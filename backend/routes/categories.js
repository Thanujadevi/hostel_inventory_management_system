import express from 'express';
import { categoryController } from '../controllers/categoryController.js';
import pool from '../config/db.js';

const router = express.Router();

router.get('/seed', async (req, res) => {
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
      const [existing] = await pool.query(
        'SELECT int_Category_Id FROM tbl_Category WHERE txt_Category_Code = ? OR LOWER(TRIM(txt_Category_Name)) = LOWER(?)',
        [c.code, c.name]
      );
      if (existing.length === 0) {
        await pool.query(
          `INSERT INTO tbl_Category (txt_Category_Code, txt_Category_Name, txt_Description, txt_status, dte_Created_Date, txt_Created_By)
           VALUES (?, ?, ?, 'Active', NOW(), 'System')`,
          [c.code, c.name, c.desc]
        );
      }
    }
    const [allCats] = await pool.query('SELECT * FROM tbl_Category ORDER BY int_Category_Id ASC');
    res.json({ success: true, count: allCats.length, categories: allCats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', categoryController.getAll);
router.post('/', categoryController.createOrUpdate);
router.delete('/:id', categoryController.delete);

export default router;
