import pool from '../config/db.js';

export const RequirementModel = {
  async getAll() {
    const [rawRequests] = await pool.query(`
      SELECT r.*, s.txt_Store_Name, s.txt_Campus 
      FROM tbl_Inventory_Request r
      LEFT JOIN tbl_Store s ON r.int_Store_Id = s.int_Store_Id
      ORDER BY r.int_Request_Id DESC
    `);

    // Deduplicate requirement rows by txt_Request_Code / int_Request_Id
    const uniqueMap = new Map();
    for (let req of rawRequests) {
      const codeKey = req.txt_Request_Code || req.txt_Request_No || `REQ-${req.int_Request_Id}`;
      if (!uniqueMap.has(codeKey) && !uniqueMap.has(String(req.int_Request_Id))) {
        uniqueMap.set(codeKey, req);
      }
    }
    const requests = Array.from(uniqueMap.values());

    for (let req of requests) {
      req.txt_Request_No = req.txt_Request_No || req.txt_Request_Code || `REQ-${req.int_Request_Id}`;
      req.store_name = req.store_name || req.txt_Store_Name || `Store #${req.int_Store_Id}`;
      req.dte_Request_Date = req.dte_Request_Date ? new Date(req.dte_Request_Date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      req.txt_Month = req.txt_Month || 'August';
      req.int_Year = req.int_Year || 2026;

      const [items] = await pool.query(`
        SELECT ri.*, i.txt_Item_Name, i.txt_Unit, i.txt_Item_Code, 'Standard' AS txt_Brand, i.dbl_Unit_Price, c.txt_Category_Name AS txt_Category
        FROM tbl_Request_Item ri
        LEFT JOIN tbl_Item i ON ri.int_Item_Id = i.int_Item_Id
        LEFT JOIN tbl_Category c ON i.int_Category_Id = c.int_Category_Id
        WHERE ri.int_Request_Id = ?
      `, [req.int_Request_Id]);

      let totalBudget = 0;
      req.items = items.map(item => {
        const qty = Number(item.int_Quantity || item.int_Requested_Quantity || item.dec_Required_Qty || item.quantity || 0);
        const price = Number(item.dbl_Unit_Price || item.dec_Last_Purchase_Price || item.price || 50);
        const cat = item.txt_Category || item.txt_Category_Name || item.category || 'General';
        totalBudget += qty * price;

        return {
          ...item,
          int_Product_Id: item.int_Product_Id || item.int_Item_Id,
          int_Item_Id: item.int_Item_Id || item.int_Product_Id,
          product_code: item.product_code || item.txt_Item_Code || `PRD-00${item.int_Item_Id}`,
          txt_Item_Code: item.txt_Item_Code || item.product_code || `PRD-00${item.int_Item_Id}`,
          product_name: item.product_name || item.txt_Item_Name || `Product #${item.int_Item_Id}`,
          txt_Item_Name: item.txt_Item_Name || item.product_name || `Product #${item.int_Item_Id}`,
          category: cat,
          txt_Category: cat,
          brand: item.brand || item.txt_Brand || 'Standard',
          txt_Brand: item.txt_Brand || item.brand || 'Standard',
          unit: item.unit || item.txt_Unit || 'Pcs',
          txt_Unit: item.txt_Unit || item.unit || 'Pcs',
          int_Quantity: qty,
          dec_Required_Qty: qty,
          int_Requested_Quantity: qty
        };
      });

      req.dec_Budget = Number(req.dec_Budget || totalBudget || 0);
    }
    return requests;
  },

  async findById(id) {
    const reqId = Number(id);
    const [rows] = await pool.query(`
      SELECT r.*, s.txt_Store_Name, s.txt_Campus 
      FROM tbl_Inventory_Request r
      LEFT JOIN tbl_Store s ON r.int_Store_Id = s.int_Store_Id
      WHERE r.int_Request_Id = ? OR r.txt_Request_Code = ?
    `, [reqId || 0, String(id)]);
    if (rows.length === 0) return null;
    const req = rows[0];
    req.txt_Request_No = req.txt_Request_No || req.txt_Request_Code || `REQ-${req.int_Request_Id}`;
    req.store_name = req.store_name || req.txt_Store_Name || `Store #${req.int_Store_Id}`;
    req.dte_Request_Date = req.dte_Request_Date ? new Date(req.dte_Request_Date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    req.txt_Month = req.txt_Month || 'August';
    req.int_Year = req.int_Year || 2026;

    const [items] = await pool.query(`
      SELECT ri.*, i.txt_Item_Name, i.txt_Unit, i.txt_Item_Code, 'Standard' AS txt_Brand, i.dbl_Unit_Price, c.txt_Category_Name AS txt_Category
      FROM tbl_Request_Item ri
      LEFT JOIN tbl_Item i ON ri.int_Item_Id = i.int_Item_Id
      LEFT JOIN tbl_Category c ON i.int_Category_Id = c.int_Category_Id
      WHERE ri.int_Request_Id = ?
    `, [req.int_Request_Id]);

    let totalBudget = 0;
    req.items = items.map(item => {
      const qty = Number(item.int_Quantity || item.int_Requested_Quantity || item.dec_Required_Qty || item.quantity || 0);
      const price = Number(item.dbl_Unit_Price || item.dec_Last_Purchase_Price || item.price || 50);
      const cat = item.txt_Category || item.txt_Category_Name || item.category || 'General';
      totalBudget += qty * price;

      return {
        ...item,
        int_Product_Id: item.int_Product_Id || item.int_Item_Id,
        int_Item_Id: item.int_Item_Id || item.int_Product_Id,
        product_code: item.product_code || item.txt_Item_Code || `PRD-00${item.int_Item_Id}`,
        txt_Item_Code: item.txt_Item_Code || item.product_code || `PRD-00${item.int_Item_Id}`,
        product_name: item.product_name || item.txt_Item_Name || `Product #${item.int_Item_Id}`,
        txt_Item_Name: item.txt_Item_Name || item.product_name || `Product #${item.int_Item_Id}`,
        category: cat,
        txt_Category: cat,
        brand: item.brand || item.txt_Brand || 'Standard',
        txt_Brand: item.txt_Brand || item.brand || 'Standard',
        unit: item.unit || item.txt_Unit || 'Pcs',
        txt_Unit: item.txt_Unit || item.unit || 'Pcs',
        int_Quantity: qty,
        dec_Required_Qty: qty,
        int_Requested_Quantity: qty
      };
    });

    req.dec_Budget = Number(req.dec_Budget || totalBudget || 0);
    return req;
  },

  async create(reqData) {
    const createdBy = reqData.txt_Created_By || 'Store Incharge';
    const updatedBy = reqData.txt_Updated_By || createdBy;

    let storeId = Number(reqData.int_Store_Id || 1);
    const [storeCheck] = await pool.query('SELECT int_Store_Id FROM tbl_Store WHERE int_Store_Id = ?', [storeId]);
    if (storeCheck.length === 0) {
      const [firstStore] = await pool.query('SELECT int_Store_Id FROM tbl_Store LIMIT 1');
      if (firstStore.length > 0) {
        storeId = firstStore[0].int_Store_Id;
      }
    }

    // Calculate total budget for this store request
    let calculatedBudget = Number(reqData.dec_Budget || 0);
    if (reqData.items && Array.isArray(reqData.items)) {
      let sum = 0;
      for (let item of reqData.items) {
        const itemId = Number(item.int_Product_Id || item.int_Item_Id);
        const qty = Number(item.dec_Required_Qty || item.int_Requested_Quantity || item.int_Quantity || item.quantity || 1);
        const [priceRows] = await pool.query('SELECT dbl_Unit_Price FROM tbl_Item WHERE int_Item_Id = ?', [itemId]);
        const price = priceRows.length > 0 ? Number(priceRows[0].dbl_Unit_Price || 0) : 0;
        sum += qty * price;
      }
      if (sum > 0) calculatedBudget = sum;
    }

    // Check if an existing Pending store request exists for this Store
    const [existingStoreReqs] = await pool.query(
      `SELECT int_Request_Id, txt_Request_Code FROM tbl_Inventory_Request 
       WHERE int_Store_Id = ? AND (txt_Status = 'Pending Approval' OR txt_Status = 'Pending') 
       ORDER BY int_Request_Id DESC LIMIT 1`,
      [storeId]
    );

    let requestId;
    let requestCode;

    if (existingStoreReqs.length > 0) {
      // Consolidate into existing single store request
      requestId = existingStoreReqs[0].int_Request_Id;
      requestCode = existingStoreReqs[0].txt_Request_Code;

      try {
        await pool.query(
          `UPDATE tbl_Inventory_Request SET 
            dec_Budget = ?, 
            txt_Month = ?, 
            int_Year = ?, 
            txt_Remarks = ?, 
            txt_Status = 'Pending Approval',
            dte_Updated_Date = NOW(), 
            txt_Updated_By = ?
          WHERE int_Request_Id = ?`,
          [calculatedBudget, reqData.txt_Month || 'August', reqData.int_Year || 2026, reqData.txt_Remarks || '', updatedBy, requestId]
        );
      } catch (err) {
        await pool.query(
          `UPDATE tbl_Inventory_Request SET 
            txt_Remarks = ?, 
            txt_Status = 'Pending Approval'
          WHERE int_Request_Id = ?`,
          [reqData.txt_Remarks || '', requestId]
        );
      }

      // Clear existing line items to replace with updated store manifest
      await pool.query('DELETE FROM tbl_Request_Item WHERE int_Request_Id = ?', [requestId]);
    } else {
      // Create new single store request
      const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM tbl_Inventory_Request');
      requestCode = reqData.txt_Request_Code || reqData.txt_Request_No || `REQ-${String(countRows[0].cnt + 1).padStart(4, '0')}`;

      try {
        const [result] = await pool.query(
          `INSERT INTO tbl_Inventory_Request
            (txt_Request_Code, int_Store_Id, dec_Budget, txt_Month, int_Year, dte_Request_Date, txt_Status, txt_Remarks, dte_Created_Date, txt_Created_By, dte_Updated_Date, txt_Updated_By)
          VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, NOW(), ?, NOW(), ?)`,
          [
            requestCode, storeId, calculatedBudget, reqData.txt_Month || 'August', reqData.int_Year || 2026,
            reqData.txt_Status || 'Pending Approval', reqData.txt_Remarks || '', createdBy, updatedBy
          ]
        );
        requestId = result.insertId;
      } catch (err) {
        // Fallback INSERT if dec_Budget or extra columns are not yet present in MySQL schema
        const [result] = await pool.query(
          `INSERT INTO tbl_Inventory_Request
            (txt_Request_Code, int_Store_Id, txt_Priority, txt_Status, txt_Remarks, dte_Request_Date, txt_Created_By)
          VALUES (?, ?, 'Medium', ?, ?, NOW(), ?)`,
          [requestCode, storeId, reqData.txt_Status || 'Pending Approval', reqData.txt_Remarks || '', createdBy]
        );
        requestId = result.insertId;
      }
    }

    // Insert item manifest rows
    if (reqData.items && Array.isArray(reqData.items)) {
      for (let item of reqData.items) {
        const itemId = Number(item.int_Product_Id || item.int_Item_Id);
        const qty = Number(item.dec_Required_Qty || item.int_Requested_Quantity || item.int_Quantity || item.quantity || 1);

        const [itemCheck] = await pool.query('SELECT int_Item_Id FROM tbl_Item WHERE int_Item_Id = ?', [itemId]);
        if (itemCheck.length > 0) {
          await pool.query(
            `INSERT INTO tbl_Request_Item
              (int_Request_Id, int_Item_Id, int_Quantity)
            VALUES (?, ?, ?)`,
            [requestId, itemId, qty]
          );
        }
      }
    }
    return this.findById(requestId);
  },

  async updateStatus(id, status, remarks, updatedBy = 'System') {
    const reqId = Number(id);
    await pool.query(
      `UPDATE tbl_Inventory_Request SET 
        txt_Status = ?, txt_Remarks = ?, dte_Updated_Date = NOW(), txt_Updated_By = ?
      WHERE int_Request_Id = ? OR txt_Request_Code = ?`,
      [status, remarks || '', updatedBy, reqId || 0, String(id)]
    );
    return this.findById(reqId || id);
  }
};
