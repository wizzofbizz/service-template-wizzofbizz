import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "./components/DashboardLayout";
import { RequireAuth } from "./components/RequireAuth";
import { siteConfig } from "@/config/site";

// Public site (the client's own business website)
import BusinessLandingPage from "@/pages/business-landing";
import BookingRouter from "@/pages/booking-router";
import PublicQuoteView from "@/pages/public-quote-view";
import PublicInvoiceView from "@/pages/public-invoice-view";
import { PaymentSuccess, PaymentCancelled } from "@/pages/payment-result";
import NotFoundPage from "@/pages/not-found";

// Auth
import LoginPage from "@/pages/login";
import VerifyEmail from "@/pages/verify-email";
import ResendVerification from "@/pages/resend-verification";
import RequestPasswordReset from "@/pages/request-password-reset";
import ResetPassword from "@/pages/reset-password";

// Admin dashboard
import DashboardHome from "@/pages/dashboard/index";
import ContactsPage from "@/pages/dashboard/contacts";
import Contact360Page from "@/pages/dashboard/contact-360";
import QuotesPage from "@/pages/dashboard/quotes";
import QuoteFormPage from "@/pages/dashboard/quotes/form";
import JobsPage from "@/pages/dashboard/jobs";
import JobFormPage from "@/pages/dashboard/jobs/form";
import InvoicesPage from "@/pages/dashboard/invoices";
import NewInvoicePage from "@/pages/dashboard/invoices/new";
import ServicesPage from "@/pages/dashboard/services";
import SettingsPage from "@/pages/dashboard/settings";
import CalendarPage from "@/pages/dashboard/calendar";
import InsightsPage from "@/pages/dashboard/insights";
import WhatsAppAnalyticsPage from "@/pages/dashboard/whatsapp-analytics";

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

/** Wraps a dashboard page in the auth gate and shared admin chrome. */
function Admin({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <DashboardLayout>{children}</DashboardLayout>
    </RequireAuth>
  );
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        {/* Public site */}
        <Route path="/" component={BusinessLandingPage} />
        <Route path="/quote" component={BookingRouter} />
        <Route path="/book" component={BookingRouter} />
        <Route path="/quotes/:id/view" component={PublicQuoteView} />
        <Route path="/invoices/:id/view" component={PublicInvoiceView} />
        <Route path="/payment/success" component={PaymentSuccess} />
        <Route path="/payment/cancelled" component={PaymentCancelled} />

        {/* Auth */}
        <Route path="/login" component={LoginPage} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/resend-verification" component={ResendVerification} />
        <Route path="/request-password-reset" component={RequestPasswordReset} />
        <Route path="/reset-password" component={ResetPassword} />

        {/* Dashboard */}
        <Route path="/dashboard">
          <Admin><DashboardHome /></Admin>
        </Route>
        <Route path="/dashboard/contacts">
          <Admin><ContactsPage /></Admin>
        </Route>
        <Route path="/dashboard/contacts/:id">
          <Admin><Contact360Page /></Admin>
        </Route>
        {/* Quoting is skipped entirely in direct-booking mode. The routes are
            withheld too, not just the menu items, so a disabled section is not
            reachable by typing the URL. */}
        {siteConfig.bookingMode !== "direct" && (
          <>
            <Route path="/dashboard/quotes">
              <Admin><QuotesPage /></Admin>
            </Route>
            <Route path="/dashboard/quotes/new">
              <Admin><QuoteFormPage /></Admin>
            </Route>
            <Route path="/dashboard/quotes/:id/edit">
              <Admin><QuoteFormPage /></Admin>
            </Route>
            <Route path="/dashboard/quotes/:id/view">
              <Admin><QuoteFormPage /></Admin>
            </Route>
          </>
        )}
        <Route path="/dashboard/jobs">
          <Admin><JobsPage /></Admin>
        </Route>
        <Route path="/dashboard/jobs/new">
          <Admin><JobFormPage /></Admin>
        </Route>
        <Route path="/dashboard/jobs/:id/edit">
          <Admin><JobFormPage /></Admin>
        </Route>
        {siteConfig.features.invoicing && (
          <>
            <Route path="/dashboard/invoices">
              <Admin><InvoicesPage /></Admin>
            </Route>
            <Route path="/dashboard/invoices/new">
              <Admin><NewInvoicePage /></Admin>
            </Route>
          </>
        )}
        <Route path="/dashboard/calendar">
          <Admin><CalendarPage /></Admin>
        </Route>
        <Route path="/dashboard/services">
          <Admin><ServicesPage /></Admin>
        </Route>
        {siteConfig.features.insights && (
          <Route path="/dashboard/insights">
            <Admin><InsightsPage /></Admin>
          </Route>
        )}
        {siteConfig.features.whatsapp && (
          <Route path="/dashboard/whatsapp-analytics">
            <Admin><WhatsAppAnalyticsPage /></Admin>
          </Route>
        )}
        <Route path="/dashboard/settings">
          <Admin><SettingsPage /></Admin>
        </Route>

        {/* Reachable now that the /:slug tenant catch-all is gone */}
        <Route component={NotFoundPage} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
