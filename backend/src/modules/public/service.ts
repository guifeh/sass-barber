import { db } from '../../db';
import { barberProfile, services } from '../../db/schema';
import { eq, ilike } from 'drizzle-orm';
import { getAvailability } from '../appointments/service';

export async function listPublicBarbers(search?: string) {
  let query = db.select().from(barberProfile);
  
  if (search) {
    query = query.where(ilike(barberProfile.displayName, `%${search}%`)) as any;
  }
  
  const barbers = await query.orderBy(barberProfile.displayName);
  
  // Return safe fields
  return barbers.map(b => ({
    id: b.id,
    displayName: b.displayName,
    bio: b.bio,
    photoUrl: b.photoUrl,
  }));
}

export async function listPublicServicesByBarber(barberId: string) {
  const list = await db
    .select()
    .from(services)
    .where(eq(services.barberProfileId, barberId))
    .orderBy(services.name);
    
  return list.filter(s => s.active).map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMinutes: s.durationMinutes,
    basePrice: s.basePrice,
  }));
}

export async function getPublicAvailability(
  dateStr: string,
  serviceId: string,
  barberId: string
) {
  return getAvailability(dateStr, serviceId, barberId);
}
