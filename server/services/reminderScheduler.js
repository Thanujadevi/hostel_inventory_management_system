import { sendDeadlineReminders } from './emailService.js';

let schedulerInterval = null;
let lastRunTimestamp = null;
let isSchedulerRunning = false;

export function startReminderScheduler() {
  if (isSchedulerRunning) return;

  console.log('⏰ Automated 24-hour Email Reminder Scheduler initialized.');
  isSchedulerRunning = true;

  // Run initial check on server startup (delayed 10s to allow DB connection)
  setTimeout(async () => {
    try {
      console.log('🔍 [24h Scheduler] Checking inventory requirement deadlines...');
      const res = await sendDeadlineReminders({ forceManual: false, triggerType: 'AUTOMATIC_CRON' });
      lastRunTimestamp = new Date().toISOString();
      console.log(`⏰ [24h Scheduler Result]: ${res.message}`);
    } catch (err) {
      console.error('⚠️ [24h Scheduler Error]:', err.message);
    }
  }, 10000);

  // Set interval to run every 24 hours (24 * 60 * 60 * 1000 ms)
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  schedulerInterval = setInterval(async () => {
    try {
      console.log('⏰ [24h Scheduler] Executing daily 24-hour deadline reminder check...');
      const res = await sendDeadlineReminders({ forceManual: false, triggerType: 'AUTOMATIC_CRON' });
      lastRunTimestamp = new Date().toISOString();
      console.log(`⏰ [24h Scheduler Result]: ${res.message}`);
    } catch (err) {
      console.error('⚠️ [24h Scheduler Error]:', err.message);
    }
  }, TWENTY_FOUR_HOURS);
}

export function getSchedulerStatus() {
  return {
    isRunning: isSchedulerRunning,
    lastRun: lastRunTimestamp,
    intervalHours: 24,
    reminderRule: 'Automatically checks every 24 hours. Triggers emails within 2 days of requirement deadline.'
  };
}
