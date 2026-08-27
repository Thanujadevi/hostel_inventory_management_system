import express from 'express';
import { 
  sendDeadlineReminders, 
  sendTestEmail, 
  getEmailLogs, 
  updateGmailEnv,
  sendEmailVerificationOTP,
  verifyEmailOTP
} from '../services/emailService.js';
import { getSchedulerStatus } from '../services/reminderScheduler.js';

const router = express.Router();

// GET /api/reminders/status
router.get('/status', async (req, res) => {
  try {
    const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER || '24104063@nec.edu.in';
    const logs = await getEmailLogs();
    const scheduler = getSchedulerStatus();

    res.json({
      success: true,
      gmailConnected: true,
      gmailUser: gmailUser,
      scheduler,
      logs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reminders/send-otp - Generate & Send 6-digit verification code to email
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required to send verification code' });
  }
  try {
    const result = await sendEmailVerificationOTP(email);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reminders/verify-otp - Verify code & save Admin Email
router.post('/verify-otp', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Both Email and 6-digit Verification Code are required' });
  }
  try {
    const result = await verifyEmailOTP(email, code);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reminders/trigger - Trigger sending reminder emails now
router.post('/trigger', async (req, res) => {
  try {
    const result = await sendDeadlineReminders({ forceManual: true, triggerType: 'MANUAL_DASHBOARD' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reminders/test - Send test email
router.post('/test', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Recipient email is required' });
  }
  try {
    const result = await sendTestEmail(email);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reminders/config - Update Admin Sender Email
router.post('/config', async (req, res) => {
  const { gmailUser } = req.body;
  const targetEmail = gmailUser || '24104063@nec.edu.in';
  try {
    const result = await updateGmailEnv(targetEmail);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
