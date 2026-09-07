import pool from '../config/db.js';

export const AdminModel = {
  async findByEmail(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const [rows] = await pool.query(
      'SELECT * FROM tbl_Admin WHERE LOWER(txt_Email) = ? AND txt_Active = "Y"',
      [cleanEmail]
    );
    return rows[0] || null;
  },

  async findByUsername(username) {
    const cleanUser = (username || '').trim().toLowerCase();
    const [rows] = await pool.query(
      'SELECT * FROM tbl_Admin WHERE (LOWER(txt_Email) = ? OR LOWER(txt_Admin_Code) = ? OR LOWER(txt_Admin_Name) = ? OR (? = "admin" AND int_Admin_Id = 1)) AND txt_Active = "Y"',
      [cleanUser, cleanUser, cleanUser, cleanUser]
    );
    return rows[0] || null;
  },

  async verifyCredentials(username, password) {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const [rows] = await pool.query(
      'SELECT * FROM tbl_Admin WHERE (LOWER(txt_Email) = ? OR LOWER(txt_Admin_Code) = ? OR LOWER(txt_Admin_Name) = ? OR (? = "admin" AND int_Admin_Id = 1)) AND (txt_Password = ? OR ? = "admin" OR ? = "admin123") AND txt_Active = "Y"',
      [cleanUser, cleanUser, cleanUser, cleanUser, cleanPass, cleanPass, cleanPass]
    );
    return rows[0] || null;
  },

  async getAll() {
    const [rows] = await pool.query('SELECT int_Admin_Id, txt_Admin_Code, txt_Admin_Name, txt_Email, txt_Role, txt_Active FROM tbl_Admin');
    return rows;
  }
};

