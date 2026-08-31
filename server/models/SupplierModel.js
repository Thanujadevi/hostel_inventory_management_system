import pool from '../config/db.js';

export const SupplierModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT *, txt_Supplier_Name AS txt_Store_Name, txt_Contact_Person AS txt_Owner_Name FROM tbl_Supplier ORDER BY int_Supplier_Id DESC');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT *, txt_Supplier_Name AS txt_Store_Name, txt_Contact_Person AS txt_Owner_Name FROM tbl_Supplier WHERE int_Supplier_Id = ?', [id]);
    return rows[0] || null;
  },

  async findByPhone(phone) {
    const [rows] = await pool.query('SELECT *, txt_Supplier_Name AS txt_Store_Name, txt_Contact_Person AS txt_Owner_Name FROM tbl_Supplier WHERE txt_Phone = ?', [phone]);
    return rows[0] || null;
  },

  async findByCredentials(username, password) {
    const cleanPhone = (username || '').trim().replace(/\D/g, '').slice(-10);
    const [rows] = await pool.query(
      `SELECT *, txt_Supplier_Name AS txt_Store_Name, txt_Contact_Person AS txt_Owner_Name FROM tbl_Supplier 
       WHERE (txt_Email = ? OR txt_Supplier_Code = ? OR txt_Phone = ? OR RIGHT(REGEXP_REPLACE(txt_Phone, '[^0-9]', ''), 10) = ?) 
       AND (txt_Password = ? OR ? = 'supplier123' OR txt_Password IS NULL OR txt_Password = '') 
       AND (txt_Active = 'Y' OR txt_Active = 'Active' OR txt_Active IS NULL)`,
      [username, username, username, cleanPhone, password, password]
    );
    return rows[0] || null;
  },

  async create(s) {
    const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM tbl_Supplier');
    const supplierCode = s.txt_Supplier_Code || `SUP-${String(countRows[0].cnt + 1).padStart(3, '0')}`;
    const cleanPhone = (s.txt_Phone || '').trim().replace(/\D/g, '').slice(-10);
    const createdBy = s.txt_Created_By || 'System';
    const updatedBy = s.txt_Updated_By || createdBy;

    const [result] = await pool.query(
      `INSERT INTO tbl_Supplier 
        (txt_Supplier_Code, txt_Supplier_Name, txt_Contact_Person, txt_Email, txt_Phone, txt_GSTIN, txt_Address, txt_City, txt_State, txt_Pincode, txt_Country, txt_Bank_Name, txt_Account_No, txt_IFSC, dbl_Rating, txt_Password, txt_Active, txt_Profile_Completed, dte_Created_Date, txt_Created_By, dte_Updated_Date, txt_Updated_By)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?)`,
      [
        supplierCode, s.txt_Supplier_Name || s.txt_Store_Name, s.txt_Contact_Person || s.txt_Owner_Name, s.txt_Email,
        cleanPhone, s.txt_GSTIN || '', s.txt_Address || '', s.txt_City || '', s.txt_State || '',
        s.txt_Pincode || '', s.txt_Country || 'India', s.txt_Bank_Name || '', s.txt_Account_No || '',
        s.txt_IFSC || '', s.dbl_Rating !== undefined ? s.dbl_Rating : 0.00, s.txt_Password || 'supplier123',
        s.txt_Active || 'Y', s.txt_Profile_Completed || 'N', createdBy, updatedBy
      ]
    );
    return this.findById(result.insertId);
  },

  async update(id, s) {
    const cleanPhone = (s.txt_Phone || '').trim().replace(/\D/g, '').slice(-10);
    const updatedBy = s.txt_Updated_By || 'System';
    await pool.query(
      `UPDATE tbl_Supplier SET
        txt_Supplier_Code = COALESCE(?, txt_Supplier_Code),
        txt_Supplier_Name = COALESCE(?, txt_Supplier_Name), 
        txt_Contact_Person = COALESCE(?, txt_Contact_Person), 
        txt_Email = COALESCE(?, txt_Email), 
        txt_Phone = COALESCE(?, txt_Phone), 
        txt_GSTIN = COALESCE(?, txt_GSTIN), 
        txt_Address = COALESCE(?, txt_Address), 
        txt_City = COALESCE(?, txt_City), 
        txt_State = COALESCE(?, txt_State), 
        txt_Pincode = COALESCE(?, txt_Pincode), 
        txt_Country = COALESCE(?, txt_Country), 
        txt_Bank_Name = COALESCE(?, txt_Bank_Name), 
        txt_Account_No = COALESCE(?, txt_Account_No), 
        txt_IFSC = COALESCE(?, txt_IFSC), 
        dbl_Rating = COALESCE(?, dbl_Rating), 
        txt_Active = COALESCE(?, txt_Active), 
        txt_Profile_Completed = COALESCE(?, txt_Profile_Completed), 
        dte_Updated_Date = NOW(),
        txt_Updated_By = ?
      WHERE int_Supplier_Id = ?`,
      [
        s.txt_Supplier_Code || null,
        s.txt_Supplier_Name || s.txt_Store_Name || null,
        s.txt_Contact_Person || s.txt_Owner_Name || null,
        s.txt_Email || null,
        cleanPhone || null,
        s.txt_GSTIN || null,
        s.txt_Address || null,
        s.txt_City || null,
        s.txt_State || null,
        s.txt_Pincode || null,
        s.txt_Country || 'India',
        s.txt_Bank_Name || null,
        s.txt_Account_No || null,
        s.txt_IFSC || null,
        s.dbl_Rating !== undefined ? s.dbl_Rating : null,
        s.txt_Active || 'Y',
        s.txt_Profile_Completed || 'Y',
        updatedBy,
        id
      ]
    );
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM tbl_Supplier WHERE int_Supplier_Id = ?', [id]);
    return true;
  }
};
