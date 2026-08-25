import pool from '../config/db.js';

export const PaymentModel = {
  async getAll() {
    const [rows] = await pool.query(`
      SELECT pay.*, p.txt_PO_Code, s.txt_Supplier_Name 
      FROM tbl_Payment pay
      LEFT JOIN tbl_Purchase p ON pay.int_Purchase_Id = p.int_Purchase_Id
      LEFT JOIN tbl_Supplier s ON pay.int_Supplier_Id = s.int_Supplier_Id
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

    const [result] = await pool.query(
      `INSERT INTO tbl_Payment
        (txt_Payment_Code, int_Purchase_Id, int_Supplier_Id, dbl_Amount, txt_Payment_Mode, txt_Transaction_Ref, dte_Payment_Date, txt_Status, dte_Created_Date, txt_Created_By)
      VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?, CURDATE(), ?)`,
      [
        paymentCode, payData.int_Purchase_Id, payData.int_Supplier_Id,
        payData.dbl_Amount || 0, payData.txt_Payment_Mode || 'Bank Transfer',
        payData.txt_Transaction_Ref || '', payData.txt_Status || 'Completed',
        payData.txt_Created_By || 'Chief Warden / Admin'
      ]
    );

    // Also update PO payment status to Paid
    if (payData.int_Purchase_Id) {
      await pool.query(
        'UPDATE tbl_Purchase SET txt_Payment_Status = "Paid" WHERE int_Purchase_Id = ?',
        [payData.int_Purchase_Id]
      );
    }

    return this.findById(result.insertId);
  }
};
