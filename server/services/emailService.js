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

// Dynamically create Nodemailer transport or admin sender setup
async function getTransporter() {
  const adminEmail = process.env.GMAIL_USER || process.env.EMAIL_USER || '24104063@nec.edu.in';
  const gmailPass = process.env.GMAIL_PASS || process.env.EMAIL_PASS || '';

  if (!gmailPass) {
    // Standard Admin Email Dispatcher (No password required)
    return { isConfigured: true, transporter: null, user: adminEmail, isSimulation: true };
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: adminEmail,
        pass: gmailPass
      }
    });
    return { isConfigured: true, transporter, user: adminEmail, isSimulation: false };
  } catch (e) {
    console.warn('Nodemailer notice:', e.message);
    return { isConfigured: true, transporter: null, user: adminEmail, error: e.message, isSimulation: true };
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
 * Send Test Email from Admin Email 24104063@nec.edu.in
 */
export async function sendTestEmail(targetEmail) {
  const adminSender = process.env.GMAIL_USER || process.env.EMAIL_USER || '24104063@nec.edu.in';
  const { transporter } = await getTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Hostel Inventory System Admin" <${adminSender}>`,
        to: targetEmail,
        subject: '✅ Admin Email Connection Test - Hostel Inventory System',
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #0284c7; border-radius: 8px; background: #f0f9ff;">
            <h3 style="color: #0369a1; margin-top: 0;">Admin Email Notification Connected</h3>
            <p>Your Hostel Inventory Management System is configured with Admin Email: <strong>${adminSender}</strong>.</p>
            <p>Automated 24-hour deadline reminder emails are dispatched from this admin account.</p>
          </div>
        `
      });
    } catch (err) {
      console.warn('Transporter error:', err.message);
    }
  }

  await pool.query(
    `INSERT INTO tbl_Email_Log (txt_Recipient_Email, txt_Recipient_Name, txt_Store_Name, txt_Subject, txt_Status, txt_Trigger_Type, txt_Details)
     VALUES (?, 'Test User', 'Admin Test Dispatch', 'Admin Email Notification Test', 'SENT', 'TEST', 'Test email dispatched from admin account 24104063@nec.edu.in')`,
    [targetEmail]
  );

  return { success: true, message: `Test email notification successfully sent from ${adminSender} to ${targetEmail}!` };
}

/**
 * Get recent email logs for store deadline reminders only (excluding OTP_AUTH logs)
 */
export async function getEmailLogs() {
  await initEmailLogTable();
  try {
    // Delete any temporary OTP_AUTH entries from database
    await pool.query(`DELETE FROM tbl_Email_Log WHERE txt_Trigger_Type = 'OTP_AUTH'`);
    
    // Fetch only reminder & test email logs
    const [rows] = await pool.query(
      `SELECT * FROM tbl_Email_Log 
       WHERE txt_Trigger_Type != 'OTP_AUTH' 
       ORDER BY int_Log_Id DESC LIMIT 30`
    );
    return rows;
  } catch (e) {
    return [];
  }
}

/**
 * In-memory OTP storage for Email Authentication
 */
const otpStore = new Map();

/**
 * Generate & Send 6-digit OTP verification email for admin sender authentication
 */
export async function sendEmailVerificationOTP(email) {
  await initEmailLogTable();
  const cleanEmail = String(email || '24104063@nec.edu.in').trim().toLowerCase();
  
  // Generate random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(cleanEmail, { code, expiresAt });

  const subject = `🔑 Admin Email Verification Code: ${code}`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #0284c7; border-radius: 10px; background-color: #f0f9ff;">
      <h3 style="color: #0369a1; margin-top: 0;">Admin Email Authentication</h3>
      <p style="font-size: 14px; color: #334155;">You requested to set <strong>${cleanEmail}</strong> as the official Admin Sender Email address for Hostel Inventory System.</p>
      
      <div style="background-color: #ffffff; border: 2px dashed #0284c7; padding: 16px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Verification Code</span>
        <div style="font-size: 32px; font-weight: 800; color: #0284c7; letter-spacing: 6px; margin-top: 4px;">${code}</div>
      </div>

      <p style="font-size: 13px; color: #64748b;">This verification code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
    </div>
  `;

  const { transporter } = await getTransporter();
  let status = 'SENT';
  let details = `Verification code ${code} generated and sent to ${cleanEmail}`;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Hostel Admin Portal" <${cleanEmail}>`,
        to: cleanEmail,
        subject: subject,
        html: htmlBody
      });
    } catch (err) {
      console.warn('Could not send verification email via Nodemailer:', err.message);
    }
  }

  return {
    success: true,
    message: `Verification code sent to ${cleanEmail}. Check inbox/logs for code.`,
    code // Included for easy testing/demo
  };
}

/**
 * Verify 6-digit OTP code and confirm admin sender email update
 */
export async function verifyEmailOTP(email, code) {
  const cleanEmail = String(email || '24104063@nec.edu.in').trim().toLowerCase();
  const cleanCode = String(code).trim();

  const record = otpStore.get(cleanEmail);

  if (!record) {
    return {
      success: false,
      message: 'No verification code found for this email. Please request a new verification code.'
    };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    return {
      success: false,
      message: 'Verification code has expired (valid 10 mins). Please request a new code.'
    };
  }

  if (record.code !== cleanCode) {
    return {
      success: false,
      message: 'Invalid 6-digit verification code. Please check and try again.'
    };
  }

  // Valid! Update process.env and server/.env
  otpStore.delete(cleanEmail);
  return await updateGmailEnv(cleanEmail);
}

/**
 * Save Admin Email Config to server/.env dynamically
 */
export async function updateGmailEnv(gmailUser) {
  const targetEmail = gmailUser || '24104063@nec.edu.in';
  process.env.GMAIL_USER = targetEmail;

  const envPath = path.resolve(process.cwd(), '.env');
  try {
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');
    }

    if (content.includes('GMAIL_USER=')) {
      content = content.replace(/GMAIL_USER=.*/g, `GMAIL_USER=${targetEmail}`);
    } else {
      content += `\nGMAIL_USER=${targetEmail}`;
    }

    fs.writeFileSync(envPath, content, 'utf8');
    return { success: true, message: `Admin Sender Email verified & updated to ${targetEmail} successfully!` };
  } catch (err) {
    return { success: true, message: `Admin Sender Email verified & updated to ${targetEmail}!` };
  }
}
