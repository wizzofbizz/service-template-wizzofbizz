
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  BookOpen, 
  Users, 
  FileText, 
  Calendar, 
  Receipt, 
  MessageSquare, 
  BarChart3,
  ChevronRight,
  Rocket,
  ArrowLeft,
  Orbit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { FeatureNavigation } from "@/components/FeatureNavigation";

const categories = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Set up your account and business profile",
    icon: Rocket,
    articles: [
      { id: "account-setup", title: "Creating Your Account", time: "3 min" },
      { id: "business-onboarding", title: "Business Profile Setup", time: "5 min" },
      { id: "adding-services", title: "Adding Your Services", time: "4 min" },
      { id: "business-hours", title: "Setting Business Hours", time: "2 min" },
    ]
  },
  {
    id: "customers",
    title: "Managing Customers",
    description: "Add, organize, and track customer information",
    icon: Users,
    articles: [
      { id: "add-contact", title: "Adding New Contacts", time: "3 min" },
      { id: "contact-types", title: "Lead vs Customer Status", time: "2 min" },
      { id: "contact-details", title: "Viewing Contact History", time: "3 min" },
      { id: "contact-search", title: "Searching & Filtering Contacts", time: "2 min" },
    ]
  },
  {
    id: "quotes",
    title: "Quotes & Estimates",
    description: "Create and send professional quotes",
    icon: FileText,
    articles: [
      { id: "create-quote", title: "Creating a Quote", time: "5 min" },
      { id: "quote-line-items", title: "Adding Line Items & Services", time: "3 min" },
      { id: "discounts-tax", title: "Discounts & Tax Calculation", time: "3 min" },
      { id: "send-quote", title: "Sending Quotes to Customers", time: "2 min" },
      { id: "quote-acceptance", title: "Quote Approval Process", time: "3 min" },
      { id: "deposit-quotes", title: "Requesting Deposits on Quotes", time: "4 min" },
    ]
  },
  {
    id: "jobs",
    title: "Jobs & Scheduling",
    description: "Schedule and manage your work",
    icon: Calendar,
    articles: [
      { id: "create-job", title: "Creating Jobs from Quotes", time: "3 min" },
      { id: "schedule-job", title: "Scheduling Appointments", time: "4 min" },
      { id: "calendar-view", title: "Using the Calendar", time: "3 min" },
      { id: "job-status", title: "Job Status & Workflow", time: "4 min" },
      { id: "complete-job", title: "Completing Jobs", time: "3 min" },
      { id: "job-notes", title: "Adding Job Notes & Photos", time: "2 min" },
    ]
  },
  {
    id: "invoicing",
    title: "Invoicing & Payments",
    description: "Get paid faster with automated invoicing",
    icon: Receipt,
    articles: [
      { id: "invoice-generation", title: "Invoice Creation & Generation", time: "3 min" },
      { id: "send-invoice", title: "Sending Invoices", time: "2 min" },
      { id: "deposit-invoices", title: "Deposit vs Final Invoices", time: "4 min" },
      { id: "payment-tracking", title: "Tracking Payment Status", time: "3 min" },
      { id: "payment-reminders", title: "Automated Payment Reminders", time: "3 min" },
      { id: "mark-paid", title: "Recording Manual Payments", time: "2 min" },
    ]
  },
  {
    id: "website",
    title: "Your Website",
    description: "Manage your online presence",
    icon: Orbit,
    articles: [
      { id: "website-editor", title: "Editing Your Website", time: "5 min" },
      { id: "website-sections", title: "Managing Website Sections", time: "4 min" },
      { id: "upload-images", title: "Uploading Images", time: "3 min" },
      { id: "quote-forms", title: "Quote Request Forms", time: "3 min" },
      { id: "custom-domain", title: "Connecting a Custom Domain", time: "6 min" },
    ]
  },
  {
    id: "communication",
    title: "Communication Tools",
    description: "Stay connected with customers",
    icon: MessageSquare,
    articles: [
      { id: "email-notifications", title: "Email Notifications", time: "3 min" },
      { id: "whatsapp-setup", title: "WhatsApp Integration Setup", time: "5 min" },
      { id: "whatsapp-messages", title: "Sending WhatsApp Messages", time: "3 min" },
      { id: "communication-history", title: "Viewing Communication History", time: "2 min" },
    ]
  },
  {
    id: "reports",
    title: "Reports & Insights",
    description: "Track your business performance",
    icon: BarChart3,
    articles: [
      { id: "dashboard-overview", title: "Understanding Your Dashboard", time: "4 min" },
      { id: "financial-insights", title: "Financial Insights & KPIs", time: "5 min" },
      { id: "quote-conversion", title: "Quote Conversion Rates", time: "3 min" },
      { id: "receivables", title: "Accounts Receivable Reports", time: "4 min" },
    ]
  },
];

export default function HelpCenterPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = categories.filter(cat => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      cat.title.toLowerCase().includes(query) ||
      cat.description.toLowerCase().includes(query) ||
      cat.articles.some(article => article.title.toLowerCase().includes(query))
    );
  });

  const selectedCategoryData = selectedCategory 
    ? categories.find(c => c.id === selectedCategory)
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <FeatureNavigation />

      {/* Hero Section */}
      <section className="bg-black text-white py-16 md:py-24">
        <div className="container mx-auto px-6 md:px-12 lg:px-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif' }}
            >
              How can we help you?
            </h1>
            <p 
              className="text-lg md:text-xl text-white/80 mb-8"
              style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400 }}
            >
              Find guides and answers to get the most out of ServiceLoop
            </p>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-white text-gray-900 border-0 text-base"
                style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 md:px-12 lg:px-20">
        {selectedCategoryData ? (
          // Category Detail View
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => setSelectedCategory(null)}
              className="mb-6 -ml-2 text-black hover:text-black/70"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to all topics
            </Button>

            <div className="mb-8">
              <h2 className="text-3xl font-normal mb-2">{selectedCategoryData.title}</h2>
              <p className="text-gray-600 font-light">{selectedCategoryData.description}</p>
            </div>

            <div className="space-y-0 border-t">
              {selectedCategoryData.articles.map((article) => (
                <div
                  key={article.id}
                  className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/help/${selectedCategoryData.id}/${article.id}`)}
                >
                  <div className="py-4 px-2 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-normal text-lg text-black hover:underline">{article.title}</h3>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Categories Grid View
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-normal mb-8">Browse by topic</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category) => (
                <Card
                  key={category.id}
                  className="hover:shadow-lg transition-all cursor-pointer border border-gray-200"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-black w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                        <category.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1">{category.title}</h3>
                        <p className="text-sm text-gray-600 mb-3 font-light">{category.description}</p>
                        <div className="text-xs text-gray-500">
                          {category.articles.length} articles
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No articles found matching your search.</p>
              </div>
            )}
          </div>
        )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
