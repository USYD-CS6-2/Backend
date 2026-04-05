const express = require('express');
const cors = require('cors');
const { randomUUID } = require('node:crypto');
const { analyzeRequestSchema } = require('./schemas/analyzeSchema');
const { analyzeComments } = require('./services/analyzeService');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/v1/health', (req, res) => {
  void req;
  res.status(200).json({
    status: 'ok',
    service: 'comments-summarizer-backend',
    version: 'v1',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/v1/analyze', async (req, res, next) => {
  const requestId = randomUUID();
  const parsed = analyzeRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error_code: 'INVALID_REQUEST',
      message: 'Request body validation failed.',
      request_id: requestId,
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await analyzeComments(parsed.data, { requestId });

    return res.status(200).json({
      request_id: requestId,
      ...result,
    });
  } catch (err) {
    err.requestId = requestId;
    return next(err);
  }
});

app.use((req, res) => {
  void req;
  res.status(404).json({
    error_code: 'NOT_FOUND',
    message: 'Route not found.',
    request_id: randomUUID(),
  });
});

app.use((err, req, res, next) => {
  void req;
  void next;

  const requestId = err.requestId || randomUUID();

  res.status(500).json({
    error_code: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Unexpected server error.',
    request_id: requestId,
  });
});

module.exports = app;