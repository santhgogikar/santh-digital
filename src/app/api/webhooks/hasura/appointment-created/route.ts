import { NextRequest, NextResponse } from "next/server";
import { notifyAppointmentCreated } from "@/lib/notify";

type HasuraEvent = {
  event?: {
    op?: string;
    data?: { new?: { id?: string } };
  };
};

export async function POST(request: NextRequest) {
  const expected = process.env.HASURA_EVENT_SECRET;
  const provided = request.headers.get("x-hasura-event-secret");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json()) as HasuraEvent;
  const appointmentId = payload.event?.data?.new?.id;
  if (!appointmentId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const result = await notifyAppointmentCreated(appointmentId);
  return NextResponse.json({ ok: true, ...result });
}
