function toNumber(value, defaultValue) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function toBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
}

const config = {
  app: {
    port: toNumber(process.env.PORT, 3000),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  agent: {
    baseUrl: process.env.AGENT_BASE_URL || 'http://localhost:8001',
    analyzePath: process.env.AGENT_ANALYZE_PATH || '/analyze',
    apiKey: process.env.AGENT_API_KEY || '',
    timeoutMs: toNumber(process.env.AGENT_TIMEOUT_MS, 8000),
    retryCount: toNumber(process.env.AGENT_RETRY_COUNT, 2),
    retryDelayMs: toNumber(process.env.AGENT_RETRY_DELAY_MS, 1000),
  },
  fallback: {
    enabled: toBoolean(process.env.FALLBACK_ENABLED, true),
  },
  log: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },
};

function validateConfig() {
  if (!config.agent.baseUrl) {
    throw new Error('Missing AGENT_BASE_URL');
  }

  if (config.agent.timeoutMs <= 0) {
    throw new Error('AGENT_TIMEOUT_MS must be > 0');
  }

  if (config.agent.retryCount < 0) {
    throw new Error('AGENT_RETRY_COUNT must be >= 0');
  }

  if (config.agent.retryDelayMs < 0) {
    throw new Error('AGENT_RETRY_DELAY_MS must be >= 0');
  }
}

module.exports = {
  config,
  validateConfig,
};