import pool from '../config/db.js';

export const CategoryModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM tbl_Category ORDER BY int_Category_Id DESC');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tbl_Category WHERE int_Category_Id = ?', [id]);
    return rows[0] || null;
  },

  async create(cat) {
    const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM tbl_Category');
    const categoryCode = cat.txt_Category_Code || `CAT-${String(countRows[0].cnt + 1).padStart(3, '0')}`;

    const [result] = await pool.query(
      `INSERT INTO tbl_Category 
        (txt_Category_Code, txt_Category_Name, txt_Description, txt_status, dte_Created_Date, txt_Created_By)
      VALUES (?, ?, ?, ?, CURDATE(), 'ADM001')`,
      [
        categoryCode, cat.txt_Category_Name, cat.txt_Description || '',
        cat.txt_status || 'Active'
      ]
    );
    return result.insertId;
  },

  async update(id, cat) {
    await pool.query(
      `UPDATE tbl_Category SET
        txt_Category_Name = ?, txt_Description = ?, txt_status = ?, dte_Updated_Date = CURDATE()
      WHERE int_Category_Id = ?`,
      [cat.txt_Category_Name, cat.txt_Description, cat.txt_status || 'Active', id]
    );
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM tbl_Category WHERE int_Category_Id = ?', [id]);
    return true;
  }
};
