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

// ----- User application state per vacancy -----
export interface VacancyApplication {
  id: string;
  appliedOn: string; // ISO date
  lastFollowupOn: string | null; // ISO date or null
}

export type VacancyAppState = "idle" | "applied" | "followup_ready" | "followed_up";

const FOLLOWUP_AFTER_DAYS = 3;

export function applicationStateFor(
  app: VacancyApplication | undefined | null,
  now: Date = new Date(),
): { state: VacancyAppState; daysUntilFollowup: number; lastActionOn: string | null } {
  if (!app) return { state: "idle", daysUntilFollowup: 0, lastActionOn: null };
  const lastAction = app.lastFollowupOn ?? app.appliedOn;
  const lastMs = new Date(lastAction).getTime();
  const diffDays = Math.floor((now.getTime() - lastMs) / (1000 * 60 * 60 * 24));
  if (app.lastFollowupOn && diffDays < FOLLOWUP_AFTER_DAYS) {
    return { state: "followed_up", daysUntilFollowup: 0, lastActionOn: app.lastFollowupOn };
  }
  if (diffDays >= FOLLOWUP_AFTER_DAYS) {
    return { state: "followup_ready", daysUntilFollowup: 0, lastActionOn: lastAction };
  }
  return {
    state: "applied",
    daysUntilFollowup: Math.max(1, FOLLOWUP_AFTER_DAYS - diffDays),
    lastActionOn: app.appliedOn,
  };
}
