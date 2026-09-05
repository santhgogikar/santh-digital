import { NextRequest, NextResponse } from "next/server";
import { requireClinicSession } from "@/lib/auth";
import { getDashboardRange } from "@/lib/dashboard-data";
import { parseDashboardRange } from "@/lib/date-range";
import { getDashboardScope } from "@/lib/scope";
import { handleAuthError } from "@/lib/api-error";

export async function GET(request: NextRequest) {
  try {
    const session = await requireClinicSession();
    const scope = await getDashboardScope(session);
    const { from, to } = parseDashboardRange(
      request.nextUrl.searchParams.get("from"),
      request.nextUrl.searchParams.get("to"),
    );
    const data = await getDashboardRange(scope.clinicIds, from, to);
    return NextResponse.json(data);
  } catch (error) {
    return handleAuthError(error);
  }
}
