import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

export type StaffRole = "platform_admin" | "clinic_admin" | "receptionist" | "doctor";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  clinicId: string | null;
  groupId: string | null;
};

const COOKIE = "sd_session";
export const BRANCH_COOKIE = "sd_branch";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set.");
  return new TextEncoder().encode(value);
}

export function isSystemAdmin(session: SessionUser) {
  return session.role === "platform_admin";
}

export function isClinicAdmin(session: SessionUser) {
  return session.role === "clinic_admin" && Boolean(session.groupId) && !session.clinicId;
}

export function isBranchAdmin(session: SessionUser) {
  return (session.role === "clinic_admin" || session.role === "receptionist" || session.role === "doctor") && Boolean(session.clinicId);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    clinicId: user.clinicId,
    groupId: user.groupId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function readSessionFromToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as SessionUser["role"],
      clinicId: (payload.clinicId as string | null) ?? null,
      groupId: (payload.groupId as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return readSessionFromToken(token);
}

export async function requireClinicSession() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  if (isSystemAdmin(session)) throw new Error("FORBIDDEN");
  if (!isClinicAdmin(session) && !isBranchAdmin(session)) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

export async function requireSystemAdmin() {
  const session = await getSession();
  if (!session || !isSystemAdmin(session)) throw new Error("UNAUTHENTICATED");
  return session;
}

export const sessionCookieName = COOKIE;
