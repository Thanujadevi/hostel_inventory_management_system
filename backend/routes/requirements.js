import express from 'express';
import pool from '../db.js';
import { RequirementModel } from '../models/RequirementModel.js';

const router = express.Router();

// GET /api/requirements/seed
router.get('/seed', async (req, res) => {
  try {
    const [stores] = await pool.query('SELECT * FROM tbl_Store ORDER BY int_Store_Id ASC');
    const [items] = await pool.query('SELECT * FROM tbl_Item ORDER BY int_Item_Id ASC');

    const itemMapByCode = new Map();
    items.forEach(i => itemMapByCode.set(i.txt_Item_Code, i));

    const storeRequestsManifest = [
      {
        storeCode: 'STR-2026-001',
        remarks: 'Urgent monthly ration refill and replacement mattresses for new hostel admission batch.',
        priority: 'High',
        items: [
          { code: 'ITM-2026-001', qty: 20 },
          { code: 'ITM-2026-002', qty: 30 },
          { code: 'ITM-2026-003', qty: 10 }
        ]
      },
      {
        storeCode: 'STR-2026-002',
        remarks: 'Sanitation supplies and fresh linens needed for Block B floors.',
        priority: 'Medium',
        items: [
          { code: 'ITM-2026-004', qty: 40 },
          { code: 'ITM-2026-009', qty: 25 },
          { code: 'ITM-2026-006', qty: 5 }
        ]
      },
      {
        storeCode: 'STR-2026-003',
        remarks: 'Hardware maintenance and door lock replacements for Subash hostel rooms.',
        priority: 'High',
        items: [
          { code: 'ITM-2026-010', qty: 15 },
          { code: 'ITM-2026-008', qty: 10 },
          { code: 'ITM-2026-005', qty: 12 }
        ]
      },
      {
        storeCode: 'STR-2026-004',
        remarks: 'Bedding upgrade requirement for East Campus Block B rooms.',
        priority: 'Medium',
        items: [
          { code: 'ITM-2026-003', qty: 8 },
          { code: 'ITM-2026-009', qty: 20 },
          { code: 'ITM-2026-004', qty: 15 }
        ]
      },
      {
        storeCode: 'STR-2026-005',
        remarks: 'Mess kitchen provision stock and medical kit for warden desk.',
        priority: 'Medium',
        items: [
          { code: 'ITM-2026-001', qty: 15 },
          { code: 'ITM-2026-002', qty: 25 },
          { code: 'ITM-2026-006', qty: 4 }
        ]
      },
      {
        storeCode: 'STR-2026-006',
        remarks: 'Sports facility items and electrical wiring maintenance supplies for Science Block.',
        priority: 'Medium',
        items: [
          { code: 'ITM-2026-007', qty: 6 },
          { code: 'ITM-2026-005', qty: 20 },
          { code: 'ITM-2026-010', qty: 10 }
        ]
      },
      {
        storeCode: 'STR-2026-007',
        remarks: 'Plumbing repair taps and cleaning disinfectant stock for Engineering hostel wing.',
        priority: 'High',
        items: [
          { code: 'ITM-2026-008', qty: 20 },
          { code: 'ITM-2026-004', qty: 30 },
          { code: 'ITM-2026-005', qty: 15 }
        ]
      },
      {
        storeCode: 'STR-2026-008',
        remarks: 'First aid supplies and fresh linen stock for Ladies Hostel Block 2.',
        priority: 'Medium',
        items: [
          { code: 'ITM-2026-006', qty: 6 },
          { code: 'ITM-2026-009', qty: 30 },
          { code: 'ITM-2026-004', qty: 25 }
        ]
      },
      {
        storeCode: 'STR-2026-009',
        remarks: 'Furniture & security lock stock for newly allocated PG scholar rooms.',
        priority: 'High',
        items: [
          { code: 'ITM-2026-003', qty: 12 },
          { code: 'ITM-2026-010', qty: 20 },
          { code: 'ITM-2026-008', qty: 12 }
        ]
      },
      {
        storeCode: 'STR-2026-010',
        remarks: 'Monthly International hostel dining hall provisions and recreational sports equipment.',
        priority: 'High',
        items: [
          { code: 'ITM-2026-001', qty: 25 },
          { code: 'ITM-2026-002', qty: 40 },
          { code: 'ITM-2026-007', qty: 4 },
          { code: 'ITM-2026-006', qty: 5 }
        ]
      }
    ];

    for (const manifest of storeRequestsManifest) {
      const storeObj = stores.find(s => s.txt_Store_Code === manifest.storeCode);
      if (!storeObj) continue;

      const reqItems = [];
      manifest.items.forEach(i => {
        const itemObj = itemMapByCode.get(i.code);
        if (itemObj) {
          reqItems.push({
            int_Item_Id: itemObj.int_Item_Id,
            int_Quantity: i.qty,
            dec_Required_Qty: i.qty
          });
        }
      });

      await RequirementModel.create({
        int_Store_Id: storeObj.int_Store_Id,
        txt_Month: 'August',
        int_Year: 2026,
        txt_Status: 'Pending Approval',
        txt_Remarks: manifest.remarks,
        txt_Priority: manifest.priority,
        items: reqItems
      });
    }

    const allRequests = await RequirementModel.getAll();
    res.json({ success: true, count: allRequests.length, requests: allRequests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

import { RequirementPeriodModel } from '../models/RequirementPeriodModel.js';

// GET /api/requirements/period
router.get('/period', async (req, res) => {
    try {
        const period = await RequirementPeriodModel.getCurrent();
        res.json(period);
    } catch (error) {
        res.json({ txt_Title: 'October 2026 Monthly Hostel Requirement Window', txt_Month: 'October', int_Year: 2026, txt_Status: 'OPEN', dte_Start_Date: null, dte_Deadline: null, txt_Remarks: 'Default Open Window' });
    }
});

// POST /api/requirements/period
router.post('/period', async (req, res) => {
    try {
        const updated = await RequirementPeriodModel.savePeriod(req.body);
        res.json(updated);
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
        const reqId = req.params.id;
        const [quotes] = await pool.query('SELECT int_Quotation_Id FROM tbl_Quotation WHERE int_Request_Id = ?', [reqId]);
        const quoteIds = quotes.map(q => q.int_Quotation_Id);

        if (quoteIds.length > 0) {
            await pool.query('DELETE FROM tbl_Quotation_Item WHERE int_Quotation_Id IN (?)', [quoteIds]);
            await pool.query('DELETE FROM tbl_Quotation WHERE int_Quotation_Id IN (?)', [quoteIds]);
        }

        const [purchases] = await pool.query('SELECT int_Purchase_Id FROM tbl_Purchase WHERE int_Request_Id = ?', [reqId]);
        const purchaseIds = purchases.map(p => p.int_Purchase_Id);
        if (purchaseIds.length > 0) {
            await pool.query('DELETE FROM tbl_Payment WHERE int_Purchase_Id IN (?)', [purchaseIds]);
            await pool.query('DELETE FROM tbl_Purchase WHERE int_Request_Id = ?', [reqId]);
        }

        await pool.query('DELETE FROM tbl_Request_Item WHERE int_Request_Id = ?', [reqId]);
        await pool.query('DELETE FROM tbl_Inventory_Request WHERE int_Request_Id = ? OR txt_Request_Code = ?', [reqId, String(reqId)]);
        const updatedList = await RequirementModel.getAll();
        res.json(updatedList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
