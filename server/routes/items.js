import express from 'express';
import { itemController } from '../controllers/itemController.js';
import pool from '../config/db.js';

const router = express.Router();

router.get('/seed', async (req, res) => {
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
      const [existing] = await pool.query(
        'SELECT int_Item_Id FROM tbl_Item WHERE txt_Item_Code = ? OR txt_Item_Name = ?',
        [item.code, item.name]
      );
      if (existing.length === 0) {
        let categoryId = null;
        if (item.category) {
          const [catRows] = await pool.query(
            'SELECT int_Category_Id FROM tbl_Category WHERE LOWER(TRIM(txt_Category_Name)) = LOWER(?)',
            [item.category]
          );
          if (catRows.length > 0) categoryId = catRows[0].int_Category_Id;
        }

        await pool.query(
          `INSERT INTO tbl_Item 
            (txt_Item_Code, txt_Item_Name, int_Category_Id, txt_Unit, int_Min_Stock, int_Current_Stock, dbl_Unit_Price, txt_Status, dte_Created_Date, txt_Created_By)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', NOW(), 'System')`,
          [item.code, item.name, categoryId, item.unit, item.minStock, item.stock, item.price]
        );
      }
    }
    const [allItems] = await pool.query(`
      SELECT i.*, c.txt_Category_Name AS txt_Category 
      FROM tbl_Item i 
      LEFT JOIN tbl_Category c ON i.int_Category_Id = c.int_Category_Id 
      ORDER BY i.int_Item_Id ASC
    `);
    res.json({ success: true, count: allItems.length, items: allItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', itemController.getAll);
router.post('/', itemController.createOrUpdate);
router.delete('/:id', itemController.delete);

export default router;
