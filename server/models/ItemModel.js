import pool from '../config/db.js';

export const ItemModel = {
  async getAll() {
    const [rows] = await pool.query(`
      SELECT 
        i.*, 
        c.txt_Category_Name, 
        c.txt_Category_Name AS txt_Category,
        i.txt_Unit AS txt_Unit_Of_Measurement,
        i.int_Min_Stock AS int_Minimum_Stock_Level,
        i.int_Current_Stock AS int_quantity_in_hand,
        i.dbl_Unit_Price AS dec_Last_Purchase_Price
      FROM tbl_Item i
      LEFT JOIN tbl_Category c ON i.int_Category_Id = c.int_Category_Id
      ORDER BY i.int_Item_Id DESC
    `);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT 
        i.*, 
        c.txt_Category_Name, 
        c.txt_Category_Name AS txt_Category,
        i.txt_Unit AS txt_Unit_Of_Measurement,
        i.int_Min_Stock AS int_Minimum_Stock_Level,
        i.int_Current_Stock AS int_quantity_in_hand,
        i.dbl_Unit_Price AS dec_Last_Purchase_Price
      FROM tbl_Item i
      LEFT JOIN tbl_Category c ON i.int_Category_Id = c.int_Category_Id
      WHERE i.int_Item_Id = ?
    `, [id]);
    return rows[0] || null;
  },

  async create(item) {
    const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM tbl_Item');
    let itemCode = item.txt_Item_Code || `ITM-${String(countRows[0].cnt + 1).padStart(4, '0')}`;

    const [existing] = await pool.query('SELECT int_Item_Id FROM tbl_Item WHERE txt_Item_Code = ?', [itemCode]);
    if (existing.length > 0) {
      itemCode = `ITM-${String(countRows[0].cnt + Date.now() % 1000).padStart(4, '0')}`;
    }

    let categoryId = null;
    if (item.txt_Category) {
      const [catRows] = await pool.query('SELECT int_Category_Id FROM tbl_Category WHERE txt_Category_Name = ?', [item.txt_Category]);
      if (catRows.length > 0) categoryId = catRows[0].int_Category_Id;
    }
    if (!categoryId && item.int_Category_Id) {
      categoryId = item.int_Category_Id;
    }

    const createdBy = item.txt_Created_By || 'System';
    const updatedBy = item.txt_Updated_By || createdBy;

    const [result] = await pool.query(
      `INSERT INTO tbl_Item 
        (txt_Item_Code, txt_Item_Name, int_Category_Id, txt_Unit, int_Min_Stock, int_Current_Stock, dbl_Unit_Price, txt_Status, dte_Created_Date, txt_Created_By, dte_Updated_Date, txt_Updated_By)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?)`,
      [
        itemCode,
        item.txt_Item_Name,
        categoryId || null,
        item.txt_Unit || item.txt_Unit_Of_Measurement || 'Nos',
        item.int_Min_Stock ?? item.int_Minimum_Stock_Level ?? 10,
        item.int_Current_Stock ?? item.int_quantity_in_hand ?? 0,
        item.dbl_Unit_Price ?? item.dec_Last_Purchase_Price ?? 0,
        item.txt_Status || 'Active',
        createdBy,
        updatedBy
      ]
    );
    return this.findById(result.insertId);
  },

  async update(id, item) {
    let categoryId = null;
    if (item.txt_Category) {
      const [catRows] = await pool.query('SELECT int_Category_Id FROM tbl_Category WHERE txt_Category_Name = ?', [item.txt_Category]);
      if (catRows.length > 0) categoryId = catRows[0].int_Category_Id;
    }
    if (!categoryId && item.int_Category_Id) {
      categoryId = item.int_Category_Id;
    }

    const updatedBy = item.txt_Updated_By || 'System';

    await pool.query(
      `UPDATE tbl_Item SET
        txt_Item_Code = COALESCE(?, txt_Item_Code),
        txt_Item_Name = COALESCE(?, txt_Item_Name),
        int_Category_Id = COALESCE(?, int_Category_Id),
        txt_Unit = COALESCE(?, txt_Unit),
        int_Min_Stock = COALESCE(?, int_Min_Stock),
        int_Current_Stock = COALESCE(?, int_Current_Stock),
        dbl_Unit_Price = COALESCE(?, dbl_Unit_Price),
        txt_Status = COALESCE(?, txt_Status),
        dte_Updated_Date = NOW(),
        txt_Updated_By = ?
      WHERE int_Item_Id = ?`,
      [
        item.txt_Item_Code || null,
        item.txt_Item_Name || null,
        categoryId || null,
        item.txt_Unit || item.txt_Unit_Of_Measurement || null,
        (item.int_Min_Stock ?? item.int_Minimum_Stock_Level) ?? null,
        (item.int_Current_Stock ?? item.int_quantity_in_hand) ?? null,
        (item.dbl_Unit_Price ?? item.dec_Last_Purchase_Price) ?? null,
        item.txt_Status || null,
        updatedBy,
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
