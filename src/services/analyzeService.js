function buildSimpleSummary(comments, maxSentences) {
  const cleaned = comments
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, arr) => arr.indexOf(item) === index);

  return cleaned.slice(0, maxSentences).join('; ');
}

async function analyzeComments(payload) {
  const summary = buildSimpleSummary(payload.comments, payload.max_sentences);

  return {
    summary: summary || 'No content to summarize.',
    meta: {
      source: payload.source,
      language: payload.language,
      comments_count: payload.comments.length,
      strategy: 'basic-v1-local-summary',
    },
  };
}

module.exports = {
  analyzeComments,
};
