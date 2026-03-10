import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { users, barberProfile, barberSettings } from '../../db/schema';
import type { RegisterBody, LoginBody } from './schemas';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function registerUser(body: RegisterBody) {
  const passwordHash = await hashPassword(body.password);
  
  return await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash,
        role: body.role,
      })
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

    if (body.role === 'barbeiro') {
      const [{ profileId }] = await tx
        .insert(barberProfile)
        .values({
          userId: user.id,
          displayName: user.name,
        })
        .returning({ profileId: barberProfile.id });

      // Default settings will be created implicitly by the schema
      // but let's insert a default row to be safe.
      await tx.insert(barberSettings).values({
        barberProfileId: profileId,
        slotIntervalMinutes: 30,
        weeklyHours: {
          '0': null,
          '1': { open: '09:00', close: '18:00' },
          '2': { open: '09:00', close: '18:00' },
          '3': { open: '09:00', close: '18:00' },
          '4': { open: '09:00', close: '18:00' },
          '5': { open: '09:00', close: '18:00' },
          '6': { open: '09:00', close: '13:00' },
        },
      });
      return { ...user, barberProfileId: profileId };
    }

    return user;
  });
}

export async function findUserByEmail(email: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      passwordHash: users.passwordHash,
      role: users.role,
      barberProfileId: barberProfile.id,
    })
    .from(users)
    .leftJoin(barberProfile, eq(users.id, barberProfile.userId))
    .where(eq(users.email, email.toLowerCase()));
  return user ?? null;
}

export async function loginUser(body: LoginBody) {
  const user = await findUserByEmail(body.email);
  if (!user) return null;
  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) return null;
  return { 
    id: user.id, 
    name: user.name, 
    email: user.email, 
    role: user.role,
    barberProfileId: user.barberProfileId || undefined
  };
}
