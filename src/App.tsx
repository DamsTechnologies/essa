import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Executives from "./pages/Executives";
import StudentLife from "./pages/StudentLife";
import Events from "./pages/Events";
import Constitution from "./pages/Constitution";
import Welfare from "./pages/Welfare";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ClubDetail from "./pages/ClubDetail";
import FashionContest from "./pages/FashionContest";
import ContestantDetail from "./pages/ContestantDetail";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import EventsHub from "./pages/EventsHub";
import EventDetail from "./pages/EventDetail";
import EventContestantDetail from "./pages/EventContestantDetail";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import CompetitionRedirect from "@/pages/CompetitionRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/executives" element={<Executives />} />
          <Route path="/student-life" element={<StudentLife />} />
          <Route path="/events" element={<Events />} />
          <Route path="/competition" element={<CompetitionRedirect />} />
          <Route path="/contestant/:slug" element={<CompetitionRedirect />} />
          <Route path="/events/fashion-contest" element={<Navigate to="/competition" replace />} />
          <Route path="/constitution" element={<Constitution />} />
          <Route path="/welfare" element={<Welfare />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/clubs/:slug" element={<ClubDetail />} />
          <Route path="/events-hub" element={<EventsHub />} />
          <Route path="/events-hub/:eventId" element={<EventDetail />} />
          <Route path="/events-hub/:eventId/contestant/:contestantSlug" element={<EventContestantDetail />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
