import pool from '../config/db.js';

export const SupplierModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM tbl_Supplier ORDER BY int_Supplier_Id DESC');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tbl_Supplier WHERE int_Supplier_Id = ?', [id]);
    return rows[0] || null;
  },

  async findByPhone(phone) {
    const [rows] = await pool.query('SELECT * FROM tbl_Supplier WHERE txt_Phone = ?', [phone]);
    return rows[0] || null;
  },

  async findByCredentials(username, password) {
    const [rows] = await pool.query(
      'SELECT * FROM tbl_Supplier WHERE (txt_Email = ? OR txt_Supplier_Code = ? OR txt_Phone = ?) AND txt_Password = ? AND txt_Active = "Y"',
      [username, username, username, password]
    );
    return rows[0] || null;
  },

  async create(s) {
    const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM tbl_Supplier');
    const supplierCode = s.txt_Supplier_Code || `SUP-${String(countRows[0].cnt + 1).padStart(3, '0')}`;

    const [result] = await pool.query(
      `INSERT INTO tbl_Supplier 
        (txt_Supplier_Code, txt_Supplier_Name, txt_Contact_Person, txt_Email, txt_Phone, txt_GSTIN, txt_Address, txt_City, txt_State, txt_Pincode, txt_Country, txt_Bank_Name, txt_Account_No, txt_IFSC, dbl_Rating, txt_Password, txt_Active, txt_Profile_Completed, dte_Created_Date, txt_Created_By)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'ADM001')`,
      [
        supplierCode, s.txt_Supplier_Name || s.txt_Store_Name, s.txt_Contact_Person || s.txt_Owner_Name, s.txt_Email,
        s.txt_Phone, s.txt_GSTIN || '', s.txt_Address || '', s.txt_City || '', s.txt_State || '',
        s.txt_Pincode || '', s.txt_Country || 'India', s.txt_Bank_Name || '', s.txt_Account_No || '',
        s.txt_IFSC || '', s.dbl_Rating || 4.50, s.txt_Password || 'supplier123',
        s.txt_Active || 'Y', s.txt_Profile_Completed || 'N'
      ]
    );
    return result.insertId;
  },

  async update(id, s) {
    await pool.query(
      `UPDATE tbl_Supplier SET
        txt_Supplier_Name = ?, txt_Contact_Person = ?, txt_Email = ?, 
        txt_Phone = ?, txt_GSTIN = ?, txt_Address = ?, txt_City = ?, 
        txt_State = ?, txt_Pincode = ?, txt_Country = ?, txt_Bank_Name = ?, 
        txt_Account_No = ?, txt_IFSC = ?, dbl_Rating = ?, txt_Active = ?, 
        txt_Profile_Completed = ?, dte_Updated_Date = CURDATE()
      WHERE int_Supplier_Id = ?`,
      [
        s.txt_Supplier_Name, s.txt_Contact_Person, s.txt_Email,
        s.txt_Phone, s.txt_GSTIN, s.txt_Address, s.txt_City,
        s.txt_State, s.txt_Pincode, s.txt_Country || 'India', s.txt_Bank_Name,
        s.txt_Account_No, s.txt_IFSC, s.dbl_Rating || 4.50, s.txt_Active || 'Y',
        s.txt_Profile_Completed || 'Y', id
      ]
    );
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM tbl_Supplier WHERE int_Supplier_Id = ?', [id]);
    return true;
  }
};
