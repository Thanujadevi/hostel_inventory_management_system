const SKIP_KEYS = new Set([
  // Internal timestamps
  'dte_Created_At',
  'dte_Updated_At',
  'dte_Created_Date',
  'dte_Updated_Date',
  'created_at',
  'updated_at',

  // System audit fields
  'txt_Created_By',
  'txt_Updated_By',
  'created_by',
  'updated_by',

  // Passwords & sensitive credentials
  'txt_Password',
  'password',
  'pass',

  // Internal raw IDs
  'int_Store_Id',
  'int_Item_Id',
  'int_Supplier_Id',
  'int_Category_Id',
  'int_Request_Id',
  'int_Quotation_Id',
  'int_Purchase_Id',
  'int_Payment_Id',
  'int_User_Id',
  'int_Admin_Id',
  'int_Quotation_Item_Id',
  'int_Request_Item_Id',
  'txt_Store_Type',

  // Internal boolean/status flags
  'txt_Active',
  'txt_Profile_Completed'
]);

/**
 * Extract all searchable text strings from primitives, arrays, and plain objects.
 * Skips React internal elements, null/undefined values, and internal timestamp metadata fields.
 */
const extractStrings = (obj, seen = new Set()) => {
  if (obj === null || obj === undefined) return [];
  if (typeof obj === 'string' || typeof obj === 'number') {
    return [String(obj)];
  }
  if (typeof obj === 'boolean') return [];
  if (typeof obj === 'object') {
    if (obj.$$typeof) return []; // Skip React nodes/elements
    if (seen.has(obj)) return [];
    seen.add(obj);
    if (Array.isArray(obj)) {
      return obj.flatMap(item => extractStrings(item, seen));
    }
    return Object.entries(obj).flatMap(([key, val]) => {
      if (SKIP_KEYS.has(key)) return [];
      return extractStrings(val, seen);
    });
  }
  return [];
};

/**
 * Strict Word-Prefix & Acronym Search Matching Helper:
 * Returns true ONLY if:
 * 1. Query terms match the START of words in target (Word-Prefix search).
 *    E.g. Query 'u' vs 'Sanjula S' -> FALSE ('u' is in middle of Sanjula, not start).
 *    E.g. Query 'u' vs 'store001@hostel.edu' -> FALSE ('u' is at end of edu, not start).
 *    E.g. Query 'san' vs 'Sanjula S' -> TRUE ('Sanjula' starts with 'san').
 *    E.g. Query 'b' vs 'Boys Hostel' -> TRUE ('Boys' starts with 'b').
 * 
 * 2. Query matches consecutive word initials (Acronym search).
 *    E.g. Query 'bh' or 'b h' vs 'Boys Hostel' -> TRUE ('B'oys 'H'ostel).
 *    E.g. Query 'gh' or 'g h' vs 'Girls Hostel' -> TRUE ('G'irls 'H'ostel).
 *    E.g. Query 'sdc' vs 'Study Desk Chair' -> TRUE ('S'tudy 'D'esk 'C'hair).
 */
export const matchesSearch = (target, query) => {
  if (!query || !String(query).trim()) return true;
  if (target === null || target === undefined) return false;

  const rawQuery = String(query).trim().toLowerCase();
  const fieldStrings = extractStrings(target);
  if (fieldStrings.length === 0) return false;

  const combinedTarget = fieldStrings.join(' ').toLowerCase();

  // Extract all words from combined target (alphanumeric sequences)
  const targetWords = combinedTarget.split(/[^a-z0-9]+/i).filter(Boolean);
  if (targetWords.length === 0) return false;

  // Split query into tokens (by spaces or non-alphanumeric)
  const qTokens = rawQuery.split(/[\s\-_,.]+/).filter(Boolean);
  if (qTokens.length === 0) return false;

  // Rule 1: Word-Prefix Token Match
  // Every query token must match the START of at least one word in targetWords
  const allTokensMatchPrefix = qTokens.every(token => {
    return targetWords.some(word => word.startsWith(token));
  });

  if (allTokensMatchPrefix) return true;

  // Rule 2: Word Initials / Acronym Matching
  // Extract first letter of each target word
  const initials = targetWords.map(w => w[0]).join('');
  const compactQ = rawQuery.replace(/[^a-z0-9]/gi, '');

  if (compactQ.length > 0) {
    if (initials.startsWith(compactQ) || initials.includes(compactQ)) {
      return true;
    }
  }

  // Rule 3: Spaced Initials Match (e.g. query tokens 'b' 'h' matching words starting with 'b' and 'h' consecutively)
  if (qTokens.length > 1 && qTokens.length <= targetWords.length) {
    for (let i = 0; i <= targetWords.length - qTokens.length; i++) {
      let match = true;
      for (let j = 0; j < qTokens.length; j++) {
        if (!targetWords[i + j].startsWith(qTokens[j])) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
  }

  return false;
};

// Export alias for backwards compatibility
export const matchesWordPrefix = matchesSearch;


