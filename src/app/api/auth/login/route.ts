import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { createSessionToken, sessionCookieName } from "@/lib/auth";
import { findUserByEmail } from "@/lib/clinic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user || !user.is_active) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const ok = await compare(password, user.password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    clinicId: user.clinic_id,
    groupId: user.group_id,
  });

  const response = NextResponse.json({ ok: true, role: user.role, groupId: user.group_id, clinicId: user.clinic_id });
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
