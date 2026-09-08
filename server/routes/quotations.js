import express from 'express';
import pool from '../config/db.js';
import { quotationController } from '../controllers/quotationController.js';
import { QuotationModel } from '../models/QuotationModel.js';

const router = express.Router();

// GET /api/quotations/seed
router.get('/seed', async (req, res) => {
  try {
    // Ensure 3 distinct suppliers exist in tbl_Supplier
    const suppliersToSeed = [
      { id: 1, code: 'SUP001', name: 'Apex Traders', person: 'Ramesh Patel', email: 'apex@traders.com', phone: '9988776655', gst: '33AAACA1234A1Z5', city: 'Chennai', state: 'Tamil Nadu', rating: 4.8 },
      { id: 2, code: 'SUP002', name: 'Global Supplies', person: 'Anita Roy', email: 'global@supplies.com', phone: '9876501234', gst: '33BBBCA5678B1Z2', city: 'Coimbatore', state: 'Tamil Nadu', rating: 4.6 },
      { id: 3, code: 'SUP003', name: 'Metro Wholesale Ltd', person: 'Karthik Subramanian', email: 'metro@wholesale.com', phone: '9443322110', gst: '33CCCCA9876C1Z8', city: 'Madurai', state: 'Tamil Nadu', rating: 4.7 }
    ];

    for (const sup of suppliersToSeed) {
      const [existing] = await pool.query('SELECT int_Supplier_Id FROM tbl_Supplier WHERE int_Supplier_Id = ? OR txt_Email = ?', [sup.id, sup.email]);
      if (existing.length === 0) {
        await pool.query(
          `INSERT INTO tbl_Supplier 
            (int_Supplier_Id, txt_Supplier_Code, txt_Supplier_Name, txt_Contact_Person, txt_Email, txt_Phone, txt_GSTIN, txt_City, txt_State, dbl_Rating, txt_Active, dte_Created_Date, txt_Created_By)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Y', NOW(), 'System')`,
          [sup.id, sup.code, sup.name, sup.person, sup.email, sup.phone, sup.gst, sup.city, sup.state, sup.rating]
        );
      }
    }

    // Get all requests
    const [requests] = await pool.query('SELECT * FROM tbl_Inventory_Request ORDER BY int_Request_Id ASC');
    if (requests.length === 0) {
      return res.status(400).json({ error: 'No inventory requests found in database to seed quotations for.' });
    }

    // Ensure status for top requests is 'Open for Quotation'
    await pool.query(
      `UPDATE tbl_Inventory_Request SET txt_Status = 'Open for Quotation' 
       WHERE txt_Status = 'Pending Approval' OR txt_Status = 'Pending' OR txt_Status IS NULL`
    );

    // Fetch line items for each request
    for (const r of requests) {
      const [reqItems] = await pool.query(
        `SELECT ri.*, i.txt_Item_Name, i.dbl_Unit_Price as catalog_price 
         FROM tbl_Request_Item ri 
         LEFT JOIN tbl_Item i ON ri.int_Item_Id = i.int_Item_Id 
         WHERE ri.int_Request_Id = ?`,
        [r.int_Request_Id]
      );
      r.items = reqItems;
    }

    let seededCount = 0;

    // Seed 3 supplier bids per open request with varying item acceptance and pricing
    for (const req of requests) {
      const rItems = req.items || [];
      if (rItems.length === 0) continue;

      // Check if quotes already exist for this request
      const [existingQuotes] = await pool.query('SELECT int_Quotation_Id FROM tbl_Quotation WHERE int_Request_Id = ?', [req.int_Request_Id]);
      if (existingQuotes.length >= 2) continue; // Already has bids

      // Supplier 1: Apex Traders (All items accepted with standard rate)
      const apexItems = rItems.map((item, idx) => {
        const catPrice = Number(item.catalog_price || 100);
        const unitPrice = Math.round(catPrice * 0.95); // 5% discount
        const qty = item.int_Quantity || 1;
        return {
          int_Item_Id: item.int_Item_Id,
          int_Quantity: qty,
          dbl_Unit_Price: unitPrice,
          dbl_Total_Price: unitPrice * qty
        };
      });
      const apexSubtotal = apexItems.reduce((acc, i) => acc + i.dbl_Total_Price, 0);
      await QuotationModel.create({
        txt_Quotation_Code: `QUO-APX-${req.int_Request_Id}`,
        int_Request_Id: req.int_Request_Id,
        int_Supplier_Id: 1,
        dbl_Total_Amount: apexSubtotal + 500, // + ₹500 transport
        txt_Status: 'Submitted',
        txt_Delivery_Days: '3 Days',
        txt_Payment_Terms: 'Net 30',
        txt_Created_By: 'Apex Traders',
        txt_Updated_By: 'Apex Traders',
        items: apexItems
      });
      seededCount++;

      // Supplier 2: Global Supplies (Omits last item - Out of stock, but cheaper on 1st item)
      const globalItems = rItems.map((item, idx) => {
        const catPrice = Number(item.catalog_price || 100);
        const isLastItem = idx === rItems.length - 1 && rItems.length > 1;
        const unitPrice = isLastItem ? 0 : Math.round(catPrice * 0.90); // 10% discount on available
        const qty = item.int_Quantity || 1;
        return {
          int_Item_Id: item.int_Item_Id,
          int_Quantity: qty,
          dbl_Unit_Price: unitPrice,
          dbl_Total_Price: unitPrice * qty
        };
      });
      const globalSubtotal = globalItems.reduce((acc, i) => acc + i.dbl_Total_Price, 0);
      await QuotationModel.create({
        txt_Quotation_Code: `QUO-GBL-${req.int_Request_Id}`,
        int_Request_Id: req.int_Request_Id,
        int_Supplier_Id: 2,
        dbl_Total_Amount: globalSubtotal + 350, // + ₹350 transport
        txt_Status: 'Submitted',
        txt_Delivery_Days: '2 Days',
        txt_Payment_Terms: 'Net 15',
        txt_Created_By: 'Global Supplies',
        txt_Updated_By: 'Global Supplies',
        items: globalItems
      });
      seededCount++;

      // Supplier 3: Metro Wholesale Ltd (Omits 1st item - Out of stock, but cheaper on 2nd item)
      const metroItems = rItems.map((item, idx) => {
        const catPrice = Number(item.catalog_price || 100);
        const isFirstItem = idx === 0 && rItems.length > 1;
        const unitPrice = isFirstItem ? 0 : Math.round(catPrice * 0.88); // 12% discount on available
        const qty = item.int_Quantity || 1;
        return {
          int_Item_Id: item.int_Item_Id,
          int_Quantity: qty,
          dbl_Unit_Price: unitPrice,
          dbl_Total_Price: unitPrice * qty
        };
      });
      const metroSubtotal = metroItems.reduce((acc, i) => acc + i.dbl_Total_Price, 0);
      await QuotationModel.create({
        txt_Quotation_Code: `QUO-MTR-${req.int_Request_Id}`,
        int_Request_Id: req.int_Request_Id,
        int_Supplier_Id: 3,
        dbl_Total_Amount: metroSubtotal + 400, // + ₹400 transport
        txt_Status: 'Submitted',
        txt_Delivery_Days: '4 Days',
        txt_Payment_Terms: 'Net 30',
        txt_Created_By: 'Metro Wholesale Ltd',
        txt_Updated_By: 'Metro Wholesale Ltd',
        items: metroItems
      });
      seededCount++;
    }

    const allQuotations = await QuotationModel.getAll();
    res.json({
      success: true,
      message: `Seeded ${seededCount} supplier bids with varying item acceptance and pricing across requests.`,
      quotations: allQuotations
    });
  } catch (err) {
    console.error("Error seeding quotations:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', quotationController.getAll);
router.post('/', quotationController.create);
router.put('/:id/status', quotationController.updateStatus);

export default router;

