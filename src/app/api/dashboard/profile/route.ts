import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isClinicAdmin, requireClinicSession } from "@/lib/auth";
import { hasura } from "@/lib/hasura";
import { getDashboardScope } from "@/lib/scope";
import { handleAuthError } from "@/lib/api-error";

const schema = z.object({
  description: z.string().max(800).optional(),
  branchId: z.string().uuid().optional(),
  shortAddress: z.string().max(200).optional(),
  clinicNumber: z.string().max(40).optional(),
  fullAddress: z.string().max(400).optional(),
  mapURL: z.string().max(500).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireClinicSession();
    const scope = await getDashboardScope(session);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid profile." }, { status: 400 });
    }

    if (parsed.data.description !== undefined) {
      if (!isClinicAdmin(session) || !scope.groupId) {
        return NextResponse.json({ error: "Only clinic admin can edit the description." }, { status: 403 });
      }
      await hasura(
        `mutation SetGroup($id: uuid!, $description: String) {
          update_clinic_groups_by_pk(pk_columns: { id: $id }, _set: { description: $description }) { id }
        }`,
        { id: scope.groupId, description: parsed.data.description.trim() },
      );
    }

    const branchFields =
      parsed.data.shortAddress !== undefined ||
      parsed.data.clinicNumber !== undefined ||
      parsed.data.fullAddress !== undefined ||
      parsed.data.mapURL !== undefined;

    if (branchFields) {
      const branchId = parsed.data.branchId ?? scope.activeClinicId;
      if (!branchId || !scope.branches.some((b) => b.id === branchId)) {
        return NextResponse.json({ error: "Choose a branch to edit address details." }, { status: 400 });
      }
      const clinicPatch: Record<string, string> = {};
      if (parsed.data.shortAddress !== undefined) clinicPatch.short_address = parsed.data.shortAddress.trim();
      if (parsed.data.clinicNumber !== undefined) clinicPatch.phone = parsed.data.clinicNumber.trim();
      if (parsed.data.fullAddress !== undefined) clinicPatch.full_address = parsed.data.fullAddress.trim();
      if (parsed.data.mapURL !== undefined) clinicPatch.map_url = parsed.data.mapURL.trim();

      await hasura(
        `mutation SetBranch($id: uuid!, $patch: clinics_set_input!) {
          update_clinics_by_pk(pk_columns: { id: $id }, _set: $patch) { id }
        }`,
        { id: branchId, patch: clinicPatch },
      );

      const locationPatch: Record<string, string> = {};
      if (parsed.data.fullAddress !== undefined) {
        locationPatch.address_line1 = parsed.data.fullAddress.trim().split("\n")[0] ?? "";
      }
      if (parsed.data.clinicNumber !== undefined) locationPatch.phone = parsed.data.clinicNumber.trim();
      if (parsed.data.mapURL !== undefined) locationPatch.google_maps_url = parsed.data.mapURL.trim();
      if (Object.keys(locationPatch).length) {
        await hasura(
          `mutation SetLocation($clinicId: uuid!, $patch: locations_set_input!) {
            update_locations(where: { clinic_id: { _eq: $clinicId }, is_primary: { _eq: true } }, _set: $patch) {
              affected_rows
            }
          }`,
          { clinicId: branchId, patch: locationPatch },
        );
      }
    }

    revalidatePath("/dashboard/clinic");
    revalidatePath("/dashboard");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
