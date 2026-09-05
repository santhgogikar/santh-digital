export function defaultWorkingHours(clinicId: string, locationId: string) {
  const sessions = [
    { start_time: "10:00:00", end_time: "14:00:00" },
    { start_time: "17:00:00", end_time: "20:00:00" },
  ];
  return [1, 2, 3, 4, 5, 6].flatMap((day_of_week) =>
    sessions.map((session) => ({
      clinic_id: clinicId,
      doctor_id: null,
      location_id: locationId,
      day_of_week,
      ...session,
    })),
  );
}
