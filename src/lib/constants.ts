// Fixed id for the internal "clinic" record that super admin / platform accounts are
// attached to, since the schema requires every User to belong to a Clinic. This is not
// a real client and must be excluded from any client-facing list/report.
export const PLATFORM_CLINIC_ID = "platform-hq";
