const { z } = require('zod');

const analyzeRequestSchema = z.object({
  source: z.string().trim().min(1).max(100).default('unknown'),
  comments: z.array(z.any()).optional(),
  reviews: z.array(z.any()).optional(),
  data: z.array(z.any()).optional(),
  items: z.array(z.any()).optional(),
  tweets: z.array(z.any()).optional(),
  text: z.string().trim().optional(),
  context_title: z.string().trim().optional(),
  context_description: z.string().trim().optional(),
  language: z.enum(['zh', 'en']).default('zh'),
  max_sentences: z.number().int().min(1).max(10).default(3),
}).passthrough();

const cleanedCommentSchema = z.object({
  comment_id: z.string().trim().min(1),
  text: z.string().trim().min(1).max(5000),
  likes: z.number().int(),
  timestamp: z.string().trim().min(1),
  platform: z.string().trim().min(1),
  context_title: z.string().trim().min(1).default('Unknown Topic'),
  context_description: z.string().default(''),
});

const cleanedAnalyzePayloadSchema = z.object({
  source: z.string().trim().min(1).max(100).default('unknown'),
  comments: z.array(cleanedCommentSchema).min(1).max(200),
  language: z.enum(['zh', 'en']).default('zh'),
  max_sentences: z.number().int().min(1).max(10).default(3),
  cleaning_meta: z.object({
    input_count: z.number().int().min(0),
    output_count: z.number().int().min(0),
    skipped_empty_text: z.number().int().min(0),
    schema: z.literal('CommentInput'),
    cleaned_at: z.string(),
  }),
});

module.exports = {
  analyzeRequestSchema,
  cleanedAnalyzePayloadSchema,
};
