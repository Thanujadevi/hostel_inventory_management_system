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

    const [result] = await pool.query(
      `INSERT INTO tbl_Purchase
        (txt_PO_Code, int_Quotation_Id, int_Supplier_Id, dte_PO_Date, dbl_Total_Amount, txt_Status, txt_Payment_Status, dte_Created_Date, txt_Created_By)
      VALUES (?, ?, ?, CURDATE(), ?, ?, ?, CURDATE(), ?)`,
      [
        poCode, pData.int_Quotation_Id, pData.int_Supplier_Id,
        pData.dbl_Total_Amount || 0, pData.txt_Status || 'Approved',
        pData.txt_Payment_Status || 'Pending', pData.txt_Created_By || 'Chief Warden / Admin'
      ]
    );
    return this.findById(result.insertId);
  },

  async updateStatus(id, status, paymentStatus) {
    await pool.query(
      `UPDATE tbl_Purchase SET 
        txt_Status = COALESCE(?, txt_Status),
        txt_Payment_Status = COALESCE(?, txt_Payment_Status),
        dte_Updated_Date = CURDATE()
      WHERE int_Purchase_Id = ?`,
      [status, paymentStatus, id]
    );
    return this.findById(id);
  }
};
