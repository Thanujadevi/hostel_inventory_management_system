import pool from './config/db.js';

async function clearDatabase() {
  console.log("🧹 Starting database data wipe (preserving table structures)...");
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');

    const tables = [
      'tbl_Payment',
      'tbl_Purchase',
      'tbl_Quotation_Item',
      'tbl_Quotation',
      'tbl_Request_Item',
      'tbl_Inventory_Request',
      'tbl_Store_Stock',
      'tbl_Item',
      'tbl_Category',
      'tbl_Supplier',
      'tbl_Store',
      'tbl_Admin',
      'tbl_Requirement_Period'
    ];

    for (const table of tables) {
      try {
        await conn.query(`TRUNCATE TABLE ${table};`);
        console.log(`  ✔ Truncated table: ${table}`);
      } catch (tErr) {
        console.warn(`  ⚠️ Could not truncate ${table}: ${tErr.message}`);
        await conn.query(`DELETE FROM ${table};`);
        await conn.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1;`);
        console.log(`  ✔ Cleared rows & reset auto_increment for: ${table}`);
      }
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log("✨ All table data has been successfully wiped. Table structures, columns, and foreign keys remain completely intact!");
  } catch (err) {
    console.error("❌ Error during database clear:", err.message);
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}

clearDatabase();
