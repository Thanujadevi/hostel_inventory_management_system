import pool from '../config/db.js';

export const PurchaseModel = {
  async getAll() {
    const [rows] = await pool.query(`
      SELECT p.*, s.txt_Supplier_Name, q.txt_Quotation_Code 
      FROM tbl_Purchase p
      LEFT JOIN tbl_Supplier s ON p.int_Supplier_Id = s.int_Supplier_Id
      LEFT JOIN tbl_Quotation q ON p.int_Quotation_Id = q.int_Quotation_Id
      ORDER BY p.int_Purchase_Id DESC
    `);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tbl_Purchase WHERE int_Purchase_Id = ?', [id]);
    return rows[0] || null;
  },

  async create(pData) {
    const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM tbl_Purchase');
    const poCode = pData.txt_PO_Code || `PO-${String(countRows[0].cnt + 1).padStart(4, '0')}`;
    const createdBy = pData.txt_Created_By || 'Chief Warden / Admin';
    const updatedBy = pData.txt_Updated_By || createdBy;

    const [result] = await pool.query(
      `INSERT INTO tbl_Purchase
        (txt_PO_Code, int_Quotation_Id, int_Request_Id, int_Supplier_Id, int_Store_Id, dbl_Total_Amount, txt_Status, dte_PO_Date, dte_Created_Date, txt_Created_By, dte_Updated_Date, txt_Updated_By)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, NOW(), ?)`,
      [
        poCode, pData.int_Quotation_Id || null, pData.int_Request_Id || null,
        pData.int_Supplier_Id || 1, pData.int_Store_Id || 1,
        pData.dbl_Total_Amount || 0, pData.txt_Status || 'PO Issued',
        createdBy, updatedBy
      ]
    );
    return this.findById(result.insertId);
  },

  async updateStatus(id, status, updatedBy = 'System') {
    await pool.query(
      `UPDATE tbl_Purchase SET 
        txt_Status = COALESCE(?, txt_Status),
        dte_Updated_Date = NOW(),
        txt_Updated_By = ?
      WHERE int_Purchase_Id = ?`,
      [status, updatedBy, id]
    );
    return this.findById(id);
  }
};
