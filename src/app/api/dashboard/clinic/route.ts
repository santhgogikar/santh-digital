import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireClinicSession } from "@/lib/auth";
import { hasura } from "@/lib/hasura";
import { requireOperableClinic } from "@/lib/scope";
import { handleAuthError } from "@/lib/api-error";

const schema = z.object({
  show_treatments: z.boolean().optional(),
  show_doctors: z.boolean().optional(),
  show_hours: z.boolean().optional(),
  slot_duration_minutes: z.coerce.number().refine((n) => n === 15 || n === 30).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireClinicSession();
    const { clinicId } = await requireOperableClinic(session);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid settings." }, { status: 400 });
    }

    const patch: Record<string, boolean | number> = {};
    if (parsed.data.show_treatments !== undefined) patch.show_treatments = parsed.data.show_treatments;
    if (parsed.data.show_doctors !== undefined) patch.show_doctors = parsed.data.show_doctors;
    if (parsed.data.show_hours !== undefined) patch.show_hours = parsed.data.show_hours;
    if (parsed.data.slot_duration_minutes !== undefined) {
      patch.slot_duration_minutes = parsed.data.slot_duration_minutes;
    }
    if (!Object.keys(patch).length) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    await hasura(
      `mutation SetClinic($id: uuid!, $patch: clinics_set_input!) {
        update_clinics_by_pk(pk_columns: { id: $id }, _set: $patch) { id }
      }`,
      { id: clinicId, patch },
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/hours");
    revalidatePath("/dashboard/services");
    revalidatePath("/dashboard/doctors");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
