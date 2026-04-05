const { config } = require('../config/env');
const logger = require('../utils/logger');
const { callAgentAnalyze } = require('./agentClient');
const { buildFallbackSummary } = require('./fallbackService');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeAgentResult(agentResult, payload) {
  return {
    summary: agentResult.summary || 'No content to summarize.',
    meta: {
      source: payload.source,
      language: payload.language,
      comments_count: payload.comments.length,
      strategy: 'agent-summary',
      agent_meta: agentResult.meta || null,
    },
  };
}

function buildFallbackResult(payload, reason) {
  const summary = buildFallbackSummary(payload.comments, payload.max_sentences);

  return {
    summary,
    meta: {
      source: payload.source,
      language: payload.language,
      comments_count: payload.comments.length,
      strategy: 'fallback-local-summary',
      fallback_reason: reason,
    },
  };
}

async function analyzeComments(payload, context = {}) {
  const { requestId } = context;

  let lastError = null;

  for (let attempt = 0; attempt <= config.agent.retryCount; attempt += 1) {
    try {
      logger.info('Analyze attempt started', {
        request_id: requestId,
        attempt: attempt + 1,
      });

      const agentResult = await callAgentAnalyze(payload, { requestId });

      const normalized = normalizeAgentResult(agentResult, payload);

      logger.info('Analyze completed by agent', {
        request_id: requestId,
        attempt: attempt + 1,
        strategy: normalized.meta.strategy,
      });

      return normalized;
    } catch (err) {
      lastError = err;

      logger.warn('Analyze attempt failed', {
        request_id: requestId,
        attempt: attempt + 1,
        error_code: err.code,
        message: err.message,
        retryable: err.retryable,
      });

      const shouldRetry =
        attempt < config.agent.retryCount && err.retryable !== false;

      if (shouldRetry) {
        await sleep(config.agent.retryDelayMs);
        continue;
      }

      break;
    }
  }

  if (config.fallback.enabled) {
    logger.warn('Fallback summary triggered', {
      request_id: requestId,
      reason: lastError?.code || 'UNKNOWN_AGENT_FAILURE',
    });

    return buildFallbackResult(
      payload,
      lastError?.code || 'UNKNOWN_AGENT_FAILURE'
    );
  }

  logger.error('Analyze failed without fallback', {
    request_id: requestId,
    error_code: lastError?.code || 'ANALYZE_FAILED',
    message: lastError?.message || 'Unknown error',
  });

  const error = new Error('Analyze failed and fallback is disabled.');
  error.code = lastError?.code || 'ANALYZE_FAILED';
  throw error;
}

module.exports = {
  analyzeComments,
};