import pool from '../config/db.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Ensure tbl_Email_Log table exists
export async function initEmailLogTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tbl_Email_Log (
        int_Log_Id INT AUTO_INCREMENT PRIMARY KEY,
        txt_Recipient_Email VARCHAR(150),
        txt_Recipient_Name VARCHAR(100),
        txt_Store_Name VARCHAR(100),
        txt_Subject VARCHAR(255),
        txt_Status VARCHAR(50),
        txt_Trigger_Type VARCHAR(50),
        dte_Sent_At DATETIME DEFAULT CURRENT_TIMESTAMP,
        txt_Details TEXT
      );
    `);
  } catch (err) {
    console.error('Error initializing tbl_Email_Log:', err.message);
  }
}

// Initialize table on load
initEmailLogTable();

// Dynamically create Nodemailer transport if package is installed and credentials exist
async function getTransporter() {
  const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS || process.env.EMAIL_PASS;

  if (!gmailUser || !gmailPass) {
    return { isConfigured: false, transporter: null, user: null };
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });
    return { isConfigured: true, transporter, user: gmailUser };
  } catch (e) {
    console.warn('Nodemailer dynamic import notice:', e.message);
    return { isConfigured: false, transporter: null, user: gmailUser, error: e.message };
  }
}

/**
 * Send deadline reminder emails to all active store in-charges
 */
export async function sendDeadlineReminders({ forceManual = false, triggerType = 'MANUAL_DASHBOARD' } = {}) {
  await initEmailLogTable();

  // 1. Get current requirement period and deadline
  let period = null;
  try {
    const [rows] = await pool.query('SELECT * FROM tbl_Requirement_Period ORDER BY int_Period_Id DESC LIMIT 1');
    if (rows.length > 0) period = rows[0];
  } catch (e) {
    console.error('Error fetching period:', e.message);
  }

  const isWindowOpen = period ? period.txt_Status === 'OPEN' : true;
  const deadlineStr = period?.dte_Deadline ? new Date(period.dte_Deadline).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }) : 'End of Month';

  // Calculate days remaining
  let daysRemaining = null;
  if (period?.dte_Deadline) {
    const deadlineDate = new Date(period.dte_Deadline);
    const now = new Date();
    const diffTime = deadlineDate - now;
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Determine if reminder should be sent
  // AUTOMATIC mode: triggers when daysRemaining <= 2 OR when deadline is overdue (daysRemaining < 0)
  // MANUAL mode: triggers anytime on demand
  const isOverdue = daysRemaining !== null && daysRemaining < 0;
  const isDeadlineToday = daysRemaining === 0;
  const isUpcoming = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 2;

  const shouldSend = forceManual || isUpcoming || isDeadlineToday || isOverdue;

  if (!shouldSend && !forceManual) {
    return {
      success: true,
      sentCount: 0,
      message: `No email sent. Deadline is in ${daysRemaining} days (automated emails trigger within 2 days of deadline, on deadline day, and daily if overdue).`,
      daysRemaining,
      isWindowOpen
    };
  }

  // 2. Fetch active stores
  const [stores] = await pool.query('SELECT * FROM tbl_Store WHERE txt_Active = "Y"');
  if (!stores || stores.length === 0) {
    return {
      success: true,
      sentCount: 0,
      message: 'No active hostel stores found to send email reminders.'
    };
  }

  const { isConfigured, transporter, user: gmailSender } = await getTransporter();

  const results = [];
  let successCount = 0;

  for (const store of stores) {
    const recipientEmail = store.txt_Email || 'incharge@hostel.edu';
    const recipientName = store.txt_Incharge || 'Store In-Charge';
    const storeName = store.txt_Store_Name || 'Hostel Store';

    // Dynamic subject line based on status
    let subject = `⏰ [Action Required] Hostel Inventory Requirement Submission Reminder (${storeName})`;
    let statusBannerTitle = '⚠️ Deadline Notice';
    let statusBannerColor = '#f59e0b'; // warning yellow
    let timeStatusText = '';

    if (isOverdue) {
      subject = `🚨 [OVERDUE NOTICE] Requirement Deadline Passed - ${storeName}`;
      statusBannerTitle = '🚨 OVERDUE SUBMISSION ALERT';
      statusBannerColor = '#ef4444'; // danger red
      timeStatusText = `Status: <strong style="color:#ef4444">${Math.abs(daysRemaining)} Day(s) Overdue</strong> (Deadline was ${deadlineStr})`;
    } else if (isDeadlineToday) {
      subject = `🚨 [DEADLINE TODAY] Final Call for Inventory Requirements - ${storeName}`;
      statusBannerTitle = '⏰ DEADLINE CLOSING TODAY';
      statusBannerColor = '#dc2626';
      timeStatusText = `Status: <strong>CLOSING TODAY!</strong> (Deadline: ${deadlineStr})`;
    } else if (isUpcoming) {
      subject = `⏰ [Reminder] Requirement Deadline in ${daysRemaining} Day(s) - ${storeName}`;
      statusBannerTitle = '⚠️ Upcoming Deadline Alert';
      statusBannerColor = '#f59e0b';
      timeStatusText = `Time Remaining: <strong>${daysRemaining} Day(s)</strong> (Deadline: ${deadlineStr})`;
    } else {
      timeStatusText = `Deadline: <strong>${deadlineStr}</strong>`;
    }
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 24px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 22px;">Hostel Inventory Management System</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Requirement Window & Deadline Notification</p>
        </div>

        <div style="padding: 24px; background-color: #ffffff; color: #333333;">
          <p style="font-size: 16px; margin-top: 0;">Dear <strong>${recipientName}</strong>,</p>
          <p style="line-height: 1.6;">This is an automated notice regarding the <strong>${storeName}</strong> monthly inventory requirement submission.</p>

          <div style="background-color: #fffbe6; border-left: 4px solid ${statusBannerColor}; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <h4 style="margin: 0 0 8px 0; color: ${statusBannerColor}; font-size: 16px;">${statusBannerTitle}</h4>
            <p style="margin: 0; font-size: 14px; color: #374151;">
              ${timeStatusText}
            </p>
          </div>

          <p style="line-height: 1.6;">Please log into the Hostel Store Portal immediately and verify/submit your store's requirements.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Open Store Portal</a>
          </div>

          <p style="font-size: 13px; color: #6b7280; border-top: 1px solid #f3f4f6; padding-top: 16px; margin-bottom: 0;">
            This email is sent automatically by the 24-hour reminder engine.<br/>
            Chief Warden / Admin Office, Hostel Inventory Portal.
          </p>
        </div>
      </div>
    `;

    let status = 'SIMULATED';
    let details = 'Simulated email log (Gmail credentials not provided in server/.env)';

    if (isConfigured && transporter) {
      try {
        await transporter.sendMail({
          from: `"Hostel Inventory Admin" <${gmailSender}>`,
          to: recipientEmail,
          subject: subject,
          html: htmlBody
        });
        status = 'SENT';
        details = `Email successfully dispatched via Gmail SMTP to ${recipientEmail}`;
        successCount++;
      } catch (mailError) {
        status = 'FAILED';
        details = `Gmail SMTP error: ${mailError.message}`;
        console.error(`Failed to send email to ${recipientEmail}:`, mailError.message);
      }
    } else {
      successCount++;
    }

    // Log to DB
    await pool.query(
      `INSERT INTO tbl_Email_Log (txt_Recipient_Email, txt_Recipient_Name, txt_Store_Name, txt_Subject, txt_Status, txt_Trigger_Type, txt_Details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [recipientEmail, recipientName, storeName, subject, status, triggerType, details]
    );

    results.push({
      store: storeName,
      incharge: recipientName,
      email: recipientEmail,
      status,
      details
    });
  }

  return {
    success: true,
    sentCount: successCount,
    totalStores: stores.length,
    isGmailConnected: isConfigured,
    triggerType,
    daysRemaining,
    results,
    message: isConfigured 
      ? `Successfully sent ${successCount} reminder email(s) via Gmail SMTP!`
      : `Generated ${successCount} reminder notification(s) (Simulation Mode). Connect Gmail in settings to dispatch actual emails.`
  };
}

/**
 * Send Test Email to verify Gmail settings
 */
export async function sendTestEmail(targetEmail) {
  const { isConfigured, transporter, user: gmailSender } = await getTransporter();

  if (!isConfigured || !transporter) {
    return {
      success: false,
      message: 'Gmail credentials not configured in server/.env (GMAIL_USER & GMAIL_PASS are required).'
    };
  }

  try {
    await transporter.sendMail({
      from: `"Hostel Inventory System" <${gmailSender}>`,
      to: targetEmail,
      subject: '✅ Gmail SMTP Connection Test - Hostel Inventory System',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #22c55e; border-radius: 8px; background: #f0fdf4;">
          <h3 style="color: #15803d; margin-top: 0;">Gmail SMTP Connected Successfully!</h3>
          <p>Your Hostel Inventory Management System is now connected to <strong>${gmailSender}</strong>.</p>
          <p>Automated 24-hour deadline reminder emails will be sent smoothly through this Gmail account.</p>
        </div>
      `
    });

    await pool.query(
      `INSERT INTO tbl_Email_Log (txt_Recipient_Email, txt_Recipient_Name, txt_Store_Name, txt_Subject, txt_Status, txt_Trigger_Type, txt_Details)
       VALUES (?, 'Test User', 'System Test', 'Gmail SMTP Connection Test', 'SENT', 'TEST', 'Test email dispatched successfully')`,
      [targetEmail]
    );

    return { success: true, message: `Test email successfully sent to ${targetEmail}` };
  } catch (err) {
    return { success: false, message: `Gmail SMTP Error: ${err.message}` };
  }
}

/**
 * Get recent email logs
 */
export async function getEmailLogs() {
  await initEmailLogTable();
  try {
    const [rows] = await pool.query('SELECT * FROM tbl_Email_Log ORDER BY int_Log_Id DESC LIMIT 30');
    return rows;
  } catch (e) {
    return [];
  }
}

/**
 * Save Gmail Config to server/.env dynamically
 */
export async function updateGmailEnv(gmailUser, gmailPass) {
  process.env.GMAIL_USER = gmailUser;
  process.env.GMAIL_PASS = gmailPass;

  const envPath = path.resolve(process.cwd(), '.env');
  try {
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');
    }

    // Replace or append GMAIL_USER and GMAIL_PASS
    if (content.includes('GMAIL_USER=')) {
      content = content.replace(/GMAIL_USER=.*/g, `GMAIL_USER=${gmailUser}`);
    } else {
      content += `\nGMAIL_USER=${gmailUser}`;
    }

    if (content.includes('GMAIL_PASS=')) {
      content = content.replace(/GMAIL_PASS=.*/g, `GMAIL_PASS=${gmailPass}`);
    } else {
      content += `\nGMAIL_PASS=${gmailPass}`;
    }

    fs.writeFileSync(envPath, content, 'utf8');
    return { success: true, message: 'Gmail SMTP configuration saved to server/.env successfully!' };
  } catch (err) {
    return { success: false, message: `Could not save to .env: ${err.message}` };
  }
}
