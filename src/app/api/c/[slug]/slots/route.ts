import { NextRequest, NextResponse } from "next/server";
import { fromZonedTime } from "date-fns-tz";
import { getBusyAppointments, getClinicBySlug, getClinicHolidays, getClinicWorkingHours } from "@/lib/clinic";
import { computeSlots } from "@/lib/slots";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const clinic = await getClinicBySlug(slug);
  if (!clinic) return NextResponse.json({ error: "Clinic not found." }, { status: 404 });

  const serviceId = request.nextUrl.searchParams.get("serviceId");
  const date = request.nextUrl.searchParams.get("date");
  if (!serviceId || !date) {
    return NextResponse.json({ error: "serviceId and date are required." }, { status: 400 });
  }

  const service = clinic.services.find((s) => s.id === serviceId);
  if (!service) {
    return NextResponse.json({ error: "Unknown treatment." }, { status: 400 });
  }

  const hours = await getClinicWorkingHours(clinic.id);
  const holidays = await getClinicHolidays(clinic.id, date, date);
  const dayStart = fromZonedTime(`${date}T00:00:00`, clinic.timezone);
  const dayEnd = fromZonedTime(`${date}T23:59:59`, clinic.timezone);
  const busy = await getBusyAppointments(clinic.id, dayStart.toISOString(), dayEnd.toISOString());
  const durationMinutes = clinic.slot_duration_minutes || 30;

  const slots = computeSlots({
    dateYmd: date,
    timeZone: clinic.timezone,
    durationMinutes,
    bufferMinutes: clinic.booking_buffer_minutes,
    hours,
    busy,
    holidays,
  });

  return NextResponse.json({ slots, durationMinutes });
}
