export const PRIORITY_LEVELS = ["TINGGI", "SEDANG", "RENDAH"] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];
