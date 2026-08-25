import pool from '../config/db.js';

export const RequirementModel = {
  async getAll() {
    const [requests] = await pool.query(`
      SELECT r.*, s.txt_Store_Name, s.txt_Campus 
      FROM tbl_Inventory_Request r
      LEFT JOIN tbl_Store s ON r.int_Store_Id = s.int_Store_Id
      ORDER BY r.int_Request_Id DESC
    `);

    for (let req of requests) {
      const [items] = await pool.query(`
        SELECT ri.*, i.txt_Item_Name, i.txt_Unit_Of_Measurement, i.txt_Item_Code 
        FROM tbl_Request_Item ri
        LEFT JOIN tbl_Item i ON ri.int_Item_Id = i.int_Item_Id
        WHERE ri.int_Request_Id = ?
      `, [req.int_Request_Id]);
      req.items = items;
    }
    return requests;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tbl_Inventory_Request WHERE int_Request_Id = ?', [id]);
    if (rows.length === 0) return null;
    const request = rows[0];
    const [items] = await pool.query('SELECT * FROM tbl_Request_Item WHERE int_Request_Id = ?', [id]);
    request.items = items;
    return request;
  },

  async create(reqData) {
    const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM tbl_Inventory_Request');
    const requestCode = reqData.txt_Request_Code || `REQ-${String(countRows[0].cnt + 1).padStart(4, '0')}`;

    const [result] = await pool.query(
      `INSERT INTO tbl_Inventory_Request
        (txt_Request_Code, int_Store_Id, dte_Request_Date, txt_Status, txt_Remarks, dte_Created_Date, txt_Created_By)
      VALUES (?, ?, CURDATE(), ?, ?, CURDATE(), ?)`,
      [
        requestCode, reqData.int_Store_Id, reqData.txt_Status || 'Pending',
        reqData.txt_Remarks || '', reqData.txt_Created_By || 'Store Incharge'
      ]
    );

    const requestId = result.insertId;
    if (reqData.items && Array.isArray(reqData.items)) {
      for (let item of reqData.items) {
        await pool.query(
          `INSERT INTO tbl_Request_Item
            (int_Request_Id, int_Item_Id, int_Requested_Quantity, txt_Reason, txt_Status)
          VALUES (?, ?, ?, ?, ?)`,
          [
            requestId, item.int_Item_Id, item.int_Requested_Quantity || item.quantity,
            item.txt_Reason || item.reason || '', 'Pending'
          ]
        );
      }
    }
    return this.findById(requestId);
  },

  async updateStatus(id, status, remarks) {
    await pool.query(
      `UPDATE tbl_Inventory_Request SET 
        txt_Status = ?, txt_Remarks = ?, dte_Updated_Date = CURDATE()
      WHERE int_Request_Id = ?`,
      [status, remarks || '', id]
    );
    return this.findById(id);
  }
};
