export const EXECUTION_STATUSES = [
  "TO DO",
  "PROSES",
  "REVIEW",
  "SELESAI",
  "TERKENDALA",
  "CANCELLED",
] as const;
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];
