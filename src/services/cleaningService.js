const crypto = require('node:crypto');

const COMMENT_TEXT_KEYS = ['text', 'content', 'body', 'comment'];
const TIMESTAMP_KEYS = [
  'timestamp',
  'created_at',
  'createdAt',
  'published_at',
  'publishedAt',
  'time',
];
const CONTEXT_TITLE_KEYS = [
  'context_title',
  'page_title',
  'video_title',
  'post_title',
  'title',
];
const CONTEXT_DESCRIPTION_KEYS = [
  'context_description',
  'page_description',
  'video_description',
  'post_description',
  'description',
];

function toCleanString(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
}

function toInteger(value, defaultValue = 0) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : defaultValue;
  }

  const match = String(value).replace(/,/g, '').match(/-?\d+/);
  if (!match) {
    return defaultValue;
  }

  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function firstPresent(object, keys, defaultValue = '') {
  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(object, key) &&
      object[key] !== undefined &&
      object[key] !== null &&
      object[key] !== ''
    ) {
      return object[key];
    }
  }

  return defaultValue;
}

function getLikes(raw) {
  return toInteger(
    firstPresent(
      raw,
      [
        'likes',
        'like_count',
        'likeCount',
        'upvotes',
        'upvote_count',
        'score',
        'retweets',
      ],
      0
    )
  );
}

function detectPlatform(raw, platformHint = '') {
  const explicitPlatform = toCleanString(firstPresent(raw, ['platform', 'source'], platformHint));
  if (explicitPlatform) {
    return explicitPlatform;
  }

  if ('author_handle' in raw || 'retweets' in raw) {
    return 'X/Twitter';
  }

  if ('author_detail' in raw || 'upvotes' in raw || 'score' in raw) {
    return 'Reddit';
  }

  if ('rating' in raw && 'author_stats' in raw) {
    return 'Google Reviews';
  }

  if (String(raw.author_url || '').includes('youtube.com')) {
    return 'YouTube';
  }

  return 'Unknown Platform';
}

function buildStableCommentId(raw, platform, index) {
  const existingId = toCleanString(firstPresent(raw, ['comment_id', 'id', 'commentId', 'cid'], ''));
  if (existingId) {
    return existingId;
  }

  const seed = [
    platform,
    firstPresent(raw, ['author_name', 'author', 'author_handle', 'username'], ''),
    firstPresent(raw, TIMESTAMP_KEYS, ''),
    firstPresent(raw, COMMENT_TEXT_KEYS, ''),
    index ?? '',
  ].join('|');

  const digest = crypto.createHash('sha1').update(seed).digest('hex').slice(0, 12);
  const prefix = platform.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'comment';

  return `${prefix}_${digest}`;
}

function normalizeComment(rawInput, options = {}) {
  const {
    index,
    platformHint = '',
    contextTitle = 'Unknown Topic',
    contextDescription = '',
  } = options;

  const raw =
    typeof rawInput === 'string'
      ? {
          text: rawInput,
        }
      : rawInput;

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const text = toCleanString(firstPresent(raw, COMMENT_TEXT_KEYS, ''));
  if (!text) {
    return null;
  }

  const platform = detectPlatform(raw, platformHint);
  const timestamp =
    toCleanString(firstPresent(raw, TIMESTAMP_KEYS, '')) || new Date().toISOString();

  return {
    comment_id: buildStableCommentId(raw, platform, index),
    text,
    likes: getLikes(raw),
    timestamp,
    platform,
    context_title:
      toCleanString(firstPresent(raw, CONTEXT_TITLE_KEYS, contextTitle)) || 'Unknown Topic',
    context_description: toCleanString(
      firstPresent(raw, CONTEXT_DESCRIPTION_KEYS, contextDescription)
    ),
  };
}

function extractRawComments(payload) {
  if (Array.isArray(payload)) {
    return {
      comments: payload,
      envelope: {},
    };
  }

  if (!payload || typeof payload !== 'object') {
    return {
      comments: [],
      envelope: {},
    };
  }

  for (const key of ['comments', 'reviews', 'data', 'items', 'tweets']) {
    if (Array.isArray(payload[key])) {
      return {
        comments: payload[key],
        envelope: payload,
      };
    }
  }

  if (COMMENT_TEXT_KEYS.some((key) => Object.prototype.hasOwnProperty.call(payload, key))) {
    return {
      comments: [payload],
      envelope: payload,
    };
  }

  return {
    comments: [],
    envelope: payload,
  };
}

function cleanAnalyzePayload(payload) {
  const { comments: rawComments, envelope } = extractRawComments(payload);
  const platformHint = toCleanString(firstPresent(envelope, ['platform', 'source'], ''));
  const contextTitle =
    toCleanString(firstPresent(envelope, CONTEXT_TITLE_KEYS, 'Unknown Topic')) || 'Unknown Topic';
  const contextDescription = toCleanString(
    firstPresent(envelope, CONTEXT_DESCRIPTION_KEYS, '')
  );

  const comments = [];
  let skippedEmptyText = 0;

  rawComments.forEach((rawComment, rawIndex) => {
    const cleaned = normalizeComment(rawComment, {
      index: rawIndex + 1,
      platformHint,
      contextTitle,
      contextDescription,
    });

    if (!cleaned) {
      skippedEmptyText += 1;
      return;
    }

    comments.push(cleaned);
  });

  return {
    source: platformHint || (comments[0] ? comments[0].platform : 'unknown'),
    language: payload.language || 'zh',
    max_sentences: toInteger(payload.max_sentences, 3),
    comments,
    cleaning_meta: {
      input_count: rawComments.length,
      output_count: comments.length,
      skipped_empty_text: skippedEmptyText,
      schema: 'CommentInput',
      cleaned_at: new Date().toISOString(),
    },
  };
}

module.exports = {
  cleanAnalyzePayload,
  normalizeComment,
};
