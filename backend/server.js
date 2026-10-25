import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

import authRoutes from './routes/auth.js';
import storeRoutes from './routes/stores.js';
import supplierRoutes from './routes/suppliers.js';
import categoryRoutes from './routes/categories.js';
import itemRoutes from './routes/items.js';
import requirementRoutes from './routes/requirements.js';
import quotationRoutes from './routes/quotations.js';
import purchaseRoutes from './routes/purchases.js';
import paymentRoutes from './routes/payments.js';
import requirementPeriodRoutes from './routes/requirementPeriod.js';
import reminderRoutes from './routes/reminders.js';
import { startReminderScheduler } from './services/reminderScheduler.js';

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/requirement-period', requirementPeriodRoutes);
app.use('/api/reminders', reminderRoutes);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json({
      status: 'OK',
      message: 'Hostel Inventory MySQL Backend API is running',
      dbConnected: true,
      database: process.env.DB_NAME || 'hostel_inventory_db'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Server is running but MySQL DB is not connected',
      dbConnected: false,
      error: error.message
    });
  }
});

// Start Server & 24-hour Reminder Scheduler
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Fast2SMS Key Loaded: ${process.env.FAST2SMS_API_KEY ? 'YES (Key Active)' : 'NO (Missing)'}`);
  try {
    await pool.query("UPDATE tbl_Supplier SET dbl_Rating = 0.00 WHERE dbl_Rating >= 4.5 OR dbl_Rating IS NULL");
    console.log("✅ Supplier ratings initialized to 0.00 (Unrated) for unreviewed suppliers");
  } catch (e) {
    // Ignore if table doesn't exist yet
  }
  startReminderScheduler();
});

