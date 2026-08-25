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
