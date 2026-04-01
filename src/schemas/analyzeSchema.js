const { z } = require('zod');

const analyzeRequestSchema = z.object({
  source: z.string().trim().min(1).max(100).default('unknown'),
  comments: z.array(z.string().trim().min(1).max(500)).min(1).max(200),
  language: z.enum(['zh', 'en']).default('zh'),
  max_sentences: z.number().int().min(1).max(10).default(3),
});

module.exports = {
  analyzeRequestSchema,
};
