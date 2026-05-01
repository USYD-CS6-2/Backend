function buildFallbackSummary(comments, maxSentences) {
  const cleaned = comments
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }

      return String(item?.text || '').trim();
    })
    .filter(Boolean)
    .filter((item, index, arr) => arr.indexOf(item) === index);

  const summary = cleaned.slice(0, maxSentences).join('; ');

  return summary || 'No content to summarize.';
}

module.exports = {
  buildFallbackSummary,
};
