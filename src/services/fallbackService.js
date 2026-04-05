function buildFallbackSummary(comments, maxSentences) {
  const cleaned = comments
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, arr) => arr.indexOf(item) === index);

  const summary = cleaned.slice(0, maxSentences).join('; ');

  return summary || 'No content to summarize.';
}

module.exports = {
  buildFallbackSummary,
};