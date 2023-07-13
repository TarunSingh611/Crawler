function isValidUrl(urlString) {
  try {
    new URL(urlString);
    return true;
  } catch (error) {
    return false;
  }
}

function isValidMaxDepth(maxDepth) {
  return typeof maxDepth === 'number' && maxDepth >= 0;
}

function isValidMs(ms) {
  return typeof ms === 'number' && ms >= 0;
}

module.exports = {
  isValidUrl,
  isValidMaxDepth,
  isValidMs
};
