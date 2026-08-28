import pool from '../config/db.js';

export const ItemModel = {
  async getAll() {
    const [rows] = await pool.query(`
      SELECT 
        i.int_Item_Id,
        i.txt_Item_Code,
        i.txt_Item_Name,
        i.int_Category_Id,
        COALESCE(c.txt_Category_Name, 'General') AS txt_Category_Name,
        COALESCE(c.txt_Category_Name, 'General') AS txt_Category,
        COALESCE(i.txt_Unit, 'Pcs') AS txt_Unit,
        COALESCE(i.dbl_Unit_Price, 0.00) AS dec_Last_Purchase_Price,
        COALESCE(i.dbl_Unit_Price, 0.00) AS dbl_Estimated_Price,
        COALESCE(i.dbl_Unit_Price, 0.00) AS dbl_Unit_Price,
        COALESCE(i.int_Current_Stock, 0) AS int_quantity_in_hand,
        COALESCE(i.int_Current_Stock, 0) AS int_Current_Stock,
        COALESCE(i.int_Current_Stock, 0) AS int_Stock,
        COALESCE(i.txt_Status, 'Active') AS txt_Status
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
    const itemCode = item.txt_Item_Code || `ITM-${String(countRows[0].cnt + 1).padStart(3, '0')}`;
    const price = Number(item.dec_Last_Purchase_Price !== undefined ? item.dec_Last_Purchase_Price : (item.dbl_Estimated_Price || 0));
    const qty = Number(item.int_quantity_in_hand !== undefined ? item.int_quantity_in_hand : (item.int_Current_Stock || item.int_Stock || 0));
    const unit = item.txt_Unit || item.txt_Unit_Of_Measurement || 'Pcs';

    const [result] = await pool.query(
      `INSERT INTO tbl_Item 
        (txt_Item_Code, txt_Item_Name, int_Category_Id, txt_Unit, dbl_Unit_Price, int_Current_Stock, txt_Status, dte_Created_Date, txt_Created_By)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), 'ADM001')`,
      [
        itemCode, item.txt_Item_Name, item.int_Category_Id || null, unit, price, qty, item.txt_Status || 'Active'
      ]
    );
    return result.insertId;
  },

  async update(id, item) {
    const price = Number(item.dec_Last_Purchase_Price !== undefined ? item.dec_Last_Purchase_Price : (item.dbl_Estimated_Price || 0));
    const qty = Number(item.int_quantity_in_hand !== undefined ? item.int_quantity_in_hand : (item.int_Current_Stock || item.int_Stock || 0));
    const unit = item.txt_Unit || item.txt_Unit_Of_Measurement || 'Pcs';

    await pool.query(
      `UPDATE tbl_Item SET
        txt_Item_Code = ?,
        txt_Item_Name = ?,
        txt_Unit = ?,
        dbl_Unit_Price = ?,
        int_Current_Stock = ?,
        txt_Status = ?,
        dte_Updated_Date = CURDATE()
      WHERE int_Item_Id = ?`,
      [
        item.txt_Item_Code,
        item.txt_Item_Name,
        unit,
        price,
        qty,
        item.txt_Status || 'Active',
        id
      ]
    );
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM tbl_Item WHERE int_Item_Id = ?', [id]);
    return true;
  }
};
