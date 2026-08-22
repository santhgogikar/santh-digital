import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getClinicBySlug } from "@/lib/clinic";
import { hasura } from "@/lib/hasura";

const schema = z.object({
  name: z.string().min(2).max(80),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number."),
  requirement: z.string().min(3).max(400),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const clinic = await getClinicBySlug(slug);
  if (!clinic) return NextResponse.json({ error: "Clinic not found." }, { status: 404 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const lead = await hasura<{ insert_leads_one: { id: string } }>(
    `mutation NewLead($clinicId: uuid!, $name: String!, $mobile: String!, $requirement: String!) {
      insert_leads_one(
        object: {
          clinic_id: $clinicId
          name: $name
          mobile: $mobile
          requirement: $requirement
          status: new
          source: "website"
        }
      ) {
        id
      }
    }`,
    {
      clinicId: clinic.id,
      name: parsed.data.name.trim(),
      mobile: parsed.data.mobile,
      requirement: parsed.data.requirement.trim(),
    },
  );

  return NextResponse.json({ ok: true, id: lead.insert_leads_one.id });
}
