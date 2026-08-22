import { NextRequest, NextResponse } from "next/server";
import { requireClinicSession } from "@/lib/auth";
import { getDashboardRange } from "@/lib/dashboard-data";
import { parseDashboardRange } from "@/lib/date-range";

export async function GET(request: NextRequest) {
  try {
    const session = await requireClinicSession();
    if (!session.clinicId) {
      return NextResponse.json({ error: "Platform admin dashboard is not in this MVP." }, { status: 403 });
    }
    const { from, to } = parseDashboardRange(
      request.nextUrl.searchParams.get("from"),
      request.nextUrl.searchParams.get("to"),
    );
    const data = await getDashboardRange(session.clinicId, from, to);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }
    throw error;
  }
}
