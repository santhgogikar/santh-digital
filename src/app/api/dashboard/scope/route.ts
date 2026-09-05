import { NextRequest, NextResponse } from "next/server";
import { BRANCH_COOKIE, requireClinicSession } from "@/lib/auth";
import { getDashboardScope } from "@/lib/scope";
import { handleAuthError } from "@/lib/api-error";

export async function POST(request: NextRequest) {
  try {
    const session = await requireClinicSession();
    const scope = await getDashboardScope(session);
    const body = (await request.json()) as { clinicId?: string | null };
    const next = body.clinicId && scope.branches.some((b) => b.id === body.clinicId) ? body.clinicId : "all";
    const response = NextResponse.json({ ok: true, clinicId: next === "all" ? null : next });
    response.cookies.set(BRANCH_COOKIE, next, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    return handleAuthError(error);
  }
}
