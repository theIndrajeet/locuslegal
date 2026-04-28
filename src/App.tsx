import { lazy, Suspense, useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, toast } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import RouteSkeleton from "./components/RouteSkeleton";
import { useVersionCheck } from "@/hooks/useVersionCheck";
import { routeImports, prefetchCommonRoutes } from "@/lib/prefetch";
import { CommandPaletteProvider } from "@/components/search/useCommandPalette";
import CommandPalette from "@/components/search/CommandPalette";
import SearchFab from "@/components/search/SearchFab";

// Lazy-load every non-landing route so the home page ships only what it needs.
// All importers live in `lib/prefetch.ts` so hover/idle prefetching shares the
// exact same module promise as React.lazy() — chunks are downloaded only once.
const Waitlist = lazy(routeImports.waitlist as never);
const Directory = lazy(routeImports.directory as never);
const Resources = lazy(routeImports.resources as never);
const Playbook = lazy(routeImports.playbook as never);
const PlaybookGuide = lazy(routeImports.playbookGuide as never);
const Tools = lazy(routeImports.tools as never);
const CvAnalyser = lazy(routeImports.cvAnalyser as never);
const TheBar = lazy(routeImports.theBar as never);
const AppHome = lazy(routeImports.appHome as never);
const TheBarPreview = lazy(routeImports.theBarPreview as never);
const TheBarBrowse = lazy(routeImports.theBarBrowse as never);
const TheBarChallenge = lazy(routeImports.theBarChallenge as never);
const TheBarHistory = lazy(routeImports.theBarHistory as never);
const TheBarLeaderboard = lazy(routeImports.theBarLeaderboard as never);
const Auth = lazy(routeImports.auth as never);
const ResetPassword = lazy(routeImports.resetPassword as never);
const ChooseUsername = lazy(routeImports.chooseUsername as never);
const ProfileEdit = lazy(routeImports.profileEdit as never);
const PublicProfile = lazy(routeImports.publicProfile as never);
const AdminWaitlist = lazy(routeImports.adminWaitlist as never);
const AdminBar = lazy(routeImports.adminBar as never);
const AdminBeta = lazy(routeImports.adminBeta as never);
const Vacancies = lazy(routeImports.vacancies as never);
const AdminVacancies = lazy(routeImports.adminVacancies as never);
const ApplicationTracker = lazy(routeImports.applicationTracker as never);
const BetaChecklist = lazy(routeImports.betaChecklist as never);
const NotFound = lazy(routeImports.notFound as never);
const DockLab = lazy(() => import("./pages/DockLab"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Treat data as fresh for 30s — eliminates the burst of refetches
      // that fire whenever a page remounts during navigation.
      staleTime: 30_000,
      // Keep cached data around for 5 minutes after last use, so back/forward
      // navigation pulls from cache instead of re-querying Supabase.
      gcTime: 5 * 60_000,
      // Tab-switching back into the app shouldn't blast the network.
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
      retry: 1,
    },
  },
});

const VersionWatcher = () => {
  useVersionCheck(() => {
    const hardReload = () => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("v", Date.now().toString());
        window.location.replace(url.toString());
      } catch {
        window.location.reload();
      }
    };
    toast("New version of Locus available", {
      description: "Refresh to get the latest updates.",
      duration: Infinity,
      action: {
        label: "Refresh",
        onClick: hardReload,
      },
    });
  });
  return null;
};

const IdlePrefetcher = () => {
  useEffect(() => {
    prefetchCommonRoutes();
  }, []);
  return null;
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <VersionWatcher />
        <IdlePrefetcher />
        <BrowserRouter>
          <CommandPaletteProvider>
            <Suspense fallback={<RouteSkeleton />}>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/app" element={<AppHome />} />
                  <Route path="/waitlist" element={<Waitlist />} />
                  <Route path="/directory" element={<Directory />} />
                  <Route path="/playbook" element={<Playbook />} />
                  <Route path="/playbook/:slug" element={<PlaybookGuide />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/tools" element={<Tools />} />
                  <Route path="/tools/cv-analyser" element={<CvAnalyser />} />
                  <Route path="/the-bar" element={<TheBar />} />
                  <Route path="/the-bar/preview" element={<TheBarPreview />} />
                  <Route path="/the-bar/browse" element={<TheBarBrowse />} />
                  <Route path="/the-bar/challenge/:id" element={<TheBarChallenge />} />
                  <Route path="/the-bar/history" element={<TheBarHistory />} />
                  <Route path="/the-bar/leaderboard" element={<TheBarLeaderboard />} />
                  <Route path="/applications" element={<ApplicationTracker />} />
                  <Route path="/profile/edit" element={<ProfileEdit />} />
                  <Route path="/u/:username" element={<PublicProfile />} />
                  <Route path="/admin/waitlist" element={<AdminWaitlist />} />
                  <Route path="/admin/bar" element={<AdminBar />} />
                  <Route path="/admin/beta" element={<AdminBeta />} />
                  <Route path="/admin/vacancies" element={<AdminVacancies />} />
                  <Route path="/vacancies" element={<Vacancies />} />
                  <Route path="/dock-lab" element={<DockLab />} />
                </Route>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/choose-username" element={<ChooseUsername />} />
                <Route path="/beta" element={<BetaChecklist />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <CommandPalette />
            <SearchFab />
          </CommandPaletteProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
