import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { users } from '../../db/schema';
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
  const [user] = await db
    .insert(users)
    .values({
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash,
      role: body.role,
    })
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role });
  return user;
}

export async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));
  return user ?? null;
}

export async function loginUser(body: LoginBody) {
  const user = await findUserByEmail(body.email);
  if (!user) return null;
  const valid = await verifyPassword(body.password, user.passwordHash);
  if (!valid) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
