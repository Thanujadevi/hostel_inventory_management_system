import { sendDeadlineReminders } from './emailService.js';

let schedulerInterval = null;
let lastRunTimestamp = null;
let isSchedulerRunning = false;

// 5-Minute Test Mode State Variables
let testStartTime = null;
let testDeadlineTime = null;
let hasSent3MinReminder = false;
let hasSent5MinDeadline = false;

export function startReminderScheduler() {
  if (isSchedulerRunning) return;

  testStartTime = Date.now();
  testDeadlineTime = testStartTime + 5 * 60 * 1000; // 5 minutes deadline window
  hasSent3MinReminder = false;
  hasSent5MinDeadline = false;
  isSchedulerRunning = true;

  console.log('⏰ [5-Min Test Mode] Automated Email Reminder Scheduler initialized.');
  console.log(`⏰ [Test Schedule]: Start = ${new Date(testStartTime).toLocaleTimeString()}, Deadline (5 mins) = ${new Date(testDeadlineTime).toLocaleTimeString()}`);
  console.log('⏰ [Test Schedule Plan]: Reminder mail at +3 mins (2 mins remaining); Deadline mail at +5 mins (0 mins remaining).');

  // Check every 15 seconds (15000 ms) to detect timing milestones accurately
  const CHECK_INTERVAL = 15 * 1000;

  schedulerInterval = setInterval(async () => {
    try {
      const now = Date.now();
      const elapsedMs = now - testStartTime;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const remainingSeconds = Math.max(0, Math.floor((testDeadlineTime - now) / 1000));
      lastRunTimestamp = new Date().toISOString();

      // Milestone 1: 3 minutes elapsed (180 seconds or remaining <= 120 seconds / 2 minutes left)
      if (elapsedSeconds >= 180 && !hasSent3MinReminder && remainingSeconds > 0) {
        hasSent3MinReminder = true;
        console.log(`⏰ [3-Min Reminder Triggered]: 3 minutes elapsed (${Math.ceil(remainingSeconds / 60)} mins / ${remainingSeconds}s remaining until deadline). Sending reminder emails...`);
        const res = await sendDeadlineReminders({
          forceManual: false,
          triggerType: 'AUTOMATIC_CRON',
          testStage: 'REMINDER_3MIN',
          remainingMins: 2
        });
        console.log(`⏰ [3-Min Reminder Result]: ${res.message}`);
      }

      // Milestone 2: 5 minutes elapsed (300 seconds or remaining == 0)
      if (elapsedSeconds >= 300 && !hasSent5MinDeadline) {
        hasSent5MinDeadline = true;
        console.log(`🚨 [5-Min Deadline Triggered]: 5 minutes deadline window reached! Sending deadline emails...`);
        const res = await sendDeadlineReminders({
          forceManual: false,
          triggerType: 'AUTOMATIC_CRON',
          testStage: 'DEADLINE_5MIN',
          remainingMins: 0
        });
        console.log(`🚨 [5-Min Deadline Result]: ${res.message}`);
      }
    } catch (err) {
      console.error('⚠️ [5-Min Scheduler Error]:', err.message);
    }
  }, CHECK_INTERVAL);
}

export function resetTestScheduler() {
  testStartTime = Date.now();
  testDeadlineTime = testStartTime + 5 * 60 * 1000;
  hasSent3MinReminder = false;
  hasSent5MinDeadline = false;
  console.log('🔄 [5-Min Test Mode] Scheduler timer reset! New 5-minute deadline initiated.');
}

export function getSchedulerStatus() {
  const now = Date.now();
  const elapsedMs = testStartTime ? now - testStartTime : 0;
  const remainingSeconds = testDeadlineTime ? Math.max(0, Math.floor((testDeadlineTime - now) / 1000)) : 300;

  return {
    isRunning: isSchedulerRunning,
    lastRun: lastRunTimestamp,
    intervalHours: '5-Min Test Mode (Checks every 15s)',
    reminderRule: 'TEST MODE: Deadline in 5 mins. Reminder email sent after 3 mins (2 mins left), Deadline email sent at 5 mins.',
    testStartTime: testStartTime ? new Date(testStartTime).toISOString() : null,
    testDeadlineTime: testDeadlineTime ? new Date(testDeadlineTime).toISOString() : null,
    elapsedSeconds: Math.floor(elapsedMs / 1000),
    remainingSeconds,
    hasSent3MinReminder,
    hasSent5MinDeadline
  };
}

