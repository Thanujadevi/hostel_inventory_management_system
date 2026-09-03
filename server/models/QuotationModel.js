import pool from '../config/db.js';

export const QuotationModel = {
  async getAll() {
    const [quotations] = await pool.query(`
      SELECT q.*, 
             s.txt_Supplier_Name, 
             s.txt_Supplier_Name AS txt_Store_Name,
             s.txt_Contact_Person, 
             s.txt_Contact_Person AS txt_Owner_Name,
             s.txt_Email, 
             s.txt_Phone, 
             s.txt_GSTIN,
             s.txt_GSTIN AS txt_GST_Number,
             s.dbl_Rating, 
             s.txt_City, 
             s.txt_State, 
             r.txt_Request_Code 
      FROM tbl_Quotation q
      LEFT JOIN tbl_Supplier s ON q.int_Supplier_Id = s.int_Supplier_Id
      LEFT JOIN tbl_Inventory_Request r ON q.int_Request_Id = r.int_Request_Id
      ORDER BY q.int_Quotation_Id DESC
    `);

    for (let q of quotations) {
      const [items] = await pool.query(`
        SELECT qi.*, i.txt_Item_Name 
        FROM tbl_Quotation_Item qi
        LEFT JOIN tbl_Item i ON qi.int_Item_Id = i.int_Item_Id
        WHERE qi.int_Quotation_Id = ?
      `, [q.int_Quotation_Id]);
      q.items = items;
    }
    return quotations;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tbl_Quotation WHERE int_Quotation_Id = ?', [id]);
    if (rows.length === 0) return null;
    const quotation = rows[0];
    const [items] = await pool.query('SELECT * FROM tbl_Quotation_Item WHERE int_Quotation_Id = ?', [id]);
    quotation.items = items;
    return quotation;
  },

  async create(qData) {
    const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM tbl_Quotation');
    const quotationCode = qData.txt_Quotation_Code || `QUO-${String(countRows[0].cnt + 1).padStart(4, '0')}`;
    const createdBy = qData.txt_Created_By || 'Supplier';
    const updatedBy = qData.txt_Updated_By || createdBy;

    const [result] = await pool.query(
      `INSERT INTO tbl_Quotation
        (txt_Quotation_Code, int_Request_Id, int_Supplier_Id, dbl_Total_Amount, txt_Status, txt_Delivery_Days, txt_Payment_Terms, dte_Submitted_Date, dte_Created_Date, txt_Created_By, dte_Updated_Date, txt_Updated_By)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, NOW(), ?)`,
      [
        quotationCode, qData.int_Request_Id, qData.int_Supplier_Id,
        qData.dbl_Total_Amount || 0, qData.txt_Status || 'Submitted',
        qData.txt_Delivery_Days || '7 Days', qData.txt_Payment_Terms || 'Net 30',
        createdBy, updatedBy
      ]
    );

    const quotationId = result.insertId;
    if (qData.items && Array.isArray(qData.items)) {
      for (let item of qData.items) {
        await pool.query(
          `INSERT INTO tbl_Quotation_Item
            (int_Quotation_Id, int_Item_Id, int_Quantity, dbl_Unit_Price, dbl_Total_Price)
          VALUES (?, ?, ?, ?, ?)`,
          [
            quotationId, item.int_Item_Id || item.int_Product_Id, item.int_Quantity || item.quantity || 1,
            item.dbl_Unit_Price || item.price || 0, item.dbl_Total_Price || ((item.quantity || 1) * (item.price || 0))
          ]
        );
      }
    }
    return this.findById(quotationId);
  },

  async updateStatus(id, status, remarks, updatedBy = 'System') {
    await pool.query(
      `UPDATE tbl_Quotation SET 
        txt_Status = ?, dte_Updated_Date = NOW(), txt_Updated_By = ?
      WHERE int_Quotation_Id = ?`,
      [status, updatedBy, id]
    );
    return this.findById(id);
  }
};
