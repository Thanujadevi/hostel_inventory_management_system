import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/requirements
router.get('/', async (req, res) => {
    try {
        const [reqs] = await pool.query(`
      SELECT 
        r.*,
        s.txt_Store_Name,
        s.txt_Campus
      FROM tbl_Inventory_Request r
      LEFT JOIN tbl_Store s ON r.int_Store_Id = s.int_Store_Id
      ORDER BY r.int_Request_Id DESC
    `);

        // Fetch line items for each request
        for (let request of reqs) {
            const [items] = await pool.query(`
        SELECT 
          ri.*,
          i.txt_Item_Code,
          i.txt_Item_Name,
          i.txt_Unit,
          i.dbl_Unit_Price
        FROM tbl_Request_Item ri
        JOIN tbl_Item i ON ri.int_Item_Id = i.int_Item_Id
        WHERE ri.int_Request_Id = ?
      `, [request.int_Request_Id]);
            request.items = items;
        }

        res.json(reqs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/requirements (Create new requisition)
router.post('/', async (req, res) => {
    const { int_Store_Id, txt_Priority, txt_Remarks, items, txt_Created_By } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [countRows] = await connection.query('SELECT COUNT(*) as cnt FROM tbl_Inventory_Request');
        const reqCode = `REQ-${String(countRows[0].cnt + 1).padStart(3, '0')}`;

        const [result] = await connection.query(
            `INSERT INTO tbl_Inventory_Request 
        (txt_Request_Code, int_Store_Id, txt_Priority, txt_Status, txt_Remarks, dte_Request_Date, txt_Created_By)
      VALUES (?, ?, ?, 'Pending Approval', ?, CURDATE(), ?)`,
            [reqCode, int_Store_Id, txt_Priority || 'Medium', txt_Remarks || '', txt_Created_By || 'Store Manager']
        );

        const requestId = result.insertId;

        if (items && Array.isArray(items)) {
            for (let item of items) {
                await connection.query(
                    `INSERT INTO tbl_Request_Item (int_Request_Id, int_Item_Id, int_Quantity)
           VALUES (?, ?, ?)`,
                    [requestId, item.int_Item_Id, item.int_Quantity]
                );
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Requirement raised successfully', requestId, requestCode: reqCode });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// GET /api/requirements/period
router.get('/period', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tbl_Requirement_Period ORDER BY int_Period_Id DESC LIMIT 1');
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.json({ txt_Status: 'OPEN', dte_Start_Date: null, dte_Deadline: null, txt_Remarks: 'Default Open Window' });
        }
    } catch (error) {
        res.json({ txt_Status: 'OPEN', dte_Start_Date: null, dte_Deadline: null, txt_Remarks: 'Default Open Window' });
    }
});

// POST /api/requirements/period
router.post('/period', async (req, res) => {
    const { txt_Status, dte_Start_Date, dte_Deadline, txt_Remarks } = req.body;
    try {
        await pool.query('CREATE TABLE IF NOT EXISTS tbl_Requirement_Period (int_Period_Id INT AUTO_INCREMENT PRIMARY KEY, txt_Status VARCHAR(20) DEFAULT "OPEN", dte_Start_Date DATE, dte_Deadline DATE, txt_Remarks TEXT)');
        await pool.query(
            'INSERT INTO tbl_Requirement_Period (txt_Status, dte_Start_Date, dte_Deadline, txt_Remarks) VALUES (?, ?, ?, ?)',
            [txt_Status || 'OPEN', dte_Start_Date || null, dte_Deadline || null, txt_Remarks || '']
        );
        const [rows] = await pool.query('SELECT * FROM tbl_Requirement_Period ORDER BY int_Period_Id DESC LIMIT 1');
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH/PUT /api/requirements/:id/status (Approve/Reject)
const handleStatusUpdate = async (req, res) => {
    const txt_Status = req.body.txt_Status || req.body.status;
    const txt_Remarks = req.body.txt_Remarks || req.body.remarks || '';
    try {
        await pool.query(
            'UPDATE tbl_Inventory_Request SET txt_Status = ?, txt_Remarks = ? WHERE int_Request_Id = ?',
            [txt_Status, txt_Remarks, req.params.id]
        );
        res.json({ success: true, message: `Requirement status updated to ${txt_Status}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

router.patch('/:id/status', handleStatusUpdate);
router.put('/:id/status', handleStatusUpdate);

// DELETE /api/requirements/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM tbl_Request_Item WHERE int_Request_Id = ?', [req.params.id]);
        await pool.query('DELETE FROM tbl_Inventory_Request WHERE int_Request_Id = ?', [req.params.id]);
        const [updatedList] = await pool.query('SELECT * FROM tbl_Inventory_Request ORDER BY int_Request_Id DESC');
        res.json(updatedList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
