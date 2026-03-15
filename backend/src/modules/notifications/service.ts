import { db } from '../../db';
import { appointments, barberProfile, services, users } from '../../db/schema';
import { and, eq, gte, lte, isNull } from 'drizzle-orm';
import { sendMail } from './mailer';
import {
  appointmentCreatedForUser,
  appointmentCreatedForBarber,
  confirmationReminder,
  type AppointmentEmailData,
} from './templates';
import { env } from '../../config/env';

const CONFIRMATION_REMINDER_WINDOW_HOURS = 24;
const APP_BASE_URL_DEFAULT = 'http://localhost:3333';

function getAppBaseUrl(): string {
  return env.APP_BASE_URL ?? APP_BASE_URL_DEFAULT;
}

async function buildEmailData(appointmentId: string): Promise<AppointmentEmailData | null> {
  const [apt] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);
  if (!apt) return null;

  const [user] = await db.select().from(users).where(eq(users.id, apt.userId)).limit(1);
  const [barber] = await db.select().from(barberProfile).where(eq(barberProfile.id, apt.barberId)).limit(1);
  const [svc] = await db.select().from(services).where(eq(services.id, apt.serviceId)).limit(1);

  if (!user || !barber || !svc) return null;

  const [barberUser] = await db.select().from(users).where(eq(users.id, barber.userId)).limit(1);
  if (!barberUser) return null;

  return {
    userName: user.name,
    userEmail: user.email,
    barberName: barber.displayName ?? barberUser.name,
    barberEmail: barberUser.email,
    serviceName: svc.name,
    startTime: apt.startTime.toISOString(),
    endTime: apt.endTime.toISOString(),
    confirmationToken: apt.confirmationToken,
    appBaseUrl: getAppBaseUrl(),
  };
}

/**
 * Send "appointment created" emails to both the client and the barber.
 * Call this after creating an appointment (fire-and-forget is fine).
 */
export async function sendAppointmentCreatedEmails(appointmentId: string): Promise<void> {
  console.log(`[notifications] Sending immediate booking emails for appointment ${appointmentId}...`);
  const data = await buildEmailData(appointmentId);
  if (!data) {
    console.error(`[notifications] Could not build email data for appointment ${appointmentId}`);
    return;
  }

  const forUser = appointmentCreatedForUser(data);
  const forBarber = appointmentCreatedForBarber(data);

  const [userResult, barberResult] = await Promise.all([
    sendMail({ to: data.userEmail, ...forUser }),
    sendMail({ to: data.barberEmail, ...forBarber }),
  ]);

  if (userResult.success) {
    console.log(`[notifications] Immediate email sent to user: ${data.userEmail}`);
  } else {
    console.error(`[notifications] Failed to send email to user ${data.userEmail}:`, userResult.error);
  }

  if (barberResult.success) {
    console.log(`[notifications] Immediate email sent to barber: ${data.barberEmail}`);
  } else {
    console.error(`[notifications] Failed to send email to barber ${data.barberEmail}:`, barberResult.error);
  }
}

/**
 * Find appointments that are pending confirmation, within the reminder window,
 * and not yet sent. Send reminder email and mark as sent.
 */
export async function sendConfirmationReminderEmails(): Promise<{ sent: number; errors: number }> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + CONFIRMATION_REMINDER_WINDOW_HOURS * 60 * 60 * 1000);

  const due = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.status, 'pending_confirmation'),
        lte(appointments.confirmationDeadline, windowEnd),
        gte(appointments.confirmationDeadline, now),
        isNull(appointments.confirmationEmailSentAt)
      )
    );

  console.log(`[notifications] Reminder check: found ${due.length} appointments pending confirmation within window.`);

  let sent = 0;
  let errors = 0;

  for (const apt of due) {
    console.log(`[notifications] Sending reminder for appointment ${apt.id}...`);
    const data = await buildEmailData(apt.id);
    if (!data) {
      console.error(`[notifications] Could not build email data for appointment ${apt.id}`);
      errors++;
      continue;
    }
    const msg = confirmationReminder(data);
    const result = await sendMail({ to: data.userEmail, ...msg });
    if (result.success) {
      await db
        .update(appointments)
        .set({ confirmationEmailSentAt: now, updatedAt: now })
        .where(eq(appointments.id, apt.id));
      console.log(`[notifications] Reminder sent and DB updated for appointment ${apt.id}`);
      sent++;
    } else {
      console.error(`[notifications] Failed to send reminder for ${apt.id}:`, result.error);
      errors++;
    }
  }

  return { sent, errors };
}
