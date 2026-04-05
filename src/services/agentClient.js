const { config } = require('../config/env');
const logger = require('../utils/logger');

class AgentClientError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'AgentClientError';
    this.code = options.code || 'AGENT_CLIENT_ERROR';
    this.status = options.status;
    this.details = options.details;
    this.retryable = options.retryable ?? true;
  }
}

async function callAgentAnalyze(payload, context = {}) {
  const { requestId } = context;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.agent.timeoutMs);

  const url = `${config.agent.baseUrl}${config.agent.analyzePath}`;

  try {
    logger.info('Calling agent service', {
      request_id: requestId,
      url,
      timeout_ms: config.agent.timeoutMs,
    });

    const headers = {
      'Content-Type': 'application/json',
    };

    if (config.agent.apiKey) {
      headers.Authorization = `Bearer ${config.agent.apiKey}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const responseText = await response.text();

    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new AgentClientError('Agent response is not valid JSON.', {
        code: 'AGENT_INVALID_JSON',
        status: response.status,
        retryable: false,
        details: { raw: responseText },
      });
    }

    if (!response.ok) {
      throw new AgentClientError('Agent service returned non-2xx response.', {
        code: 'AGENT_HTTP_ERROR',
        status: response.status,
        retryable: response.status >= 500,
        details: responseData,
      });
    }

    logger.info('Agent service responded successfully', {
      request_id: requestId,
      url,
      status: response.status,
    });

    return responseData;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new AgentClientError('Agent request timed out.', {
        code: 'AGENT_TIMEOUT',
        retryable: true,
      });
    }

    if (err instanceof AgentClientError) {
      throw err;
    }

    throw new AgentClientError('Agent request failed.', {
      code: 'AGENT_NETWORK_ERROR',
      retryable: true,
      details: { message: err.message },
    });
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  callAgentAnalyze,
  AgentClientError,
};