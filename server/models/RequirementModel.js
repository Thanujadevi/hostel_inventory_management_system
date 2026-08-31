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
      req.txt_Request_No = req.txt_Request_No || req.txt_Request_Code || `REQ-${req.int_Request_Id}`;
      req.store_name = req.store_name || req.txt_Store_Name || `Store #${req.int_Store_Id}`;
      req.dte_Request_Date = req.dte_Request_Date ? new Date(req.dte_Request_Date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      req.txt_Month = req.txt_Month || 'August';
      req.int_Year = req.int_Year || 2026;

      const [items] = await pool.query(`
        SELECT ri.*, i.txt_Item_Name, i.txt_Unit, i.txt_Item_Code, i.txt_Brand, i.dbl_Unit_Price
        FROM tbl_Request_Item ri
        LEFT JOIN tbl_Item i ON ri.int_Item_Id = i.int_Item_Id
        WHERE ri.int_Request_Id = ?
      `, [req.int_Request_Id]);

      let totalBudget = 0;
      req.items = items.map(item => {
        const qty = Number(item.int_Quantity || item.int_Requested_Quantity || item.dec_Required_Qty || item.quantity || 0);
        const price = Number(item.dbl_Unit_Price || item.dec_Last_Purchase_Price || item.price || 50);
        totalBudget += qty * price;

        return {
          ...item,
          int_Product_Id: item.int_Product_Id || item.int_Item_Id,
          product_code: item.product_code || item.txt_Item_Code || `PRD-00${item.int_Item_Id}`,
          product_name: item.product_name || item.txt_Item_Name || `Product #${item.int_Item_Id}`,
          category: item.category || 'General',
          brand: item.brand || item.txt_Brand || 'Standard',
          unit: item.unit || item.txt_Unit || 'Pcs',
          dec_Required_Qty: qty,
          int_Requested_Quantity: qty
        };
      });

      req.dec_Budget = req.dec_Budget || totalBudget;
    }
    return requests;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT r.*, s.txt_Store_Name, s.txt_Campus 
      FROM tbl_Inventory_Request r
      LEFT JOIN tbl_Store s ON r.int_Store_Id = s.int_Store_Id
      WHERE r.int_Request_Id = ?
    `, [id]);
    if (rows.length === 0) return null;
    const req = rows[0];
    req.txt_Request_No = req.txt_Request_No || req.txt_Request_Code || `REQ-${req.int_Request_Id}`;
    req.store_name = req.store_name || req.txt_Store_Name || `Store #${req.int_Store_Id}`;
    req.dte_Request_Date = req.dte_Request_Date ? new Date(req.dte_Request_Date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    req.txt_Month = req.txt_Month || 'August';
    req.int_Year = req.int_Year || 2026;

    const [items] = await pool.query(`
      SELECT ri.*, i.txt_Item_Name, i.txt_Unit, i.txt_Item_Code, i.txt_Brand, i.dbl_Unit_Price
      FROM tbl_Request_Item ri
      LEFT JOIN tbl_Item i ON ri.int_Item_Id = i.int_Item_Id
      WHERE ri.int_Request_Id = ?
    `, [id]);

    let totalBudget = 0;
    req.items = items.map(item => {
      const qty = Number(item.int_Quantity || item.int_Requested_Quantity || item.dec_Required_Qty || item.quantity || 0);
      const price = Number(item.dbl_Unit_Price || item.dec_Last_Purchase_Price || item.price || 50);
      totalBudget += qty * price;

      return {
        ...item,
        int_Product_Id: item.int_Product_Id || item.int_Item_Id,
        product_code: item.product_code || item.txt_Item_Code || `PRD-00${item.int_Item_Id}`,
        product_name: item.product_name || item.txt_Item_Name || `Product #${item.int_Item_Id}`,
        category: item.category || 'General',
        brand: item.brand || item.txt_Brand || 'Standard',
        unit: item.unit || item.txt_Unit || 'Pcs',
        dec_Required_Qty: qty,
        int_Requested_Quantity: qty
      };
    });

    req.dec_Budget = req.dec_Budget || totalBudget;
    return req;
  },

  async create(reqData) {
    const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM tbl_Inventory_Request');
    const requestCode = reqData.txt_Request_Code || reqData.txt_Request_No || `REQ-${String(countRows[0].cnt + 1).padStart(4, '0')}`;
    const createdBy = reqData.txt_Created_By || 'Store Incharge';
    const updatedBy = reqData.txt_Updated_By || createdBy;

    const [result] = await pool.query(
      `INSERT INTO tbl_Inventory_Request
        (txt_Request_Code, int_Store_Id, dte_Request_Date, txt_Status, txt_Remarks, dte_Created_Date, txt_Created_By, dte_Updated_Date, txt_Updated_By)
      VALUES (?, ?, NOW(), ?, ?, NOW(), ?, NOW(), ?)`,
      [
        requestCode, reqData.int_Store_Id || 1, reqData.txt_Status || 'Pending Approval',
        reqData.txt_Remarks || '', createdBy, updatedBy
      ]
    );

    const requestId = result.insertId;
    if (reqData.items && Array.isArray(reqData.items)) {
      for (let item of reqData.items) {
        await pool.query(
          `INSERT INTO tbl_Request_Item
            (int_Request_Id, int_Item_Id, int_Quantity)
          VALUES (?, ?, ?)`,
          [
            requestId, item.int_Product_Id || item.int_Item_Id,
            item.dec_Required_Qty || item.int_Requested_Quantity || item.int_Quantity || item.quantity || 1
          ]
        );
      }
    }
    return this.findById(requestId);
  },

  async updateStatus(id, status, remarks, updatedBy = 'System') {
    await pool.query(
      `UPDATE tbl_Inventory_Request SET 
        txt_Status = ?, txt_Remarks = ?, dte_Updated_Date = NOW(), txt_Updated_By = ?
      WHERE int_Request_Id = ?`,
      [status, remarks || '', updatedBy, id]
    );
    return this.findById(id);
  }
};
