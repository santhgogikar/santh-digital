import type { ClinicRecord } from "./types";

export function clinicBrandName(clinic: ClinicRecord) {
  return clinic.group?.name ?? clinic.name;
}

export function clinicDescription(clinic: ClinicRecord) {
  return clinic.group?.description ?? clinic.tagline ?? "";
}

export function clinicShortAddress(clinic: ClinicRecord) {
  return clinic.short_address || [clinic.locations[0]?.area, clinic.locations[0]?.city].filter(Boolean).join(", ");
}

export function clinicFullAddress(clinic: ClinicRecord) {
  return clinic.full_address || clinic.locations[0]?.address_line1 || "";
}

export function clinicMapUrl(clinic: ClinicRecord) {
  return clinic.map_url || clinic.locations[0]?.google_maps_url || null;
}
