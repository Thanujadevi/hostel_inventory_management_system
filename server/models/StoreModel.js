import pool from '../config/db.js';

export const StoreModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM tbl_Store ORDER BY int_Store_Id DESC');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM tbl_Store WHERE int_Store_Id = ?', [id]);
    return rows[0] || null;
  },

  async findByCredentials(username, password) {
    const [rows] = await pool.query(
      'SELECT * FROM tbl_Store WHERE (txt_Username = ? OR txt_Store_Code = ? OR txt_Email = ?) AND txt_Password = ? AND txt_Active = "Y"',
      [username, username, username, password]
    );
    return rows[0] || null;
  },

  async create(storeData) {
    const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM tbl_Store');
    const storeCode = storeData.txt_Store_Code || `STR-${String(countRows[0].cnt + 1).padStart(3, '0')}`;
    
    const [result] = await pool.query(
      `INSERT INTO tbl_Store 
        (txt_Store_Code, txt_Store_Name, txt_Campus, txt_Incharge, txt_Email, txt_Phone, txt_Username, txt_Password, txt_Active, dte_Created_Date, txt_Created_By)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'ADM001')`,
      [
        storeCode, storeData.txt_Store_Name, storeData.txt_Campus, storeData.txt_Incharge,
        storeData.txt_Email, storeData.txt_Phone, storeData.txt_Username || storeCode.toLowerCase(),
        storeData.txt_Password || 'storepassword', storeData.txt_Active || 'Y'
      ]
    );
    return result.insertId;
  },

  async update(id, storeData) {
    await pool.query(
      `UPDATE tbl_Store SET 
        txt_Store_Name = ?, txt_Campus = ?, txt_Incharge = ?, 
        txt_Email = ?, txt_Phone = ?, txt_Username = ?, 
        txt_Password = ?, txt_Active = ?, dte_Updated_Date = CURDATE()
      WHERE int_Store_Id = ?`,
      [
        storeData.txt_Store_Name, storeData.txt_Campus, storeData.txt_Incharge,
        storeData.txt_Email, storeData.txt_Phone, storeData.txt_Username,
        storeData.txt_Password, storeData.txt_Active || 'Y', id
      ]
    );
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM tbl_Store WHERE int_Store_Id = ?', [id]);
    return true;
  }
};
