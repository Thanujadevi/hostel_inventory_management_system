import pool from '../config/db.js';

export const RequirementPeriodModel = {
  async getCurrent() {
    const [rows] = await pool.query('SELECT * FROM tbl_Requirement_Period ORDER BY int_Period_Id DESC LIMIT 1');
    if (rows.length === 0) {
      const [result] = await pool.query(
        `INSERT INTO tbl_Requirement_Period (txt_Status, dte_Start_Date, dte_Deadline, txt_Remarks)
         VALUES ('OPEN', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'Default Monthly Requirement Window')`
      );
      const [newRows] = await pool.query('SELECT * FROM tbl_Requirement_Period WHERE int_Period_Id = ?', [result.insertId]);
      return newRows[0];
    }
    return rows[0];
  },

  async savePeriod(data) {
    const current = await this.getCurrent();
    if (current && current.int_Period_Id) {
      await pool.query(
        `UPDATE tbl_Requirement_Period SET
          txt_Status = COALESCE(?, txt_Status),
          dte_Start_Date = COALESCE(?, dte_Start_Date),
          dte_Deadline = COALESCE(?, dte_Deadline),
          txt_Remarks = COALESCE(?, txt_Remarks),
          dte_Updated_Date = NOW()
         WHERE int_Period_Id = ?`,
        [data.txt_Status || null, data.dte_Start_Date || null, data.dte_Deadline || null, data.txt_Remarks || null, current.int_Period_Id]
      );
      return this.getCurrent();
    } else {
      const [result] = await pool.query(
        `INSERT INTO tbl_Requirement_Period (txt_Status, dte_Start_Date, dte_Deadline, txt_Remarks, dte_Updated_Date)
         VALUES (?, ?, ?, ?, NOW())`,
        [data.txt_Status || 'OPEN', data.dte_Start_Date || new Date(), data.dte_Deadline || null, data.txt_Remarks || '']
      );
      const [newRows] = await pool.query('SELECT * FROM tbl_Requirement_Period WHERE int_Period_Id = ?', [result.insertId]);
      return newRows[0];
    }
  },

  async toggleStatus(status) {
    return this.savePeriod({ txt_Status: status });
  }
};
