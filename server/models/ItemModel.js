import pool from '../config/db.js';

export const ItemModel = {
  async getAll() {
    const [rows] = await pool.query(`
      SELECT i.*, c.txt_Category_Name 
      FROM tbl_Item i
      LEFT JOIN tbl_Category c ON i.int_Category_Id = c.int_Category_Id
      ORDER BY i.int_Item_Id DESC
    `);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tbl_Item WHERE int_Item_Id = ?', [id]);
    return rows[0] || null;
  },

  async create(item) {
    const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM tbl_Item');
    const itemCode = item.txt_Item_Code || `ITM-${String(countRows[0].cnt + 1).padStart(4, '0')}`;

    const [result] = await pool.query(
      `INSERT INTO tbl_Item 
        (txt_Item_Code, int_Category_Id, txt_Item_Name, txt_Specification, txt_Unit_Of_Measurement, int_Minimum_Stock_Level, dbl_Estimated_Price, txt_Status, dte_Created_Date, txt_Created_By)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'ADM001')`,
      [
        itemCode, item.int_Category_Id, item.txt_Item_Name,
        item.txt_Specification || '', item.txt_Unit_Of_Measurement || 'PCS',
        item.int_Minimum_Stock_Level || 10, item.dbl_Estimated_Price || 0,
        item.txt_Status || 'Active'
      ]
    );
    return result.insertId;
  },

  async update(id, item) {
    await pool.query(
      `UPDATE tbl_Item SET
        int_Category_Id = ?, txt_Item_Name = ?, txt_Specification = ?,
        txt_Unit_Of_Measurement = ?, int_Minimum_Stock_Level = ?,
        dbl_Estimated_Price = ?, txt_Status = ?, dte_Updated_Date = CURDATE()
      WHERE int_Item_Id = ?`,
      [
        item.int_Category_Id, item.txt_Item_Name, item.txt_Specification,
        item.txt_Unit_Of_Measurement, item.int_Minimum_Stock_Level,
        item.dbl_Estimated_Price, item.txt_Status || 'Active', id
      ]
    );
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM tbl_Item WHERE int_Item_Id = ?', [id]);
    return true;
  }
};
