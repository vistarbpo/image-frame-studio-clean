import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import RisalaFramePage from "./pages/risala";
import TaifRisalaFramePage from "./pages/taif-risala";
import Milad1FramePage from "./pages/milad1";
import HabibiDayFramePage from "./pages/habibi-day";
import SahityotsavFramePage from "./pages/sahityotsav";
import MakkahSahithyotsavFramePage from "./pages/makkah-sahithyotsav";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/risala" element={<RisalaFramePage />} />
              <Route path="/taif-risala" element={<TaifRisalaFramePage />} />
              <Route path="/milad1" element={<Milad1FramePage />} />
              <Route path="/habibi-day" element={<HabibiDayFramePage />} />
              <Route path="/sahityotsav" element={<SahityotsavFramePage />} />
              <Route path="/makkah-sahithyotsav" element={<MakkahSahithyotsavFramePage />} />
              {/* Redirect all unknown routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
