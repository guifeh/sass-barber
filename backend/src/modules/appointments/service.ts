import { db } from '../../db';
import {
  appointments,
  barberProfile,
  barberSettings,
  services,
  type WeeklyHours,
} from '../../db/schema';
import { and, eq, gt, gte, lt, lte, ne } from 'drizzle-orm';
import type { CreateAppointmentBody } from './schemas';
import { randomBytes } from 'crypto';

const SLOT_INTERVAL_MINUTES = 30;
const DEFAULT_OPEN = '09:00';
const DEFAULT_CLOSE = '18:00';
const CONFIRMATION_DEADLINE_DAYS = 1;

export async function getFirstBarberProfile() {
  const [row] = await db.select().from(barberProfile).limit(1);
  return row ?? null;
}

export async function getBarberProfileById(id: string) {
  const [row] = await db.select().from(barberProfile).where(eq(barberProfile.id, id));
  return row ?? null;
}

export async function getBarberProfileByUserId(userId: string) {
  const [row] = await db
    .select()
    .from(barberProfile)
    .where(eq(barberProfile.userId, userId));
  return row ?? null;
}

export async function getBarberSettingsByProfileId(barberProfileId: string) {
  const [row] = await db
    .select()
    .from(barberSettings)
    .where(eq(barberSettings.barberProfileId, barberProfileId));
  return row ?? null;
}

function getDayOfWeek(d: Date): number {
  return d.getDay();
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hours: h ?? 0, minutes: m ?? 0 };
}

function getOpeningAndClosing(
  date: Date,
  weeklyHours: WeeklyHours | null
): { open: Date; close: Date } {
  const day = getDayOfWeek(date).toString();
  const hours = weeklyHours?.[day];
  const openStr = hours?.open ?? DEFAULT_OPEN;
  const closeStr = hours?.close ?? DEFAULT_CLOSE;
  const { hours: openH, minutes: openM } = parseTime(openStr);
  const { hours: closeH, minutes: closeM } = parseTime(closeStr);

  const open = new Date(date);
  open.setHours(openH, openM, 0, 0);
  const close = new Date(date);
  close.setHours(closeH, closeM, 0, 0);
  return { open, close };
}

function addMinutes(d: Date, minutes: number): Date {
  const out = new Date(d);
  out.setMinutes(out.getMinutes() + minutes);
  return out;
}

function toDateOnly(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export interface Slot {
  start: string;
  end: string;
}

export async function getAvailability(
  dateStr: string,
  serviceId: string,
  barberId?: string
): Promise<{ slots: Slot[]; error?: string }> {
  const service = await db
    .select()
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);
  const svc = service[0];
  if (!svc || !svc.active) {
    return { slots: [], error: 'Service not found or inactive' };
  }

  let barber = barberId
    ? await getBarberProfileById(barberId)
    : await getFirstBarberProfile();
  if (!barber) {
    return { slots: [], error: 'No barber available' };
  }

  const settings = await getBarberSettingsByProfileId(barber.id);
  const slotInterval = settings?.slotIntervalMinutes ?? SLOT_INTERVAL_MINUTES;
  const weeklyHours = settings?.weeklyHours ?? null;
  const minAdvanceMinutes = settings?.minAdvanceBookingMinutes;
  const maxAdvanceDays = settings?.maxAdvanceBookingDays;

  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) {
    return { slots: [], error: 'Invalid date' };
  }
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime()) || date.getFullYear() !== y || date.getMonth() !== m - 1) {
    return { slots: [], error: 'Invalid date' };
  }

  const { open, close } = getOpeningAndClosing(date, weeklyHours);
  if (close <= open) {
    return { slots: [] };
  }

  const now = new Date();
  const dayStart = toDateOnly(date);
  if (maxAdvanceDays != null) {
    const maxDate = toDateOnly(now);
    maxDate.setDate(maxDate.getDate() + maxAdvanceDays);
    if (dayStart > maxDate) {
      return { slots: [] };
    }
  }
  if (minAdvanceMinutes != null) {
    const minBooking = addMinutes(now, minAdvanceMinutes);
    if (close <= minBooking && toDateOnly(close).getTime() === dayStart.getTime()) {
      return { slots: [] };
    }
  }

  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const existing = await db
    .select({ startTime: appointments.startTime, endTime: appointments.endTime })
    .from(appointments)
    .where(
      and(
        eq(appointments.barberId, barber!.id),
        gte(appointments.startTime, open),
        lte(appointments.startTime, dayEnd),
        ne(appointments.status, 'cancelled')
      )
    );

  const durationMs = svc.durationMinutes * 60 * 1000;
  const slotStepMs = slotInterval * 60 * 1000;
  const slots: Slot[] = [];

  for (let slotStart = open.getTime(); slotStart < close.getTime(); slotStart += slotStepMs) {
    const start = new Date(slotStart);
    const end = new Date(slotStart + durationMs);
    if (end > close) break;

    if (minAdvanceMinutes != null && start < addMinutes(now, minAdvanceMinutes)) {
      continue;
    }

    const overlaps = existing.some(
      (a) =>
        (start.getTime() < new Date(a.endTime).getTime() &&
          end.getTime() > new Date(a.startTime).getTime())
    );
    if (overlaps) continue;

    slots.push({
      start: start.toISOString(),
      end: end.toISOString(),
    });
  }

  return { slots };
}

function generateConfirmationToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createAppointment(
  userId: string,
  data: CreateAppointmentBody
): Promise<{ appointment: (typeof appointments.$inferSelect) | null; error?: string }> {
  const [svc] = await db.select().from(services).where(eq(services.id, data.serviceId));
  if (!svc || !svc.active) {
    return { appointment: null, error: 'Service not found or inactive' };
  }

  const barber = await getBarberProfileById(data.barberId);
  if (!barber) {
    return { appointment: null, error: 'Barber not found' };
  }

  const startTime = new Date(data.startTime);
  if (Number.isNaN(startTime.getTime())) {
    return { appointment: null, error: 'Invalid start time' };
  }

  const endTime = addMinutes(startTime, svc.durationMinutes);
  const settings = await getBarberSettingsByProfileId(barber.id);
  const weeklyHours = settings?.weeklyHours ?? null;
  const dateOnly = toDateOnly(startTime);
  const { open, close } = getOpeningAndClosing(dateOnly, weeklyHours);

  if (startTime < open || endTime > close) {
    return { appointment: null, error: 'Outside business hours' };
  }

  const minAdvance = settings?.minAdvanceBookingMinutes;
  const maxAdvanceDays = settings?.maxAdvanceBookingDays;
  const now = new Date();
  if (minAdvance != null && startTime < addMinutes(now, minAdvance)) {
    return { appointment: null, error: 'Booking too soon' };
  }
  if (maxAdvanceDays != null) {
    const maxDate = toDateOnly(now);
    maxDate.setDate(maxDate.getDate() + maxAdvanceDays);
    if (dateOnly > maxDate) {
      return { appointment: null, error: 'Booking too far in advance' };
    }
  }

  const conflict = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.barberId, data.barberId),
        ne(appointments.status, 'cancelled'),
        lt(appointments.startTime, endTime),
        gt(appointments.endTime, startTime)
      )
    )
    .limit(1);

  if (conflict.length > 0) {
    return { appointment: null, error: 'Time slot no longer available' };
  }

  const confirmationToken = generateConfirmationToken();
  const confirmationDeadline = new Date();
  confirmationDeadline.setDate(confirmationDeadline.getDate() + CONFIRMATION_DEADLINE_DAYS);

  const [created] = await db
    .insert(appointments)
    .values({
      userId,
      barberId: data.barberId,
      serviceId: data.serviceId,
      startTime,
      endTime,
      status: 'pending_confirmation',
      confirmationToken,
      confirmationDeadline,
    })
    .returning();

  return { appointment: created ?? null };
}

export async function listMyAppointments(userId: string) {
  return db
    .select()
    .from(appointments)
    .where(eq(appointments.userId, userId))
    .orderBy(appointments.startTime);
}

export async function listBarberAppointments(
  barberId: string,
  from?: Date,
  to?: Date
) {
  const conditions = [eq(appointments.barberId, barberId)];
  if (from) conditions.push(gte(appointments.startTime, from));
  if (to) conditions.push(lte(appointments.startTime, to));

  return db
    .select()
    .from(appointments)
    .where(and(...conditions))
    .orderBy(appointments.startTime);
}

export async function getAppointmentById(id: string) {
  const [row] = await db.select().from(appointments).where(eq(appointments.id, id));
  return row ?? null;
}

export async function cancelAppointment(
  appointmentId: string,
  userId: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  const apt = await getAppointmentById(appointmentId);
  if (!apt) {
    return { success: false, error: 'Appointment not found' };
  }
  if (apt.status === 'cancelled') {
    return { success: false, error: 'Appointment already cancelled' };
  }

  const isOwner = apt.userId === userId;
  const canCancelAsStaff = role === 'admin' || role === 'barbeiro';
  if (!isOwner && !canCancelAsStaff) {
    return { success: false, error: 'Forbidden' };
  }

  const barber = await getBarberProfileById(apt.barberId);
  const settings = barber ? await getBarberSettingsByProfileId(barber.id) : null;
  const minCancelMinutes = settings?.minCancelMinutes;
  if (minCancelMinutes != null && isOwner) {
    const cutoff = addMinutes(new Date(), minCancelMinutes);
    if (apt.startTime < cutoff) {
      return { success: false, error: 'Too close to appointment time to cancel' };
    }
  }

  await db
    .update(appointments)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(appointments.id, appointmentId));

  return { success: true };
}

export async function getAppointmentByConfirmationToken(token: string) {
  const [row] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.confirmationToken, token))
    .limit(1);
  return row ?? null;
}

export async function confirmAppointmentByToken(
  token: string
): Promise<{ success: boolean; error?: string }> {
  const apt = await getAppointmentByConfirmationToken(token);
  if (!apt) {
    return { success: false, error: 'Invalid or expired link' };
  }
  if (apt.status === 'cancelled') {
    return { success: false, error: 'Appointment was cancelled' };
  }
  if (apt.status === 'confirmed') {
    return { success: true };
  }

  await db
    .update(appointments)
    .set({ status: 'confirmed', updatedAt: new Date() })
    .where(eq(appointments.id, apt.id));

  return { success: true };
}

export async function cancelAppointmentByToken(
  token: string
): Promise<{ success: boolean; error?: string }> {
  const apt = await getAppointmentByConfirmationToken(token);
  if (!apt) {
    return { success: false, error: 'Invalid or expired link' };
  }
  if (apt.status === 'cancelled') {
    return { success: true };
  }

  await db
    .update(appointments)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(appointments.id, apt.id));

  return { success: true };
}
