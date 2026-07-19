import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RequireOnboarding } from "@/components/RequireOnboarding";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import OnboardingPage from "@/pages/onboarding";
import DashboardHome from "@/pages/dashboard/index";
import ContactsPage from "@/pages/dashboard/contacts";
import Contact360Page from "@/pages/dashboard/contact-360"; // Import the new Customer 360 View page
import QuotesPage from "@/pages/dashboard/quotes";
import QuoteFormPage from "@/pages/dashboard/quotes/form";
import JobsPage from "@/pages/dashboard/jobs";
import JobFormPage from "@/pages/dashboard/jobs/form";
import InvoicesPage from "@/pages/dashboard/invoices";
import NewInvoicePage from "@/pages/dashboard/invoices/new";
import ServicesPage from "@/pages/dashboard/services";
import SettingsPage from "@/pages/dashboard/settings";
import BusinessLandingPage from "@/pages/business-landing";
import PublicQuoteView from "@/pages/public-quote-view";
import PublicInvoiceView from "@/pages/public-invoice-view";
import PublicQuoteRequest from "@/pages/public-quote-request";
import NotFoundPage from "@/pages/not-found";
import { DashboardLayout } from "./components/DashboardLayout";
import VerifyEmail from "@/pages/verify-email";
import ResendVerification from "@/pages/resend-verification";
import RequestPasswordReset from "@/pages/request-password-reset";
import ResetPassword from "@/pages/reset-password";
// Import the new Insights page
import InsightsPage from "@/pages/dashboard/insights";
// Import the new WhatsApp analytics page
import WhatsAppAnalyticsPage from "@/pages/dashboard/whatsapp-analytics";
// Import the new WhatsApp debug page
import WhatsAppDebugPage from "@/pages/dashboard/whatsapp-debug";
// Import the new Calendar page
import CalendarPage from "@/pages/dashboard/calendar";
// Import the new Website Editor page
import WebsiteEditorPage from "@/pages/dashboard/website-editor";
import GbpDashboard from "@/pages/dashboard/gbp-dashboard";
import HelpCenterPage from "@/pages/help-center";
import HelpArticlePage from "@/pages/help-article";

// Import the new feature pages
import GetNoticedPage from "@/pages/features/get-noticed";
import WinJobsPage from "@/pages/features/win-jobs";
import WorkSmarterPage from "@/pages/features/work-smarter";
import BoostProfitsPage from "@/pages/features/boost-profits";
import PricingPage from "@/pages/pricing";
import SubscriptionSuccessPage from "@/pages/subscription-success";
import SubscriptionCancelledPage from "@/pages/subscription-cancelled";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsOfServicePage from "@/pages/terms-of-service";
import FAQPage from "@/pages/faq";

// Import the new industry pages
import PlumbingSoftwarePage from "./pages/industries/plumbing-software";
import CleaningSoftwarePage from "./pages/industries/cleaning-software";
import ElectricalSoftwarePage from "./pages/industries/electrical-software";
import HVACSoftwarePage from "./pages/industries/hvac-software";
import LandscapingSoftwarePage from "./pages/industries/landscaping-software";
import HandymanSoftwarePage from "./pages/industries/handyman-software";
import PaintingSoftwarePage from "./pages/industries/painting-software";
import RoofingSoftwarePage from "./pages/industries/roofing-software";
import ConstructionSoftwarePage from "./pages/industries/construction-software";
import PoolMaintenanceSoftwarePage from "./pages/industries/pool-maintenance-software";
import PestControlSoftwarePage from "./pages/industries/pest-control-software";

// Import the new Blog pages
import BlogHubPage from "@/pages/blog/index";
import BlogPostPage from "@/pages/blog/post";

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
      {/* SaaS Application Routes - MUST come before /:slug */}
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/resend-verification" component={ResendVerification} />
      <Route path="/request-password-reset" component={RequestPasswordReset} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/help" component={HelpCenterPage} />
      <Route path="/help/:category/:article" component={HelpArticlePage} />

      {/* Dashboard Routes - All wrapped with RequireOnboarding and DashboardLayout */}
      <Route path="/dashboard">
        <RequireOnboarding>
          <DashboardLayout>
            <DashboardHome />
          </DashboardLayout>
        </RequireOnboarding>
      </Route>
      <Route path="/dashboard/contacts" component={() => (
        <RequireOnboarding>
          <DashboardLayout>
            <ContactsPage />
          </DashboardLayout>
        </RequireOnboarding>
      )} />
      <Route path="/dashboard/contacts/:id" component={() => (
        <RequireOnboarding>
          <DashboardLayout>
            <Contact360Page />
          </DashboardLayout>
        </RequireOnboarding>
      )} />
      <Route path="/dashboard/quotes" component={() => (
            <RequireOnboarding>
              <DashboardLayout>
                <QuotesPage />
              </DashboardLayout>
            </RequireOnboarding>
          )} />
          <Route path="/dashboard/quotes/new" component={() => (
            <RequireOnboarding>
              <DashboardLayout>
                <QuoteFormPage />
              </DashboardLayout>
            </RequireOnboarding>
          )} />
          <Route path="/dashboard/quotes/:id/edit" component={() => (
            <RequireOnboarding>
              <DashboardLayout>
                <QuoteFormPage />
              </DashboardLayout>
            </RequireOnboarding>
          )} />
          <Route path="/dashboard/quotes/:id/view" component={() => (
            <RequireOnboarding>
              <DashboardLayout>
                <QuoteFormPage />
              </DashboardLayout>
            </RequireOnboarding>
          )} />
      <Route path="/dashboard/jobs">
        <RequireOnboarding>
          <DashboardLayout>
            <JobsPage />
          </DashboardLayout>
        </RequireOnboarding>
      </Route>
      <Route path="/dashboard/jobs/new" component={() => (
        <RequireOnboarding>
          <DashboardLayout>
            <JobFormPage />
          </DashboardLayout>
        </RequireOnboarding>
      )} />
      <Route path="/dashboard/jobs/:id/edit" component={() => (
        <RequireOnboarding>
          <DashboardLayout>
            <JobFormPage />
          </DashboardLayout>
        </RequireOnboarding>
      )} />
      <Route path="/dashboard/invoices">
        <RequireOnboarding>
          <DashboardLayout>
            <InvoicesPage />
          </DashboardLayout>
        </RequireOnboarding>
      </Route>
      <Route path="/dashboard/invoices/new" component={() => (
        <RequireOnboarding>
          <DashboardLayout>
            <NewInvoicePage />
          </DashboardLayout>
        </RequireOnboarding>
      )} />
      <Route path="/dashboard/invoices/:id/edit" component={() => (
        <RequireOnboarding>
          <DashboardLayout>
            <NewInvoicePage />
          </DashboardLayout>
        </RequireOnboarding>
      )} />
      <Route path="/dashboard/services">
        <RequireOnboarding>
          <DashboardLayout>
            <ServicesPage />
          </DashboardLayout>
        </RequireOnboarding>
      </Route>
      <Route path="/dashboard/settings">
        <RequireOnboarding>
          <DashboardLayout>
            <SettingsPage />
          </DashboardLayout>
        </RequireOnboarding>
      </Route>

      {/* Register Insights route */}
      <Route path="/dashboard/insights">
        <RequireOnboarding>
          <DashboardLayout>
            <InsightsPage />
          </DashboardLayout>
        </RequireOnboarding>
      </Route>
      {/* Register WhatsApp analytics route */}
      <Route path="/dashboard/whatsapp-analytics">
        <RequireOnboarding>
          <DashboardLayout>
            <WhatsAppAnalyticsPage />
          </DashboardLayout>
        </RequireOnboarding>
      </Route>
      {/* Register WhatsApp debug route */}
      <Route path="/dashboard/whatsapp-debug">
        <RequireOnboarding>
          <DashboardLayout>
            <WhatsAppDebugPage />
          </DashboardLayout>
        </RequireOnboarding>
      </Route>

      {/* Add calendar route */}
      <Route path="/dashboard/calendar">
        <RequireOnboarding>
          <DashboardLayout>
            <CalendarPage />
          </DashboardLayout>
        </RequireOnboarding>
      </Route>

      {/* Add website editor route */}
      <Route path="/dashboard/website-editor">
        <RequireOnboarding>
          <DashboardLayout>
            <WebsiteEditorPage />
          </DashboardLayout>
        </RequireOnboarding>
      </Route>

      {/* Google Business Profile Dashboard */}
      <Route path="/dashboard/settings/google-business">
        <RequireOnboarding>
          <DashboardLayout>
            <GbpDashboard />
          </DashboardLayout>
        </RequireOnboarding>
      </Route>

      {/* Public Quote View - Must come before /:slug */}
      <Route path="/quotes/:id/view" component={PublicQuoteView} />

      {/* Public Invoice View - Must come before /:slug */}
      <Route path="/invoices/:id/view" component={PublicInvoiceView} />

      {/* Public Quote Request - Must come before /:slug */}
      <Route path="/:slug/quote" component={PublicQuoteRequest} />

      {/* Pricing & Subscription Pages */}
      <Route path="/pricing" component={PricingPage} />
      <Route path="/subscription/success" component={SubscriptionSuccessPage} />
      <Route path="/subscription/cancelled" component={SubscriptionCancelledPage} />

      {/* Feature Category Pages */}
      <Route path="/features/get-noticed" component={GetNoticedPage} />
          <Route path="/features/win-jobs" component={WinJobsPage} />
          <Route path="/features/work-smarter" component={WorkSmarterPage} />
          <Route path="/features/boost-profits" component={BoostProfitsPage} />

          {/* Industry Pages */}
          <Route path="/industries/plumbing-software" component={PlumbingSoftwarePage} />
          <Route path="/industries/cleaning-software" component={CleaningSoftwarePage} />
          <Route path="/industries/electrical-software" component={ElectricalSoftwarePage} />
          <Route path="/industries/hvac-software" component={HVACSoftwarePage} />

      {/* FAQ Page */}
      <Route path="/faq" component={FAQPage} />

      {/* Legal Pages */}
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/terms-of-service" component={TermsOfServicePage} />

      {/* Blog Routes */}
      <Route path="/blog" component={BlogHubPage} />
      <Route path="/blog/:slug" component={BlogPostPage} />

      {/* Industry Pages */}
      <Route path="/industries/plumbing-software" component={PlumbingSoftwarePage} />
      <Route path="/industries/cleaning-software" component={CleaningSoftwarePage} />
      <Route path="/industries/electrical-software" component={ElectricalSoftwarePage} />
      <Route path="/industries/hvac-software" component={HVACSoftwarePage} />
      <Route path="/industries/landscaping-software" component={LandscapingSoftwarePage} />
      <Route path="/industries/handyman-software" component={HandymanSoftwarePage} />
      <Route path="/industries/painting-software" component={PaintingSoftwarePage} />
      <Route path="/industries/roofing-software" component={RoofingSoftwarePage} />
      <Route path="/industries/construction-software" component={ConstructionSoftwarePage} />
      <Route path="/industries/pool-maintenance-software" component={PoolMaintenanceSoftwarePage} />
      <Route path="/industries/pest-control-software" component={PestControlSoftwarePage} />

      {/* Customer-facing Business Landing Pages - MUST come last */}
      {/* Matches: /demo, /clive-glass, or any other business slug */}
      <Route path="/:slug">
        {(params) => <BusinessLandingPage params={params} />}
      </Route>

      {/* 404 - Never reached because /:slug catches everything */}
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