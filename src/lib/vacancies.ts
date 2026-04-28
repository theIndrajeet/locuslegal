// Shared vacancy types + helpers for both admin and public surfaces.
export type VacancyStatus = "live" | "archived" | "deleted";

export interface Vacancy {
  id: string;
  firm_name: string;
  role: string;
  location: string | null;
  application_email: string;
  eligibility: string | null;
  stipend: string | null;
  description: string | null;
  source_credit: string | null;
  posted_at: string;
  expires_at: string;
  status: VacancyStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function daysLeft(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function urgencyTone(days: number): "fresh" | "soon" | "expired" {
  if (days <= 0) return "expired";
  if (days <= 2) return "soon";
  return "fresh";
}

export function formatExpiry(expiresAt: string): string {
  const d = daysLeft(expiresAt);
  if (d <= 0) return "Closed";
  if (d === 1) return "Closes in 1 day";
  return `Closes in ${d} days`;
}
