import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Directory from "./pages/Directory";
import Resources from "./pages/Resources";
import Playbook from "./pages/Playbook";
import Tools from "./pages/Tools";
import TheBar from "./pages/TheBar";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import ChooseUsername from "./pages/ChooseUsername";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/directory" element={<Directory />} />
              <Route path="/playbook" element={<Playbook />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/the-bar" element={<TheBar />} />
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
