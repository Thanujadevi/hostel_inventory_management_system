import express from 'express';
import pool from '../db.js';
import { RequirementModel } from '../models/RequirementModel.js';

const router = express.Router();

// GET /api/requirements
router.get('/', async (req, res) => {
    try {
        const requirements = await RequirementModel.getAll();
        res.json(requirements);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/requirements (Create/Consolidate store requisition)
router.post('/', async (req, res) => {
    try {
        const result = await RequirementModel.create(req.body);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error("Error creating requirement request:", error);
        res.status(500).json({ success: false, error: error.message });
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

const handleStatusUpdate = async (req, res) => {
    const txt_Status = req.body.txt_Status || req.body.status;
    const txt_Remarks = req.body.txt_Remarks || req.body.remarks || '';
    try {
        const updated = await RequirementModel.updateStatus(req.params.id, txt_Status, txt_Remarks);
        res.json({ success: true, message: `Requirement status updated to ${txt_Status}`, data: updated });
    } catch (error) {
        console.error("Error updating requirement status:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

router.patch('/:id/status', handleStatusUpdate);
router.post('/:id/status', handleStatusUpdate);
router.put('/:id/status', handleStatusUpdate);

// DELETE /api/requirements/:id
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM tbl_Request_Item WHERE int_Request_Id = ?', [req.params.id]);
        await pool.query('DELETE FROM tbl_Inventory_Request WHERE int_Request_Id = ?', [req.params.id]);
        const updatedList = await RequirementModel.getAll();
        res.json(updatedList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
