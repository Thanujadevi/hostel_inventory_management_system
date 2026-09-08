import express from 'express';
import { storeController } from '../controllers/storeController.js';
import pool from '../config/db.js';

const router = express.Router();

router.get('/seed', async (req, res) => {
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
      const [existing] = await pool.query(
        'SELECT int_Store_Id FROM tbl_Store WHERE txt_Store_Code = ? OR txt_Username = ? OR txt_Store_Name = ?',
        [st.code, st.user, st.name]
      );
      if (existing.length === 0) {
        await pool.query(
          `INSERT INTO tbl_Store 
            (txt_Store_Code, txt_Store_Name, txt_Campus, txt_Incharge, txt_Email, txt_Phone, txt_Username, txt_Password, txt_Active, dte_Created_Date, txt_Created_By)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Y', NOW(), 'System')`,
          [st.code, st.name, st.campus, st.incharge, st.email, st.phone, st.user, st.pass]
        );
      }
    }
    const [allStores] = await pool.query('SELECT * FROM tbl_Store ORDER BY int_Store_Id ASC');
    res.json({ success: true, count: allStores.length, stores: allStores });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', storeController.getAll);
router.get('/:id', storeController.getById);
router.post('/', storeController.createOrUpdate);
router.delete('/:id', storeController.delete);

export default router;
