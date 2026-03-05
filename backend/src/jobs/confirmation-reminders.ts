import { sendConfirmationReminderEmails } from '../modules/notifications/service';

const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startConfirmationRemindersJob(): void {
  if (intervalId !== null) return;

  async function run() {
    try {
      const { sent, errors } = await sendConfirmationReminderEmails();
      if (sent > 0 || errors > 0) {
        console.log(`[job] Confirmation reminders: sent=${sent}, errors=${errors}`);
      }
    } catch (err) {
      console.error('[job] Confirmation reminders error:', err);
    }
  }

  run();
  intervalId = setInterval(run, INTERVAL_MS);
  console.log('[job] Confirmation reminders job started (every 15 min)');
}

export function stopConfirmationRemindersJob(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[job] Confirmation reminders job stopped');
  }
}
