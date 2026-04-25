import { lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, toast } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import { useVersionCheck } from "@/hooks/useVersionCheck";

// Lazy-load every non-landing route so the home page ships only what it needs.
const Waitlist = lazy(() => import("./pages/Waitlist"));
const Directory = lazy(() => import("./pages/Directory"));
const Resources = lazy(() => import("./pages/Resources"));
const Playbook = lazy(() => import("./pages/Playbook"));
const PlaybookGuide = lazy(() => import("./pages/PlaybookGuide"));
const Tools = lazy(() => import("./pages/Tools"));
const CvAnalyser = lazy(() => import("./pages/CvAnalyser"));
const TheBar = lazy(() => import("./pages/TheBar"));
const AppHome = lazy(() => import("./pages/AppHome"));
const TheBarPreview = lazy(() => import("./pages/TheBarPreview"));
const TheBarBrowse = lazy(() => import("./pages/TheBarBrowse"));
const TheBarChallenge = lazy(() => import("./pages/TheBarChallenge"));
const TheBarHistory = lazy(() => import("./pages/TheBarHistory"));
const TheBarLeaderboard = lazy(() => import("./pages/TheBarLeaderboard"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ChooseUsername = lazy(() => import("./pages/ChooseUsername"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const AdminWaitlist = lazy(() => import("./pages/AdminWaitlist"));
const AdminBar = lazy(() => import("./pages/AdminBar"));
const ApplicationTracker = lazy(() => import("./pages/ApplicationTracker"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
  </div>
);

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

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <VersionWatcher />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
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
              </Route>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/choose-username" element={<ChooseUsername />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
