import pool from '../config/db.js';

export const PaymentModel = {
  async getAll() {
    const [rows] = await pool.query(`
      SELECT pay.*, p.txt_PO_Code, s.txt_Supplier_Name 
      FROM tbl_Payment pay
      LEFT JOIN tbl_Purchase p ON pay.int_Purchase_Id = p.int_Purchase_Id
      LEFT JOIN tbl_Supplier s ON p.int_Supplier_Id = s.int_Supplier_Id
      ORDER BY pay.int_Payment_Id DESC
    `);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tbl_Payment WHERE int_Payment_Id = ?', [id]);
    return rows[0] || null;
  },

  async create(payData) {
    const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM tbl_Payment');
    const paymentCode = payData.txt_Payment_Code || `PAY-${String(countRows[0].cnt + 1).padStart(4, '0')}`;
    const createdBy = payData.txt_Created_By || 'Chief Warden / Admin';
    const updatedBy = payData.txt_Updated_By || createdBy;

    const [result] = await pool.query(
      `INSERT INTO tbl_Payment
        (txt_Payment_Code, int_Purchase_Id, dbl_Amount, txt_Payment_Mode, txt_Transaction_Ref, dte_Payment_Date, txt_Status, dte_Created_Date, txt_Created_By, dte_Updated_Date, txt_Updated_By)
      VALUES (?, ?, ?, ?, ?, NOW(), ?, NOW(), ?, NOW(), ?)`,
      [
        paymentCode, payData.int_Purchase_Id || 1,
        payData.dbl_Amount || payData.amount || 0, payData.txt_Payment_Mode || 'Bank Transfer',
        payData.txt_Transaction_Ref || '', payData.txt_Status || 'Completed',
        createdBy, updatedBy
      ]
    );

    if (payData.int_Purchase_Id) {
      await pool.query(
        'UPDATE tbl_Purchase SET txt_Status = "Completed", dte_Updated_Date = NOW(), txt_Updated_By = ? WHERE int_Purchase_Id = ?',
        [updatedBy, payData.int_Purchase_Id]
      );
    }

    return this.findById(result.insertId);
  }
};
