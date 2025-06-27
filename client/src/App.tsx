import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import React, { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Home from "@/pages/home";
import Specialists from "@/pages/specialists";
import Chat from "@/pages/chat";
import NotFound from "@/pages/not-found";

const CrisisServices = React.lazy(() => import("@/pages/crisis-services"));
const Settings = React.lazy(() => import("@/pages/settings"));
const Notes = React.lazy(() => import("@/pages/notes"));
const Profile = React.lazy(() => import("@/pages/profile"));
const EmergencyContacts = React.lazy(() => import("@/pages/emergency-contacts"));
const Reminders = React.lazy(() => import("@/pages/reminders"));

function Router() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/specialists" component={Specialists} />
        <Route path="/crisis-services" component={CrisisServices} />
        <Route path="/emergency-contacts" component={EmergencyContacts} />
        <Route path="/chat/:id" component={Chat} />
        <Route path="/chat/new" component={Chat} />
        <Route path="/settings" component={Settings} />
        <Route path="/notes" component={Notes} />
        <Route path="/profile" component={Profile} />
        <Route path="/reminders" component={Reminders} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="mate-ui-theme">
      <ErrorBoundary>
        <div style={{
          position: 'relative', 
          minHeight: '100vh',
        }}>
          {/* Modern animated SVG blobs background */}
          <div className="modern-bg-blobs" aria-hidden="true">
            <svg width="100%" height="100%" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="300" cy="200" rx="340" ry="180" fill="#6366f1" fillOpacity="0.18">
                <animate attributeName="cx" values="300;400;300" dur="12s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="1200" cy="700" rx="320" ry="160" fill="#38bdf8" fillOpacity="0.13">
                <animate attributeName="cy" values="700;600;700" dur="14s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="900" cy="200" rx="200" ry="100" fill="#fbbf24" fillOpacity="0.10">
                <animate attributeName="cx" values="900;1000;900" dur="16s" repeatCount="indefinite" />
              </ellipse>
            </svg>
          </div>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </QueryClientProvider>
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
