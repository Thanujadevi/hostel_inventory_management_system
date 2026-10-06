import pool from '../config/db.js';
import { getOrGenerateUniqueCode } from '../utils/codeUtils.js';

export const StoreModel = {
  async getAll() {
    const [rows] = await pool.query(`
      SELECT 
        s.*, 
        COALESCE(s.txt_Incharge, '') AS txt_Incharge_Name,
        COALESCE(s.txt_Campus, '') AS txt_Location,
        'Residential Hostel' AS txt_Store_Type
      FROM tbl_Store s
      ORDER BY s.int_Store_Id DESC
    `);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(`
      SELECT 
        s.*, 
        COALESCE(s.txt_Incharge, '') AS txt_Incharge_Name,
        COALESCE(s.txt_Campus, '') AS txt_Location,
        'Residential Hostel' AS txt_Store_Type
      FROM tbl_Store s
      WHERE s.int_Store_Id = ?
    `, [id]);
    return rows[0] || null;
  },

  async findByCredentials(username, password) {
    const [rows] = await pool.query(
      `SELECT 
        s.*, 
        COALESCE(s.txt_Incharge, '') AS txt_Incharge_Name,
        COALESCE(s.txt_Campus, '') AS txt_Location
      FROM tbl_Store s
      WHERE (s.txt_Username = ? OR s.txt_Store_Code = ? OR s.txt_Email = ?) AND s.txt_Password = ? AND (s.txt_Active = "Y" OR s.txt_Active = "Active")`,
      [username, username, username, password]
    );
    return rows[0] || null;
  },

  async create(storeData) {
    const storeCode = await getOrGenerateUniqueCode(pool, 'tbl_Store', 'txt_Store_Code', 'STR', storeData.txt_Store_Code);
    const createdBy = storeData.txt_Created_By || 'System';
    const updatedBy = storeData.txt_Updated_By || createdBy;
    const campus = storeData.txt_Location || storeData.txt_Campus || '';
    const incharge = storeData.txt_Incharge_Name || storeData.txt_Incharge || '';
    
    const [result] = await pool.query(
      `INSERT INTO tbl_Store 
        (txt_Store_Code, txt_Store_Name, txt_Campus, txt_Incharge, txt_Email, txt_Phone, txt_Username, txt_Password, txt_Active, dte_Created_Date, txt_Created_By, dte_Updated_Date, txt_Updated_By)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?)`,
      [
        storeCode, 
        storeData.txt_Store_Name, 
        campus,
        incharge,
        storeData.txt_Email || '', 
        storeData.txt_Phone || '',
        storeData.txt_Username || storeCode.toLowerCase(),
        storeData.txt_Password || 'storepassword', 
        storeData.txt_Active || 'Y',
        createdBy, 
        updatedBy
      ]
    );
    return this.findById(result.insertId);
  },

  async update(id, storeData) {
    const updatedBy = storeData.txt_Updated_By || 'System';
    const campus = storeData.txt_Location || storeData.txt_Campus || null;
    const incharge = storeData.txt_Incharge_Name || storeData.txt_Incharge || null;

    await pool.query(
      `UPDATE tbl_Store SET 
        txt_Store_Code = COALESCE(?, txt_Store_Code),
        txt_Store_Name = COALESCE(?, txt_Store_Name),
        txt_Campus = COALESCE(?, txt_Campus), 
        txt_Incharge = COALESCE(?, txt_Incharge), 
        txt_Email = COALESCE(?, txt_Email),
        txt_Phone = COALESCE(?, txt_Phone),
        txt_Username = COALESCE(?, txt_Username), 
        txt_Password = COALESCE(?, txt_Password),
        txt_Active = COALESCE(?, txt_Active),
        dte_Updated_Date = NOW(),
        txt_Updated_By = ?
      WHERE int_Store_Id = ?`,
      [
        storeData.txt_Store_Code || null,
        storeData.txt_Store_Name || null,
        campus,
        incharge,
        storeData.txt_Email || null,
        storeData.txt_Phone || null,
        storeData.txt_Username || null,
        storeData.txt_Password || null,
        storeData.txt_Active || 'Y',
        updatedBy,
        id
      ]
    );
    return this.findById(id);
  },

  async delete(id) {
    const [reqs] = await pool.query('SELECT int_Request_Id FROM tbl_Inventory_Request WHERE int_Store_Id = ?', [id]);
    const reqIds = reqs.map(r => r.int_Request_Id);

    if (reqIds.length > 0) {
      const [quotes] = await pool.query('SELECT int_Quotation_Id FROM tbl_Quotation WHERE int_Request_Id IN (?)', [reqIds]);
      const quoteIds = quotes.map(q => q.int_Quotation_Id);

      if (quoteIds.length > 0) {
        await pool.query('DELETE FROM tbl_Quotation_Item WHERE int_Quotation_Id IN (?)', [quoteIds]);
        await pool.query('DELETE FROM tbl_Quotation WHERE int_Quotation_Id IN (?)', [quoteIds]);
      }

      const [purchases] = await pool.query('SELECT int_Purchase_Id FROM tbl_Purchase WHERE int_Store_Id = ? OR int_Request_Id IN (?)', [id, reqIds]);
      const purchaseIds = purchases.map(p => p.int_Purchase_Id);
      if (purchaseIds.length > 0) {
        await pool.query('DELETE FROM tbl_Payment WHERE int_Purchase_Id IN (?)', [purchaseIds]);
        await pool.query('DELETE FROM tbl_Purchase WHERE int_Purchase_Id IN (?)', [purchaseIds]);
      }

      await pool.query('DELETE FROM tbl_Request_Item WHERE int_Request_Id IN (?)', [reqIds]);
      await pool.query('DELETE FROM tbl_Inventory_Request WHERE int_Request_Id IN (?)', [reqIds]);
    }

    const [directPurchases] = await pool.query('SELECT int_Purchase_Id FROM tbl_Purchase WHERE int_Store_Id = ?', [id]);
    const directPIds = directPurchases.map(p => p.int_Purchase_Id);
    if (directPIds.length > 0) {
      await pool.query('DELETE FROM tbl_Payment WHERE int_Purchase_Id IN (?)', [directPIds]);
      await pool.query('DELETE FROM tbl_Purchase WHERE int_Purchase_Id IN (?)', [directPIds]);
    }

    await pool.query('DELETE FROM tbl_Store_Stock WHERE int_Store_Id = ?', [id]);
    await pool.query('DELETE FROM tbl_Store WHERE int_Store_Id = ?', [id]);
    return true;
  }
};
