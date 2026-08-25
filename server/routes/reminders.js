import express from 'express';
import { 
  sendDeadlineReminders, 
  sendTestEmail, 
  getEmailLogs, 
  updateGmailEnv 
} from '../services/emailService.js';
import { getSchedulerStatus } from '../services/reminderScheduler.js';

const router = express.Router();

// GET /api/reminders/status
router.get('/status', async (req, res) => {
  try {
    const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER || '';
    const hasPassword = Boolean(process.env.GMAIL_PASS || process.env.EMAIL_PASS);
    const logs = await getEmailLogs();
    const scheduler = getSchedulerStatus();

    res.json({
      success: true,
      gmailConnected: Boolean(gmailUser && hasPassword),
      gmailUser: gmailUser || 'Not Configured',
      scheduler,
      logs
    });
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

// POST /api/reminders/config - Update Gmail credentials
router.post('/config', async (req, res) => {
  const { gmailUser, gmailPass } = req.body;
  if (!gmailUser || !gmailPass) {
    return res.status(400).json({ success: false, message: 'Both Gmail User & Gmail App Password are required' });
  }
  try {
    const result = await updateGmailEnv(gmailUser, gmailPass);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
