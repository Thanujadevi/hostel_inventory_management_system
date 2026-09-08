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

    // Check if database tables are already initialized
    const [existingTables] = await initConn.query("SHOW TABLES LIKE 'tbl_Admin'");
    if (existingTables.length === 0) {
      // Schema file is located in server/schema.sql
      const schemaPath = path.join(__dirname, '..', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sqlContent = fs.readFileSync(schemaPath, 'utf8');
        await initConn.query(sqlContent);
        console.log(`✅ MySQL Database '${database}' initialized with schema for the first time.`);
      }
    } else {
      console.log(`ℹ️ MySQL Database '${database}' already initialized. Skipping seed re-insertion.`);
    }

    const addCol = async (table, colName, colDef) => {
      try {
        await initConn.query(`ALTER TABLE ${table} ADD COLUMN ${colName} ${colDef}`);
      } catch (err) {
        // Safe to ignore duplicate column name error
      }
    };

    await addCol('tbl_Inventory_Request', 'dec_Budget', 'DECIMAL(12,2) DEFAULT 0.00');
    await addCol('tbl_Inventory_Request', 'txt_Month', 'VARCHAR(20) DEFAULT "August"');
    await addCol('tbl_Inventory_Request', 'int_Year', 'INT DEFAULT 2026');
    await addCol('tbl_Inventory_Request', 'dte_Created_Date', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    await addCol('tbl_Inventory_Request', 'txt_Created_By', 'VARCHAR(50) DEFAULT "System"');
    await addCol('tbl_Inventory_Request', 'dte_Updated_Date', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    await addCol('tbl_Inventory_Request', 'txt_Updated_By', 'VARCHAR(50) DEFAULT "System"');

    await addCol('tbl_Item', 'txt_Brand', 'VARCHAR(100)');
    await addCol('tbl_Item', 'txt_Specification', 'TEXT');
    await addCol('tbl_Item', 'dte_Created_Date', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    await addCol('tbl_Item', 'txt_Created_By', 'VARCHAR(50) DEFAULT "System"');
    await addCol('tbl_Item', 'dte_Updated_Date', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    await addCol('tbl_Item', 'txt_Updated_By', 'VARCHAR(50) DEFAULT "System"');

    await addCol('tbl_Category', 'dte_Created_Date', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    await addCol('tbl_Category', 'txt_Created_By', 'VARCHAR(50) DEFAULT "System"');
    await addCol('tbl_Category', 'dte_Updated_Date', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    await addCol('tbl_Category', 'txt_Updated_By', 'VARCHAR(50) DEFAULT "System"');

    await addCol('tbl_Store', 'txt_Campus', 'VARCHAR(100)');
    await addCol('tbl_Store', 'txt_Location', 'VARCHAR(100)');
    await addCol('tbl_Store', 'txt_Incharge_Name', 'VARCHAR(100)');
    await addCol('tbl_Store', 'txt_Store_Type', 'VARCHAR(100)');
    await addCol('tbl_Store', 'dte_Created_Date', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    await addCol('tbl_Store', 'txt_Created_By', 'VARCHAR(50) DEFAULT "System"');
    await addCol('tbl_Store', 'dte_Updated_Date', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    await addCol('tbl_Store', 'txt_Updated_By', 'VARCHAR(50) DEFAULT "System"');

    await addCol('tbl_Supplier', 'dte_Created_Date', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    await addCol('tbl_Supplier', 'txt_Created_By', 'VARCHAR(50) DEFAULT "System"');
    await addCol('tbl_Supplier', 'dte_Updated_Date', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    await addCol('tbl_Supplier', 'txt_Updated_By', 'VARCHAR(50) DEFAULT "System"');

    await addCol('tbl_Quotation', 'dte_Created_Date', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    await addCol('tbl_Quotation', 'txt_Created_By', 'VARCHAR(50) DEFAULT "System"');
    await addCol('tbl_Quotation', 'dte_Updated_Date', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    await addCol('tbl_Quotation', 'txt_Updated_By', 'VARCHAR(50) DEFAULT "System"');

    await addCol('tbl_Purchase', 'dte_Created_Date', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    await addCol('tbl_Purchase', 'txt_Created_By', 'VARCHAR(50) DEFAULT "System"');
    await addCol('tbl_Purchase', 'dte_Updated_Date', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    await addCol('tbl_Purchase', 'txt_Updated_By', 'VARCHAR(50) DEFAULT "System"');

    await addCol('tbl_Payment', 'dte_Created_Date', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    await addCol('tbl_Payment', 'txt_Created_By', 'VARCHAR(50) DEFAULT "System"');
    await addCol('tbl_Payment', 'dte_Updated_Date', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    await addCol('tbl_Payment', 'txt_Updated_By', 'VARCHAR(50) DEFAULT "System"');

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
    // Deduplicate any repeated category records by name in tbl_Category
    try {
      await initConn.query(`
        DELETE c1 FROM tbl_Category c1
        INNER JOIN tbl_Category c2 
        WHERE c1.int_Category_Id > c2.int_Category_Id 
          AND LOWER(TRIM(c1.txt_Category_Name)) = LOWER(TRIM(c2.txt_Category_Name));
      `);
    } catch (dedupErr) {}

    // Deduplicate repeated inventory requests per store to maintain single store-wise requests
    try {
      await initConn.query(`
        DELETE r1 FROM tbl_Inventory_Request r1
        INNER JOIN tbl_Inventory_Request r2
        WHERE r1.int_Store_Id = r2.int_Store_Id
          AND r1.int_Request_Id < r2.int_Request_Id;
      `);
    } catch (reqDedupErr) {}

    // Ensure default admin user 24104063@nec.edu.in is guaranteed to exist in database
    try {
      await initConn.query(
        `INSERT INTO tbl_Admin 
          (int_Admin_Id, txt_Admin_Code, txt_Admin_Name, txt_Email, txt_Password, txt_Role, txt_Active, dte_Created_Date, txt_Created_By) 
        VALUES 
          (1, 'ADM001', 'Chief Warden / Admin', '24104063@nec.edu.in', 'admin', 'Chief Warden / Admin', 'Y', NOW(), 'System')
        ON DUPLICATE KEY UPDATE 
          txt_Email = '24104063@nec.edu.in',
          txt_Admin_Name = 'Chief Warden / Admin',
          txt_Active = 'Y';`
      );
      console.log("✅ Verified admin email 24104063@nec.edu.in in MySQL tbl_Admin database.");
    } catch (adminErr) {
      console.warn(`⚠️ Default admin creation notice: ${adminErr.message}`);
    }

    // Ensure all 10 default hostel stores exist in tbl_Store
    try {
      const storesToEnsure = [
        { code: 'STR-2026-001', name: 'Boys Hostel Store', campus: 'Boys Hostel', incharge: 'John', email: 'store001@hostel.edu', phone: '9876543210', user: 'str-2026-001', pass: 'storepassword' },
        { code: 'STR-2026-002', name: 'Girls Hostel Store', campus: 'Girls Hostel', incharge: 'Alice', email: 'store002@hostel.edu', phone: '9876543211', user: 'str-2026-002', pass: 'storepassword' },
        { code: 'STR-2026-003', name: 'Subash Hostel Store', campus: 'West Campus - Block A', incharge: 'David Raj', email: 'store003@hostel.edu', phone: '9876543212', user: 'str-2026-003', pass: 'storepassword' },
        { code: 'STR-2026-004', name: 'Bharathi Hostel Store', campus: 'East Campus - Block B', incharge: 'Saravanan M', email: 'store004@hostel.edu', phone: '9876543213', user: 'str-2026-004', pass: 'storepassword' },
        { code: 'STR-2026-005', name: 'Vivekanandar Hostel Store', campus: 'Main Campus - Block C', incharge: 'Anitha K', email: 'store005@hostel.edu', phone: '9876543214', user: 'str-2026-005', pass: 'storepassword' },
        { code: 'STR-2026-006', name: 'Kalam Hostel Store', campus: 'Science Block Campus', incharge: 'Vigneshwaran R', email: 'store006@hostel.edu', phone: '9876543215', user: 'str-2026-006', pass: 'storepassword' },
        { code: 'STR-2026-007', name: 'Ramanujan Hostel Store', campus: 'Engineering Wing Campus', incharge: 'Meenakshi S', email: 'store007@hostel.edu', phone: '9876543216', user: 'str-2026-007', pass: 'storepassword' },
        { code: 'STR-2026-008', name: 'Mother Teresa Hostel Store', campus: 'Ladies Hostel Block 2', incharge: 'Soundarya P', email: 'store008@hostel.edu', phone: '9876543217', user: 'str-2026-008', pass: 'storepassword' },
        { code: 'STR-2026-009', name: 'PG & Research Scholars Store', campus: 'PG Block Campus', incharge: 'Murugan T', email: 'store009@hostel.edu', phone: '9876543218', user: 'str-2026-009', pass: 'storepassword' },
        { code: 'STR-2026-010', name: 'International Students Store', campus: 'Global Block Campus', incharge: 'Radhika N', email: 'store010@hostel.edu', phone: '9876543219', user: 'str-2026-010', pass: 'storepassword' }
      ];

      for (const st of storesToEnsure) {
        const [existing] = await initConn.query(
          'SELECT int_Store_Id FROM tbl_Store WHERE txt_Store_Code = ? OR txt_Username = ? OR txt_Store_Name = ?',
          [st.code, st.user, st.name]
        );
        if (existing.length === 0) {
          await initConn.query(
            `INSERT INTO tbl_Store 
              (txt_Store_Code, txt_Store_Name, txt_Campus, txt_Incharge, txt_Email, txt_Phone, txt_Username, txt_Password, txt_Active, dte_Created_Date, txt_Created_By)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Y', NOW(), 'System')`,
            [st.code, st.name, st.campus, st.incharge, st.email, st.phone, st.user, st.pass]
          );
        }
      }
      console.log("✅ Verified 10 Hostel Stores seeded in MySQL tbl_Store database.");
    } catch (storeSeedErr) {
      console.warn(`⚠️ Store seed notice: ${storeSeedErr.message}`);
    }

    // Ensure all 10 categories exist in tbl_Category
    try {
      const categoriesToEnsure = [
        { code: 'CAT-2026-001', name: 'Room & Furniture', desc: 'Chairs, tables, mattresses and bedframes' },
        { code: 'CAT-2026-003', name: 'Bathroom Supplies', desc: 'Detergents, brooms, disinfectants and cleaning tools' },
        { code: 'CAT-2026-004', name: 'Kitchen & Dining', desc: 'Groceries, oils, rice, cooking utensils and dining tools' },
        { code: 'CAT-2026-005', name: 'Stationery & Office', desc: 'Registers, pens, papers and office supplies' },
        { code: 'CAT-2026-006', name: 'Electricals', desc: 'Bulbs, switches, wires and extension boards' },
        { code: 'CAT-2026-007', name: 'Medical & First Aid', desc: 'Emergency medicines, band-aids, antiseptics, and health kits' },
        { code: 'CAT-2026-008', name: 'Sports & Recreation', desc: 'Badminton racquets, volleyballs, carrom boards, and sports gear' },
        { code: 'CAT-2026-009', name: 'Plumbing & Hardware', desc: 'Water pipes, taps, valves, sealant tapes, and plumbing fittings' },
        { code: 'CAT-2026-010', name: 'Laundry & Linen', desc: 'Washing powder, bedsheets, pillow covers, and towels' },
        { code: 'CAT-2026-011', name: 'Safety & Security', desc: 'Fire extinguishers, padlocks, CCTV cables, and security gear' }
      ];

      for (const c of categoriesToEnsure) {
        const [existing] = await initConn.query(
          'SELECT int_Category_Id FROM tbl_Category WHERE txt_Category_Code = ? OR LOWER(TRIM(txt_Category_Name)) = LOWER(?)',
          [c.code, c.name]
        );
        if (existing.length === 0) {
          await initConn.query(
            `INSERT INTO tbl_Category (txt_Category_Code, txt_Category_Name, txt_Description, txt_status, dte_Created_Date, txt_Created_By)
             VALUES (?, ?, ?, 'Active', NOW(), 'System')`,
            [c.code, c.name, c.desc]
          );
        }
      }
      console.log("✅ Verified 10 Categories seeded in MySQL tbl_Category database.");
    } catch (catSeedErr) {
      console.warn(`⚠️ Category seed notice: ${catSeedErr.message}`);
    }

    // Ensure all 10 items exist in tbl_Item
    try {
      const itemsToEnsure = [
        { code: 'ITM-2026-001', name: 'Basmati Rice 25kg Bag', category: 'Kitchen & Dining', unit: 'Kg', minStock: 10, stock: 250, price: 85.00 },
        { code: 'ITM-2026-002', name: 'Cooking Oil', category: 'Kitchen & Dining', unit: 'Litre', minStock: 10, stock: 100, price: 150.00 },
        { code: 'ITM-2026-003', name: 'Mattress', category: 'Room & Furniture', unit: 'Nos', minStock: 10, stock: 5, price: 3500.00 },
        { code: 'ITM-2026-004', name: 'Floor Cleaner', category: 'Bathroom Supplies', unit: 'Litre', minStock: 10, stock: 50, price: 180.00 },
        { code: 'ITM-2026-005', name: 'Wire', category: 'Electricals', unit: 'Rolls', minStock: 10, stock: 10, price: 50.00 },
        { code: 'ITM-2026-006', name: 'First Aid Kit Complete', category: 'Medical & First Aid', unit: 'Set', minStock: 5, stock: 15, price: 650.00 },
        { code: 'ITM-2026-007', name: 'Volleyball Tournament Leather', category: 'Sports & Recreation', unit: 'Nos', minStock: 5, stock: 8, price: 950.00 },
        { code: 'ITM-2026-008', name: 'Brass Tap 1/2 Inch', category: 'Plumbing & Hardware', unit: 'Pcs', minStock: 10, stock: 30, price: 240.00 },
        { code: 'ITM-2026-009', name: 'Cotton Bedsheet Double', category: 'Laundry & Linen', unit: 'Pcs', minStock: 15, stock: 45, price: 480.00 },
        { code: 'ITM-2026-010', name: 'Heavy Duty Brass Padlock 50mm', category: 'Safety & Security', unit: 'Pcs', minStock: 10, stock: 25, price: 320.00 }
      ];

      for (const item of itemsToEnsure) {
        const [existing] = await initConn.query(
          'SELECT int_Item_Id FROM tbl_Item WHERE txt_Item_Code = ? OR txt_Item_Name = ?',
          [item.code, item.name]
        );
        if (existing.length === 0) {
          let categoryId = null;
          if (item.category) {
            const [catRows] = await initConn.query(
              'SELECT int_Category_Id FROM tbl_Category WHERE LOWER(TRIM(txt_Category_Name)) = LOWER(?)',
              [item.category]
            );
            if (catRows.length > 0) categoryId = catRows[0].int_Category_Id;
          }

          await initConn.query(
            `INSERT INTO tbl_Item 
              (txt_Item_Code, txt_Item_Name, int_Category_Id, txt_Unit, int_Min_Stock, int_Current_Stock, dbl_Unit_Price, txt_Status, dte_Created_Date, txt_Created_By)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', NOW(), 'System')`,
            [item.code, item.name, categoryId, item.unit, item.minStock, item.stock, item.price]
          );
        }
      }
      console.log("✅ Verified 10 Items seeded in MySQL tbl_Item database.");
    } catch (itemSeedErr) {
      console.warn(`⚠️ Item seed notice: ${itemSeedErr.message}`);
    }

    // Ensure store requests exist for all 10 hostel stores
    try {
      const [reqCountRows] = await initConn.query('SELECT COUNT(*) as cnt FROM tbl_Inventory_Request');
      if (reqCountRows[0].cnt < 10) {
        const [stores] = await initConn.query('SELECT * FROM tbl_Store ORDER BY int_Store_Id ASC');
        const [items] = await initConn.query('SELECT * FROM tbl_Item ORDER BY int_Item_Id ASC');
        const itemMapByCode = new Map();
        items.forEach(i => itemMapByCode.set(i.txt_Item_Code, i));

        const storeRequestsManifest = [
          { storeCode: 'STR-2026-001', remarks: 'Urgent monthly ration refill and replacement mattresses for new hostel admission batch.', priority: 'High', items: [{ code: 'ITM-2026-001', qty: 20 }, { code: 'ITM-2026-002', qty: 30 }, { code: 'ITM-2026-003', qty: 10 }] },
          { storeCode: 'STR-2026-002', remarks: 'Sanitation supplies and fresh linens needed for Block B floors.', priority: 'Medium', items: [{ code: 'ITM-2026-004', qty: 40 }, { code: 'ITM-2026-009', qty: 25 }, { code: 'ITM-2026-006', qty: 5 }] },
          { storeCode: 'STR-2026-003', remarks: 'Hardware maintenance and door lock replacements for Subash hostel rooms.', priority: 'High', items: [{ code: 'ITM-2026-010', qty: 15 }, { code: 'ITM-2026-008', qty: 10 }, { code: 'ITM-2026-005', qty: 12 }] },
          { storeCode: 'STR-2026-004', remarks: 'Bedding upgrade requirement for East Campus Block B rooms.', priority: 'Medium', items: [{ code: 'ITM-2026-003', qty: 8 }, { code: 'ITM-2026-009', qty: 20 }, { code: 'ITM-2026-004', qty: 15 }] },
          { storeCode: 'STR-2026-005', remarks: 'Mess kitchen provision stock and medical kit for warden desk.', priority: 'Medium', items: [{ code: 'ITM-2026-001', qty: 15 }, { code: 'ITM-2026-002', qty: 25 }, { code: 'ITM-2026-006', qty: 4 }] },
          { storeCode: 'STR-2026-006', remarks: 'Sports facility items and electrical wiring maintenance supplies for Science Block.', priority: 'Medium', items: [{ code: 'ITM-2026-007', qty: 6 }, { code: 'ITM-2026-005', qty: 20 }, { code: 'ITM-2026-010', qty: 10 }] },
          { storeCode: 'STR-2026-007', remarks: 'Plumbing repair taps and cleaning disinfectant stock for Engineering hostel wing.', priority: 'High', items: [{ code: 'ITM-2026-008', qty: 20 }, { code: 'ITM-2026-004', qty: 30 }, { code: 'ITM-2026-005', qty: 15 }] },
          { storeCode: 'STR-2026-008', remarks: 'First aid supplies and fresh linen stock for Ladies Hostel Block 2.', priority: 'Medium', items: [{ code: 'ITM-2026-006', qty: 6 }, { code: 'ITM-2026-009', qty: 30 }, { code: 'ITM-2026-004', qty: 25 }] },
          { storeCode: 'STR-2026-009', remarks: 'Furniture & security lock stock for newly allocated PG scholar rooms.', priority: 'High', items: [{ code: 'ITM-2026-003', qty: 12 }, { code: 'ITM-2026-010', qty: 20 }, { code: 'ITM-2026-008', qty: 12 }] },
          { storeCode: 'STR-2026-010', remarks: 'Monthly International hostel dining hall provisions and recreational sports equipment.', priority: 'High', items: [{ code: 'ITM-2026-001', qty: 25 }, { code: 'ITM-2026-002', qty: 40 }, { code: 'ITM-2026-007', qty: 4 }, { code: 'ITM-2026-006', qty: 5 }] }
        ];

        for (const manifest of storeRequestsManifest) {
          const storeObj = stores.find(s => s.txt_Store_Code === manifest.storeCode);
          if (!storeObj) continue;

          const [existingReq] = await initConn.query(
            'SELECT int_Request_Id FROM tbl_Inventory_Request WHERE int_Store_Id = ?',
            [storeObj.int_Store_Id]
          );

          if (existingReq.length === 0) {
            let budget = 0;
            const reqItems = [];
            for (const i of manifest.items) {
              const itemObj = itemMapByCode.get(i.code);
              if (itemObj) {
                const qty = i.qty;
                const price = Number(itemObj.dbl_Unit_Price || 0);
                budget += qty * price;
                reqItems.push({ itemId: itemObj.int_Item_Id, qty });
              }
            }

            const [cntRows] = await initConn.query('SELECT COUNT(*) as cnt FROM tbl_Inventory_Request');
            const requestCode = `REQ-${String(cntRows[0].cnt + 1).padStart(4, '0')}`;

            const [insRes] = await initConn.query(
              `INSERT INTO tbl_Inventory_Request
                (txt_Request_Code, int_Store_Id, dec_Budget, txt_Month, int_Year, dte_Request_Date, txt_Status, txt_Remarks, dte_Created_Date, txt_Created_By)
               VALUES (?, ?, ?, 'August', 2026, NOW(), 'Pending Approval', ?, NOW(), 'Store Incharge')`,
              [requestCode, storeObj.int_Store_Id, budget, manifest.remarks]
            );

            const newReqId = insRes.insertId;
            for (const ri of reqItems) {
              await initConn.query(
                `INSERT INTO tbl_Request_Item (int_Request_Id, int_Item_Id, int_Quantity) VALUES (?, ?, ?)`,
                [newReqId, ri.itemId, ri.qty]
              );
            }
          }
        }
        console.log("✅ Verified Inventory Requests created for all 10 Hostel Stores in MySQL database.");
      }
    } catch (reqSeedErr) {
      console.warn(`⚠️ Requirement seed notice: ${reqSeedErr.message}`);
    }

    // Ensure 3 default suppliers exist in tbl_Supplier
    try {
      const suppliersToEnsure = [
        { id: 1, code: 'SUP001', name: 'Apex Traders', person: 'Ramesh Patel', email: 'apex@traders.com', phone: '9988776655', gst: '33AAACA1234A1Z5', city: 'Chennai', state: 'Tamil Nadu', rating: 4.8 },
        { id: 2, code: 'SUP002', name: 'Global Supplies', person: 'Anita Roy', email: 'global@supplies.com', phone: '9876501234', gst: '33BBBCA5678B1Z2', city: 'Coimbatore', state: 'Tamil Nadu', rating: 4.6 },
        { id: 3, code: 'SUP003', name: 'Metro Wholesale Ltd', person: 'Karthik Subramanian', email: 'metro@wholesale.com', phone: '9443322110', gst: '33CCCCA9876C1Z8', city: 'Madurai', state: 'Tamil Nadu', rating: 4.7 }
      ];

      for (const sup of suppliersToEnsure) {
        const [existing] = await initConn.query(
          'SELECT int_Supplier_Id FROM tbl_Supplier WHERE int_Supplier_Id = ? OR txt_Email = ?',
          [sup.id, sup.email]
        );
        if (existing.length === 0) {
          await initConn.query(
            `INSERT INTO tbl_Supplier 
              (int_Supplier_Id, txt_Supplier_Code, txt_Supplier_Name, txt_Contact_Person, txt_Email, txt_Phone, txt_GSTIN, txt_City, txt_State, dbl_Rating, txt_Active, dte_Created_Date, txt_Created_By)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Y', NOW(), 'System')`,
            [sup.id, sup.code, sup.name, sup.person, sup.email, sup.phone, sup.gst, sup.city, sup.state, sup.rating]
          );
        }
      }
      console.log("✅ Verified 3 Suppliers seeded in MySQL tbl_Supplier database.");
    } catch (supErr) {
      console.warn(`⚠️ Supplier seed notice: ${supErr.message}`);
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
