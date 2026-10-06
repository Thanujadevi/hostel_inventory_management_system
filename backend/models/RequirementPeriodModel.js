import pool from '../config/db.js';

export const RequirementPeriodModel = {
  async ensureColumns() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tbl_Requirement_Period (
          int_Period_Id INT AUTO_INCREMENT PRIMARY KEY,
          txt_Title VARCHAR(200),
          txt_Month VARCHAR(20) DEFAULT 'October',
          int_Year INT DEFAULT 2026,
          txt_Status VARCHAR(20) DEFAULT 'OPEN',
          dte_Start_Date DATETIME,
          dte_Deadline DATETIME,
          txt_Remarks TEXT,
          txt_Instructions TEXT,
          arr_Active_Item_Ids JSON,
          dte_Updated_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      const [cols] = await pool.query('SHOW COLUMNS FROM tbl_Requirement_Period');
      const colNames = cols.map(c => c.Field);

      if (!colNames.includes('txt_Title')) {
        await pool.query('ALTER TABLE tbl_Requirement_Period ADD COLUMN txt_Title VARCHAR(200)');
      }
      if (!colNames.includes('txt_Month')) {
        await pool.query("ALTER TABLE tbl_Requirement_Period ADD COLUMN txt_Month VARCHAR(20) DEFAULT 'October'");
      }
      if (!colNames.includes('int_Year')) {
        await pool.query('ALTER TABLE tbl_Requirement_Period ADD COLUMN int_Year INT DEFAULT 2026');
      }
      if (!colNames.includes('txt_Instructions')) {
        await pool.query('ALTER TABLE tbl_Requirement_Period ADD COLUMN txt_Instructions TEXT');
      }
      if (!colNames.includes('arr_Active_Item_Ids')) {
        await pool.query('ALTER TABLE tbl_Requirement_Period ADD COLUMN arr_Active_Item_Ids JSON');
      }
    } catch (err) {
      console.warn("RequirementPeriodModel column check notice:", err.message);
    }
  },

  async getCurrent() {
    await this.ensureColumns();
    const [rows] = await pool.query('SELECT * FROM tbl_Requirement_Period ORDER BY int_Period_Id DESC LIMIT 1');
    if (rows.length === 0) {
      const [result] = await pool.query(
        `INSERT INTO tbl_Requirement_Period (txt_Title, txt_Month, int_Year, txt_Status, dte_Start_Date, dte_Deadline, txt_Remarks, txt_Instructions)
         VALUES ('October 2026 Monthly Hostel Requirement Window', 'October', 2026, 'OPEN', NOW(), DATE_ADD(NOW(), INTERVAL 10 DAY), 'Default Monthly Requirement Window', 'Please inspect hostel inventory stock levels and submit monthly requirements before the deadline.')`
      );
      const [newRows] = await pool.query('SELECT * FROM tbl_Requirement_Period WHERE int_Period_Id = ?', [result.insertId]);
      return this.formatPeriod(newRows[0]);
    }
    return this.formatPeriod(rows[0]);
  },

  formatPeriod(row) {
    if (!row) return null;
    let activeItems = [];
    if (row.arr_Active_Item_Ids) {
      try {
        activeItems = typeof row.arr_Active_Item_Ids === 'string' ? JSON.parse(row.arr_Active_Item_Ids) : row.arr_Active_Item_Ids;
      } catch (e) {
        activeItems = [];
      }
    }
    return {
      ...row,
      txt_Month: row.txt_Month || 'October',
      int_Year: row.int_Year || 2026,
      txt_Title: row.txt_Title || `${row.txt_Month || 'October'} ${row.int_Year || 2026} Monthly Hostel Requirement Period`,
      arr_Active_Item_Ids: activeItems
    };
  },

  async savePeriod(data) {
    await this.ensureColumns();
    const current = await this.getCurrent();

    const title = data.txt_Title || (data.txt_Month ? `${data.txt_Month} ${data.int_Year || 2026} Monthly Hostel Requirement Period` : null);
    const month = data.txt_Month || 'October';
    const year = data.int_Year || 2026;
    const status = data.txt_Status || 'OPEN';
    const startDate = data.dte_Start_Date || null;
    const deadline = data.dte_Deadline || null;
    const remarks = data.txt_Remarks || '';
    const instructions = data.txt_Instructions || '';
    const activeItemIdsJson = JSON.stringify(data.arr_Active_Item_Ids || []);

    if (current && current.int_Period_Id) {
      await pool.query(
        `UPDATE tbl_Requirement_Period SET
          txt_Title = ?,
          txt_Month = ?,
          int_Year = ?,
          txt_Status = ?,
          dte_Start_Date = COALESCE(?, dte_Start_Date),
          dte_Deadline = COALESCE(?, dte_Deadline),
          txt_Remarks = ?,
          txt_Instructions = ?,
          arr_Active_Item_Ids = ?,
          dte_Updated_Date = NOW()
         WHERE int_Period_Id = ?`,
        [title, month, year, status, startDate, deadline, remarks, instructions, activeItemIdsJson, current.int_Period_Id]
      );
      return this.getCurrent();
    } else {
      const [result] = await pool.query(
        `INSERT INTO tbl_Requirement_Period (txt_Title, txt_Month, int_Year, txt_Status, dte_Start_Date, dte_Deadline, txt_Remarks, txt_Instructions, arr_Active_Item_Ids, dte_Updated_Date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [title, month, year, status, startDate || new Date(), deadline || null, remarks, instructions, activeItemIdsJson]
      );
      const [newRows] = await pool.query('SELECT * FROM tbl_Requirement_Period WHERE int_Period_Id = ?', [result.insertId]);
      return this.formatPeriod(newRows[0]);
    }
  },

  async toggleStatus(status) {
    return this.savePeriod({ txt_Status: status });
  }
};

