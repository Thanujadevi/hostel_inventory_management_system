/**
 * Word-prefix search matching helper:
 * Returns true if the query matches the START of any word in the given text or object values.
 * E.g.:
 *  - Query 'esk' vs 'Study Desk Chair' -> FALSE (words: study, desk, chair; none start with 'esk')
 *  - Query 'des' vs 'Study Desk Chair' -> TRUE ('desk' starts with 'des')
 *  - Query 'itm' vs 'ITM-003' -> TRUE ('itm' starts with 'itm')
 */
export const matchesWordPrefix = (target, query) => {
  if (!query || !query.trim()) return true;
  if (target === null || target === undefined) return false;

  const q = query.trim().toLowerCase();

  // Handle objects or primitives
  let targetStr = '';
  if (typeof target === 'object') {
    targetStr = Object.values(target)
      .filter(v => v !== null && v !== undefined && typeof v !== 'object')
      .join(' ');
  } else {
    targetStr = String(target);
  }

  const cleanStr = targetStr.toLowerCase();

  // Direct start match
  if (cleanStr.startsWith(q)) return true;

  // Split into words by non-alphanumeric delimiters (spaces, hyphens, slashes, etc.)
  const words = cleanStr.split(/[^a-z0-9]+/i).filter(Boolean);

  // Check if any word starts with the query
  return words.some(word => word.startsWith(q));
};
