import { db } from '../../db';
import { appointments, services } from '../../db/schema';
import { and, eq, gte, lte, ne } from 'drizzle-orm';

export async function getDashboardMetrics(barberProfileId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Fetch today's appointments that are not cancelled
  const todayAppointments = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      basePrice: services.basePrice,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        eq(appointments.barberId, barberProfileId),
        gte(appointments.startTime, startOfDay),
        lte(appointments.startTime, endOfDay),
        ne(appointments.status, 'cancelled')
      )
    );

  const totalAppointmentsToday = todayAppointments.length;
  // basePrice is in cents, keep it in cents or convert as needed. Let's return cents.
  const projectedRevenueToday = todayAppointments.reduce((sum, apt) => {
    return sum + (apt.basePrice || 0);
  }, 0);

  return {
    totalAppointmentsToday,
    projectedRevenueTodayCents: projectedRevenueToday,
  };
}
