import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

// Placeholder components for other routes
const Executives = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Executives - Coming Soon</h1></div>;
const StudentLife = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Student Life - Coming Soon</h1></div>;
const Events = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Events - Coming Soon</h1></div>;
const Constitution = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Constitution - Coming Soon</h1></div>;
const Welfare = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Welfare Center - Coming Soon</h1></div>;
const Contact = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl">Contact - Coming Soon</h1></div>;

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/executives" element={<Executives />} />
          <Route path="/student-life" element={<StudentLife />} />
          <Route path="/events" element={<Events />} />
          <Route path="/constitution" element={<Constitution />} />
          <Route path="/welfare" element={<Welfare />} />
          <Route path="/contact" element={<Contact />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
