import { cookies } from "next/headers";
import { BRANCH_COOKIE, isBranchAdmin, isClinicAdmin, isSystemAdmin, type SessionUser } from "./auth";
import { hasura } from "./hasura";

export type BranchSummary = {
  id: string;
  name: string;
  slug: string;
  short_address: string | null;
  phone: string | null;
};

export type DashboardScope = {
  groupId: string | null;
  groupName: string;
  description: string | null;
  branches: BranchSummary[];
  activeClinicId: string | null;
  clinicIds: string[];
  allBranches: boolean;
};

export async function getDashboardScope(session: SessionUser): Promise<DashboardScope> {
  if (isSystemAdmin(session)) {
    return {
      groupId: null,
      groupName: "Santh Digital",
      description: null,
      branches: [],
      activeClinicId: null,
      clinicIds: [],
      allBranches: true,
    };
  }

  if (isBranchAdmin(session) && session.clinicId) {
    const clinic = await hasura<{
      clinics_by_pk: {
        id: string;
        name: string;
        slug: string;
        short_address: string | null;
        phone: string | null;
        group: { id: string; name: string; description: string | null };
      } | null;
    }>(
      `query BranchScope($id: uuid!) {
        clinics_by_pk(id: $id) {
          id name slug short_address phone
          group { id name description }
        }
      }`,
      { id: session.clinicId },
    );
    const row = clinic.clinics_by_pk;
    if (!row) {
      return {
        groupId: null,
        groupName: "Clinic",
        description: null,
        branches: [],
        activeClinicId: session.clinicId,
        clinicIds: [session.clinicId],
        allBranches: false,
      };
    }
    const branch: BranchSummary = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      short_address: row.short_address,
      phone: row.phone,
    };
    return {
      groupId: row.group.id,
      groupName: row.group.name,
      description: row.group.description,
      branches: [branch],
      activeClinicId: row.id,
      clinicIds: [row.id],
      allBranches: false,
    };
  }

  if (!isClinicAdmin(session) || !session.groupId) {
    return {
      groupId: null,
      groupName: "Clinic",
      description: null,
      branches: [],
      activeClinicId: null,
      clinicIds: [],
      allBranches: true,
    };
  }

  const data = await hasura<{
    clinic_groups_by_pk: {
      id: string;
      name: string;
      description: string | null;
      clinics: BranchSummary[];
    } | null;
  }>(
    `query GroupScope($id: uuid!) {
      clinic_groups_by_pk(id: $id) {
        id
        name
        description
        clinics(where: { is_active: { _eq: true } }, order_by: { short_address: asc }) {
          id name slug short_address phone
        }
      }
    }`,
    { id: session.groupId },
  );

  const group = data.clinic_groups_by_pk;
  const branches = group?.clinics ?? [];
  const ids = branches.map((b) => b.id);
  const jar = await cookies();
  const raw = jar.get(BRANCH_COOKIE)?.value;
  const selected =
    branches.length === 1
      ? branches[0]?.id ?? null
      : raw && raw !== "all" && ids.includes(raw)
        ? raw
        : null;

  return {
    groupId: group?.id ?? session.groupId,
    groupName: group?.name ?? "Clinic",
    description: group?.description ?? null,
    branches,
    activeClinicId: selected,
    clinicIds: selected ? [selected] : ids,
    allBranches: !selected,
  };
}

export function assertClinicInScope(scope: DashboardScope, clinicId: string) {
  return scope.clinicIds.includes(clinicId) || scope.branches.some((b) => b.id === clinicId);
}

export async function requireOperableClinic(session: SessionUser) {
  const scope = await getDashboardScope(session);
  if (!scope.activeClinicId) {
    throw new Error("SELECT_BRANCH");
  }
  return { clinicId: scope.activeClinicId, scope };
}
