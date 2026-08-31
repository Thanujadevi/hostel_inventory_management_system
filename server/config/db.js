import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const host = process.env.DB_HOST || 'localhost';
const port = Number(process.env.DB_PORT) || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'hostel_inventory_db';

// Automatically create database and run schema on startup if needed
async function autoInitDatabase() {
  try {
    const initConn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      connectTimeout: 5000,
      multipleStatements: true
    });

    await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await initConn.query(`USE \`${database}\`;`);

    // Schema file is located in server/schema.sql
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf8');
      await initConn.query(sqlContent);
      console.log(`✅ MySQL Database '${database}' auto-initialized with schema successfully.`);
    }

    // Auto-migration & Backfill to fix missing columns and NULL timestamps/users across all tables
    const alterQueries = [
      `ALTER TABLE tbl_Item ADD COLUMN IF NOT EXISTS txt_Brand VARCHAR(100);`,
      `ALTER TABLE tbl_Item ADD COLUMN IF NOT EXISTS txt_Specification TEXT;`,
      `ALTER TABLE tbl_Item ADD COLUMN IF NOT EXISTS dte_Created_Date DATETIME DEFAULT CURRENT_TIMESTAMP;`,
      `ALTER TABLE tbl_Item ADD COLUMN IF NOT EXISTS txt_Created_By VARCHAR(50) DEFAULT 'System';`,
      `ALTER TABLE tbl_Item ADD COLUMN IF NOT EXISTS dte_Updated_Date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
      `ALTER TABLE tbl_Item ADD COLUMN IF NOT EXISTS txt_Updated_By VARCHAR(50) DEFAULT 'System';`,

      `ALTER TABLE tbl_Category ADD COLUMN IF NOT EXISTS dte_Created_Date DATETIME DEFAULT CURRENT_TIMESTAMP;`,
      `ALTER TABLE tbl_Category ADD COLUMN IF NOT EXISTS txt_Created_By VARCHAR(50) DEFAULT 'System';`,
      `ALTER TABLE tbl_Category ADD COLUMN IF NOT EXISTS dte_Updated_Date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
      `ALTER TABLE tbl_Category ADD COLUMN IF NOT EXISTS txt_Updated_By VARCHAR(50) DEFAULT 'System';`,

      `ALTER TABLE tbl_Store ADD COLUMN IF NOT EXISTS txt_Campus VARCHAR(100);`,
      `ALTER TABLE tbl_Store ADD COLUMN IF NOT EXISTS txt_Location VARCHAR(100);`,
      `ALTER TABLE tbl_Store ADD COLUMN IF NOT EXISTS txt_Incharge_Name VARCHAR(100);`,
      `ALTER TABLE tbl_Store ADD COLUMN IF NOT EXISTS txt_Store_Type VARCHAR(100);`,
      `ALTER TABLE tbl_Store ADD COLUMN IF NOT EXISTS dte_Created_Date DATETIME DEFAULT CURRENT_TIMESTAMP;`,
      `ALTER TABLE tbl_Store ADD COLUMN IF NOT EXISTS txt_Created_By VARCHAR(50) DEFAULT 'System';`,
      `ALTER TABLE tbl_Store ADD COLUMN IF NOT EXISTS dte_Updated_Date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
      `ALTER TABLE tbl_Store ADD COLUMN IF NOT EXISTS txt_Updated_By VARCHAR(50) DEFAULT 'System';`,

      `ALTER TABLE tbl_Supplier ADD COLUMN IF NOT EXISTS dte_Created_Date DATETIME DEFAULT CURRENT_TIMESTAMP;`,
      `ALTER TABLE tbl_Supplier ADD COLUMN IF NOT EXISTS txt_Created_By VARCHAR(50) DEFAULT 'System';`,
      `ALTER TABLE tbl_Supplier ADD COLUMN IF NOT EXISTS dte_Updated_Date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
      `ALTER TABLE tbl_Supplier ADD COLUMN IF NOT EXISTS txt_Updated_By VARCHAR(50) DEFAULT 'System';`,

      `ALTER TABLE tbl_Inventory_Request ADD COLUMN IF NOT EXISTS dte_Created_Date DATETIME DEFAULT CURRENT_TIMESTAMP;`,
      `ALTER TABLE tbl_Inventory_Request ADD COLUMN IF NOT EXISTS txt_Created_By VARCHAR(50) DEFAULT 'System';`,
      `ALTER TABLE tbl_Inventory_Request ADD COLUMN IF NOT EXISTS dte_Updated_Date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
      `ALTER TABLE tbl_Inventory_Request ADD COLUMN IF NOT EXISTS txt_Updated_By VARCHAR(50) DEFAULT 'System';`,

      `ALTER TABLE tbl_Quotation ADD COLUMN IF NOT EXISTS dte_Created_Date DATETIME DEFAULT CURRENT_TIMESTAMP;`,
      `ALTER TABLE tbl_Quotation ADD COLUMN IF NOT EXISTS txt_Created_By VARCHAR(50) DEFAULT 'System';`,
      `ALTER TABLE tbl_Quotation ADD COLUMN IF NOT EXISTS dte_Updated_Date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
      `ALTER TABLE tbl_Quotation ADD COLUMN IF NOT EXISTS txt_Updated_By VARCHAR(50) DEFAULT 'System';`,

      `ALTER TABLE tbl_Purchase ADD COLUMN IF NOT EXISTS dte_Created_Date DATETIME DEFAULT CURRENT_TIMESTAMP;`,
      `ALTER TABLE tbl_Purchase ADD COLUMN IF NOT EXISTS txt_Created_By VARCHAR(50) DEFAULT 'System';`,
      `ALTER TABLE tbl_Purchase ADD COLUMN IF NOT EXISTS dte_Updated_Date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
      `ALTER TABLE tbl_Purchase ADD COLUMN IF NOT EXISTS txt_Updated_By VARCHAR(50) DEFAULT 'System';`,

      `ALTER TABLE tbl_Payment ADD COLUMN IF NOT EXISTS dte_Created_Date DATETIME DEFAULT CURRENT_TIMESTAMP;`,
      `ALTER TABLE tbl_Payment ADD COLUMN IF NOT EXISTS txt_Created_By VARCHAR(50) DEFAULT 'System';`,
      `ALTER TABLE tbl_Payment ADD COLUMN IF NOT EXISTS dte_Updated_Date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`,
      `ALTER TABLE tbl_Payment ADD COLUMN IF NOT EXISTS txt_Updated_By VARCHAR(50) DEFAULT 'System';`
    ];

    for (const q of alterQueries) {
      try {
        await initConn.query(q);
      } catch (err) {
        // Ignore column exists errors if older MySQL version doesn't support IF NOT EXISTS
      }
    }

    // Backfill NULL dates and created/updated by users across all primary tables
    const tables = ['tbl_Item', 'tbl_Category', 'tbl_Store', 'tbl_Supplier', 'tbl_Inventory_Request', 'tbl_Quotation', 'tbl_Purchase', 'tbl_Payment', 'tbl_Admin'];
    for (const table of tables) {
      try {
        await initConn.query(`UPDATE ${table} SET dte_Created_Date = NOW() WHERE dte_Created_Date IS NULL;`);
        await initConn.query(`UPDATE ${table} SET txt_Created_By = 'System' WHERE txt_Created_By IS NULL OR txt_Created_By = '';`);
        await initConn.query(`UPDATE ${table} SET dte_Updated_Date = NOW() WHERE dte_Updated_Date IS NULL;`);
        await initConn.query(`UPDATE ${table} SET txt_Updated_By = 'System' WHERE txt_Updated_By IS NULL OR txt_Updated_By = '';`);
      } catch (err) {
        // Table or column check safeguard
      }
    }
    // Truncate all data tables to clear all rows as requested
    try {
      await initConn.query('SET FOREIGN_KEY_CHECKS = 0;');
      await initConn.query('TRUNCATE TABLE tbl_Payment;');
      await initConn.query('TRUNCATE TABLE tbl_Purchase;');
      await initConn.query('TRUNCATE TABLE tbl_Quotation_Item;');
      await initConn.query('TRUNCATE TABLE tbl_Quotation;');
      await initConn.query('TRUNCATE TABLE tbl_Request_Item;');
      await initConn.query('TRUNCATE TABLE tbl_Inventory_Request;');
      await initConn.query('TRUNCATE TABLE tbl_Store_Stock;');
      await initConn.query('TRUNCATE TABLE tbl_Item;');
      await initConn.query('TRUNCATE TABLE tbl_Category;');
      await initConn.query('TRUNCATE TABLE tbl_Supplier;');
      await initConn.query('TRUNCATE TABLE tbl_Store;');
      await initConn.query('TRUNCATE TABLE tbl_Requirement_Period;');
      await initConn.query('DELETE FROM tbl_Admin WHERE int_Admin_Id > 1;');

      const [adminRows] = await initConn.query('SELECT * FROM tbl_Admin WHERE int_Admin_Id = 1');
      if (adminRows.length === 0) {
        await initConn.query(
          `INSERT INTO tbl_Admin 
            (int_Admin_Id, txt_Admin_Code, txt_Admin_Name, txt_Email, txt_Password, txt_Role, txt_Active, dte_Created_Date, txt_Created_By) 
          VALUES 
            (1, 'ADM001', 'Chief Warden / Admin', '24104063@nec.edu.in', 'admin', 'Chief Warden / Admin', 'Y', NOW(), 'System')`
        );
      }
      await initConn.query('SET FOREIGN_KEY_CHECKS = 1;');
      console.log(`✅ All MySQL database tables successfully purged of data rows.`);
    } catch (purgeErr) {
      console.warn(`⚠️ Table purge notice: ${purgeErr.message}`);
    }

    console.log(`✅ System database schema migrations & timestamp backfills completed successfully.`);
    await initConn.end();
  } catch (err) {
    console.warn(`⚠️ Automatic database initialization notice: ${err.message}`);
  }
}

// Perform DB auto-initialization asynchronously
autoInitDatabase();

const pool = mysql.createPool({
  host,
  port,
  user,
  password,
  database,
  connectTimeout: 5000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database successfully!');
    connection.release();
  } catch (error) {
    console.warn('⚠️ Could not connect to MySQL server:', error.message);
  }
})();

export default pool;
