import pool from '../config/db.js';

export const AdminModel = {
  async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM tbl_Admin WHERE txt_Email = ? AND txt_Active = "Y"',
      [email]
    );
    return rows[0] || null;
  },

  async findByUsername(username) {
    const [rows] = await pool.query(
      'SELECT * FROM tbl_Admin WHERE (txt_Email = ? OR txt_Admin_Code = ?) AND txt_Active = "Y"',
      [username, username]
    );
    return rows[0] || null;
  },

  async verifyCredentials(username, password) {
    const [rows] = await pool.query(
      'SELECT * FROM tbl_Admin WHERE (txt_Email = ? OR txt_Admin_Code = ?) AND txt_Password = ? AND txt_Active = "Y"',
      [username, username, password]
    );
    return rows[0] || null;
  },

  async getAll() {
    const [rows] = await pool.query('SELECT int_Admin_Id, txt_Admin_Code, txt_Admin_Name, txt_Email, txt_Role, txt_Active FROM tbl_Admin');
    return rows;
  }
};
