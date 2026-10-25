/**
 * Utility to generate guaranteed unique tracking codes in MySQL tables
 * Prevents ER_DUP_ENTRY duplicate key errors and code overwriting.
 */

export async function generateUniqueCode(dbConnOrPool, tableName, codeColumn, prefix = 'CODE') {
  const currentYear = new Date().getFullYear();

  try {
    const [rows] = await dbConnOrPool.query(`SELECT ${codeColumn} FROM ${tableName}`);
    const existingSet = new Set(
      (rows || [])
        .map(r => r[codeColumn])
        .filter(Boolean)
        .map(c => String(c).trim().toUpperCase())
    );

    let maxSeq = 0;
    existingSet.forEach(code => {
      const match = code.match(/\d+/g);
      if (match) {
        const num = parseInt(match[match.length - 1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    });

    let nextSeq = Math.max(maxSeq + 1, (rows || []).length + 1);

    while (true) {
      const candidate1 = `${prefix}-${currentYear}-${String(nextSeq).padStart(3, '0')}`;
      const candidate2 = `${prefix}-${String(nextSeq).padStart(4, '0')}`;

      if (!existingSet.has(candidate1.toUpperCase()) && !existingSet.has(candidate2.toUpperCase())) {
        return candidate1;
      }
      nextSeq++;
    }
  } catch (err) {
    // Fallback code using timestamp suffix if query fails
    return `${prefix}-${currentYear}-${Date.now().toString().slice(-4)}`;
  }
}

export async function getOrGenerateUniqueCode(dbConnOrPool, tableName, codeColumn, prefix, preferredCode) {
  if (preferredCode && String(preferredCode).trim().length > 0) {
    const pref = String(preferredCode).trim();
    try {
      const [check] = await dbConnOrPool.query(
        `SELECT * FROM ${tableName} WHERE LOWER(${codeColumn}) = LOWER(?)`,
        [pref]
      );
      if (check.length === 0) {
        return pref;
      }
    } catch (err) {
      // Fall back to generator if query fails
    }
  }
  return await generateUniqueCode(dbConnOrPool, tableName, codeColumn, prefix);
}

