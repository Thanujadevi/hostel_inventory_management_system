import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
      await connection.query('TRUNCATE TABLE tbl_Payment;');
      await connection.query('TRUNCATE TABLE tbl_Purchase;');
      await connection.query('TRUNCATE TABLE tbl_Quotation_Item;');
      await connection.query('TRUNCATE TABLE tbl_Quotation;');
      await connection.query('TRUNCATE TABLE tbl_Request_Item;');
      await connection.query('TRUNCATE TABLE tbl_Inventory_Request;');
      await connection.query('TRUNCATE TABLE tbl_Store_Stock;');
      await connection.query('TRUNCATE TABLE tbl_Item;');
      await connection.query('TRUNCATE TABLE tbl_Category;');
      await connection.query('TRUNCATE TABLE tbl_Supplier;');
      await connection.query('TRUNCATE TABLE tbl_Store;');
      await connection.query('TRUNCATE TABLE tbl_Requirement_Period;');
      await connection.query('DELETE FROM tbl_Admin WHERE int_Admin_Id > 1;');

      // Ensure default Admin exists
      const [adminRows] = await connection.query('SELECT * FROM tbl_Admin WHERE int_Admin_Id = 1');
      if (adminRows.length === 0) {
        await connection.query(
          `INSERT INTO tbl_Admin 
            (int_Admin_Id, txt_Admin_Code, txt_Admin_Name, txt_Email, txt_Password, txt_Role, txt_Active, dte_Created_Date, txt_Created_By) 
          VALUES 
            (1, 'ADM001', 'Chief Warden / Admin', '24104063@nec.edu.in', 'admin', 'Chief Warden / Admin', 'Y', NOW(), 'System')`
        );
      }

      await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
      res.json({ success: true, message: 'All MySQL database tables purged successfully!' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Database purge error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
