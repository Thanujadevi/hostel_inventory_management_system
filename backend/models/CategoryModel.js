import pool from '../config/db.js';
import { getOrGenerateUniqueCode } from '../utils/codeUtils.js';

export const CategoryModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM tbl_Category ORDER BY int_Category_Id ASC');
    const uniqueMap = new Map();
    for (const row of rows) {
      const key = (row.txt_Category_Name || '').trim().toLowerCase();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, row);
      }
    }
    return Array.from(uniqueMap.values());
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tbl_Category WHERE int_Category_Id = ?', [id]);
    return rows[0] || null;
  },

  async create(cat) {
    const name = (cat.txt_Category_Name || '').trim();
    if (name) {
      const [existingByName] = await pool.query(
        'SELECT * FROM tbl_Category WHERE LOWER(TRIM(txt_Category_Name)) = LOWER(?)',
        [name]
      );
      if (existingByName.length > 0) {
        return existingByName[0];
      }
    }

    const categoryCode = await getOrGenerateUniqueCode(pool, 'tbl_Category', 'txt_Category_Code', 'CAT', cat.txt_Category_Code);

    const createdBy = cat.txt_Created_By || 'System';
    const updatedBy = cat.txt_Updated_By || createdBy;

    const [result] = await pool.query(
      `INSERT INTO tbl_Category 
        (txt_Category_Code, txt_Category_Name, txt_Description, txt_status, dte_Created_Date, txt_Created_By, dte_Updated_Date, txt_Updated_By)
      VALUES (?, ?, ?, ?, NOW(), ?, NOW(), ?)`,
      [
        categoryCode, name, cat.txt_Description || '',
        cat.txt_status || 'Active', createdBy, updatedBy
      ]
    );
    return this.findById(result.insertId);
  },

  async update(id, cat) {
    const updatedBy = cat.txt_Updated_By || 'System';
    await pool.query(
      `UPDATE tbl_Category SET
        txt_Category_Code = COALESCE(?, txt_Category_Code),
        txt_Category_Name = COALESCE(?, txt_Category_Name),
        txt_Description = COALESCE(?, txt_Description),
        txt_status = COALESCE(?, txt_status),
        dte_Updated_Date = NOW(),
        txt_Updated_By = ?
      WHERE int_Category_Id = ?`,
      [cat.txt_Category_Code || null, cat.txt_Category_Name || null, cat.txt_Description || null, cat.txt_status || 'Active', updatedBy, id]
    );
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('UPDATE tbl_Item SET int_Category_Id = NULL WHERE int_Category_Id = ?', [id]);
    await pool.query('DELETE FROM tbl_Category WHERE int_Category_Id = ?', [id]);
    return true;
  }
};
