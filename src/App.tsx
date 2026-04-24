import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, toast } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Waitlist from "./pages/Waitlist";
import Directory from "./pages/Directory";
import Resources from "./pages/Resources";
import Playbook from "./pages/Playbook";
import Tools from "./pages/Tools";
import TheBar from "./pages/TheBar";
import AppHome from "./pages/AppHome";
import TheBarPreview from "./pages/TheBarPreview";
import TheBarBrowse from "./pages/TheBarBrowse";
import TheBarChallenge from "./pages/TheBarChallenge";
import TheBarHistory from "./pages/TheBarHistory";
import TheBarLeaderboard from "./pages/TheBarLeaderboard";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import ChooseUsername from "./pages/ChooseUsername";
import ProfileEdit from "./pages/ProfileEdit";
import PublicProfile from "./pages/PublicProfile";
import AdminWaitlist from "./pages/AdminWaitlist";
import AdminBar from "./pages/AdminBar";
import ApplicationTracker from "./pages/ApplicationTracker";
import NotFound from "./pages/NotFound";
import { useVersionCheck } from "@/hooks/useVersionCheck";

const queryClient = new QueryClient();

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
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/app" element={<AppHome />} />
              <Route path="/waitlist" element={<Waitlist />} />
              <Route path="/directory" element={<Directory />} />
              <Route path="/playbook" element={<Playbook />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/tools" element={<Tools />} />
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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
