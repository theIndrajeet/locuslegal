// Central registry of route → dynamic import.
// `lazy(() => routeImports.tools())` and `prefetchRoute('/tools')` resolve to
// the SAME module promise, so a chunk is only ever downloaded once.

type Importer = () => Promise<unknown>;

export const routeImports = {
  waitlist: () => import("@/pages/Waitlist"),
  directory: () => import("@/pages/Directory"),
  resources: () => import("@/pages/Resources"),
  playbook: () => import("@/pages/Playbook"),
  playbookGuide: () => import("@/pages/PlaybookGuide"),
  tools: () => import("@/pages/Tools"),
  cvAnalyser: () => import("@/pages/CvAnalyser"),
  theBar: () => import("@/pages/TheBar"),
  appHome: () => import("@/pages/AppHome"),
  theBarPreview: () => import("@/pages/TheBarPreview"),
  theBarBrowse: () => import("@/pages/TheBarBrowse"),
  theBarChallenge: () => import("@/pages/TheBarChallenge"),
  theBarHistory: () => import("@/pages/TheBarHistory"),
  theBarLeaderboard: () => import("@/pages/TheBarLeaderboard"),
  auth: () => import("@/pages/Auth"),
  resetPassword: () => import("@/pages/ResetPassword"),
  chooseUsername: () => import("@/pages/ChooseUsername"),
  profileEdit: () => import("@/pages/ProfileEdit"),
  publicProfile: () => import("@/pages/PublicProfile"),
  adminWaitlist: () => import("@/pages/AdminWaitlist"),
  adminBar: () => import("@/pages/AdminBar"),
  applicationTracker: () => import("@/pages/ApplicationTracker"),
  notFound: () => import("@/pages/NotFound"),
} satisfies Record<string, Importer>;

// Map URL path prefixes → importer key. Order matters (most specific first).
const pathToKey: Array<[RegExp, keyof typeof routeImports]> = [
  [/^\/waitlist/, "waitlist"],
  [/^\/directory/, "directory"],
  [/^\/resources/, "resources"],
  [/^\/playbook\/.+/, "playbookGuide"],
  [/^\/playbook/, "playbook"],
  [/^\/tools\/cv-analyser/, "cvAnalyser"],
  [/^\/tools/, "tools"],
  [/^\/the-bar\/preview/, "theBarPreview"],
  [/^\/the-bar\/browse/, "theBarBrowse"],
  [/^\/the-bar\/challenge/, "theBarChallenge"],
  [/^\/the-bar\/history/, "theBarHistory"],
  [/^\/the-bar\/leaderboard/, "theBarLeaderboard"],
  [/^\/the-bar/, "theBar"],
  [/^\/app/, "appHome"],
  [/^\/auth/, "auth"],
  [/^\/reset-password/, "resetPassword"],
  [/^\/choose-username/, "chooseUsername"],
  [/^\/profile\/edit/, "profileEdit"],
  [/^\/u\//, "publicProfile"],
  [/^\/admin\/waitlist/, "adminWaitlist"],
  [/^\/admin\/bar/, "adminBar"],
  [/^\/applications/, "applicationTracker"],
];

const fired = new Set<string>();

export function prefetchRoute(path: string) {
  const match = pathToKey.find(([re]) => re.test(path));
  if (!match) return;
  const key = match[1];
  if (fired.has(key)) return;
  fired.add(key);
  // Fire and forget. Errors are silent — the real navigation will surface them.
  routeImports[key]().catch(() => fired.delete(key));
}

// Routes most users hit shortly after landing. Warm them during idle time.
const COMMON_KEYS: Array<keyof typeof routeImports> = [
  "directory",
  "playbook",
  "resources",
  "tools",
  "theBar",
];

export function prefetchCommonRoutes() {
  if (typeof window === "undefined") return;

  // Run sequentially so we don't compete with the current page's API calls.
  const run = async () => {
    for (const key of COMMON_KEYS) {
      if (fired.has(key)) continue;
      fired.add(key);
      try {
        await routeImports[key]();
      } catch {
        fired.delete(key);
      }
      // Yield between chunks so the main thread stays responsive.
      await new Promise((r) => setTimeout(r, 250));
    }
  };

  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
    .requestIdleCallback;
  if (ric) ric(() => run(), { timeout: 4000 });
  else setTimeout(run, 3000);
}
