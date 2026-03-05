export { authRoutes } from './routes';
export { authenticate, requireRole, type AllowedRole } from './guards';
export {
  registerBodySchema,
  loginBodySchema,
  refreshBodySchema,
  type RegisterBody,
  type LoginBody,
  type RefreshBody,
} from './schemas';
export { registerUser, loginUser, findUserByEmail, hashPassword, verifyPassword } from './service';
