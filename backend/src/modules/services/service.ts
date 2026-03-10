import { db } from '../../db';
import { services } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { CreateServiceBody, UpdateServiceBody } from './schemas';

export async function listServices(activeOnly = false, barberProfileId?: string) {
  let query = db.select().from(services);
  if (barberProfileId) {
    query = query.where(eq(services.barberProfileId, barberProfileId)) as any;
  }
  const rows = await query.orderBy(services.name);
  if (activeOnly) {
    return rows.filter((r) => r.active);
  }
  return rows;
}

export async function getServiceById(id: string) {
  const [row] = await db.select().from(services).where(eq(services.id, id));
  return row ?? null;
}

export async function createService(data: CreateServiceBody, barberProfileId: string) {
  const [created] = await db
    .insert(services)
    .values({
      barberProfileId,
      name: data.name,
      description: data.description ?? null,
      durationMinutes: data.durationMinutes,
      basePrice: data.basePrice ?? null,
      active: data.active ?? true,
    })
    .returning();
  return created ?? null;
}

export async function updateService(id: string, data: UpdateServiceBody) {
  const updates: Partial<{
    name: string;
    description: string | null;
    durationMinutes: number;
    basePrice: number | null;
    active: boolean;
    updatedAt: Date;
  }> = {
    updatedAt: new Date(),
  };
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.durationMinutes !== undefined) updates.durationMinutes = data.durationMinutes;
  if (data.basePrice !== undefined) updates.basePrice = data.basePrice;
  if (data.active !== undefined) updates.active = data.active;

  const [updated] = await db
    .update(services)
    .set(updates)
    .where(eq(services.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteService(id: string) {
  const [deleted] = await db.delete(services).where(eq(services.id, id)).returning();
  return deleted ?? null;
}
