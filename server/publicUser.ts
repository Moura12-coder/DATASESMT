import type { User } from "../drizzle/schema";
export function publicUser(user: User | null) {
  if (!user) return null;
  return {
    id: user.id,
    openId: user.openId,
    name: user.name,
    email: user.email,
    role: user.role,
    loginMethod: user.loginMethod,
    registrationStatus: user.registrationStatus,
    rejectionReason: user.rejectionReason,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastSignedIn: user.lastSignedIn,
  };
}
