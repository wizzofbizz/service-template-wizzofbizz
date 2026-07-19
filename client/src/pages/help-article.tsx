import { useRoute, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Clock, 
  ChevronRight,
  Lightbulb,
  AlertCircle
} from "lucide-react";

// Example article data structure
const articles: Record<string, any> = {
  "getting-started": {
    "account-setup": {
      title: "Creating Your Account",
      time: "3 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Navigate to the Sign Up Page",
          description: "Click the 'Get Started' button on the homepage or go directly to the registration page.",
          tips: ["Make sure you have your email address ready"]
        },
        {
          title: "Enter Your Email and Password",
          description: "Provide a valid email address and create a strong password (minimum 8 characters).",
          warnings: ["Password must be at least 8 characters long"]
        },
        {
          title: "Verify Your Email",
          description: "Check your email inbox for a verification link and click it to activate your account.",
          tips: ["Check your spam folder if you don't see the email within 5 minutes"]
        },
        {
          title: "Log In",
          description: "Return to the login page and enter your credentials to access your account.",
        }
      ],
      relatedArticles: [
        { id: "business-onboarding", title: "Business Profile Setup" },
        { id: "adding-services", title: "Adding Your Services" }
      ]
    },
    "business-onboarding": {
      title: "Business Profile Setup",
      time: "5 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Complete Business Information",
          description: "Enter your business name, industry, contact details, and physical address.",
          tips: ["Choose an industry that best matches your services for better templates"]
        },
        {
          title: "Set Your Business Slug",
          description: "Create a unique URL for your business website (e.g., yourcompany.example.com).",
          warnings: ["Slug can only contain lowercase letters, numbers, and hyphens"]
        },
        {
          title: "Configure Business Hours",
          description: "Set your working hours for each day of the week to control when customers can book appointments.",
        },
        {
          title: "Add Your Services",
          description: "Create your service catalog with pricing and descriptions for each service you offer.",
          tips: ["You can add more services later from the Settings page"]
        }
      ],
      relatedArticles: [
        { id: "adding-services", title: "Adding Your Services" },
        { id: "business-hours", title: "Setting Business Hours" }
      ]
    },
    "adding-services": {
      title: "Adding Your Services",
      time: "4 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Navigate to Services Page",
          description: "From your dashboard, click 'Services' in the main sidebar menu to access the service management area.",
        },
        {
          title: "Click 'New Service' Button",
          description: "In the top right corner of the Services page, click the '+ New Service' button to open the service creation dialog.",
        },
        {
          title: "Enter Service Name and Base Price",
          description: "Provide a descriptive name for your service (e.g., 'Window Repair', 'Emergency Plumbing') and set a base price in Rands (R). The base price is optional but recommended as a starting point for quotes.",
          tips: ["Use clear, customer-friendly names that describe what you do"]
        },
        {
          title: "Add Service Description",
          description: "Write a brief description of the service to help customers understand what's included. This will appear on your website and in quotes.",
          tips: ["Include key details like what's covered, typical duration, or any materials included"]
        },
        {
          title: "Choose an Industry Template (Optional)",
          description: "For new services, you can select from industry-specific templates (Plumbing, Photography, Tiling, Website, or Custom) that pre-configure pricing formulas and AI guidance for common service types.",
          tips: ["Templates provide smart defaults but can be customized to match your specific business needs"]
        },
        {
          title: "Configure AI Pricing (Advanced)",
          description: "Set up intelligent pricing by defining a pricing formula (e.g., 'base_price + (hours * hourly_rate) + (km * travel_rate)'), rule configuration JSON with variables like hourly_rate and travel_rate, and AI guidance prompts to help extract relevant information from customer requests.",
          tips: [
            "AI pricing automatically adjusts quotes based on job complexity, distance, and time required",
            "Use the 'Test Formula' button to verify your pricing calculations work correctly"
          ]
        },
        {
          title: "Add Customer Questions (Optional)",
          description: "Create custom questions to ask customers when they request quotes for this service. Questions can be text, number, or select (dropdown) types, and can be marked as required.",
          tips: [
            "Ask specific questions that help you provide accurate quotes (e.g., 'Property size in square meters', 'Type of flooring needed')",
            "Required questions ensure you get essential information before creating a quote"
          ]
        },
        {
          title: "Set Service Status",
          description: "Toggle the 'Service Active' switch to control whether this service appears in your catalog. Inactive services won't show on your website or be available for quotes.",
          warnings: ["Inactive services remain in your system but are hidden from customers"]
        },
        {
          title: "Save Your Service",
          description: "Click the 'Create Service' button to save your new service. It will immediately appear in your service catalog and be available for use in quotes.",
        }
      ],
      relatedArticles: [
        { id: "business-onboarding", title: "Business Profile Setup" },
        { id: "business-hours", title: "Setting Business Hours" }
      ]
    },
    "business-hours": {
      title: "Setting Business Hours",
      time: "2 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Access Settings Page",
          description: "Click 'Settings' in the sidebar menu to open your business settings dashboard.",
        },
        {
          title: "Locate Calendar & Availability Section",
          description: "Scroll down to the 'Calendar & Availability Settings' section where you'll find business hours configuration.",
        },
        {
          title: "Set Standard Operating Hours",
          description: "For each day of the week, set your opening and closing times. You can configure different hours for different days to match your actual availability.",
          tips: ["These hours control when customers can book appointments through your online booking system"]
        },
        {
          title: "Mark Days as Closed (Optional)",
          description: "Uncheck the 'Open' checkbox for any days when your business is closed (e.g., Sundays or public holidays). Customers won't be able to book appointments on closed days.",
        },
        {
          title: "Configure Booking Window",
          description: "Set how far in advance customers can book appointments (e.g., up to 30 days in advance) and the minimum notice period required (e.g., 24 hours before the appointment).",
          tips: ["Minimum notice prevents last-minute bookings that you may not be able to accommodate"]
        },
        {
          title: "Set Buffer Times",
          description: "Define buffer time between appointments to account for travel, setup, or cleanup. This ensures appointments aren't scheduled back-to-back without adequate transition time.",
          tips: ["A 30-minute buffer is common for mobile service businesses to allow for travel time"]
        },
        {
          title: "Save Your Changes",
          description: "Click the 'Save Settings' button at the bottom of the page to apply your business hours configuration.",
          warnings: ["Changes to business hours take effect immediately and will affect customer booking availability"]
        }
      ],
      relatedArticles: [
        { id: "business-onboarding", title: "Business Profile Setup" },
        { id: "adding-services", title: "Adding Your Services" }
      ]
    }
  },
  "customers": {
    "add-contact": {
      title: "Adding New Contacts",
      time: "3 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Navigate to Contacts Page",
          description: "Click 'Contacts' in the main sidebar menu.",
        },
        {
          title: "Click 'Add Contact' Button",
          description: "Look for the 'Add Contact' or '+ New Contact' button in the top right corner.",
        },
        {
          title: "Fill in Contact Details",
          description: "Enter the customer's full name (required), email, phone number, and address.",
          warnings: ["Full name is required. Email or phone is recommended for communication."]
        },
        {
          title: "Set Contact Type",
          description: "Choose whether this is a Lead (potential customer) or Customer (existing client).",
          tips: ["Start as Lead and it will automatically convert to Customer when they accept a quote"]
        },
        {
          title: "Add Optional Details",
          description: "Include lead source, WhatsApp opt-in status, and any initial notes.",
        },
        {
          title: "Save Contact",
          description: "Click 'Save' to add the contact to your database.",
        }
      ],
      relatedArticles: [
        { id: "contact-types", title: "Lead vs Customer Status" },
        { id: "contact-details", title: "Viewing Contact History" }
      ]
    },
    "contact-types": {
      title: "Lead vs Customer Status",
      time: "2 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Understanding Contact Types",
          description: "The system tracks three types of contacts: Lead (potential customers who haven't accepted a quote yet), Customer (active clients who have accepted at least one quote), and Past Customer (previous clients for historical tracking).",
          tips: ["Contact types help you organize and prioritize your sales and service efforts"]
        },
        {
          title: "Lead Status",
          description: "Leads are potential customers who have expressed interest in your services but haven't committed yet. They typically come from website quote requests, referrals, or direct inquiries. Leads are shown with a yellow badge in the system.",
          tips: [
            "Focus on converting leads to customers by following up promptly with quotes",
            "Track lead sources to understand which marketing channels work best for your business"
          ]
        },
        {
          title: "Customer Status",
          description: "Customers are active clients who have accepted at least one quote from you. The system automatically converts a Lead to Customer when they approve a quote. Customers are shown with a green badge.",
          tips: ["Customers represent your active client base and generate revenue for your business"]
        },
        {
          title: "Automatic Status Updates",
          description: "When a Lead accepts a quote, their contact type automatically changes to Customer. You don't need to manually update this—the system handles it based on quote acceptance.",
          warnings: ["Manual changes to contact type should be rare; trust the automatic workflow"]
        },
        {
          title: "Past Customer Status",
          description: "Past Customers are former clients you want to keep in your system for historical records. You can manually change a Customer to Past Customer if they're no longer active. Past Customers are shown with a gray badge.",
          tips: ["Keep past customers in your system—they may return in the future or provide referrals"]
        },
        {
          title: "Filtering by Contact Type",
          description: "On the Contacts page, use the 'Filter by type' dropdown to view only Leads, Customers, or Past Customers. This helps you focus on specific groups for targeted follow-ups or analysis.",
        },
        {
          title: "Conversion Rate Tracking",
          description: "The Contacts dashboard shows your conversion rate—the percentage of Leads that become Customers. A healthy conversion rate typically ranges from 20-40% depending on your industry.",
          tips: ["Monitor your conversion rate monthly to measure sales effectiveness"]
        }
      ],
      relatedArticles: [
        { id: "add-contact", title: "Adding New Contacts" },
        { id: "contact-search", title: "Searching & Filtering Contacts" }
      ]
    },
    "contact-details": {
      title: "Viewing Contact History",
      time: "3 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Access Contact Details",
          description: "From the Contacts page, click the 'eye' icon or the contact's name to view their complete profile and history. This opens a detailed 360-degree view of all interactions with this contact.",
        },
        {
          title: "Review Contact Information",
          description: "The contact details page shows all basic information including full name, email, phone number, physical address, contact type, lead source, and any notes you've added.",
          tips: ["Keep contact information up-to-date to ensure accurate communication and service delivery"]
        },
        {
          title: "View Activity Timeline",
          description: "The Activity History section displays a chronological timeline of all interactions with this contact, including when the contact was created, quotes sent, quotes accepted or declined, jobs scheduled and completed, invoices sent and paid, and any communication sent via email or WhatsApp.",
          tips: ["The timeline helps you quickly understand the complete customer journey and relationship history"]
        },
        {
          title: "Check Quote History",
          description: "See all quotes associated with this contact, including draft, sent, accepted, and declined quotes. Each quote shows the title, total amount, status, and date created.",
          tips: ["Review past quotes before creating new ones to maintain consistent pricing and understand customer preferences"]
        },
        {
          title: "Review Job History",
          description: "View all jobs linked to this contact, including scheduled, in-progress, completed, and cancelled jobs. Jobs show the service type, scheduled date, status, and associated quote or invoice.",
          tips: ["Job history helps you track service patterns and plan for recurring work"]
        },
        {
          title: "Monitor Invoice Status",
          description: "See all invoices for this contact with payment status (draft, sent, paid, overdue). Track outstanding balances and payment history to manage accounts receivable.",
          warnings: ["Follow up promptly on overdue invoices to maintain healthy cash flow"]
        },
        {
          title: "View Communication History",
          description: "The system logs all emails and WhatsApp messages sent to this contact, showing when messages were sent, delivery status, and message type (quote notification, appointment reminder, payment reminder, etc.).",
          tips: ["Communication history prevents duplicate messages and ensures consistent customer experience"]
        },
        {
          title: "Quick Actions from Contact Page",
          description: "From the contact details page, you can quickly create a new quote, schedule a job, send an invoice, edit contact information, or delete the contact (with confirmation).",
        }
      ],
      relatedArticles: [
        { id: "add-contact", title: "Adding New Contacts" },
        { id: "contact-types", title: "Lead vs Customer Status" }
      ]
    },
    "contact-search": {
      title: "Searching & Filtering Contacts",
      time: "2 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Using the Search Bar",
          description: "At the top of the Contacts page, use the search bar to find contacts by name, email, or phone number. The search updates results in real-time as you type, making it fast to locate any contact.",
          tips: ["Search works with partial matches—you don't need to type the complete name or email"]
        },
        {
          title: "Filter by Contact Type",
          description: "Use the 'Filter by type' dropdown to show only Leads, Customers, Past Customers, or All Types. This helps you focus on specific groups for targeted actions.",
          tips: [
            "Filter to 'Lead' to see all potential customers who need follow-up",
            "Filter to 'Customer' to review your active client base"
          ]
        },
        {
          title: "Filter by Lead Source",
          description: "The 'Filter by source' dropdown lets you view contacts from specific channels: Website (online quote requests), Referral (word-of-mouth), Google (search/ads), Direct (walk-ins or phone), or Other.",
          tips: ["Analyze which lead sources convert best to optimize your marketing spend"]
        },
        {
          title: "Combine Multiple Filters",
          description: "You can use search and both filters simultaneously. For example, search for 'John' while filtering for 'Lead' type and 'Website' source to find website leads named John.",
          tips: ["Combined filters help with targeted outreach and analysis"]
        },
        {
          title: "View Contact Statistics",
          description: "At the top of the Contacts page, dashboard cards show: Total This Month (new contacts added), New Leads (lead contacts this month), Conversion Rate (percentage of leads that became customers), and Lead Sources breakdown (pie chart of where contacts come from).",
          tips: ["Monitor these metrics monthly to track business growth and marketing effectiveness"]
        },
        {
          title: "Export and Bulk Actions",
          description: "While bulk export isn't currently available in the interface, you can view and manage contacts individually. Contact your administrator if you need to export your entire contact database.",
        },
        {
          title: "Mobile vs Desktop View",
          description: "On mobile devices, contacts display as cards with key information. On desktop, contacts appear in a detailed table with sortable columns. Both views support all search and filter functions.",
        }
      ],
      relatedArticles: [
        { id: "add-contact", title: "Adding New Contacts" },
        { id: "contact-types", title: "Lead vs Customer Status" },
        { id: "contact-details", title: "Viewing Contact History" }
      ]
    }
  },
  "reports": {
    "dashboard-overview": {
      title: "Understanding Dashboard Overview",
      time: "4 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Accessing the Dashboard",
          description: "When you log into your account, the Dashboard is the first page you see. It provides a high-level summary of your business performance and key metrics at a glance. Navigate to Dashboard → Home from the sidebar to return to this view at any time.",
        },
        {
          title: "Key Performance Indicators (KPIs)",
          description: "The top of the dashboard displays four primary KPI cards that track your most important business metrics: Total Revenue (all paid invoices this period), Outstanding (unpaid invoice amounts), Paid Invoices (count of successfully paid invoices), and Overdue (invoices past their due date). Each KPI card shows the current value, percentage change compared to the previous period, and a trend indicator (up/down arrow).",
          tips: [
            "Green upward arrows indicate positive trends for revenue and paid invoices",
            "Red downward arrows for outstanding and overdue amounts are actually good—they mean you're collecting payments",
            "Review KPIs daily to stay on top of your business health"
          ]
        },
        {
          title: "Understanding Trend Indicators",
          description: "Each KPI card includes a trend comparison showing percentage change versus the last period. The period is controlled by the time filter at the top right (7 days, 30 days, 90 days, or 1 year). For example, if you're viewing 'Last 30 days' and Total Revenue shows '+15%', that means revenue increased by 15% compared to the previous 30-day period.",
          tips: ["Use trend data to identify patterns—consistent growth is good, sudden drops need investigation"]
        },
        {
          title: "Receivables Summary Card",
          description: "The Receivables card shows who owes you money and how much. It displays: Total Clients Owing (number of customers with outstanding balances), Total Outstanding Balance (sum of all unpaid amounts), and Top 3 Clients Owing (your largest outstanding accounts). For each top client, you see their name, number of invoices, late amount, and total balance.",
          tips: [
            "Focus collection efforts on the top clients owing—they represent the most potential revenue",
            "Monitor the 'late amount' to identify customers who need payment reminders"
          ]
        },
        {
          title: "Projected Income Card",
          description: "This card forecasts upcoming cash flow based on invoice due dates. It shows three time horizons: Due in 7 Days (invoices due within the next week), Due in 30 Days (invoices due within the next month), and Due Today (invoices due on the current date). Each shows both the total amount and number of invoices. This helps you anticipate incoming cash and plan accordingly.",
          tips: [
            "Compare 'Due in 7 Days' to your upcoming expenses to ensure you have enough cash",
            "Follow up on 'Due Today' invoices immediately to accelerate payment"
          ]
        },
        {
          title: "Performance Metrics Breakdown",
          description: "Below projected income, you'll find four key performance indicators: Average Payment Time (how many days it typically takes customers to pay invoices—lower is better), Average Invoice Value (typical size of your invoices), Collection Rate (percentage of total invoices that have been paid—higher is better, aim for 90%+), and Overdue Ratio (percentage of outstanding invoices that are overdue—lower is better). Each metric includes a comparison to the previous period.",
          tips: [
            "If Average Payment Time is increasing, tighten payment terms or send earlier reminders",
            "High Collection Rate (90%+) indicates healthy cash flow management"
          ]
        },
        {
          title: "Aged Receivables Chart",
          description: "The Aged Receivables bar chart breaks down outstanding invoices by how overdue they are: 0-30 days (recently due, low concern), 31-60 days (needs follow-up), 61-90 days (urgent follow-up required), and 90+ days (critical, may require collection action). The chart uses color coding: green for 0-30 days, amber for 31-60, orange for 61-90, and red for 90+ days. Use this to prioritize collection efforts.",
          warnings: ["Invoices over 90 days old have a significantly lower chance of collection—act urgently on these"]
        },
        {
          title: "Top Overdue Clients List",
          description: "Next to the aged receivables chart, you'll see a list of the top 10 clients with overdue balances. For each client, the list shows: Client name, Invoice number, Days overdue, Amount owed, and Aging bucket badge (color-coded). Clients are sorted by amount owed (largest first). Use this to quickly identify who to contact for payment follow-up.",
          tips: [
            "Start your collection calls with the largest amounts first—they have the biggest impact",
            "Document all follow-up attempts in the customer's contact notes"
          ]
        },
        {
          title: "Lead Conversion Funnel",
          description: "The funnel visualization shows your sales pipeline from initial quote to final payment: Quotes Created (top of funnel—all quotes sent in the period), Jobs Created (quotes that converted to scheduled work), and Invoices Created (jobs that resulted in invoices). Each stage shows: Count (number of items), Value (total rand amount), Conversion Rate (percentage that moved to next stage), and Drop-off Rate (percentage that didn't convert). The overall conversion rate shows what percentage of quotes ultimately result in invoices.",
          tips: [
            "A healthy conversion rate from Quotes to Jobs is 30-50%",
            "High drop-off rates indicate you need to improve quote quality or follow-up",
            "Track your funnel weekly to spot conversion trends early"
          ]
        },
        {
          title: "Lead Conversion Timing Metrics",
          description: "Two timing cards show how long your sales cycle takes: Time to Accept Quote (average days from quote creation to customer acceptance—faster is better, aim for under 7 days), and Quote-to-Invoice Cycle (average days from quote creation to invoice generation—tracks your complete delivery cycle). Both metrics show percentage change versus the previous period. Shorter cycles mean faster cash flow and more agile operations.",
          tips: [
            "If Time to Accept Quote is increasing, your quotes may be too complex or prices too high",
            "Long Quote-to-Invoice cycles may indicate scheduling or delivery issues"
          ]
        },
        {
          title: "Using the Time Period Filter",
          description: "At the top right of the dashboard, you'll find a time period selector with options: Last 7 days (weekly performance snapshot), Last 30 days (monthly view—most common), Last 90 days (quarterly trends), and Last year (annual performance). Changing the period updates all dashboard metrics and comparisons. The comparison period is always the same length immediately before your selected range.",
          tips: ["Use 30 days for regular business reviews, 90 days for trend analysis, and 7 days for rapid issue detection"]
        },
        {
          title: "Export Dashboard Data",
          description: "Click the 'Export' button at the top right to download dashboard data as a CSV file for external analysis or record-keeping. The export includes all KPIs, receivables data, and funnel metrics for the selected time period. Use this for: Monthly reports to business partners, Financial planning and forecasting, Tax preparation and accounting, or Historical trend analysis in spreadsheet software.",
          tips: ["Export monthly data on the last day of each month to maintain historical records"]
        },
        {
          title: "Dashboard Best Practices",
          description: "To get maximum value from your dashboard: Review it daily (first thing each morning to plan your day), Focus on trends (single data points are less useful than patterns over time), Set targets (know what 'good' looks like for your business—e.g., 'Collection Rate above 85%'), Take action (dashboard insights only help if you act on them—follow up on overdue invoices, improve low conversion rates), and Compare periods (always look at month-over-month or week-over-week changes to spot issues early).",
        }
      ],
      relatedArticles: [
        { id: "financial-insights", title: "Understanding Financial Insights" },
        { id: "quote-conversion", title: "Analyzing Quote Conversion Rates" },
        { id: "receivables", title: "Managing Receivables Effectively" }
      ]
    },
    "financial-insights": {
      title: "Understanding Financial Insights",
      time: "6 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Accessing Financial Insights",
          description: "Navigate to Dashboard → Insights from the sidebar menu. This dedicated page provides deep financial analysis beyond the main dashboard overview. Financial Insights help you understand revenue patterns, cash flow trends, payment methods, and profitability.",
        },
        {
          title: "Financial Overview KPIs",
          description: "At the top of the Insights page, four key financial metrics provide a snapshot of your business health: Total Revenue (all income from paid invoices—tracked over your selected time period), Outstanding (money owed to you but not yet collected), Paid Invoices (count of invoices successfully paid), and Overdue (amount past due date—requires immediate attention). Each metric shows the current value, percentage change versus the previous period, and a trend indicator.",
          tips: [
            "Total Revenue trending up indicates business growth",
            "Outstanding should be monitored weekly—high amounts tie up cash flow",
            "Overdue amounts over 10% of outstanding indicate collection problems"
          ]
        },
        {
          title: "Revenue Timeline Chart",
          description: "The Revenue Timeline displays monthly revenue and estimated expenses over the selected period (default: last 90 days). Revenue (blue line/bars) shows income from paid invoices each month. Expenses (red line/bars) are estimated at 40% of job totals for that month. The chart helps you visualize: Seasonal revenue patterns, Monthly profitability (revenue minus expenses), and Growth trends over time.",
          tips: [
            "Look for seasonal patterns—some months may naturally be slower",
            "If expenses consistently exceed 40% of revenue, review your cost structure",
            "Use historical data to forecast future months and plan cash reserves"
          ]
        },
        {
          title: "Payment Method Distribution",
          description: "This chart breaks down how customers are paying you: Cash (physical cash payments), Card (credit/debit card transactions), Bank Transfer (electronic funds transfer/EFT), and Other (alternative payment methods). For each method, you see: Total value received via that method, Number of transactions, and Percentage of total payments. Understanding payment preferences helps you optimize your payment collection.",
          tips: [
            "If most customers prefer bank transfer, ensure your details are clearly stated on invoices",
            "High cash payments may indicate opportunities to offer card payment for faster processing",
            "Diversifying payment methods reduces friction and speeds up collection"
          ]
        },
        {
          title: "Cashflow Trend Analysis",
          description: "The Cashflow Trend chart shows cumulative cash flow (running total) over the selected period. It displays day-by-day or week-by-week (depending on period length) how your cash position changes. Upward trends indicate positive cash flow (more money coming in than going out). Plateaus suggest no new payments during that period. Sharp increases show large payment receipts. This visual helps identify cash flow problems before they become critical.",
          warnings: ["Downward trends or extended plateaus indicate you need to accelerate collections or reduce expenses"]
        },
        {
          title: "Receivables Deep Dive",
          description: "The Receivables section provides detailed analysis of outstanding amounts: Total Outstanding (sum of all unpaid invoices), Total Clients Owing (number of customers with balances), and Top Clients Owing (detailed breakdown of your largest outstanding accounts). For each top client, you see: Client name and contact details, Total balance owed, Late amount (overdue portion), and Number of outstanding invoices. This helps you prioritize collection efforts for maximum impact.",
          tips: [
            "Focus on the top 3-5 clients—they often represent 70-80% of total receivables",
            "Clients with multiple outstanding invoices may need payment plan discussions"
          ]
        },
        {
          title: "Projected Income Forecasting",
          description: "The Projected Income section forecasts cash flow based on invoice due dates: Due Today (invoices due on current date—should be collected immediately), Due Next 7 Days (short-term cash flow—plan for this week's expenses), and Due Next 30 Days (medium-term forecast—useful for monthly planning). Each category shows both total amount expected and number of invoices. Use these forecasts to: Plan large purchases or investments, Ensure you have cash to cover payroll and bills, Identify weeks with low expected income (tighten spending), and Anticipate cash surpluses (plan for growth investments).",
          tips: [
            "Compare 'Due Next 7 Days' to your weekly expenses to avoid cash shortfalls",
            "If forecasted income is low, accelerate collection efforts or delay non-urgent spending"
          ]
        },
        {
          title: "Key Performance Metrics Grid",
          description: "Below projected income, a grid of performance metrics provides operational insights: Average Payment Time (how long customers take to pay—measured in days from invoice to payment), Average Invoice Value (typical size of your invoices—helps with pricing strategy), Collection Rate (percentage of total invoiced amount that's been collected—aim for 90%+), and Overdue Ratio (percentage of outstanding invoices that are overdue—lower is better). Each metric includes a comparison to the previous period showing whether performance is improving or declining.",
          tips: [
            "Track Average Payment Time weekly—if it's increasing, send reminders earlier or adjust payment terms",
            "Low Collection Rate (below 80%) indicates you need better follow-up processes",
            "High Overdue Ratio suggests customers don't respect your payment terms"
          ]
        },
        {
          title: "Aged Receivables Breakdown",
          description: "The Aged Receivables section categorizes outstanding invoices by how overdue they are: 0-30 days (current or recently due—low collection risk), 31-60 days (needs attention—send first reminder), 61-90 days (urgent—requires phone follow-up), and 90+ days (critical—may need collection agency or write-off). Each bucket shows: Total amount in that category, Number of invoices, and Specific clients and invoice numbers. Use the color-coded bar chart to quickly assess your receivables health—green (0-30 days) is healthy, red (90+ days) needs immediate action.",
          warnings: [
            "Invoices over 90 days old have less than 30% chance of collection",
            "Move quickly on 61-90 day invoices before they become uncollectible"
          ]
        },
        {
          title: "Lead Conversion Funnel Analysis",
          description: "The Lead Funnel visualization tracks your sales pipeline through three stages: Quotes Created (all quotes sent in the selected period), Jobs Created (quotes accepted and converted to scheduled work), and Invoices Created (jobs completed and invoiced). For each stage, you see: Count (number of items), Total Value (sum of amounts), Conversion Rate (% moving to next stage), Drop-off Rate (% lost at this stage), and Average Time in Stage (days spent before converting or dropping off). The overall conversion rate shows end-to-end efficiency from quote to invoice.",
          tips: [
            "Healthy Quote-to-Job conversion: 30-50%",
            "Healthy Job-to-Invoice conversion: 90%+ (most jobs should result in invoices)",
            "If conversion rates are low, improve quote quality, follow-up speed, or pricing"
          ]
        },
        {
          title: "Conversion Timing Insights",
          description: "Two critical timing metrics measure your sales cycle speed: Time to Accept Quote (average days from quote creation to customer acceptance—measures sales velocity), and Quote-to-Invoice Cycle (average days from quote to invoice—measures full delivery cycle including work completion). Both show: Average days, Total conversions counted, and Percentage change versus previous period. Shorter cycles mean: Faster cash flow (money comes in sooner), Better customer satisfaction (quick turnaround), More jobs completed per month (higher revenue potential), and Improved working capital (less money tied up in work-in-progress).",
          tips: [
            "Aim for Time to Accept Quote under 7 days—faster means customers are eager",
            "If Quote-to-Invoice is increasing, you may have scheduling or delivery bottlenecks"
          ]
        },
        {
          title: "Using Time Period Filters",
          description: "The time period selector at the top right controls all Insights data. Options include: Last 7 days (weekly snapshot for rapid monitoring), Last 30 days (monthly view—most commonly used for business reviews), Last 90 days (quarterly trends for strategic planning), and Last year (annual performance for tax and planning). When you change the period: All charts and metrics update immediately, Comparisons are always to the equal previous period, Trends show percentage changes for the selected timeframe. Use different periods for different purposes—7 days for daily operations, 30 days for monthly reviews, 90 days for trend analysis.",
        },
        {
          title: "Exporting Insights Data",
          description: "Click the 'Export' button to download all Insights data as a CSV file. The export includes: All KPI metrics and trends, Revenue and expense data (monthly breakdown), Payment method distribution, Aged receivables details, Funnel conversion data, and Timing metrics. Use exported data for: Monthly board or partner reports, Financial planning and budgeting, Tax preparation and accounting reconciliation, Historical analysis in Excel or Google Sheets, or Comparison with industry benchmarks.",
          tips: ["Export data monthly and archive for year-end tax preparation and performance reviews"]
        },
        {
          title: "Insights Best Practices",
          description: "To maximize the value of Financial Insights: Review Weekly (dedicate 30 minutes every Monday to review the previous week's performance), Set Benchmarks (define what 'good' looks like for each metric based on your industry and goals), Track Trends (focus on changes over time, not absolute numbers), Take Action (insights are only valuable if you act on them—address declining trends immediately), Compare to Budget (if you have a budget, compare actual to planned performance monthly), and Share with Team (if you have staff, share relevant metrics to align everyone on business goals).",
        }
      ],
      relatedArticles: [
        { id: "dashboard-overview", title: "Understanding Dashboard Overview" },
        { id: "quote-conversion", title: "Analyzing Quote Conversion Rates" },
        { id: "receivables", title: "Managing Receivables Effectively" }
      ]
    },
    "quote-conversion": {
      title: "Analyzing Quote Conversion Rates",
      time: "5 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Understanding Quote Conversion",
          description: "Quote conversion rate is the percentage of quotes you send that result in actual work and revenue. It's one of the most important sales metrics for service businesses. High conversion rates (40%+) indicate: Accurate pricing that customers find fair, Effective sales communication, Good targeting (you're quoting the right customers), and Competitive positioning in your market. Low conversion rates (below 20%) suggest: Pricing may be too high, Quotes lack clarity or professionalism, Long response times losing customers to competitors, or Poor qualification (quoting customers who aren't serious).",
          tips: ["Industry average quote conversion for service businesses is 25-35%—aim to beat this"]
        },
        {
          title: "Accessing Conversion Metrics",
          description: "Quote conversion data appears in two main locations: Dashboard → Home (Lead Conversion Funnel section showing overall pipeline), and Dashboard → Insights (detailed funnel analysis with breakdown by stage). The funnel visualization shows three stages: Quotes Created (top of funnel), Jobs Created (middle—accepted quotes converted to scheduled work), and Invoices Created (bottom—completed jobs that generated invoices). Conversion rates are calculated between each stage.",
          tips: ["Review conversion funnel weekly to spot trends early"]
        },
        {
          title: "Calculating Conversion Rates",
          description: "The system calculates conversion rates automatically using these formulas: Quote-to-Job Conversion = (Jobs Created ÷ Quotes Created) × 100, Job-to-Invoice Conversion = (Invoices Created ÷ Jobs Created) × 100, and Overall Conversion = (Invoices Created ÷ Quotes Created) × 100. For example: If you sent 100 quotes this month, 40 became jobs (40% Quote-to-Job conversion), 35 of those jobs were completed and invoiced (87.5% Job-to-Invoice conversion), then your overall conversion is 35 ÷ 100 = 35%.",
          tips: ["Overall conversion is the most important metric—it measures end-to-end sales effectiveness"]
        },
        {
          title: "Interpreting Drop-Off Rates",
          description: "Drop-off rate is the inverse of conversion—it shows what percentage didn't move to the next stage. Drop-off at Quote-to-Job Stage (quotes that weren't accepted) can be due to: Price too high relative to competitors, Customer chose not to proceed with work, Customer found another provider, Quote response too slow (customer moved on), or Quote lacked clarity or professionalism. Drop-off at Job-to-Invoice Stage (jobs that didn't result in invoices) can be due to: Job was cancelled before completion, Work is still in progress (not yet completed), Scheduling conflicts or delays, or Customer dispute or dissatisfaction. High drop-off rates highlight where to focus improvement efforts.",
          warnings: ["Drop-off above 70% at any stage indicates serious issues requiring immediate attention"]
        },
        {
          title: "Analyzing Conversion by Time Period",
          description: "Use the time period filter (7 days, 30 days, 90 days, year) to analyze conversion trends: Short periods (7 days) show recent performance and immediate issues, Medium periods (30 days) reveal monthly patterns and seasonal changes, Long periods (90 days, year) show overall trends and strategic performance. Compare conversion rates across periods: Is conversion improving or declining month-over-month? Are there seasonal patterns (e.g., lower conversion in summer)? Do conversion spikes correlate with marketing campaigns or price changes?",
          tips: [
            "Track conversion monthly and document the percentage—aim for consistent improvement",
            "Seasonal businesses should compare same month year-over-year, not month-to-month"
          ]
        },
        {
          title: "Time-to-Convert Metrics",
          description: "In the Insights page, two timing metrics measure how quickly quotes convert: Time to Accept Quote (average days from quote creation to customer acceptance), and Quote-to-Invoice Cycle (average days from quote to completed job and invoice). Faster conversion times indicate: Customers are eager and ready to buy, Your quotes are compelling and clear, Minimal price shopping or hesitation, and Efficient scheduling and delivery. Longer times may suggest: Customers are comparing multiple quotes, Price sensitivity or budget constraints, Complex decision-making process, or Your scheduling availability is limited.",
          tips: [
            "Aim for Time to Accept Quote under 5 days—faster means strong sales process",
            "Follow up within 24-48 hours if customer hasn't accepted to maintain momentum"
          ]
        },
        {
          title: "Conversion Rate Benchmarks",
          description: "Compare your conversion rates to these industry benchmarks: Quote-to-Job Conversion (Excellent: 50%+, Good: 30-50%, Average: 20-30%, Poor: Below 20%), Job-to-Invoice Conversion (Excellent: 95%+, Good: 85-95%, Average: 75-85%, Poor: Below 75%), and Overall Conversion (Excellent: 40%+, Good: 25-40%, Average: 15-25%, Poor: Below 15%). If you're below 'Average' in any category, focus improvement efforts there. If you're consistently 'Excellent', you may have room to increase prices.",
          tips: ["Set quarterly conversion goals and track progress weekly"]
        },
        {
          title: "Improving Quote-to-Job Conversion",
          description: "If Quote-to-Job conversion is low, try these strategies: Respond Faster (send quotes within 24 hours of request—speed wins), Improve Quote Quality (use detailed line items, professional formatting, clear terms), Add Social Proof (include customer testimonials in quotes), Competitive Pricing (research competitor prices and ensure you're in range), Follow Up (contact customers 2-3 days after sending quote if no response), Simplify Acceptance (make it easy to say yes—clear 'Accept' button, online payment), and Qualify Better (only quote customers who are serious and have budget). Track which changes improve conversion and double down on what works.",
          tips: ["A/B test different quote formats or pricing strategies to find what converts best"]
        },
        {
          title: "Improving Job-to-Invoice Conversion",
          description: "If Job-to-Invoice conversion is low (jobs not resulting in invoices), focus on: Reduce Cancellations (confirm appointments 1-2 days before, be punctual and professional), Complete Jobs Promptly (don't let work drag on indefinitely—finish what you start), Improve Scheduling (avoid overbooking or gaps that delay job completion), Quality Control (ensure work quality meets customer expectations to avoid disputes), and Invoice Immediately (generate invoices as soon as jobs are complete—same day). This conversion rate should be 90%+ in a healthy business.",
          warnings: ["Job-to-Invoice below 80% suggests operational problems—investigate cancelled jobs for patterns"]
        },
        {
          title: "Conversion Value Analysis",
          description: "Beyond conversion rates, analyze the value of converted quotes: Average Accepted Quote Value (total value of accepted quotes ÷ number accepted), Average Declined Quote Value (total value of declined quotes ÷ number declined), and Value Conversion Rate (total invoiced amount ÷ total quoted amount × 100). If you're losing high-value quotes but winning low-value ones, you may have a pricing credibility issue for larger jobs. If value conversion is significantly below count conversion, you're discounting too heavily or losing scope during delivery.",
          tips: ["Focus on winning higher-value quotes—they have more impact on revenue than high volume of small quotes"]
        },
        {
          title: "Using Conversion Data for Pricing",
          description: "Conversion rates provide valuable pricing intelligence: Very High Conversion (60%+) may indicate you're priced too low—test small price increases, Healthy Conversion (30-50%) suggests good price/value balance—maintain current strategy, Low Conversion (below 20%) may mean you're too expensive—review competitor pricing or improve value proposition. Track conversion after price changes: If conversion drops significantly after a price increase, you may have overshot, If conversion stays stable after price increase, you found room for margin improvement, If conversion improves after price decrease, you were previously overpriced.",
          tips: ["Make pricing changes gradually (5-10% at a time) and track conversion impact for 30 days"]
        },
        {
          title: "Funnel Optimization Workflow",
          description: "Use this systematic approach to improve conversion: 1. Identify Weakest Stage (which stage has lowest conversion or highest drop-off?), 2. Investigate Root Causes (review declined quotes, talk to customers, analyze patterns), 3. Test Improvements (implement one change at a time so you know what works), 4. Measure Results (track conversion for 30 days after change), 5. Iterate (keep what works, discard what doesn't, test next improvement), 6. Document Learnings (build a playbook of what improves conversion for your business). Repeat this cycle monthly for continuous improvement.",
        }
      ],
      relatedArticles: [
        { id: "financial-insights", title: "Understanding Financial Insights" },
        { id: "dashboard-overview", title: "Understanding Dashboard Overview" },
        { id: "receivables", title: "Managing Receivables Effectively" }
      ]
    },
    "receivables": {
      title: "Managing Receivables Effectively",
      time: "7 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Understanding Receivables",
          description: "Receivables (also called 'accounts receivable' or 'outstanding invoices') are amounts customers owe you for work completed but not yet paid. Effective receivables management is critical for healthy cash flow. Poor receivables management leads to: Cash flow problems (not enough money to pay bills), Increased borrowing costs (needing credit to cover gaps), Reduced profitability (time spent chasing payments instead of earning), and Higher bad debt (some old receivables become uncollectible). Good receivables management ensures: Predictable cash flow, Minimal bad debt, More time for revenue-generating activities, and Better customer relationships (proactive vs reactive communication).",
          tips: ["Aim to keep outstanding receivables under 30 days on average"]
        },
        {
          title: "Accessing Receivables Data",
          description: "Receivables information appears in multiple locations: Dashboard → Home (Receivables card showing total outstanding and top clients), Dashboard → Insights (detailed receivables analysis with aging breakdown), Dashboard → Invoices (full list of outstanding invoices with status and due dates). Each view provides different insights: Home dashboard for daily at-a-glance monitoring, Insights for deep analysis and trend tracking, Invoices page for detailed invoice-by-invoice management.",
          tips: ["Check receivables daily on the main dashboard, do deep analysis weekly on Insights page"]
        },
        {
          title: "Total Outstanding Amount",
          description: "Total Outstanding is the sum of all unpaid invoices (status: 'sent' or 'overdue'). This number appears prominently on both the Dashboard and Insights pages. Track this metric daily because it represents: Cash that should be in your bank but isn't, Work you've completed but haven't been paid for, Your working capital tied up in receivables. Healthy businesses keep outstanding receivables below 20-30% of monthly revenue. If outstanding exceeds 50% of monthly revenue, you have a collection problem requiring immediate attention.",
          warnings: ["High outstanding amounts can lead to cash flow crises—monitor this number closely"]
        },
        {
          title: "Number of Clients Owing",
          description: "This metric shows how many different customers have outstanding balances. More clients owing isn't necessarily bad—it depends on amounts and ages. Analyze the relationship: Few clients with large amounts (concentrated risk—if one doesn't pay, it's a big hit), or Many clients with small amounts (diversified risk but more follow-up work required). Use the 'Top Clients Owing' list to identify your largest receivables risks and prioritize collection efforts.",
          tips: ["Focus collection efforts on the top 20% of clients owing—they usually represent 80% of total receivables"]
        },
        {
          title: "Understanding Aged Receivables",
          description: "Aged receivables categorize outstanding invoices by how long they've been overdue: 0-30 days (Current - recently due, low risk, normal follow-up), 31-60 days (Slightly Overdue - requires first reminder and phone follow-up), 61-90 days (Seriously Overdue - urgent attention, may require payment plan discussion), 90+ days (Severely Overdue - high risk of non-payment, consider collection agency or write-off). The aging buckets are color-coded: Green (0-30) = healthy, Amber (31-60) = attention needed, Orange (61-90) = urgent, Red (90+) = critical.",
          warnings: [
            "Invoices over 90 days have less than 30% chance of collection",
            "Act aggressively on 31-60 day invoices before they become uncollectible"
          ]
        },
        {
          title: "Aged Receivables Chart Analysis",
          description: "The Aged Receivables bar chart (in Insights) shows the distribution of your outstanding amounts across aging buckets. A healthy receivables profile looks like: 70-80% in 0-30 days bucket (most outstanding is recent), 15-20% in 31-60 days bucket (some normal delays), 5-10% in 61-90 days bucket (minimal seriously overdue), 0-5% in 90+ days bucket (almost no bad debt risk). If your chart is inverted (more in 60+ day buckets), you have a serious collection problem requiring immediate process changes.",
        },
        {
          title: "Top Clients Owing List",
          description: "The Top Clients Owing section lists your largest outstanding accounts, showing: Client name, Total balance owed, Late amount (portion that's overdue), Number of outstanding invoices. Clients are sorted by total balance (largest first). Use this list to: Prioritize collection calls (start with biggest amounts for maximum impact), Identify problem clients (multiple invoices or large late amounts), Plan cash flow (when will these large amounts likely come in?), Assess credit risk (should you require deposits from these clients in future?).",
          tips: [
            "Contact top 3 clients owing at least weekly until balances are paid",
            "Document all collection conversations in customer notes for legal protection"
          ]
        },
        {
          title: "Client-Specific Receivables Details",
          description: "Click any invoice number in the Aged Receivables list to see specific details: Full invoice with line items and amounts, Original due date and days overdue, Payment history and reminders sent, Customer contact information and communication history. Use this detailed view to: Prepare for collection calls (know exactly what's owed and when), Identify invoice disputes (customer may have questioned a charge), Verify invoice was actually received (check communication log), Plan follow-up strategy (what's been tried, what's next).",
        },
        {
          title: "Collection Best Practices",
          description: "Follow these proven strategies for effective receivables management: Send Invoices Immediately (invoice the day work is complete, not weeks later), Set Clear Payment Terms (NET 30 days maximum, consider NET 15 or NET 7 for faster payment), Send Automated Reminders (3-day, 7-day, 14-day after due date using system automation), Personal Follow-Up (phone call for amounts over R5,000 or 30+ days overdue), Offer Multiple Payment Methods (make it easy to pay—card, EFT, cash), Payment Plans (for large amounts, offer structured payment rather than lose it all), Stop Work for Non-Payers (don't do more work for customers with overdue balances), and Document Everything (keep records of all payment promises and conversations).",
          tips: ["80% of receivables collection success comes from speed—act immediately when invoices become overdue"]
        },
        {
          title: "Setting Up Automated Reminders",
          description: "Configure automatic payment reminders in Dashboard → Settings → Payment Reminders. Set reminder schedule (recommended: 3, 7, 14 days after due date), customize reminder messages (polite but firm tone), choose communication channels (email and WhatsApp for maximum visibility). Automated reminders: Ensure no invoice is forgotten, Maintain consistent professional communication, Free your time from manual follow-up, Normalize payment expectations with customers. Most customers pay within 7 days of the first reminder if it's sent promptly.",
          tips: ["Test your reminder emails by sending to yourself first to ensure professional appearance"]
        },
        {
          title: "Manual Collection Strategies",
          description: "For invoices that don't respond to automated reminders (30+ days overdue or large amounts), use these manual techniques: Personal Phone Call (more effective than email—call the customer directly), Ask for Commitment ('When can I expect payment?' not 'Can you pay?'), Offer Payment Plans (half now, half in 30 days—get something rather than nothing), Understand Objections (is there a legitimate dispute? resolve it immediately), Escalate Professionally ('I'll need to pause future work until this is settled'), Follow Up in Writing (email summary of phone conversation and agreed payment date), and Set Consequences ('Payment by Friday or account goes to collections').",
          warnings: ["Always remain professional and courteous—aggressive tactics damage reputation and rarely work"]
        },
        {
          title: "Receivables KPIs to Track",
          description: "Monitor these key performance indicators weekly: Days Sales Outstanding (DSO = Average Receivables ÷ Average Daily Sales—measures how long it takes to collect, aim for under 45 days), Collection Effectiveness (Money Collected ÷ Total Receivables × 100—aim for 90%+), Bad Debt Ratio (Written-Off Amount ÷ Total Revenue × 100—aim for under 2%), Aging Percentage (Amount Over 60 Days ÷ Total Receivables × 100—aim for under 15%). Track these monthly and graph trends to spot deteriorating collection performance early.",
        },
        {
          title: "Preventing Receivables Problems",
          description: "Prevention is easier than collection. Implement these practices: Screen New Customers (check references, search online reviews before extending credit), Require Deposits (30-50% upfront for new customers or large jobs), Shorter Payment Terms (NET 15 instead of NET 30 reduces collection time), Credit Limits (set maximum outstanding per customer before requiring payment), Payment on Completion (for small jobs, collect when work is done, not later), Clear Invoices (itemized, professional, easy to understand what's owed), Friendly Reminders (courtesy reminder 3 days before due date prevents forgetting).",
          tips: ["The best receivables management is never having receivables—collect payment immediately when possible"]
        },
        {
          title: "When to Write Off Bad Debt",
          description: "Eventually, some invoices become uncollectible and must be written off: Consider write-off when: Invoice is 120+ days overdue with no payment, Customer is unresponsive to all contact attempts (6+ attempts), Amount is small (under R500) and cost of collection exceeds value, Customer has gone out of business or declared bankruptcy. Before writing off: Make final collection attempt (certified letter demanding payment), Consider small claims court (for amounts over R2,000), Send to collection agency (they take 30-50% but may recover something), Document reason for write-off (for tax purposes). Write-offs should be under 2% of annual revenue.",
          warnings: ["Writing off too quickly is worse than trying too long—exhaust reasonable efforts first"]
        }
      ],
      relatedArticles: [
        { id: "financial-insights", title: "Understanding Financial Insights" },
        { id: "dashboard-overview", title: "Understanding Dashboard Overview" },
        { id: "quote-conversion", title: "Analyzing Quote Conversion Rates" }
      ]
    }
  },
  "communication": {
    "email-notifications": {
      title: "Managing Email Notifications",
      time: "5 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Understanding Email Notifications",
          description: "The system automatically sends email notifications for key business events to keep you and your customers informed. Email notifications are sent for: Quote sent to customer, Job scheduled or rescheduled, Invoice sent to customer, Payment reminders (overdue invoices), Job reminders (upcoming appointments), Deposit reminders (when deposit payment is required), Payment receipts (when payment is received), Quote follow-ups (when customer hasn't responded). All emails are sent from your configured sender email address with your business branding.",
          tips: [
            "Emails are sent automatically when you perform actions like sending quotes or scheduling jobs",
            "All emails use professional templates that include your business name and contact information"
          ]
        },
        {
          title: "Configuring Email Settings",
          description: "To customize your email sender information: Navigate to Dashboard → Settings, scroll to 'Email & Communication Settings' section, enter your Sender Email (the email address customers will see messages from), enter your Sender Name (your name or business name), and click 'Save Settings'. The system will use these details in the 'From' field of all automated emails.",
          tips: [
            "Use a professional email address like info@yourbusiness.com or your personal business email",
            "The sender name should be recognizable to customers (your name or business name)"
          ],
          warnings: ["Some email providers may require additional verification for custom sender addresses"]
        },
        {
          title: "Email Notification Types",
          description: "Quote Sent Email - Sent immediately when you send a quote to a customer. Includes quote number, total amount, valid until date, view quote link, and accept/decline options. Job Confirmation Email - Sent when you schedule or reschedule a job. Includes job number, service description, scheduled date and time, location address, and confirmation details. Invoice Sent Email - Sent when you send an invoice to a customer. Includes invoice number, total amount, due date, payment link, and payment instructions. Payment Reminder Email - Sent automatically for overdue invoices based on your payment reminder schedule. Includes days overdue, amount due, payment link, and urgent call-to-action. Payment Receipt Email - Sent automatically when payment is marked as received. Includes payment amount, payment method, invoice number, and receipt download link.",
          tips: ["Customers can click links in emails to view quotes and invoices without logging in"]
        },
        {
          title: "Email Delivery Status",
          description: "The system tracks the status of all sent emails: Pending - Email is queued and waiting to be sent, Sent - Email was successfully delivered to the recipient's email server, Failed - Email delivery failed (invalid email address, server error, etc.), Cancelled - Email was cancelled before sending. You can view email delivery status in the Activity History section of each contact's profile.",
          tips: ["If an email fails, check that the contact's email address is correct"]
        },
        {
          title: "Payment Reminder Schedule",
          description: "Payment reminders are sent automatically for overdue invoices. To configure the reminder schedule: Navigate to Dashboard → Settings, scroll to 'Payment Settings', set 'Payment Reminder Days' (default: 3, 7, 14 days after due date), and save settings. For example, if an invoice is due on January 1st and you set reminders for [3, 7, 14], the system will send reminder emails on January 4th, January 8th, and January 15th if the invoice remains unpaid.",
          tips: [
            "Start with gentle reminders (3 days) and escalate to more urgent ones (14 days)",
            "Too many reminders can frustrate customers—keep the schedule reasonable"
          ]
        },
        {
          title: "Quote Follow-Up Emails",
          description: "Follow-up emails are sent automatically to customers who haven't responded to quotes. To configure follow-ups: Navigate to Dashboard → Settings, scroll to 'Quote Settings', set 'Quote Follow-up Days' (default: 3, 7, 14 days after sending), and save settings. Follow-ups only send if the quote status is still 'sent' (not accepted or declined).",
          tips: [
            "Follow-ups help you stay top-of-mind without manually tracking each quote",
            "If a customer accepts or declines, follow-ups automatically stop"
          ]
        },
        {
          title: "Email Templates and Customization",
          description: "All emails use professional templates that include: Your business name and logo (if uploaded), Customer's name for personalization, Relevant details (quote number, amount, dates, etc.), Call-to-action buttons (View Quote, Pay Invoice, etc.), Your contact information (phone, email), Professional formatting with your brand colors. Templates are pre-designed and optimized for deliverability. Custom template editing is not currently available, but all templates maintain a professional, consistent brand image.",
          tips: ["Templates are mobile-responsive and look great on all devices"]
        },
        {
          title: "Viewing Email History",
          description: "To see all emails sent to a specific customer: Navigate to Dashboard → Contacts, click on the customer's name to open their 360° profile, scroll to the 'Activity History' section. You'll see a timeline of all emails sent, including: Email type (Quote Sent, Invoice Sent, Payment Reminder, etc.), Date and time sent, Delivery status (Sent, Failed, Pending), Email subject line. This helps you track all communication with each customer in one place.",
          tips: ["Use the activity history to avoid sending duplicate emails or to verify when communication was sent"]
        },
        {
          title: "Email Best Practices",
          description: "To ensure your emails are professional and effective: Use a Professional Sender Email - Avoid free email providers (Gmail, Yahoo) for business communications. Verify Contact Email Addresses - Ensure customer emails are correct before sending quotes/invoices. Monitor Delivery Status - Check the activity log for failed emails and follow up manually. Respond Promptly - When customers reply to your emails, respond quickly to maintain momentum. Don't Over-Email - Use the system's automated schedules rather than manually sending duplicate emails. Keep Contact Info Updated - Ensure your business phone and email in Settings are current.",
          tips: [
            "Professional email communication builds trust and credibility with customers",
            "Automated emails save you time while keeping customers informed"
          ]
        },
        {
          title: "Troubleshooting Email Issues",
          description: "Emails Not Sending - Check that sender email and name are configured in Settings. Verify contact has a valid email address. Check Activity History for error messages. Emails Going to Spam - Use a professional sender email (not free providers). Ensure your sender email is verified with your email provider. Ask customers to add your email to their contacts. Customer Not Receiving Emails - Verify the email address is correct. Ask customer to check spam/junk folders. Resend manually if needed. Email Failed Status - Check for typos in the email address. Contact might have an invalid or inactive email account. Update contact email and retry.",
          warnings: ["Always have a backup communication method (phone, WhatsApp) in case email fails"]
        }
      ],
      relatedArticles: [
        { id: "whatsapp-setup", title: "Setting Up WhatsApp Messaging" },
        { id: "communication-history", title: "Viewing Communication History" }
      ]
    },
    "whatsapp-setup": {
      title: "Setting Up WhatsApp Messaging",
      time: "8 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "What is WhatsApp Business Messaging?",
          description: "WhatsApp Business messaging allows you to send automated notifications to customers via WhatsApp instead of (or in addition to) email. Benefits include: 98% open rate (vs 20% for email), instant delivery to customer's phone, preferred communication channel in South Africa, read receipts to confirm delivery, professional business messaging. The system supports two WhatsApp providers: Twilio (recommended for most businesses) - Reliable, well-documented, R0.40 per message. WaSender - Lower cost option, R0.25 per message, requires API key setup.",
          tips: [
            "WhatsApp is the dominant communication channel in South Africa with 95%+ penetration",
            "Customers are more likely to read and respond to WhatsApp messages than emails"
          ]
        },
        {
          title: "Prerequisites for WhatsApp Setup",
          description: "Before you can send WhatsApp messages, you need: A WhatsApp Provider Account - Sign up for either Twilio or WaSender. API Credentials - Obtain your API key from your chosen provider. Business Phone Number - Your business WhatsApp number that customers can reply to. Customer Consent - Customers must opt-in to receive WhatsApp messages (POPIA compliance).",
          warnings: ["Without proper setup, WhatsApp messages will not send. Email will be used as a fallback."]
        },
        {
          title: "Option 1: Setting Up Twilio WhatsApp",
          description: "Twilio is the recommended provider for most businesses. Step 1: Create Twilio Account - Go to twilio.com/try-twilio, sign up for a free trial account, verify your email and phone number. Step 2: Get WhatsApp Sandbox (for testing) - In Twilio Console, go to Messaging → Try it Out → Try WhatsApp, you'll get a test number like whatsapp:+14155238886, send 'join [code]' to this number from your WhatsApp to activate sandbox. Step 3: Get Production WhatsApp Number (for real use) - Go to Messaging → WhatsApp → Senders, click 'Request to use your Twilio number with WhatsApp', submit your business profile for Meta approval (1-3 days). Step 4: Get API Credentials - In Twilio Console, go to Account → API Keys & Tokens, copy your Account SID and Auth Token. Step 5: Configure in Settings - Navigate to Dashboard → Settings → Communication, select 'Twilio' as WhatsApp Provider, enter your Account SID, enter your Auth Token, enter your WhatsApp number, click 'Save Settings'.",
          tips: [
            "Sandbox is perfect for testing—use it before going live",
            "Keep your Auth Token secret—never share it publicly"
          ]
        },
        {
          title: "Option 2: Setting Up WaSender WhatsApp",
          description: "WaSender is a lower-cost alternative with simpler setup. Step 1: Create WaSender Account - Go to wasenderapi.com, sign up for an account, verify your email. Step 2: Connect WhatsApp Number - In WaSender dashboard, scan QR code with WhatsApp Web to link your business phone, ensure phone stays connected and online. Step 3: Get API Key - In WaSender dashboard, go to API Settings, copy your API Key. Step 4: Configure in Settings - Navigate to Dashboard → Settings → Communication, select 'WaSender' as WhatsApp Provider, paste your API Key, enter your WhatsApp number, click 'Save Settings'.",
          tips: [
            "WaSender costs R0.25 per message vs Twilio's R0.40",
            "WaSender requires your phone to stay online (like WhatsApp Web)"
          ]
        },
        {
          title: "Configuring WhatsApp Settings",
          description: "After setting up your provider, configure how WhatsApp is used: Navigate to Dashboard → Settings, scroll to 'WhatsApp Settings', set Monthly Message Limit (default: 1000 messages). This prevents unexpected charges. Enable/disable automatic WhatsApp for quotes, jobs, and invoices. Set your business WhatsApp number that customers can save. Click 'Save Settings'. The system will track your usage and alert you at 80%, 90%, and 100% of your limit.",
          tips: [
            "Start with a conservative limit (1000 messages) and increase as needed",
            "Monitor your usage in Dashboard → WhatsApp Analytics"
          ]
        },
        {
          title: "Getting Customer Opt-In (POPIA Compliance)",
          description: "Under South African POPIA law, customers must explicitly consent to WhatsApp messages. The system handles this automatically: When you add a new contact, there's a 'WhatsApp Opt-In' checkbox. When customers submit a quote request, they can opt-in to WhatsApp. You can manually enable opt-in when speaking to a customer. Opt-in status is tracked with timestamps for compliance. To enable WhatsApp for an existing contact: Go to Dashboard → Contacts, click Edit on the contact, check 'WhatsApp Opt-In', save. Now the contact will receive WhatsApp notifications instead of (or in addition to) email.",
          tips: [
            "Always ask permission before sending WhatsApp messages",
            "Keep records of opt-in consent for POPIA compliance"
          ],
          warnings: ["Sending WhatsApp messages without consent violates POPIA and can result in fines"]
        },
        {
          title: "Testing Your WhatsApp Setup",
          description: "After configuration, test that messages send correctly: Navigate to Dashboard → Settings → Communication, scroll to 'Test WhatsApp', enter your own phone number (in format +27821234567), enter a test message, click 'Send Test Message'. Check your WhatsApp—you should receive the message within seconds. If the test fails: Verify your API credentials are correct. Check that your provider account is active. Ensure your phone number format is correct (+27XXXXXXXXX). Check the error message in the response for details.",
          tips: ["Always test with your own number first before sending to customers"]
        },
        {
          title: "WhatsApp Message Types",
          description: "The system sends these WhatsApp notifications automatically: Quote Sent - When you send a quote to a customer who has opted in. Job Scheduled - When you schedule an appointment. Job Reminder - Automated reminders 1, 3, or 7 days before the appointment. Invoice Sent - When you send an invoice. Payment Reminder - For overdue invoices. Deposit Reminder - When deposit payment is required. Payment Receipt - Confirmation when payment is received. All messages use professional templates and include your business name and contact details.",
          tips: ["Customers can reply to your WhatsApp messages to ask questions"]
        },
        {
          title: "Monitoring WhatsApp Usage",
          description: "Track your WhatsApp usage to stay within limits: Navigate to Dashboard → WhatsApp Analytics. You'll see: Total messages sent this month, Messages delivered, Messages read, Delivery rate percentage, Read rate percentage, Usage by type (quotes, jobs, invoices), Cost tracking, Usage over time chart (last 30 days). The dashboard also shows your current usage vs limit with a progress bar. You'll receive email alerts at 80%, 90%, and 100% of your monthly limit.",
          tips: [
            "Monitor usage weekly to avoid hitting your limit unexpectedly",
            "High delivery and read rates (90%+) indicate healthy WhatsApp messaging"
          ]
        },
        {
          title: "WhatsApp vs Email: When Each is Used",
          description: "The system intelligently chooses communication channel based on customer preferences: Customer has WhatsApp opt-in enabled AND phone number → WhatsApp is sent. Customer has WhatsApp opt-in disabled OR no phone number → Email is sent. Customer prefers 'Both' → Both WhatsApp and Email are sent. WhatsApp fails to send → Email is sent as automatic fallback. This ensures customers always receive important notifications, even if one channel fails.",
          tips: ["Set customer's 'Preferred Channel' in their contact profile to 'WhatsApp', 'Email', or 'Both'"]
        },
        {
          title: "WhatsApp Best Practices",
          description: "To maximize effectiveness of WhatsApp messaging: Get Explicit Consent - Always check the opt-in box only with customer permission. Use Professional Language - Keep messages business-appropriate and concise. Don't Spam - Respect the automated schedules; avoid manual duplicate messages. Monitor Responses - When customers reply, respond promptly. Provide Value - Every message should be useful (quote updates, appointment reminders, etc.). Maintain Branding - Messages include your business name for professionalism. Track Metrics - Monitor delivery and read rates to ensure messages are reaching customers.",
          tips: [
            "WhatsApp is conversational—customers may reply with questions, so check messages regularly",
            "Professional WhatsApp communication builds trust and improves customer relationships"
          ]
        },
        {
          title: "Troubleshooting WhatsApp Issues",
          description: "Common WhatsApp problems and solutions: Messages Not Sending - Verify provider credentials in Settings. Check monthly usage limit hasn't been reached. Ensure contact has opted in and has a valid phone number. Check WhatsApp queue status in Dashboard → Settings → Communication. Test Failed - Provider API key or credentials are incorrect. Provider account is inactive or suspended. Phone number format is wrong (use +27XXXXXXXXX). Messages Queued but Not Delivered - Provider may have temporary outage. Queue processes every 5 minutes—wait a few minutes. Check provider account balance (for Twilio). Customer Not Receiving Messages - Verify phone number is correct and includes country code. Customer may have blocked your business number. Try sending a test message to your own phone to verify setup. High Message Costs - Review your usage in WhatsApp Analytics. Consider switching from Twilio (R0.40) to WaSender (R0.25). Set a lower monthly limit to control costs.",
          warnings: ["If WhatsApp fails, the system automatically falls back to email—customers will still be notified"]
        }
      ],
      relatedArticles: [
        { id: "whatsapp-messages", title: "Sending WhatsApp Messages" },
        { id: "email-notifications", title: "Managing Email Notifications" },
        { id: "communication-history", title: "Viewing Communication History" }
      ]
    },
    "whatsapp-messages": {
      title: "Sending WhatsApp Messages",
      time: "6 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "How WhatsApp Messaging Works",
          description: "The system automatically sends WhatsApp messages to customers when certain business events occur. Messages are sent if: The customer has opted in to WhatsApp messaging (POPIA compliance), the customer has a valid phone number in their contact profile, your business has WhatsApp configured (Twilio or WaSender), and your monthly message limit hasn't been reached. Messages are queued and sent within seconds. You can track delivery status, read receipts, and message history in the dashboard.",
          tips: [
            "WhatsApp messages have a 98% open rate compared to 20% for email",
            "Messages are sent automatically—you don't need to manually trigger each one"
          ]
        },
        {
          title: "Automatic WhatsApp Notifications",
          description: "The system sends WhatsApp messages automatically for these events: Quote Sent - When you send a quote to a customer. Message includes quote number, total amount, valid until date, view link, and your business name. Job Scheduled - When you schedule an appointment. Includes job number, service description, date, time, and location. Job Rescheduled - When you change an appointment. Includes new date, time, and apology for any inconvenience. Job Reminder - Automatic reminders before appointments (default: 1, 3, 7 days before). Invoice Sent - When you send an invoice. Includes invoice number, amount, due date, and payment link. Payment Reminder - For overdue invoices. Includes days overdue, amount, and urgent payment link. Deposit Invoice - When deposit is required to confirm booking. Includes deposit amount, deadline, and payment link. Deposit Reminder - Reminders before deposit deadline (default: 48 hours, 24 hours, 12 hours before). Payment Receipt - Confirmation when payment is received. Includes amount paid, payment method, and thank you message.",
          tips: ["All messages are sent from your business WhatsApp number so customers can save it and contact you"]
        },
        {
          title: "WhatsApp Message Queue",
          description: "Messages don't send instantly—they're queued and processed in batches. How the queue works: When you send a quote, schedule a job, or send an invoice, the message is added to the queue. The queue processor runs every 5 minutes and sends all pending messages. Message status updates from 'pending' → 'sent' → 'delivered' → 'read'. If a message fails, it's retried up to 3 times. You can view the queue status in Dashboard → Settings → Communication → WhatsApp Queue.",
          tips: [
            "Most messages send within 5 minutes of being queued",
            "Failed messages automatically fall back to email"
          ]
        },
        {
          title: "Viewing WhatsApp Message History",
          description: "To see all WhatsApp messages sent to a customer: Navigate to Dashboard → Contacts, click on the customer's name to open their profile, scroll to 'Activity History'. You'll see all WhatsApp messages in the timeline: Message type (Quote Sent, Job Reminder, etc.), Date and time sent, Delivery status (Pending, Sent, Delivered, Read, Failed), Message preview (first 50 characters). Click 'View Details' to see the full message content and delivery timestamps.",
          tips: ["Green checkmarks indicate message was read by the customer"]
        },
        {
          title: "WhatsApp Delivery Statuses",
          description: "Each message goes through several status stages: Pending - Message is queued and waiting to be sent. Sent - Message was successfully sent to WhatsApp servers. Delivered - Message was delivered to customer's phone (single checkmark in WhatsApp). Read - Customer has opened and read the message (double checkmark in WhatsApp). Failed - Message delivery failed (invalid number, blocked, provider error). Status updates happen in real-time. You can see current status in the communication history.",
          tips: [
            "Delivered status means customer received it, Read status means they opened it",
            "Failed messages trigger an automatic email fallback"
          ]
        },
        {
          title: "Understanding Read Receipts",
          description: "WhatsApp provides read receipts that tell you when customers open your messages. What read receipts mean: Message Sent (Single Gray Check) - Message reached WhatsApp servers. Message Delivered (Double Gray Checks) - Message arrived on customer's phone. Message Read (Double Blue Checks) - Customer opened and saw your message. Read receipts are tracked in the system and visible in Activity History. High read rates (80%+) indicate customers are engaged with your communications.",
          tips: [
            "If a quote message is read but customer doesn't respond, follow up with a phone call",
            "Read receipts help you know the best time to follow up with customers"
          ]
        },
        {
          title: "Manual WhatsApp Messages (Testing)",
          description: "While most messages are automatic, you can send test messages manually: Navigate to Dashboard → Settings → Communication, scroll to 'Test WhatsApp Messaging', enter a phone number (format: +27XXXXXXXXX), type your test message, click 'Send Test Message'. Use this feature to: Test your WhatsApp setup before going live, send one-off messages to customers, verify phone number formatting. Manual messages count toward your monthly limit.",
          tips: [
            "Always test with your own number first",
            "Manual messages are for testing only—use the automatic system for customer communication"
          ]
        },
        {
          title: "WhatsApp Message Templates",
          description: "All WhatsApp messages use pre-approved templates to ensure compliance and professionalism. Templates include: Quote Sent Template - Greeting, quote number, total amount, valid until, view link, business name. Job Reminder Template - Greeting, job number, date, time, location, confirmation. Invoice Template - Greeting, invoice number, amount, due date, payment link, business name. Payment Reminder Template - Greeting, invoice number, days overdue, amount, urgent payment link. Templates use placeholders (like {{customer_name}}, {{total_amount}}) that are automatically filled with actual data. You cannot customize templates directly, but all include your business branding.",
          tips: ["Templates are optimized for high deliverability and customer engagement"]
        },
        {
          title: "WhatsApp vs Email Preference",
          description: "Customers can choose their preferred communication channel. How preferences work: Preferred Channel: Email Only - Customer receives only email, no WhatsApp. Preferred Channel: WhatsApp Only - Customer receives only WhatsApp (if opted in). Preferred Channel: Both - Customer receives both email AND WhatsApp. No preference set - System defaults to customer's opt-in status. To set a customer's preference: Go to Dashboard → Contacts, edit the contact, set 'Preferred Communication Channel', save. This gives customers control while ensuring they always receive important notifications.",
          tips: [
            "Ask customers their preference when you first add them to your system",
            "'Both' is recommended for important notifications to ensure delivery"
          ]
        },
        {
          title: "WhatsApp Cost Management",
          description: "WhatsApp messages aren't free—each message costs R0.25-R0.40 depending on your provider. Cost per message: Twilio - R0.40 per message (more reliable, better support). WaSender - R0.25 per message (lower cost, requires always-on phone connection). The system tracks costs automatically: View total monthly cost in Dashboard → WhatsApp Analytics. Monitor usage to stay within budget. Set monthly message limits to control costs. Receive alerts at 80%, 90%, 100% of limit. If you hit your limit, new messages automatically fall back to email (which is free).",
          tips: [
            "Set a realistic monthly limit based on your customer base (e.g., 1000 messages for 50 active customers)",
            "WaSender is cheaper but requires your phone to stay online 24/7"
          ]
        },
        {
          title: "Troubleshooting Message Delivery",
          description: "If WhatsApp messages aren't being delivered: Check Customer Opt-In - Verify customer has opted in to WhatsApp. Edit contact and check 'WhatsApp Opt-In' box. Verify Phone Number - Ensure phone number is correct and includes country code (+27). Phone format should be +27821234567 (no spaces). Check Message Limit - View Dashboard → WhatsApp Analytics to see if monthly limit reached. If at limit, messages fall back to email. Review Queue Status - Go to Dashboard → Settings → Communication → WhatsApp Queue. Look for failed messages with error details. Test Provider Connection - Send a test message to your own phone. If test fails, check provider credentials in Settings. Check Activity History - View customer's Activity History to see exact error messages.",
          warnings: [
            "Invalid phone numbers cause permanent failures—verify numbers before sending",
            "If messages consistently fail, check with your WhatsApp provider for account issues"
          ]
        },
        {
          title: "WhatsApp Best Practices",
          description: "To maximize the effectiveness of WhatsApp messaging: Timing - Send messages during business hours (9am-5pm) when customers are likely to read them. Frequency - Don't over-message. Use the automated schedules rather than manual messages. Professionalism - All messages are business communication—maintain professional tone. Response Time - When customers reply to your WhatsApp, respond within 1-2 hours. Accuracy - Ensure all details (prices, dates, times) are correct before sending. Follow-Up - If a message is delivered but not read after 24 hours, follow up via phone or email. Consent - Never send WhatsApp messages to customers who haven't opted in.",
          tips: [
            "WhatsApp is conversational—expect and welcome customer replies",
            "Professional, timely WhatsApp communication builds strong customer relationships"
          ]
        }
      ],
      relatedArticles: [
        { id: "whatsapp-setup", title: "Setting Up WhatsApp Messaging" },
        { id: "email-notifications", title: "Managing Email Notifications" },
        { id: "communication-history", title: "Viewing Communication History" }
      ]
    },
    "communication-history": {
      title: "Viewing Communication History",
      time: "4 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "What is Communication History?",
          description: "Communication History is a complete timeline of all interactions between your business and each customer. It includes: All emails sent (quotes, invoices, reminders, receipts), all WhatsApp messages sent, delivery status and read receipts, customer actions (quote viewed, quote accepted, invoice paid), system events (job scheduled, payment received), manual notes you've added. This 360° view helps you understand the full customer journey and ensures nothing falls through the cracks.",
          tips: [
            "Communication history is accessible from each customer's contact profile",
            "All team members can see the history, ensuring everyone is aligned"
          ]
        },
        {
          title: "Accessing Communication History",
          description: "To view a customer's complete communication history: Navigate to Dashboard → Contacts, click on the customer's name to open their profile (or click the 'eye' icon), scroll to the 'Activity History' section. The timeline shows all events in reverse chronological order (newest first). Each event displays: Event type (Email Sent, WhatsApp Sent, Quote Accepted, etc.), date and time, status (Sent, Delivered, Read, Failed), brief description, expandable details.",
          tips: ["Click 'Show More' on any activity to see full details like message content and error messages"]
        },
        {
          title: "Understanding Activity Types",
          description: "The activity history tracks different types of events: Communication Events - Email Sent, Email Delivered, Email Opened, WhatsApp Sent, WhatsApp Delivered, WhatsApp Read. Quote Journey Events - Quote Requested (customer submitted form), Quote Sent (you sent quote to customer), Quote Viewed (customer opened quote link), Quote Accepted (customer approved quote), Quote Declined (customer rejected quote). Job Events - Job Scheduled, Job Rescheduled, Job Started, Job Completed, Job Reminder Sent. Invoice & Payment Events - Invoice Sent, Invoice Viewed, Invoice Paid, Payment Received, Payment Reminder Sent. System Events - Contact Created, Contact Updated, Notes Added. Each event type is color-coded for easy scanning.",
          tips: ["Look for gaps in communication to identify follow-up opportunities"]
        },
        {
          title: "Filtering Activity History",
          description: "For customers with lots of activity, you can filter the timeline: Filter by Event Type - Show only emails, only WhatsApp, only quote events, etc. Filter by Date Range - View activity from last 7 days, last 30 days, last 90 days, or custom range. Filter by Status - Show only failed communications, only successful ones. Search - Search for specific keywords in messages or event descriptions. Filters help you quickly find what you're looking for without scrolling through hundreds of events.",
          tips: ["Use 'Failed' filter to quickly identify and fix communication issues"]
        },
        {
          title: "Email Communication Details",
          description: "When you expand an email event in the timeline, you see: Subject Line - The email subject (e.g., 'Quote QT-2024-001 from YourBusiness'). Recipient - Customer's email address. Sent At - Exact date and time email was sent. Status - Pending, Sent, Failed. Delivery Status - Whether email reached customer's inbox. Error Message (if failed) - Reason for failure (invalid email, server error, etc.). Message Preview - First 100 characters of email body. Full Content (click 'View Full Email') - Complete email HTML and text. This helps you verify exactly what was sent and troubleshoot delivery issues.",
          tips: ["If an email shows 'Failed' status, check the error message to understand why"]
        },
        {
          title: "WhatsApp Communication Details",
          description: "When you expand a WhatsApp event in the timeline, you see: Message Type - Quote Sent, Job Reminder, Invoice Sent, etc. Phone Number - Recipient's WhatsApp number. Sent At - Exact timestamp message was queued. Delivered At - When message reached customer's phone. Read At - When customer opened the message (if available). Status - Pending, Sent, Delivered, Read, Failed. Message Content - Full text of the WhatsApp message. Provider - Whether sent via Twilio or WaSender. Cost - How much the message cost (R0.25 or R0.40). Read receipts (double blue check) indicate high engagement.",
          tips: [
            "If Read At timestamp is present, customer definitely saw your message",
            "Compare Sent At and Read At to see how quickly customer engages"
          ]
        },
        {
          title: "Quote and Job Activity Tracking",
          description: "The timeline shows the full journey of quotes and jobs: Quote Requested - Customer filled out quote request form on your website. Date, time, service requested, customer details. Quote Sent - You sent the quote. Includes quote number, total amount, and delivery channel (email/WhatsApp). Quote Viewed - Customer clicked link and opened quote. Timestamp shows exactly when they viewed it. Quote Accepted - Customer approved the quote. Triggers job scheduling workflow. Job Scheduled - You created a job from the quote. Shows scheduled date, time, service details. Job Reminder Sent - Automated reminder sent 1/3/7 days before appointment. Job Completed - You marked the job as complete. Triggers invoice generation if needed. This end-to-end tracking ensures you never lose sight of where each customer is in the sales process.",
          tips: [
            "If a quote was viewed but not accepted within 3 days, follow up with a phone call",
            "Track time between 'Quote Sent' and 'Quote Accepted' to measure your conversion speed"
          ]
        },
        {
          title: "Invoice and Payment Activity",
          description: "Payment-related events appear in the timeline: Invoice Sent - When you send an invoice to the customer. Shows invoice number, total amount, due date. Invoice Viewed - Customer opened the invoice link. Payment Reminder Sent - Automated reminder for overdue invoices. Shows days overdue. Payment Received - When you mark invoice as paid. Shows payment amount, payment method, date. Deposit Invoice Sent - For jobs requiring deposits. Deposit Reminder Sent - Automated reminders before deposit deadline. Deposit Received - Deposit payment confirmed. This helps you track payment status and identify customers who need follow-up.",
          tips: [
            "If invoice is viewed but not paid after 7 days, send a gentle reminder",
            "Track payment patterns to identify reliable customers vs. slow payers"
          ]
        },
        {
          title: "Adding Manual Notes to History",
          description: "You can add your own notes to a customer's activity history: Open the customer's contact profile, scroll to Activity History, click 'Add Note' button, type your note (e.g., 'Called customer, left voicemail'), select note category (Phone Call, Meeting, General, etc.), click 'Save Note'. Manual notes appear in the timeline alongside automatic events. Use notes to: Record phone conversations, document customer requests, note important details about the job, track promises or commitments made, add context for other team members.",
          tips: [
            "Add notes immediately after customer interactions while details are fresh",
            "Good notes improve team collaboration and customer service"
          ]
        },
        {
          title: "Using History to Improve Customer Service",
          description: "Communication history helps you provide better service: Before Calling a Customer - Review history to see what was discussed previously, check if they've viewed recent quotes/invoices, identify any outstanding issues. When Customer Calls You - Pull up their profile immediately, review recent communication, reference specific quotes or jobs in conversation. For Follow-Ups - See when last contact was made, determine if it's time for a check-in, identify customers who haven't been contacted recently. For Problem Resolution - Trace the full history of an issue, verify what was communicated when, provide accurate answers based on records. Team Collaboration - New team members can review history to get up to speed, ensure consistent service across all staff, avoid duplicate or conflicting communication.",
          tips: [
            "Review communication history before every customer interaction",
            "Well-documented history reduces miscommunication and improves customer satisfaction"
          ]
        },
        {
          title: "Communication History Best Practices",
          description: "To get the most value from communication history: Review Regularly - Check customer history before calls and meetings. Document Everything - Add manual notes for phone calls, in-person meetings, important decisions. Look for Patterns - Identify communication patterns that lead to successful conversions. Learn from Failures - Review failed communications to understand what went wrong. Use for Training - Show new team members examples of effective customer communication. Monitor Response Times - Track how quickly you respond to customer actions (quote views, etc.). Follow Up on Gaps - If a customer hasn't been contacted in 30+ days, reach out. Track Customer Journey - Understand the full path from lead to paying customer.",
          tips: [
            "Communication history is your business memory—use it to build stronger customer relationships",
            "Consistent documentation leads to better service and higher customer retention"
          ]
        }
      ],
      relatedArticles: [
        { id: "email-notifications", title: "Managing Email Notifications" },
        { id: "whatsapp-messages", title: "Sending WhatsApp Messages" },
        { id: "contact-details", title: "Viewing Contact History" }
      ]
    }
  },
  "website": {
    "website-editor": {
      title: "Using the Website Editor",
      time: "6 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Accessing the Website Editor",
          description: "From your dashboard, click 'Website Editor' in the main sidebar menu. This opens the website management interface where you can customize all aspects of your business website.",
        },
        {
          title: "Understanding the Editor Layout",
          description: "The Website Editor has two main panels: Edit Sections (left side) - Shows all your website sections organized by category with options to edit content. Live Preview (right side) - Displays your website as customers will see it, updating in real-time as you make changes. You can toggle the preview on/off using the 'Show/Hide Preview' button.",
          tips: ["Keep the preview visible while editing to see changes immediately"]
        },
        {
          title: "Navigating Website Sections",
          description: "Sections are organized in an accordion menu that matches your website structure: Hero (main banner at top of page), About (your business story), Services (what you offer), Testimonials (customer reviews), Gallery (work photos), and Contact (contact form and details). Click any section name to expand it and see the editable elements inside.",
        },
        {
          title: "Editing Text Content",
          description: "To edit any text element: Click on the element in the section list, the Edit panel opens on the right showing the element details, modify the text in the textarea field (supports multiple lines), and click 'Save Changes' to apply. Examples of text elements: Hero heading, About paragraph, Service descriptions, Testimonial quotes, Contact information.",
          tips: [
            "Keep text concise and customer-focused",
            "Use clear language that explains your value proposition"
          ]
        },
        {
          title: "Editing Images",
          description: "To change an image: Click the image element in the section list, in the Edit panel, click the upload area or drag an image file, supported formats: PNG, JPG, WebP (max 5MB), add Alt Text for accessibility (describes the image for screen readers), and click 'Save Changes'. The new image appears immediately in the preview.",
          tips: [
            "Use high-quality images that showcase your work",
            "Optimize images before upload to keep site fast (recommended: under 500KB per image)"
          ],
          warnings: ["Images over 5MB will be rejected. Compress large images before uploading."]
        },
        {
          title: "Adding and Removing Items",
          description: "Some sections allow multiple items (Services, Testimonials, Gallery). To add a new item: Expand the section in the accordion, click the '+' button next to the section name, fill in the new item's content, and save. To remove an item: Click the 'X' button next to the item you want to delete, confirm the deletion. Changes apply immediately.",
          tips: ["Services: You can add unlimited services to showcase your full offering"],
          warnings: ["Gallery is limited to 10 images to maintain site performance"]
        },
        {
          title: "Services Section Management",
          description: "Each service item consists of two fields: Service Heading (the name of your service, e.g., 'Plumbing Repairs'), and Service Description (what's included, pricing info, etc.). To add a service: Click '+' next to Services section, fill in both heading and description fields for the new service, and save. Services appear on your website in the order you add them.",
          tips: [
            "Include key benefits in descriptions",
            "Mention typical pricing or 'starting at R500' to set expectations"
          ]
        },
        {
          title: "Testimonials Section Management",
          description: "Each testimonial has two fields: Testimonial Text (the customer's quote), and Author Name (customer name or 'Anonymous'). To add a testimonial: Click '+' next to Testimonials section, paste the customer's review in the text field, add their name in the author field, and save. Testimonials build trust with potential customers.",
          tips: [
            "Ask satisfied customers for short, specific testimonials",
            "Include first name + location for authenticity (e.g., 'John, Cape Town')"
          ]
        },
        {
          title: "Gallery Section Management",
          description: "The Gallery showcases before/after photos, completed projects, or your team. Each gallery slot holds one image. To add gallery images: Expand the Gallery section, click '+' (if under 10 images), upload your image (max 5MB), add descriptive Alt Text, and save. Gallery images display in a responsive grid on your website.",
          tips: [
            "Use 'before and after' pairs to demonstrate transformation",
            "Include a variety of projects to show your range"
          ],
          warnings: ["Maximum 10 images to keep your site fast. Remove old images to add new ones."]
        },
        {
          title: "Button Elements (Calls-to-Action)",
          description: "Buttons link to other pages or trigger actions. To edit a button: Select the button element, change Button Text (what the button says, e.g., 'Get a Free Quote'), change Button URL (where it links, e.g., '/quote' or 'https://yoursite.com'), and save. Buttons should drive customer actions.",
          tips: [
            "Use action-oriented text: 'Book Now', 'Get Quote', 'Contact Us'",
            "Link Hero button to your quote request form for maximum conversions"
          ]
        },
        {
          title: "Previewing Your Changes",
          description: "The preview panel shows your website exactly as customers see it. After saving changes: The preview iframe refreshes automatically within seconds, scroll through the preview to see all sections, test that images load and buttons work. If preview doesn't update, click 'Show/Hide Preview' twice to force refresh.",
        },
        {
          title: "Publishing Your Changes",
          description: "All changes are automatically published when you click 'Save Changes'. There's no separate 'publish' step—what you save is immediately live on your website. To verify: Open your business website URL in a new tab (shown in your business settings), check that your changes appear correctly, test on mobile by resizing browser or using a phone.",
          warnings: ["Changes are immediate and public. Preview carefully before saving."]
        },
        {
          title: "Undoing Changes",
          description: "If you make a mistake: Click 'Cancel' before saving to discard edits, or re-edit the element and enter the correct content, then save again. There's no automated undo feature, so keep a backup of important text content in a separate document.",
          tips: ["Copy original text before major edits so you can restore if needed"]
        },
        {
          title: "Website Editor Best Practices",
          description: "Update regularly - Refresh photos and testimonials monthly to keep content fresh. Be consistent - Use the same tone and style across all sections. Optimize images - Compress before upload to maintain fast load times. Test mobile - Most customers view on phones, so check mobile appearance. Get feedback - Ask friends or customers to review your site before major changes. Keep it simple - Don't overcrowd sections; white space improves readability.",
        }
      ],
      relatedArticles: [
        { id: "website-sections", title: "Understanding Website Sections" },
        { id: "upload-images", title: "Uploading & Managing Images" },
        { id: "quote-forms", title: "Customizing Quote Request Forms" }
      ]
    },
    "website-sections": {
      title: "Understanding Website Sections",
      time: "5 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "What Are Website Sections?",
          description: "Website sections are distinct content blocks that make up your business landing page. Each section serves a specific purpose in your customer journey. The sections appear in a specific order on your website: Hero → About → Services → Testimonials → Gallery → Contact. This structure is proven to convert visitors into customers.",
        },
        {
          title: "Hero Section (Top Banner)",
          description: "The Hero is the first thing customers see when they visit your website. It contains: Main Heading (your value proposition, e.g., 'Reliable Plumbing Services in Cape Town'), Subheading (supporting text explaining what you do), Hero Image (background or feature image), and Call-to-Action Button (typically 'Get a Quote' or 'Book Now'). The Hero determines whether visitors stay on your site or leave within seconds.",
          tips: [
            "Use a clear, benefit-focused headline (not just your business name)",
            "The CTA button should lead to your quote request form"
          ]
        },
        {
          title: "About Section (Your Story)",
          description: "The About section builds trust by explaining who you are and why customers should choose you. Typical content includes: Business history ('Serving Cape Town for 15 years'), Your expertise and qualifications, What makes you different from competitors, and Your commitment to quality/customer service. Keep this section conversational and genuine—customers want to know the people behind the business.",
          tips: [
            "Include years of experience if you have them",
            "Mention certifications, licenses, or awards",
            "Add a professional photo of yourself or your team"
          ]
        },
        {
          title: "Services Section (What You Offer)",
          description: "The Services section lists everything you can do for customers. Each service has: Service Name/Heading (clear, descriptive title), and Service Description (what's included, who it's for, typical pricing). You can add unlimited services to this section. Organize from most popular to least popular, or by category (Emergency Services, Regular Maintenance, Installations).",
          tips: [
            "Use customer-friendly names: 'Emergency Leak Repair' not 'Hydraulic System Intervention'",
            "Include starting prices or price ranges to set expectations",
            "Explain what's included: materials, labor, warranty, etc."
          ]
        },
        {
          title: "Testimonials Section (Social Proof)",
          description: "The Testimonials section displays customer reviews and builds credibility. Each testimonial includes: Customer Quote (their positive experience in their own words), and Customer Name (can be full name, first name only, or 'Anonymous'). Testimonials answer the question: 'Can I trust this business?' Research shows they significantly increase conversion rates.",
          tips: [
            "Use real testimonials from actual customers (not made up)",
            "Include specific details: 'Fixed my burst pipe in 2 hours on a Sunday'",
            "Aim for 3-6 testimonials to avoid overwhelming visitors",
            "Update regularly with fresh reviews from recent jobs"
          ]
        },
        {
          title: "Gallery Section (Your Work)",
          description: "The Gallery showcases visual proof of your work quality. You can display up to 10 images showing: Before and after photos, Completed projects, Your team in action, Equipment and tools, or Happy customers (with permission). Gallery images appear in a responsive grid that looks good on all devices.",
          tips: [
            "Use high-quality, well-lit photos",
            "Before/after pairs are extremely effective",
            "Include variety: different project types, different locations",
            "Add Alt Text to each image (describes the photo for accessibility)"
          ],
          warnings: ["Maximum 10 images to maintain fast page load speed"]
        },
        {
          title: "Contact Section (How to Reach You)",
          description: "The Contact section makes it easy for customers to get in touch. It includes: Contact Form (for quote requests and inquiries), Your phone number, Your email address, Physical address (if applicable), and Business hours. This is often the final step before a customer converts—make it frictionless.",
          tips: [
            "Test your contact form monthly to ensure it works",
            "Include a clear call-to-action: 'Send us a message' or 'Request a quote'",
            "Add your WhatsApp number if you use it for business"
          ]
        },
        {
          title: "Section Visibility and Order",
          description: "All sections are visible by default and appear in the fixed order (Hero → About → Services → Testimonials → Gallery → Contact). You cannot currently reorder sections or hide specific sections—this ensures a consistent, proven conversion structure. However, you can leave sections minimal if you don't have content yet (e.g., empty Gallery if you don't have photos).",
        },
        {
          title: "Mobile Responsiveness",
          description: "All sections automatically adapt to mobile devices: Text becomes larger and more readable, Images resize to fit smaller screens, Buttons become easier to tap, Forms use mobile-optimized inputs. Over 60% of website visitors use mobile devices, so this automatic optimization is critical.",
          tips: ["Always test your website on a phone after making changes"]
        },
        {
          title: "SEO and Section Content",
          description: "Search engines (Google) read your section content to understand what your business does. To improve SEO: Use keywords naturally in your About section (e.g., 'plumbing services in Cape Town'), Include service names in Service headings (helps you rank for those services), Add descriptive Alt Text to all images, and Keep content relevant and specific to your location and industry.",
          tips: ["Mention your city/area in the About section to rank for local searches"]
        },
        {
          title: "Section Content Best Practices",
          description: "Hero - One clear message + one action. Keep it simple. About - 100-200 words max. People scan, they don't read novels. Services - 3-8 services ideal. Too many overwhelms visitors. Testimonials - 3-6 reviews. Quality over quantity. Gallery - 6-10 images. Showcase variety and quality. Contact - Multiple ways to reach you. Remove barriers. Remember: Less is more. Each section should have one job, not try to do everything.",
        }
      ],
      relatedArticles: [
        { id: "website-editor", title: "Using the Website Editor" },
        { id: "upload-images", title: "Uploading & Managing Images" },
        { id: "quote-forms", title: "Customizing Quote Request Forms" }
      ]
    },
    "upload-images": {
      title: "Uploading & Managing Images",
      time: "4 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Image Requirements",
          description: "Before uploading, ensure your images meet these requirements: File formats supported: JPG, PNG, WebP (most common image types), Maximum file size: 5MB per image, Recommended size: Under 500KB for optimal page speed, Minimum dimensions: 800x600 pixels for quality display, Aspect ratio: 16:9 or 4:3 works best for most sections. Images that don't meet these requirements will either be rejected or cause slow page loading.",
          warnings: ["Files over 5MB will be rejected. Compress large images before uploading."]
        },
        {
          title: "Where to Upload Images",
          description: "You can upload images in three main areas of your website: Hero Section - Background image or banner (1920x1080 recommended), Gallery Section - Project photos, before/after shots (up to 10 images), and Service Icons - Optional visual for each service (512x512 recommended). Each upload area is accessed through the Website Editor dashboard.",
        },
        {
          title: "Uploading an Image - Step by Step",
          description: "Navigate to Dashboard → Website Editor, expand the section where you want to add an image (e.g., Gallery), click the element you want to edit or click '+' to add new, in the Edit panel, click the upload area (it says 'Click to upload image'), select your image file from your computer, wait for the upload progress (usually 2-10 seconds), add Alt Text describing the image, and click 'Save Changes'. The image appears in the preview immediately.",
          tips: ["Upload multiple images in one session by adding them one at a time before closing the editor"]
        },
        {
          title: "Preparing Images Before Upload",
          description: "For best results, prepare your images before uploading: Crop and Resize - Use free tools like Canva, Photoshop, or online editors to crop to the right dimensions. Compress - Use TinyPNG.com, Squoosh.app, or similar to reduce file size without losing quality. Adjust Brightness - Ensure images are well-lit and clear. Remove Backgrounds - For service icons, consider transparent backgrounds (PNG format). Proper preparation ensures fast page loads and professional appearance.",
          tips: [
            "Target 200-400KB per image after compression",
            "Brightness adjustments can make mediocre photos look professional"
          ]
        },
        {
          title: "Adding Alt Text (Accessibility)",
          description: "Alt Text is a description of your image for screen readers (used by visually impaired visitors) and search engines. After uploading an image: Enter a brief description in the 'Alt Text' field (e.g., 'Plumber installing new kitchen sink'), be specific and descriptive, avoid 'image of' or 'picture of' (just describe what's shown), and keep it under 125 characters. Alt Text improves both accessibility and SEO.",
          tips: [
            "Good: 'Completed bathroom renovation with white tiles and chrome fixtures'",
            "Bad: 'IMG_1234' or 'bathroom'"
          ]
        },
        {
          title: "Replacing Existing Images",
          description: "To replace an image that's already on your website: Find the image element in the Website Editor, click on it to open the Edit panel, click the current image preview (a small 'X' button appears), click 'X' to remove the current image, upload your new image as described earlier, add Alt Text, and save. The old image is permanently replaced with the new one.",
          warnings: ["Replacing an image cannot be undone. Keep backups of important images offline."]
        },
        {
          title: "Managing Gallery Images",
          description: "The Gallery section can hold up to 10 images. To manage gallery images: View all gallery images by expanding the Gallery section in the editor, to add: Click '+' button (if under 10 images), upload and save, to remove: Click 'X' button next to the image element, confirm deletion, to reorder: Currently not supported—images appear in the order uploaded. Gallery management is straightforward but limited to 10 images for performance.",
          tips: ["If you need to reorder gallery images, delete all and re-upload in your desired order"]
        },
        {
          title: "Image Upload Errors and Solutions",
          description: "Common upload errors and how to fix them: 'File too large' - Compress image using TinyPNG or similar tool. 'Invalid file type' - Convert to JPG or PNG format. 'Upload failed' - Check internet connection, try again. 'Image not appearing' - Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R), refresh preview. 'Image looks blurry' - Upload higher resolution image (min 800px width). Most issues relate to file size or format.",
        },
        {
          title: "Image Storage and Limits",
          description: "Uploaded images are stored securely in cloud storage (Google Cloud Storage). There's no total storage limit per business, but individual image limits apply: Max 5MB per image, Max 10 images in gallery, Unlimited hero/service images (one per section/service). Images remain stored unless you manually delete them via the Website Editor.",
          tips: ["Delete unused images to keep your editor organized"]
        },
        {
          title: "Image Best Practices for Service Businesses",
          description: "Before/After Photos - Show transformation, extremely persuasive. Action Shots - Your team working, builds trust and professionalism. Completed Projects - Finished work from multiple angles. Equipment - Modern tools show you're up-to-date. Customer Interactions - You with happy clients (get permission first). Location Shots - Your service area, office, or van with branding. Quality over Quantity - 6 great photos beat 20 mediocre ones. Consistency - Similar lighting, style, and quality across images.",
        },
        {
          title: "Mobile Image Optimization",
          description: "Images automatically resize for mobile devices, but you can optimize further: Use landscape orientation (horizontal) - Works better on phone screens. Avoid text in images - Hard to read on small screens. Keep faces/subjects centered - Won't be cropped awkwardly. Test on mobile - View your site on a phone after uploading. Mobile users are over 60% of traffic, so mobile-optimized images are crucial.",
        },
        {
          title: "Copyright and Image Usage",
          description: "Only upload images you have rights to use: Your own photos - Always safe. Stock photos - Only from free sites (Unsplash, Pexels) with proper licenses. Customer photos - Get written permission before posting. Competitor photos - Never copy from other business websites. Violating copyright can result in legal issues and damage your reputation. When in doubt, take your own photos or hire a photographer.",
          warnings: ["Using copyrighted images without permission is illegal and can result in lawsuits."]
        }
      ],
      relatedArticles: [
        { id: "website-editor", title: "Using the Website Editor" },
        { id: "website-sections", title: "Understanding Website Sections" }
      ]
    },
    "quote-forms": {
      title: "Customizing Quote Request Forms",
      time: "5 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Understanding Quote Request Forms",
          description: "Quote request forms appear on your website and allow customers to request quotes for your services. When a customer fills out the form: They describe the work they need, provide contact information, select a service (if you have multiple), and submit the request. You receive the lead in your dashboard and can create a formal quote. The form is your primary lead generation tool.",
        },
        {
          title: "Where Quote Forms Appear",
          description: "Quote request forms are embedded in multiple locations on your website for maximum visibility: Homepage Hero Section - 'Get a Quote' button opens the form in a modal, Contact Section - Inline form at the bottom of your landing page, and Direct Quote Page - Accessible at yourbusiness.com/quote. The same form appears in all locations with consistent fields and branding.",
          tips: ["The more prominent your quote form, the more leads you'll capture"]
        },
        {
          title: "Default Form Fields",
          description: "Every quote request form includes these standard fields: Full Name (required), Email Address (required), Phone Number (required), Service Selection (dropdown of your services), Project Description (text area for customer to describe work needed), and Service Address (optional location field). These fields cannot be removed as they're essential for quote generation.",
        },
        {
          title: "Adding Custom Questions Per Service",
          description: "You can add service-specific questions to gather detailed information upfront. To add custom questions: Navigate to Dashboard → Services, click 'Edit' on the service you want to customize, scroll to 'Customer Questions' section, click 'Add Question', configure the question (see next step), and save. Custom questions only appear when that service is selected in the form.",
          tips: [
            "Custom questions reduce back-and-forth and help you create accurate quotes",
            "Ask for information you always need: property size, materials, timeframe, etc."
          ]
        },
        {
          title: "Configuring Custom Questions",
          description: "For each custom question, you configure: Question Text (what you're asking, e.g., 'What is the size of the area in square meters?'), Question Type (text, number, or select/dropdown), Required (Yes/No toggle—forces customer to answer before submitting), and Options (for select type only—list the dropdown choices). Example: Type: Number, Text: 'Property size in square meters', Required: Yes.",
          tips: [
            "Use 'Number' type for quantities, sizes, budgets",
            "Use 'Select' type when there are limited options (e.g., 'Floor type: Tile, Wood, Carpet')",
            "Use 'Text' for open-ended details"
          ]
        },
        {
          title: "Required vs Optional Questions",
          description: "Required Questions: Customer cannot submit form without answering, use for critical information you need to create a quote, shown with a red asterisk (*). Optional Questions: Customer can skip, use for nice-to-have information that helps but isn't essential, no asterisk. Balance is key—too many required questions reduce form completions. Aim for 3-5 required fields total (including default fields).",
          warnings: ["Every additional required field reduces form completion rate by ~5-10%"]
        },
        {
          title: "Example Custom Questions by Industry",
          description: "Plumbing: 'Number of fixtures needing repair' (Number, Required), 'Is this an emergency?' (Select: Yes/No, Required). Tiling: 'Floor area in square meters' (Number, Required), 'Tile type preference' (Select: Ceramic/Porcelain/Natural Stone, Optional). Landscaping: 'Garden size in square meters' (Number, Required), 'Preferred plants or style' (Text, Optional). Electrical: 'Type of electrical work' (Select: Installation/Repair/Inspection, Required), 'Number of outlets/switches' (Number, Optional). Tailor questions to information you typically ask customers.",
        },
        {
          title: "Form Submission Flow",
          description: "When a customer submits a quote request: Form validates all required fields are filled, customer information is saved as a new Lead contact, quote request is created with status 'AI Quote' or 'Draft', you receive an email notification (if enabled), customer receives confirmation email, and the lead appears in your Dashboard → Contacts and Dashboard → Quotes. The customer can also optionally book an appointment if you have calendar booking enabled.",
        },
        {
          title: "Form Branding and Appearance",
          description: "Quote forms automatically inherit your business branding: Business name appears in form header, Your logo displays (if uploaded), Form colors match your website theme, Form is mobile-responsive and looks professional on all devices. You cannot currently customize form styling beyond your overall business branding settings, but the form design is optimized for conversions.",
        },
        {
          title: "Testing Your Quote Form",
          description: "After adding custom questions, test the form: Open your website in an incognito/private browser window (to see it as a customer), click 'Get a Quote' or navigate to /quote, select the service with custom questions, verify questions appear correctly, fill out and submit a test request, check that it appears in your dashboard. Delete test submissions after verification.",
          tips: ["Test on both desktop and mobile to ensure good experience"]
        },
        {
          title: "Form Conversion Optimization Tips",
          description: "To increase quote request submissions: Keep it short - Only ask essential questions. Be clear - Use simple, jargon-free language. Show trust signals - Display reviews or credentials near the form. Make CTA prominent - 'Get Free Quote' buttons should stand out. Remove friction - Don't ask for information you don't need. Provide instant confirmation - Send immediate email receipt. Respond quickly - Aim to quote within 24 hours (ideally same day). A/B test - Try different CTA button text and see what converts better.",
        },
        {
          title: "Form Analytics and Tracking",
          description: "Monitor form performance in Dashboard → Insights: Form Views - How many people saw the quote form, Form Starts - How many began filling it out, Form Submissions - How many completed and submitted, Conversion Rate - (Submissions / Views) × 100, and Lead Source - Track which page the form was on (homepage vs /quote vs contact). Use this data to optimize form placement and questions.",
          tips: [
            "If conversion rate is below 20%, you may be asking too many questions",
            "If form views are low, make the 'Get Quote' button more visible"
          ]
        }
      ],
      relatedArticles: [
        { id: "website-editor", title: "Using the Website Editor" },
        { id: "custom-domain", title: "Setting Up a Custom Domain" }
      ]
    },
    "custom-domain": {
      title: "Setting Up a Custom Domain",
      time: "8 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "What is a Custom Domain?",
          description: "A custom domain is your own branded web address (e.g., yourcompany.co.za) instead of the default replit.app URL. Custom domains: Make your business look professional, Build brand recognition and trust, Improve SEO and search rankings, Are easier for customers to remember and share. You must purchase a domain from a registrar (Namecheap, GoDaddy, etc.) before connecting it to your website.",
        },
        {
          title: "Domain Types Supported",
          description: "The system supports two types of custom domain configurations: Full Website Domain - Your entire website loads at yourbusiness.co.za (recommended for most businesses). Quote Subdomain Only - Only the quote request page loads at quote.yourbusiness.co.za (useful if you already have a main website elsewhere). You can only have one domain of each type per business.",
          tips: ["Most businesses should use 'Full Website Domain' for complete control and branding"]
        },
        {
          title: "Purchasing a Domain",
          description: "Before you can connect a custom domain, you must buy one from a domain registrar. Popular registrars for South African businesses: Namecheap.com - $10-15/year for .co.za domains, GoDaddy.com - R150-250/year, Afrihost.com - R89-149/year, Domain.co.za - R75-120/year. Recommended: Purchase a .co.za domain if you serve South African customers (better for local SEO). Avoid expensive premium domains—a simple, relevant domain works best.",
        },
        {
          title: "Adding Your Domain in Settings",
          description: "Once you own a domain, connect it to your website: Navigate to Dashboard → Settings → Custom Domain tab, select domain type: 'Full website' or 'Quote page only', enter your domain name (e.g., myplumbing.co.za) in the input field—no http:// or www, click 'Add Domain', the system generates DNS instructions and a verification token. Your domain is now registered in the system with status 'Pending' until DNS is verified.",
          warnings: ["You can only add one full domain and one quote subdomain. Remove existing domains before adding new ones."]
        },
        {
          title: "Understanding DNS Records",
          description: "DNS (Domain Name System) records tell the internet where your website is hosted. You'll need to add two types of records: A Record - Points your domain to our server's IP address (makes your domain load our website). TXT Record - Proves you own the domain (security verification). These records are added at your domain registrar (where you bought the domain), not in our system.",
        },
        {
          title: "Getting Your DNS Instructions",
          description: "After adding your domain in settings, you'll see DNS configuration instructions with: Server IP Address - The IP where your website is hosted (copy this exactly), Verification Token - A unique 64-character code proving domain ownership. Keep these instructions open while you configure DNS at your registrar. You can also click 'View Instructions' anytime to see them again.",
        },
        {
          title: "Adding A Record at Your Registrar",
          description: "Log into your domain registrar (Namecheap, GoDaddy, etc.), find the DNS settings page (usually under 'Domain Management' or 'DNS'), add a new A Record with these settings: Type: A, Name/Host: @ (this represents your root domain), Value/Points to: The Server IP from your instructions, TTL: 3600 (or 'Automatic'). Save the record. This makes yourbusiness.co.za point to our server.",
          tips: [
            "If you want www.yourbusiness.co.za to also work, add a second A record with Name: www",
            "Some registrars call 'Name' the 'Host' field instead"
          ]
        },
        {
          title: "Adding TXT Record for Verification",
          description: "Still in your registrar's DNS settings, add a TXT Record with: Type: TXT, Name/Host: _verification (underscore + verification), Value/TXT Value: Your verification token from instructions (64-character code), TTL: 3600. Save the record. This proves you own the domain and prevents unauthorized use.",
          warnings: ["Copy the verification token exactly—one wrong character will cause verification to fail."]
        },
        {
          title: "DNS Propagation Wait Time",
          description: "After adding DNS records, you must wait for propagation (DNS updates spreading across the internet). Typical wait times: Minimum: 15-30 minutes, Average: 1-4 hours, Maximum: 24-48 hours (rare). During this time, your domain won't work yet—this is normal. You can check propagation status using tools like whatsmydns.net or dnschecker.org.",
          tips: ["Don't panic if it doesn't work immediately. Wait at least 1 hour before troubleshooting."]
        },
        {
          title: "Verifying Your Domain",
          description: "Once DNS has propagated (wait at least 30-60 minutes), verify your domain in settings: Go to Dashboard → Settings → Custom Domain, find your domain in the list (status: Pending), click 'Verify DNS' button. The system checks: If A record points to our server IP, if TXT record contains your verification token. If both pass, status changes to 'Verified' and your domain becomes active. If verification fails, see troubleshooting steps.",
          tips: ["If verification fails, wait another hour and try again—DNS can take time to propagate."]
        },
        {
          title: "SSL Certificate (HTTPS)",
          description: "After DNS verification succeeds, an SSL certificate is automatically provisioned for your domain. This enables HTTPS (the padlock in the browser). SSL provisioning: Starts automatically after verification, takes 5-30 minutes to complete, is free and renews automatically. Once SSL is active, your domain loads securely at https://yourbusiness.co.za. No action required from you.",
          warnings: ["Do not use Cloudflare's 'Proxy' feature—it interferes with SSL provisioning. Use 'DNS Only' mode."]
        },
        {
          title: "Testing Your Custom Domain",
          description: "After verification and SSL provisioning: Open a new browser tab (or incognito window), type your domain: https://yourbusiness.co.za, your website should load with all branding and content, check the padlock icon (SSL active), test on mobile device as well, click through all pages to ensure everything works. If your site loads correctly, congratulations—your custom domain is live!",
        },
        {
          title: "Troubleshooting: Verification Failed",
          description: "If DNS verification fails, check these common issues: Wrong IP Address - Verify A record value matches the server IP exactly. Missing TXT Record - Ensure _verification TXT record exists with correct token. DNS Not Propagated - Wait longer (up to 24 hours), then retry verification. Multiple A Records - Remove old A records pointing to other IPs. Cloudflare Proxy Enabled - Disable proxy (use 'DNS Only'). Wrong Name/Host - A record should be '@' not 'www' or blank. After fixing issues, wait 15-30 minutes and click 'Verify DNS' again.",
        },
        {
          title: "Troubleshooting: Domain Verified But Not Loading",
          description: "If verification succeeded but your domain doesn't load your website: Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R), try in incognito/private window, wait for SSL to provision (can take 30 minutes after verification), check if you added www. A record (if using www.yourbusiness.co.za), confirm no conflicting DNS records at registrar, check our server status (in case of rare outages). If problems persist after 1 hour, contact support.",
        },
        {
          title: "Changing or Removing Your Domain",
          description: "To remove a custom domain: Go to Dashboard → Settings → Custom Domain, find your domain, click 'Remove Domain', confirm deletion. The domain is unlinked immediately and your website returns to the default replit.app URL. Your registrar still owns the domain—removing it here just disconnects it from our system. To change domains: Remove old domain first, then add new domain and repeat DNS setup.",
          warnings: ["Removing a domain is immediate. Customers visiting the old domain will see an error."]
        },
        {
          title: "Domain Best Practices",
          description: "Choose a short, memorable domain - yourname.co.za beats yourname-and-sons-plumbing-services.co.za. Use your business name - Brand consistency builds recognition. Prefer .co.za - Better for South African SEO and trust. Avoid hyphens and numbers - Hard to communicate verbally. Keep it professional - Avoid slang or jokes. Renew annually - Set reminders so your domain doesn't expire. Update everywhere - Change domain on business cards, Google My Business, social media. Monitor uptime - Use a tool like UptimeRobot to alert you if your site goes down.",
        }
      ],
      relatedArticles: [
        { id: "website-editor", title: "Using the Website Editor" },
        { id: "quote-forms", title: "Customizing Quote Request Forms" }
      ]
    }
  },
  "invoicing": {
    "invoice-generation": {
      title: "Generating Invoices",
      time: "6 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Understanding Invoice Types",
          description: "The system supports three types of invoices: Standard (regular payment invoice for completed work), Deposit (partial payment required before work begins), and Final (balance due after deposit has been paid). Most invoices are generated automatically when jobs are completed.",
          tips: ["Deposit invoices are created automatically when a customer accepts a quote with deposit requirements"]
        },
        {
          title: "Automatic Invoice Generation",
          description: "When you mark a job as 'Completed', the system automatically generates an invoice based on the job details. The invoice inherits: Job title and description, Customer information, All line items from the job, Location address, Job total amount. If the job had a deposit invoice, the final invoice shows the deposit credit and balance due.",
          tips: ["Let the system auto-generate invoices from completed jobs to save time and ensure accuracy"]
        },
        {
          title: "Manual Invoice Creation - Navigate to Invoices",
          description: "From your dashboard, click 'Invoices' in the main sidebar menu, then click the '+ New Invoice' button in the top right corner to open the invoice creation form.",
        },
        {
          title: "Select Customer",
          description: "Use the 'Customer' dropdown to search and select an existing contact. You can search by name, email, or phone number. The customer field is required - you cannot create an invoice without selecting a customer.",
          warnings: ["If the customer doesn't exist, create them first in the Contacts section before creating the invoice"]
        },
        {
          title: "Link to Job (Optional but Recommended)",
          description: "If this invoice is for a completed job, select it from the 'Linked Job' dropdown. When you link a job: The invoice title is pre-filled from the job title, Location address is copied from the job, Line items are automatically imported from the job, Invoice total matches the job total. This saves time and ensures accuracy.",
          tips: [
            "Linking to a job creates a clear audit trail from quote → job → invoice",
            "Line items from the linked job can still be edited if needed"
          ]
        },
        {
          title: "Set Invoice Title (Optional)",
          description: "Add a descriptive title for the invoice (e.g., 'Kitchen Renovation - Final Payment', 'Emergency Plumbing Repair'). If you linked a job, the title is pre-filled but can be customized. The title appears prominently on the invoice and helps customers understand what they're paying for.",
          tips: ["Use clear, customer-friendly titles that describe the work performed"]
        },
        {
          title: "Configure Payment Terms",
          description: "Set the due date using the date picker (determines when payment is expected), and select the preferred payment method from the dropdown: Cash, Card, Bank Transfer, or Other. The due date affects overdue tracking and payment reminders.",
          tips: [
            "Standard payment terms are typically 7-30 days from invoice date",
            "For immediate payment, set due date to today's date"
          ]
        },
        {
          title: "Add Line Items",
          description: "Line items detail exactly what the customer is paying for. For each line item, you must: Enter a description (required - what was provided/done), specify quantity (default: 1 - how many units), enter unit price in Rands (the price per unit), and review the automatically calculated line total (quantity × unit price). Click 'Add Item' to add more line items. Use the trash icon to remove unwanted items.",
          tips: [
            "Be specific in descriptions: 'Replace 3 broken windows' is better than 'Window work'",
            "Break down complex jobs into multiple line items for clarity",
            "Line items from linked jobs are pre-populated but can be edited"
          ]
        },
        {
          title: "Configure Tax/VAT",
          description: "Enter the tax percentage in the 'Tax/VAT (%)' field (default: 15% for South African VAT). The system automatically calculates the tax amount based on the subtotal. The tax calculation is: Subtotal (sum of all line items) × Tax percentage = Tax amount.",
          tips: ["Adjust the percentage to 0% if the service is VAT-exempt or you're not VAT-registered"]
        },
        {
          title: "Add Service Location (Optional)",
          description: "Use the Address Autocomplete field to specify where the work was performed. Start typing the address and select from Google Maps suggestions for accuracy. The address appears on the invoice and helps with record-keeping and tax purposes.",
        },
        {
          title: "Review Invoice Totals",
          description: "Before saving, verify the invoice summary displayed on the right side: Subtotal (sum of all line items), Tax Amount (calculated automatically), Total Amount (subtotal + tax). These calculations are automatic and update in real-time as you edit line items or tax percentage.",
          warnings: ["Always verify the total amount before sending to customer"]
        },
        {
          title: "Add Notes (Optional)",
          description: "Use the Notes field to include: Payment instructions (bank details, payment methods), Terms and conditions (late fees, payment terms), Thank you message, Special conditions or discounts. Notes appear at the bottom of the invoice PDF and emails.",
          tips: ["Include your bank account details if you accept bank transfers"]
        },
        {
          title: "Save the Invoice",
          description: "You have three save options at the bottom of the form: Cancel (discard changes and return to invoices list), Save as Draft (save without sending - invoice status = 'draft'), or Create & Send (save and immediately email to customer - invoice status = 'sent'). Drafts can be edited later before sending.",
          tips: [
            "Use 'Save as Draft' if you need to verify details before sending",
            "Use 'Create & Send' when you're ready to request payment immediately"
          ]
        },
        {
          title: "Verify Invoice Creation",
          description: "After saving, you're returned to the Invoices page where your new invoice appears in the list. The invoice number (e.g., INV-2025-0001) is automatically generated. You can click on the invoice to view details, click the eye icon to preview the PDF, or use the actions menu for additional options.",
        }
      ],
      relatedArticles: [
        { id: "send-invoice", title: "Sending Invoices to Customers" },
        { id: "deposit-invoices", title: "Working with Deposit Invoices" },
        { id: "payment-tracking", title: "Tracking Invoice Payments" }
      ]
    },
    "send-invoice": {
      title: "Sending Invoices to Customers",
      time: "4 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Understanding Invoice Sending",
          description: "Sending an invoice notifies your customer that payment is due and provides them with a professional payment document. When you send an invoice: The customer receives an email with the invoice attached as a PDF, A public viewing link is included so they can view the invoice online, The invoice status changes from 'draft' to 'sent', The sent date is recorded for tracking purposes.",
          tips: ["Only send invoices when they're complete and verified - changes after sending can confuse customers"]
        },
        {
          title: "Sending During Invoice Creation",
          description: "When creating a new invoice, you can send it immediately by clicking 'Create & Send' instead of 'Save as Draft'. This will: Create the invoice, Generate the invoice number and PDF, Send the email notification to the customer, Set the invoice status to 'sent'. The customer receives the email within minutes.",
          tips: ["Use this option when you're confident the invoice details are correct"]
        },
        {
          title: "Sending a Draft Invoice",
          description: "To send an invoice that was previously saved as a draft: Navigate to Dashboard → Invoices, find the invoice with status 'DRAFT', click the three-dot menu (⋮) on the invoice row, and select 'Send to customer' from the dropdown menu.",
        },
        {
          title: "Confirm Send Action",
          description: "After clicking 'Send to customer', the system will: Verify that the customer has a valid email address (required), Generate a unique public viewing link (token) for the invoice, Queue the invoice email for sending, Update the invoice status to 'sent', Record the sent timestamp. You'll see a success message when the email is queued.",
          warnings: ["Ensure the customer's email address is correct before sending - you cannot unsend an invoice"]
        },
        {
          title: "What the Customer Receives",
          description: "The customer receives a professional email notification containing: Your business name and branding, Invoice number and amount due, Payment due date, A 'View Invoice' button linking to the online invoice, Breakdown of charges (line items), Payment instructions from your invoice notes, Your contact information for questions. The email uses a responsive template that looks great on mobile and desktop.",
        },
        {
          title: "Public Invoice View",
          description: "The customer can click the 'View Invoice' link to access a public, read-only version of the invoice in their browser. They don't need to log in or create an account. The public view shows: Complete invoice details (line items, totals, dates), Your business information and branding, Payment instructions, Option to download as PDF. The link is secure and unique to this invoice.",
          tips: ["The public link never expires but is impossible to guess without the unique token"]
        },
        {
          title: "Email Delivery Tracking",
          description: "After sending, you can track email delivery: Go to Dashboard → Invoices, find the sent invoice, check the 'Sent At' timestamp to see when the email was queued, and look for the 'sent' status badge. The system queues emails and processes them automatically. Most emails are delivered within 5 minutes.",
        },
        {
          title: "Resending an Invoice",
          description: "If the customer didn't receive the invoice or needs another copy: Navigate to the invoice in Dashboard → Invoices, click the actions menu (⋮), select 'Send to customer' again. The system will send a fresh email with the same invoice details. There's no limit to how many times you can resend.",
          tips: [
            "Always ask the customer to check their spam folder before resending",
            "Wait at least 10 minutes for email delivery before resending"
          ]
        },
        {
          title: "Multi-Channel Notifications (WhatsApp)",
          description: "If you have WhatsApp integration enabled and the customer has opted in: The customer also receives a WhatsApp notification with the invoice link, This works alongside the email notification for better reach, The WhatsApp message includes: Invoice number, Amount due, Payment deadline, Link to view invoice online.",
          tips: ["Enable WhatsApp in Settings → Communication to offer customers more convenient notifications"]
        },
        {
          title: "Editing Sent Invoices",
          description: "Once an invoice is sent, you cannot edit it directly to maintain audit integrity. If you need to make changes: Create a new invoice with the corrected details, Cancel the old invoice (mark as cancelled), Send the new invoice to the customer, Explain the correction in the notes or in a separate communication.",
          warnings: ["Frequent invoice corrections can damage customer trust - always verify before sending"]
        },
        {
          title: "Invoice Email Customization",
          description: "The invoice email automatically includes: Your business name as the sender, Your configured sender email address (set in Settings → Email), Professional email template with your branding, Payment instructions from your Settings or invoice notes. To customize the sender information, go to Settings → Email Configuration and update your sender name and email address.",
        }
      ],
      relatedArticles: [
        { id: "invoice-generation", title: "Generating Invoices" },
        { id: "payment-reminders", title: "Sending Payment Reminders" },
        { id: "mark-paid", title: "Recording Payments" }
      ]
    },
    "deposit-invoices": {
      title: "Working with Deposit Invoices",
      time: "7 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Understanding Deposit Invoices",
          description: "Deposit invoices are partial payment requests sent before work begins. They help protect your business from no-shows and ensure customer commitment. In the system: Deposit invoices are type 'DEPOSIT', They're automatically created when a customer accepts a quote with deposit requirements, The deposit amount is calculated as a percentage or fixed amount of the total quote, Final invoices show the deposit as a credit toward the balance.",
        },
        {
          title: "When Deposits Are Required",
          description: "Deposits are typically required for: High-value jobs (to reduce financial risk), Jobs requiring upfront material purchases, First-time customers (to ensure commitment), Jobs in high-demand time slots, Emergency or urgent work. You can configure deposit requirements when creating quotes or set default policies in Settings.",
          tips: ["Industry standard deposit ranges from 25-50% of total job cost"]
        },
        {
          title: "How Deposit Invoices Are Created",
          description: "The deposit invoice creation is automatic: Customer requests a quote through your website, You create and send a quote with 'Require deposit before booking' enabled, Customer accepts the quote, System creates a job with status 'pending_deposit', Deposit invoice is auto-generated and linked to the job (job.depositInvoiceId), Customer receives email with deposit payment link. No manual action needed from you.",
        },
        {
          title: "Viewing Deposit Invoices",
          description: "To see all deposit invoices: Navigate to Dashboard → Invoices, use the 'Filter by type' dropdown, select 'Deposit', and the list shows only deposit invoices. Each deposit invoice displays: Type badge: 'DEPOSIT' in purple, Customer name, Deposit amount (e.g., R300 for 30% of R1000), Due date (typically the job's deposit deadline), Status (draft, sent, paid, cancelled).",
        },
        {
          title: "Deposit Invoice Details",
          description: "Deposit invoices contain specific information: Invoice Type: 'deposit', Deposit Amount: The partial payment required (e.g., R300), Related Quote: Link to the original quote (quoteId), Related Job: Link to the pending job (via job.depositInvoiceId), Due Date: Deadline for deposit payment, Line Items: Shows deposit as a line item with description. The invoice clearly states 'DEPOSIT PAYMENT' in the title.",
        },
        {
          title: "Customer Deposit Payment Process",
          description: "From the customer's perspective: They receive the deposit invoice via email/WhatsApp after accepting the quote, Click 'View Invoice' to see the deposit payment request, See the deposit amount and deadline clearly displayed, Make payment using your specified method (bank transfer, cash, card), You mark the deposit as paid once you confirm receipt. The invoice includes urgency messaging if the deadline is approaching.",
        },
        {
          title: "Recording Deposit Payment",
          description: "When the customer pays the deposit: Navigate to Dashboard → Invoices, filter by type = 'Deposit' or status = 'Sent', find the deposit invoice, click the actions menu (⋮) → 'Mark as paid', select the payment date (when you received it), choose the payment method (cash, card, bank transfer), and click 'Mark as Paid'. The system automatically: Updates invoice status to 'paid', Sets job.depositPaid = true, Changes job status from 'pending_deposit' to 'deposit_paid', Sends confirmation to customer.",
          tips: ["Record payment as soon as you receive it to trigger the next steps in the workflow"]
        },
        {
          title: "What Happens After Deposit Payment",
          description: "Once the deposit is marked as paid: Job status changes to 'deposit_paid' (eligible for scheduling), Customer receives deposit receipt confirmation email/WhatsApp, The job becomes visible in your calendar for scheduling, You can now book the appointment with confidence, The deposit amount is tracked for the final invoice. The customer can proceed to select their preferred appointment slot.",
        },
        {
          title: "Unpaid Deposit Management",
          description: "If a deposit isn't paid by the deadline, you have options: Send manual reminder (Actions → 'Send Deposit Reminder'), Extend the deadline (Actions → 'Extend Deadline'), Waive the deposit (Actions → 'Waive Deposit' - job proceeds without payment), Cancel the booking (Actions → 'Cancel Booking (Unpaid)' - job and invoice cancelled). Automated reminders are sent based on your Settings → Deposit Policies configuration.",
        },
        {
          title: "Final Invoice with Deposit Credit",
          description: "When the job is completed, the final invoice automatically accounts for the deposit: Invoice Type: 'final' (not 'standard'), Shows original total amount, Displays deposit amount already paid, Calculates and shows balance due (total - deposit), Links to the original deposit invoice (linkedDepositInvoiceId). Example: Total Job: R1,000, Deposit Paid: R300, Balance Due: R700 (this is what the customer owes).",
        },
        {
          title: "Deposit Invoice Reporting",
          description: "Track deposit performance: Dashboard → Invoices → Filter by type = 'Deposit', view metrics like: Total deposits collected this month, Pending deposits (not yet paid), Overdue deposits (past deadline), Deposit compliance rate (% paid on time). Use these insights to refine your deposit policies and improve cash flow.",
        },
        {
          title: "Configuring Deposit Policies",
          description: "Customize deposit behavior in Settings → Deposit Policies: Require deposits by default (ON/OFF toggle), Default deposit percentage (e.g., 30%), Cancellation mode (Auto or Manual), Cancellation threshold (hours before auto-cancel), Reminder schedule (hours before deadline to send reminders). These settings apply to all new quotes unless overridden.",
          tips: ["Start with 30% deposit and adjust based on your industry and risk tolerance"]
        }
      ],
      relatedArticles: [
        { id: "invoice-generation", title: "Generating Invoices" },
        { id: "payment-tracking", title: "Tracking Invoice Payments" },
        { id: "mark-paid", title: "Recording Payments" }
      ]
    },
    "payment-tracking": {
      title: "Tracking Invoice Payments",
      time: "5 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Understanding Payment Tracking",
          description: "Payment tracking helps you monitor which invoices have been paid, which are pending, and which are overdue. The system automatically tracks: Invoice status (draft, sent, paid, overdue, cancelled), Payment dates and methods, Outstanding balances, Days overdue for unpaid invoices. This ensures you always know your accounts receivable position.",
        },
        {
          title: "Invoice Status Indicators",
          description: "Each invoice has a color-coded status badge indicating its payment state: DRAFT (gray) - Invoice created but not sent to customer, SENT (blue) - Invoice sent, payment pending, PAID (green) - Payment received and recorded, OVERDUE (red) - Past due date with outstanding balance, CANCELLED (orange) - Invoice voided or superseded. The status appears on the invoice list and updates automatically.",
        },
        {
          title: "Viewing All Invoices",
          description: "Navigate to Dashboard → Invoices to see your complete invoice list. The page displays: Invoice number (e.g., INV-2025-0001), Customer name, Invoice type (Standard, Deposit, Final), Amount or balance due, Current status badge, Created date, Due date (highlighted red if overdue). You can sort and filter this list to focus on specific invoices.",
        },
        {
          title: "Filtering Invoices by Status",
          description: "Use the status filter to view specific invoice groups: Click 'All Statuses' dropdown at the top, check the statuses you want to see (Draft, Sent, Paid, Overdue, Cancelled), click outside to apply the filter. The list updates to show only matching invoices. This helps you focus on actionable items like overdue invoices requiring follow-up.",
          tips: [
            "Filter to 'Sent' and 'Overdue' to see all unpaid invoices requiring attention",
            "Filter to 'Paid' to review completed transactions"
          ]
        },
        {
          title: "Understanding Invoice Totals",
          description: "For each invoice type, the amount shown has different meanings: Standard Invoice - Shows total amount due, Deposit Invoice - Shows deposit amount required (partial payment), Final Invoice - Shows balance due after deposit credit (total - deposit already paid). Always verify which type of invoice you're looking at when tracking payments.",
          warnings: ["Don't confuse deposit amounts with total job amounts - they're different values"]
        },
        {
          title: "Monitoring Outstanding Payments",
          description: "The dashboard provides key payment metrics at the top of the Invoices page: Total Outstanding - Sum of all unpaid invoice amounts, Paid This Month - Total payments received this month, Overdue (count and amount) - Invoices past their due date, Average Days to Payment - How long customers typically take to pay. These KPIs update in real-time as invoice statuses change.",
          tips: ["Review these metrics weekly to stay on top of cash flow"]
        },
        {
          title: "Tracking Overdue Invoices",
          description: "Overdue invoices require immediate attention. The system helps you identify them: Invoices automatically become 'OVERDUE' status the day after their due date, Overdue badge shows red color for visibility, Days overdue counter shows how late the payment is (e.g., 'OVERDUE (5d)'), Filter by status = 'Overdue' to see all late payments. The Overdue KPI card shows total overdue amount and count.",
        },
        {
          title: "Payment History Per Customer",
          description: "To view a customer's complete payment history: Go to Dashboard → Contacts, find and click the customer, scroll to the 'Invoices' section in their 360° view. This shows: All invoices for this customer (paid and unpaid), Payment dates for completed invoices, Outstanding balances, Payment patterns (average days to pay). Use this to assess customer payment reliability.",
          tips: ["Customers with slow payment history may require deposits for future work"]
        },
        {
          title: "Searching for Specific Invoices",
          description: "Use the search bar at the top of the Invoices page to find invoices by: Invoice number (e.g., INV-2025-0001), Customer name, Customer email, Customer phone, Linked job number. Search results update in real-time as you type. This is faster than scrolling through long lists.",
        },
        {
          title: "Tracking Payment Methods",
          description: "The system records how each invoice was paid: Cash - Physical cash received, Card - Credit/debit card payment, Bank Transfer - Electronic funds transfer, Other - Alternative payment methods. View payment method on the invoice details page after marking as paid. Use this data to understand customer payment preferences.",
        },
        {
          title: "Exporting Payment Data",
          description: "While the interface doesn't currently have a built-in export button, you can: View all invoices on screen (use filters to narrow the list), take screenshots for record-keeping, contact your administrator for CSV export if needed for accounting software, or use the invoice PDFs as individual payment records. Future updates will include CSV export functionality.",
        },
        {
          title: "Setting Up Payment Reminders",
          description: "Automate payment follow-up to reduce manual tracking: Go to Settings → Payment Reminders, configure 'Payment Reminder Days' (e.g., [3, 7, 14] for reminders at 3, 7, and 14 days after due date), enable automatic reminders. The system will send email/WhatsApp reminders on the scheduled days for unpaid invoices. This reduces the need for manual follow-up.",
          tips: ["Start with conservative reminder schedule and adjust based on customer feedback"]
        }
      ],
      relatedArticles: [
        { id: "invoice-generation", title: "Generating Invoices" },
        { id: "payment-reminders", title: "Sending Payment Reminders" },
        { id: "mark-paid", title: "Recording Payments" }
      ]
    },
    "payment-reminders": {
      title: "Sending Payment Reminders",
      time: "5 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Understanding Payment Reminders",
          description: "Payment reminders are polite notifications sent to customers about outstanding invoices. They help: Reduce overdue payments by prompting customers, Maintain professional customer relationships, Improve cash flow by accelerating collections, Automate follow-up so you don't have to remember. The system supports both manual and automatic reminders.",
        },
        {
          title: "When to Send Reminders",
          description: "Send payment reminders in these situations: Invoice is approaching due date (courtesy reminder), Invoice is 1-3 days overdue (gentle reminder), Invoice is 7+ days overdue (urgent reminder), Invoice is 14+ days overdue (final notice). The tone and urgency increase with each reminder. Always remain professional and polite in your communication.",
          tips: ["Send the first reminder before the due date as a courtesy - this often prevents late payments"]
        },
        {
          title: "Manual Payment Reminder - Single Invoice",
          description: "To send a one-time reminder for a specific invoice: Navigate to Dashboard → Invoices, find the invoice that's sent or overdue (you can only remind on sent/overdue invoices, not drafts), click the three-dot actions menu (⋮) on the invoice row, and select 'Send payment reminder'. The reminder is sent immediately via email and WhatsApp (if enabled).",
        },
        {
          title: "Confirm Reminder Sent",
          description: "After clicking 'Send payment reminder': You'll see a success toast notification, The invoice's 'Reminders Sent' counter increments, The 'Last Reminder Sent At' timestamp updates, The email is queued and typically delivers within 5 minutes. You can send multiple reminders for the same invoice - there's no limit.",
          tips: ["Wait at least 48 hours between manual reminders to avoid annoying customers"]
        },
        {
          title: "What the Customer Receives",
          description: "The payment reminder email includes: Prominent subject line: 'Payment Reminder: Invoice [number]', Days overdue indicator (if applicable), Original invoice amount and due date, Updated link to view the invoice online, Payment instructions, Your business contact information for questions. The email template is professional and non-confrontational.",
        },
        {
          title: "Configuring Automatic Reminders",
          description: "Set up automatic reminders to save time: Navigate to Settings → Payment Reminders, find 'Payment Reminder Days' setting, enter days after due date to send reminders (e.g., [3, 7, 14]), save settings. The system will automatically send reminders at 3 days overdue, 7 days overdue, and 14 days overdue for all unpaid invoices.",
          tips: ["Common reminder schedules: [3, 7, 14] for standard terms, [1, 3, 7] for urgent payments"]
        },
        {
          title: "How Automatic Reminders Work",
          description: "Once configured, the system runs scheduled jobs (typically daily) that: Check all invoices with status 'sent' or 'overdue', Calculate days since due date, Compare to your reminder schedule (e.g., [3, 7, 14]), Send reminders for invoices matching the schedule, Track reminder count to avoid duplicate sends. This happens automatically without manual intervention.",
        },
        {
          title: "Reminder Email Escalation",
          description: "Each reminder level has increasing urgency: First Reminder (3 days overdue) - Polite reminder with payment link, Second Reminder (7 days overdue) - Stronger language emphasizing urgency, Final Reminder (14+ days overdue) - Urgent notice with potential consequences. The email subject line and content reflect the escalation level automatically.",
          warnings: ["Always maintain professional tone even in final reminders - angry messages damage relationships"]
        },
        {
          title: "Multi-Channel Reminders (WhatsApp)",
          description: "If you have WhatsApp integration enabled: Reminders are sent via both email AND WhatsApp, Customers who opted in to WhatsApp receive text notifications, WhatsApp messages are concise with payment link, This increases reminder visibility and response rates. Configure WhatsApp in Settings → Communication Settings.",
          tips: ["WhatsApp has higher open rates than email - enable it for better results"]
        },
        {
          title: "Tracking Reminder History",
          description: "Monitor which reminders were sent: View invoice details page to see 'Reminders Sent' count, Check 'Last Reminder Sent At' timestamp, Review the Activity Log for complete reminder history, Filter invoices by overdue status to see which need follow-up. This helps you avoid over-communicating or missing customers.",
        },
        {
          title: "Extending Due Dates Instead of Reminding",
          description: "Sometimes extending the deadline is more appropriate than sending reminders: Customer has communicated financial difficulty, Unexpected circumstances (natural disaster, personal emergency), Long-term customer with good payment history, Dispute about invoice details needs resolution. To extend: Actions menu → 'Extend due date' → Set new date → Confirm. This stops overdue reminders until the new date.",
        },
        {
          title: "Best Practices for Payment Reminders",
          description: "Follow these guidelines for effective reminders: Always be polite and professional, Send first reminder before due date (courtesy), Space reminders at least 48-72 hours apart, Make payment easy (include link and instructions), Offer to discuss payment plans if needed, Stop reminders if customer communicates they're working on it, Consider phone call for large overdue amounts after 14 days.",
          tips: [
            "Personal phone calls are more effective than automated emails for large outstanding amounts",
            "Document all payment-related conversations in the customer's notes"
          ]
        }
      ],
      relatedArticles: [
        { id: "payment-tracking", title: "Tracking Invoice Payments" },
        { id: "send-invoice", title: "Sending Invoices to Customers" },
        { id: "mark-paid", title: "Recording Payments" }
      ]
    },
    "mark-paid": {
      title: "Recording Payments",
      time: "4 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Understanding Payment Recording",
          description: "Recording payments (marking invoices as paid) is how you confirm that a customer has settled their invoice. When you mark an invoice as paid: Invoice status changes from 'sent' or 'overdue' to 'paid', Payment date and method are recorded for your records, Customer receives a payment receipt confirmation, Invoice no longer appears in outstanding amounts, Job linked to the invoice can be marked complete. Always record payments promptly to keep your financial records accurate.",
        },
        {
          title: "When to Record Payments",
          description: "Mark an invoice as paid immediately after you: Receive cash from the customer, See the bank transfer clear in your account, Process a card payment successfully, Confirm payment through any other method. Don't mark as paid based on customer promises - only actual received funds. Accurate payment recording is critical for cash flow management.",
          warnings: ["Never mark an invoice paid until funds are actually in your account - this prevents accounting errors"]
        },
        {
          title: "Navigate to the Invoice",
          description: "To record a payment: Go to Dashboard → Invoices, find the invoice to mark as paid (filter by status 'Sent' or 'Overdue' to narrow the list), or search by invoice number, customer name, or job number. The invoice must have status 'sent' or 'overdue' - you cannot mark drafts or already-paid invoices as paid.",
        },
        {
          title: "Open Mark as Paid Dialog",
          description: "Once you've found the invoice: Click the three-dot actions menu (⋮) on the invoice row, select 'Mark as paid' from the dropdown menu. A payment recording dialog will open with fields to capture payment details. This dialog ensures you record all necessary information about the transaction.",
        },
        {
          title: "Enter Payment Date",
          description: "In the 'Payment Date' field: Use the date picker to select when you received the payment, Default is today's date, but you can backdate if recording a past payment, Be accurate - this date is used for financial reporting and tax records. The payment date may differ from when you're recording it (e.g., recording a Friday payment on Monday).",
          tips: ["Record the actual date funds were received, not when you're entering the data"]
        },
        {
          title: "Select Payment Method",
          description: "Choose how the customer paid from the 'Payment Method' dropdown: Cash - Physical cash received, Card - Credit or debit card payment, Bank Transfer - Electronic funds transfer (EFT), Other - Alternative methods (mobile money, check, etc.). Tracking payment methods helps you understand customer preferences and simplifies reconciliation.",
          tips: ["Bank transfers should only be marked paid after clearing in your account (allow 1-2 business days)"]
        },
        {
          title: "Review Amount Being Paid",
          description: "The dialog shows the amount that will be marked as paid: For Standard/Deposit invoices - Full invoice amount, For Final invoices - Balance due after deposit credit. Verify this matches the amount you actually received. The amount displayed is not editable - it's pulled from the invoice total or balance due.",
          warnings: ["If the customer paid a different amount (partial payment), you'll need to handle this manually - contact support"]
        },
        {
          title: "Confirm Payment Recording",
          description: "After entering payment date and method: Review all details one more time, click 'Mark as Paid' button to confirm. The system will process the payment immediately and you'll see a success notification. The dialog will close and return you to the invoice list.",
        },
        {
          title: "What Happens When Payment Is Recorded",
          description: "The system automatically performs several actions: Invoice status → 'paid', Invoice.paidAt timestamp is set to your specified date, Invoice.paymentMethod is recorded, Invoice removed from 'Outstanding' and 'Overdue' reports, Payment receipt email sent to customer (with PDF), WhatsApp receipt sent (if enabled), Activity log records 'payment_received' event. For deposit invoices: Job.depositPaid = true and job status updates to 'deposit_paid'.",
        },
        {
          title: "Customer Receipt Notification",
          description: "When you mark an invoice as paid, the customer receives an automatic receipt: Professional email with 'Payment Received' subject, Payment details (date, amount, method), Original invoice reference number, Payment receipt PDF attached, Thank you message, Your contact information. This provides the customer with immediate confirmation and a record for their files.",
        },
        {
          title: "Verifying Payment Recording",
          description: "After recording payment, verify it was successful: The invoice status badge should show 'PAID' in green, 'Paid At' date should display your entered date, Invoice should disappear from 'Sent' or 'Overdue' filters, Dashboard metrics should update (Outstanding reduced, Paid This Month increased). If something looks wrong, contact support immediately - don't re-mark the invoice.",
        },
        {
          title: "Handling Special Cases",
          description: "Special payment situations require different handling: Partial Payment - Not currently supported via UI; contact support for manual handling, Overpayment - Record full payment; note overage in customer notes for future credit, Payment Disputes - Don't mark as paid; work with customer to resolve first, Refunds - Mark original as paid, create credit note invoice with negative amount. Document special cases thoroughly in the customer's notes.",
        },
        {
          title: "Correcting Payment Recording Errors",
          description: "If you accidentally mark the wrong invoice as paid or enter wrong details: You cannot un-mark an invoice as paid via the UI (prevents accounting errors), Contact your administrator or support to reverse the payment, The reversal will: Set status back to 'sent', Clear paidAt and paymentMethod, Create activity log entry documenting the correction. Always double-check before confirming payment.",
          warnings: ["Payment recording is nearly irreversible - always verify invoice details before clicking 'Mark as Paid'"]
        }
      ],
      relatedArticles: [
        { id: "payment-tracking", title: "Tracking Invoice Payments" },
        { id: "invoice-generation", title: "Generating Invoices" },
        { id: "deposit-invoices", title: "Working with Deposit Invoices" }
      ]
    }
  },
  "jobs": {
    "create-job": {
      title: "Creating a Job",
      time: "5 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Navigate to Jobs Page",
          description: "From your dashboard, click 'Jobs' in the main sidebar menu to access the job management area.",
        },
        {
          title: "Click 'New Job' Button",
          description: "In the top right corner of the Jobs page, click the '+ New Job' button to open the job creation form.",
        },
        {
          title: "Select Customer",
          description: "Use the customer search field to find and select an existing contact. You can search by name, email, or phone number. The search updates in real-time as you type.",
          tips: [
            "If the customer doesn't exist, create them first in the Contacts section",
            "The customer field is required - you cannot create a job without selecting a customer"
          ]
        },
        {
          title: "Link a Quote (Optional)",
          description: "If this job is based on an accepted quote, select it from the 'Quote Reference' dropdown. The system will only show quotes that are in 'sent', 'viewed', or 'ai_quote' status for the selected customer. When you select a quote, the job will automatically inherit the quote's details including title, description, location address, and line items.",
          tips: [
            "Linking a quote helps track which jobs came from which estimates",
            "Line items from the quote are automatically copied to the job",
            "You can unlink a quote by clicking 'Clear quote selection'"
          ]
        },
        {
          title: "Enter Job Title",
          description: "Provide a clear, descriptive title for the job (required). For example: 'Kitchen Sink Repair', 'Annual HVAC Maintenance', or 'Bathroom Tile Installation'. This title appears on your calendar and in job lists.",
          tips: ["Use customer-friendly language that clearly describes the work to be done"]
        },
        {
          title: "Select Service Type",
          description: "Choose the type of service from the dropdown menu. Options include: Regular (standard work), Emergency (urgent repairs), Installation (new equipment), Repair (fixing existing systems), Maintenance (routine service), Inspection (assessment visits), Consultation (planning meetings), Quote Visit (site assessment for estimates), Follow-up (return visits), or Other.",
          tips: ["The service type helps with scheduling priority and internal organization"]
        },
        {
          title: "Set Job Priority",
          description: "Assign a priority level to help manage your workload: Low (non-urgent), Medium (standard priority - default), High (important, schedule soon), or Urgent (needs immediate attention).",
          tips: [
            "Priority affects how jobs are sorted in your dashboard",
            "Use 'Urgent' sparingly to maintain its effectiveness"
          ]
        },
        {
          title: "Add Job Description (Optional)",
          description: "Enter detailed notes about the work to be performed. Include specific requirements, customer requests, access instructions, or any special considerations. This description helps your team understand what needs to be done.",
          tips: [
            "Be specific: 'Replace 3 broken windows in living room' is better than 'Window work'",
            "Include any customer preferences or special instructions"
          ]
        },
        {
          title: "Schedule the Job",
          description: "In the Scheduling section, you have two options depending on your setup: If you have configured business calendar hours, use the interactive calendar booking system to select a date and time slot. The calendar shows available time slots based on your business hours, existing bookings, and buffer times. If calendar booking isn't configured, manually enter the scheduled date, start time, end time, and estimated duration using the date and time picker fields.",
          tips: [
            "The calendar automatically prevents double-booking",
            "Buffer times between jobs are respected to allow for travel",
            "You must select a date and time before you can save the job as 'Scheduled'"
          ],
          warnings: [
            "Scheduling is required to move a job from 'Draft' to 'Scheduled' status",
            "Make sure to allow enough time for the job based on its complexity"
          ]
        },
        {
          title: "Add Line Items",
          description: "In the Line Items section, specify what services or products are included in this job. Click 'Add Line Item' to add each service. For each line item, select a service from your catalog (optional), enter a description (required), specify the quantity (default: 1), enter the unit price in Rands (R), and review the automatically calculated line total (quantity × unit price).",
          tips: [
            "Line items help track exactly what work was done and simplify invoicing",
            "You can add multiple line items to break down complex jobs",
            "If you linked a quote, line items are pre-populated from the quote"
          ]
        },
        {
          title: "Specify Job Location",
          description: "Enter the physical address where the work will be performed using the Address Autocomplete field. Start typing the address and select from the suggestions for accuracy. The system uses Google Maps autocomplete to validate addresses.",
          tips: [
            "Accurate addresses help with route planning and map view",
            "The address can be different from the customer's default address if needed"
          ]
        },
        {
          title: "Add Internal Notes (Optional)",
          description: "Use the Internal Notes field to record information that should NOT be visible to the customer. This can include: technician assignments, special tools needed, parts to bring, site access codes, or any private business notes.",
          warnings: ["Internal notes are never shown on customer-facing documents or communications"]
        },
        {
          title: "Save the Job",
          description: "At the bottom of the form, you have three options: Cancel (discard changes and return to jobs list), Save as Draft (save without scheduling - useful for jobs pending final details), or Schedule Job (save with scheduled status - requires date and time to be set). Click your preferred option to complete the job creation.",
          tips: [
            "Draft jobs don't appear on your calendar until they're scheduled",
            "You can return to draft jobs later to add scheduling details"
          ]
        },
        {
          title: "Verify Job Creation",
          description: "After saving, you'll be returned to the Jobs page. Your new job should appear in the list with the appropriate status badge. The job number (e.g., J-2025-0001) is automatically generated. You can click on the job to view full details or edit it.",
        }
      ],
      relatedArticles: [
        { id: "schedule-job", title: "Scheduling Jobs" },
        { id: "job-status", title: "Understanding Job Status" },
        { id: "calendar-view", title: "Using Calendar View" }
      ]
    },
    "schedule-job": {
      title: "Scheduling Jobs",
      time: "4 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Understanding Job Scheduling",
          description: "Job scheduling is the process of assigning a specific date and time to a job. Scheduled jobs appear on your calendar, help you manage your workload, and allow you to optimize routes and avoid double-booking. The system supports both draft jobs (not yet scheduled) and scheduled jobs (with confirmed date/time).",
        },
        {
          title: "Scheduling During Job Creation",
          description: "When creating a new job, scroll to the 'Scheduling' section of the form. If you have configured business hours in Settings → Calendar Booking, you'll see an interactive calendar with available time slots. If not, you'll see manual date and time fields.",
          tips: ["Configure calendar hours in Settings to unlock the visual calendar booking interface"]
        },
        {
          title: "Using the Calendar Booking Interface",
          description: "If calendar booking is enabled, the interface shows: A monthly calendar view with dates that have available slots highlighted, disabled dates (no availability or outside booking window), and when you select a date, available time slots appear as clickable buttons showing start times (e.g., '09:00', '10:30').",
          tips: [
            "Dates are disabled if they fall outside your booking window or have no availability",
            "The system respects your business hours and won't show closed days"
          ]
        },
        {
          title: "Select a Date",
          description: "Click on an available date in the calendar. The date will be highlighted, and the available time slots for that date will appear below the calendar. If no dates appear clickable, check your Calendar Booking settings to ensure business hours are configured.",
          tips: ["You can navigate between months using the arrows at the top of the calendar"]
        },
        {
          title: "Select a Time Slot",
          description: "After selecting a date, review the available time slots displayed as buttons. Each button shows the start time (e.g., '09:00'). The time slot duration is based on your Quote Visit Duration setting (default: 60 minutes). Click on your preferred time slot to select it.",
          tips: [
            "Time slots automatically account for buffer time between appointments",
            "Slots are disabled if they conflict with existing jobs"
          ]
        },
        {
          title: "Review Existing Appointments",
          description: "Below the time slots, you'll see a list of 'Existing Appointments on This Date' (if any). This shows: Job time (start-end), Job title and customer name, Job status badge, and Location address. This helps you avoid conflicts and plan your day efficiently.",
          tips: ["Use this to ensure you're not over-scheduling or creating conflicts"]
        },
        {
          title: "Manual Scheduling (Alternative Method)",
          description: "If calendar booking isn't configured, use the manual fields: Scheduled Date - Click the date picker and select a date, Start Time - Enter the time work will begin (24-hour format), Estimated Duration - Select from dropdown (30 min, 1 hr, 2 hr, 4 hr, Full Day), End Time (Optional) - Automatically calculated or manually entered.",
        },
        {
          title: "Scheduling Considerations",
          description: "When scheduling jobs, consider: Travel time between jobs (use buffer settings in Settings → Calendar Booking), Job complexity and estimated duration, Customer availability and preferences, Technician schedules (if you have multiple team members), Weather conditions for outdoor work, and Parts/equipment availability.",
          tips: ["Allow extra time for first-time customers or complex jobs"]
        },
        {
          title: "Save the Scheduled Job",
          description: "After selecting date and time, click 'Schedule Job' at the bottom of the form. The job status will be set to 'Scheduled' and it will appear on your calendar. The customer will receive a confirmation notification (if enabled in Settings).",
        },
        {
          title: "Rescheduling an Existing Job",
          description: "To change the schedule of an existing job: Navigate to Jobs page, find the job you want to reschedule, click the three-dot menu (⋮) and select 'Edit Job', update the date/time in the Scheduling section, and click 'Schedule Job' to save. The system will send a rescheduling notification to the customer.",
          tips: ["Always communicate schedule changes to customers promptly"],
          warnings: ["Rescheduling a job will trigger new reminder emails based on the new date"]
        },
        {
          title: "Calendar Booking Settings",
          description: "To configure calendar booking for easier scheduling, go to Dashboard → Settings → Calendar Booking. Here you can set: Business Hours (operating hours for each day), Booking Window (how far in advance customers can book), Minimum Notice (minimum hours required before appointments), Time Slot Interval (15, 30, or 60-minute slots), Visit Duration (default appointment length), and Buffer Time (break between appointments).",
          tips: [
            "Proper calendar settings make scheduling faster and prevent conflicts",
            "Review your settings monthly to optimize for your workflow"
          ]
        }
      ],
      relatedArticles: [
        { id: "create-job", title: "Creating a Job" },
        { id: "calendar-view", title: "Using Calendar View" },
        { id: "job-status", title: "Understanding Job Status" }
      ]
    },
    "calendar-view": {
      title: "Using Calendar View",
      time: "4 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Accessing the Calendar",
          description: "Click 'Calendar' in the main sidebar menu to open the calendar view. The calendar displays all your scheduled jobs in a visual timeline format, making it easy to see your workload at a glance and plan your days efficiently.",
        },
        {
          title: "Understanding Calendar Views",
          description: "The calendar offers multiple view options to suit different planning needs: Month View - See your entire month at a glance with color-coded job blocks, Week View - Detailed weekly schedule with hourly time slots, Day View - Focused daily schedule with all job details visible, Agenda View - List format showing upcoming jobs chronologically. Switch between views using the buttons in the top toolbar.",
          tips: [
            "Month view is best for long-term planning",
            "Day view is ideal for managing your current workday",
            "Mobile users default to day view for easier navigation"
          ]
        },
        {
          title: "Calendar Navigation",
          description: "Navigate through dates using: Arrow buttons (< >) at the top - Move forward/backward by your current view (day, week, or month), 'Today' button - Jump back to the current date, Date picker - Click the date display to select any specific date. The current date is always highlighted for quick reference.",
        },
        {
          title: "Reading Job Blocks",
          description: "Each job on the calendar is displayed as a colored block containing: Customer name and job title, Start and end time, Status indicator (color-coded), Location address (if set), and Job type badge (Quote Visit, Regular, etc.). The block size represents the job duration. Colors indicate job status: Blue (Scheduled), Orange (In Progress), Green (Completed), Red (Cancelled), Gray (Draft).",
          tips: ["Hover over a job block to see a quick preview of details"]
        },
        {
          title: "Filtering Jobs",
          description: "Use the filter controls at the top of the calendar to customize what you see: Status Filter - Show only specific job statuses (Scheduled, In Progress, Completed, Cancelled), Job Type Filter - Filter by Quote Visit or Regular Job. Filters help you focus on specific types of work without clutter.",
          tips: [
            "Filter to 'Scheduled' status to see only upcoming work",
            "Use 'In Progress' filter to track active jobs"
          ]
        },
        {
          title: "Viewing Job Details",
          description: "Click on any job block in the calendar to open a detailed popup showing: Full job information (customer, title, description), Scheduled date and time, Service type and priority, Location address, Internal notes, Line items and pricing. From this popup, you can also access quick actions like Edit Job or view customer details.",
        },
        {
          title: "Working Hours Display",
          description: "The calendar respects your business hours configured in Settings. Time slots outside your operating hours are displayed with a gray background, making it easy to see your working window. Special hours (holidays, closures) are also reflected in the calendar view.",
          tips: ["Update business hours in Settings → Calendar Booking if your schedule changes"]
        },
        {
          title: "Current Time Indicator",
          description: "In Day and Week views, a red horizontal line shows the current time. This helps you quickly see: What jobs are coming up next, Whether you're running ahead or behind schedule, How much time remains in your workday. The line automatically scrolls into view when you open the calendar.",
        },
        {
          title: "Mobile Calendar View",
          description: "On mobile devices, the calendar automatically optimizes for smaller screens: Defaults to Day view for better readability, Job blocks show condensed information, Tap a job to see full details, Swipe left/right to navigate between days. All filtering and viewing features remain available on mobile.",
        },
        {
          title: "Calendar Scheduling Workflow",
          description: "The calendar view integrates seamlessly with job creation: From Calendar view, click '+ New Job' to create a job with pre-selected date/time based on what you're viewing, See existing appointments to avoid conflicts, Visually identify gaps in your schedule to optimize bookings. This makes scheduling more efficient than using forms alone.",
          tips: ["Use Calendar view daily to plan your routes and workload"]
        },
        {
          title: "Exporting Calendar Data",
          description: "While the calendar doesn't currently support export, you can: View all jobs in the Jobs page and export from there, Print your calendar view using browser print (Ctrl+P or Cmd+P), Take screenshots for sharing with team members. Future updates will include Google Calendar sync and iCal export.",
        },
        {
          title: "Calendar Best Practices",
          description: "To get the most from calendar view: Review your calendar daily each morning to plan your day, Use color coding (status) to quickly spot issues, Keep business hours up to date for accurate availability, Add location addresses to enable map/routing features, Use filters to focus on specific work types, Schedule buffer time between jobs for travel and breaks.",
          tips: ["A well-maintained calendar is your most powerful scheduling tool"]
        }
      ],
      relatedArticles: [
        { id: "schedule-job", title: "Scheduling Jobs" },
        { id: "create-job", title: "Creating a Job" },
        { id: "job-status", title: "Understanding Job Status" }
      ]
    },
    "job-status": {
      title: "Understanding Job Status",
      time: "5 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Job Status Overview",
          description: "Every job in the system has a status that indicates where it is in the workflow. Job status helps you track progress, manage workload, and ensure nothing falls through the cracks. The status automatically changes as you take actions on the job, and it determines what actions are available.",
        },
        {
          title: "Draft Status",
          description: "Draft jobs are incomplete or not yet ready to schedule. Characteristics: Not scheduled (no date/time set), Not visible on calendar, Cannot be started or completed, Can be edited freely. Use Cases: Jobs pending customer confirmation, Jobs awaiting parts/materials, Jobs where scheduling details aren't finalized. Badge Color: Gray",
          tips: [
            "Keep draft jobs to a minimum to avoid losing track of work",
            "Review draft jobs weekly and schedule or archive them"
          ]
        },
        {
          title: "Pending Deposit Status",
          description: "This status applies when a job requires a deposit before confirmation. Characteristics: Job is created but not scheduled yet, Customer must pay deposit before booking appointment, Deposit deadline tracks payment due date, Automatic reminders sent to customer, Cannot proceed until deposit paid. This status is used when you've enabled deposit requirements for certain services in Settings.",
          tips: [
            "Configure deposit policies in Settings → Calendar Booking",
            "Monitor deposit deadlines to avoid losing bookings"
          ],
          warnings: ["Jobs can auto-cancel if deposit isn't paid by deadline (if configured)"]
        },
        {
          title: "Deposit Paid Status",
          description: "After a customer pays the required deposit, the job moves to this status. Characteristics: Deposit payment confirmed, Job can now be scheduled, Awaiting final booking date/time selection, Customer can choose their preferred appointment slot. The job will move to 'Scheduled' once a date/time is selected.",
        },
        {
          title: "Scheduled Status",
          description: "Scheduled jobs have a confirmed date, time, and customer. Characteristics: Date and time are set, Appears on calendar, Customer has been notified, Awaiting work to begin, Can be started, rescheduled, or cancelled. Badge Color: Blue. This is the default status for most jobs once they're ready to work on.",
          tips: [
            "Scheduled jobs generate automatic reminders (1, 3, 7 days before)",
            "Keep scheduled jobs up to date with accurate times"
          ]
        },
        {
          title: "In Progress Status",
          description: "Jobs actively being worked on are marked 'In Progress'. Characteristics: Work has started (actual start time recorded), Technician is on-site or actively working, Cannot be rescheduled without cancelling, Can be completed or cancelled, Helps track which jobs are currently active. Badge Color: Orange",
          tips: [
            "Use 'Start Job' action when you arrive on-site",
            "In Progress status helps monitor real-time workload"
          ]
        },
        {
          title: "Completed Status",
          description: "Jobs that have been finished move to Completed status. Characteristics: Work is done (actual end time recorded), Invoice automatically created (if not already exists), Cannot be edited (major changes), Marked as done in calendar, Customer may receive completion notification. Badge Color: Green. Completing a job triggers the invoicing workflow.",
          tips: [
            "Always complete jobs promptly for accurate tracking",
            "Review completed jobs for quality assurance"
          ],
          warnings: ["Once completed, you cannot change the job back to Scheduled"]
        },
        {
          title: "Cancelled Status",
          description: "Jobs that won't be completed are marked Cancelled. Characteristics: Work will not be performed, Removed from active calendar, Cancellation reason recorded, No invoice created, Cannot be reactivated (must create new job). Badge Color: Red. Reasons for cancellation include: Customer cancelled, Unpaid deposit, Scheduling conflict, Business decision.",
          tips: ["Always record a cancellation reason for future reference"],
          warnings: ["Cancelled jobs cannot be un-cancelled - create a new job if needed"]
        },
        {
          title: "Changing Job Status Manually",
          description: "Most status changes happen automatically, but you can manually trigger some changes: Draft → Scheduled: Click 'Schedule Job' after setting date/time, Scheduled → In Progress: Click 'Start Job' when work begins, In Progress → Completed: Click 'Complete Job' when done, Scheduled/In Progress → Cancelled: Click 'Cancel Job' and provide reason. Access these actions via the three-dot menu (⋮) on the Jobs page.",
        },
        {
          title: "Status-Based Filtering",
          description: "On the Jobs page, use the Status Filter dropdown to view specific job types: All Statuses - See everything, Pending Deposit - Track payment-dependent bookings, Scheduled - See upcoming work, In Progress - Monitor active jobs, Completed - Review finished work, Cancelled - Audit cancelled jobs. You can select multiple statuses simultaneously using checkboxes.",
          tips: [
            "Filter to 'Scheduled' each morning to plan your day",
            "Check 'Pending Deposit' regularly to follow up on payments"
          ]
        },
        {
          title: "Status and Notifications",
          description: "Job status changes trigger automatic customer notifications: Scheduled → Customer receives confirmation email/WhatsApp, Deposit Required → Customer receives payment request and reminders, Rescheduled → Customer receives updated appointment details, Completed → Customer may receive completion notice and review request, Cancelled → Customer receives cancellation notification. Configure notification settings in Settings → Communication.",
        },
        {
          title: "Status Workflow Best Practices",
          description: "Follow these best practices for smooth workflow: Minimize Draft jobs - Schedule or delete old drafts weekly, Monitor Pending Deposit - Follow up on unpaid deposits within 24 hours, Start jobs promptly - Mark 'In Progress' when work begins for accurate tracking, Complete same-day - Don't leave jobs in 'In Progress' overnight, Document cancellations - Always record why a job was cancelled, Review Completed jobs - Check weekly for quality and invoicing accuracy.",
          tips: ["Consistent status management leads to better business insights and customer satisfaction"]
        }
      ],
      relatedArticles: [
        { id: "create-job", title: "Creating a Job" },
        { id: "complete-job", title: "Completing Jobs" },
        { id: "schedule-job", title: "Scheduling Jobs" }
      ]
    },
    "complete-job": {
      title: "Completing Jobs",
      time: "4 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "When to Complete a Job",
          description: "A job should be marked as complete when: All work described in the job has been finished, The customer has inspected and accepted the work, Any required cleanup has been done, You're ready to invoice the customer for payment. Completing a job is a critical step that triggers invoicing and closes the work order.",
          warnings: ["Do not complete jobs with outstanding work or customer issues"]
        },
        {
          title: "Starting the Completion Process",
          description: "There are two ways to complete a job: From Jobs List - Navigate to Dashboard → Jobs, find the job in the list (must be 'Scheduled' or 'In Progress' status), click the three-dot menu (⋮) on the right, select 'Complete Job'. From Calendar View - Click the job block on your calendar, click 'Complete Job' in the job details popup.",
          tips: ["You can only complete jobs that are in 'Scheduled' or 'In Progress' status"]
        },
        {
          title: "Review Job Details",
          description: "Before completing, the system shows a confirmation dialog with job information: Job number and title, Customer name, Scheduled date and time (if applicable), Line items and total amount, Any existing notes. Review this information to ensure everything is correct before proceeding.",
          tips: ["Double-check that all services listed were actually performed"]
        },
        {
          title: "Add Completion Notes (Optional)",
          description: "In the completion dialog, you can add notes about the work performed. These notes: Become part of the permanent job record, Are included on the invoice sent to the customer, Help track what was done for warranty/callback purposes, Can include observations, recommendations, or follow-up needs. Example: 'Replaced faulty valve and tested system. Recommended customer schedule annual maintenance.'",
          tips: [
            "Use completion notes to document any changes from original scope",
            "Mention any parts used or additional work performed"
          ]
        },
        {
          title: "Automatic Invoice Creation",
          description: "When you click 'Complete Job', the system automatically: Creates an invoice linked to this job, Copies all line items from the job to the invoice, Calculates totals including tax (VAT), Sets invoice due date based on your business settings (default: 30 days), Generates a unique invoice number (e.g., INV-2025-0001), Sets invoice status to 'Sent'.",
        },
        {
          title: "Handling Deposit Jobs",
          description: "If the job had a deposit requirement: The deposit amount is subtracted from the invoice, Balance Due shows the remaining amount owed, Deposit Invoice is linked for tracking, The invoice reflects: Total Amount (original job total), Deposit Amount (already paid), Balance Due (what customer still owes). The customer only pays the balance due.",
          tips: ["Invoices clearly show deposit credit to avoid customer confusion"]
        },
        {
          title: "Invoice Delivery",
          description: "After the invoice is created, it's automatically sent to the customer via: Email - PDF invoice attached with payment link, WhatsApp - Message with invoice link and amount due (if enabled). The customer receives: Invoice number and total amount, Payment due date, Link to view and pay invoice online, Your business contact information for questions.",
          tips: ["Ensure customer contact details are up-to-date before completing jobs"]
        },
        {
          title: "Payment Tracking",
          description: "After completion, track payment status: Navigate to Dashboard → Invoices, Find the invoice by job number or customer name, Check status: Sent (awaiting payment), Paid (payment received), Overdue (past due date). The system sends automatic payment reminders at intervals you configure (default: 3, 7, 14 days overdue).",
        },
        {
          title: "Job Status After Completion",
          description: "Once completed, the job: Changes status to 'Completed' (green badge), Records actual end time (timestamp), Cannot be edited back to scheduled or in progress, Remains visible in Completed filter for reporting, Appears in calendar view with green color, Counts toward your monthly completed jobs metric.",
          warnings: ["Completed jobs cannot be un-completed. If work needs continuation, create a new 'Follow-up' job."]
        },
        {
          title: "What If Work Isn't Finished?",
          description: "If you cannot complete a job for any reason: DO NOT mark it complete, Leave it in 'Scheduled' or 'In Progress' status, Add internal notes explaining the situation, Reschedule if needed, Consider creating a 'Follow-up' job for remaining work. Only mark jobs complete when 100% done and ready to invoice.",
        },
        {
          title: "Viewing Completed Jobs",
          description: "To review your completed work: Go to Dashboard → Jobs, Click 'Filter by status' dropdown, Select 'Completed' from the list. You can: See completion date and time, View the linked invoice, Check completion notes, Review customer and job details. This helps with reporting and quality assurance.",
          tips: ["Review completed jobs weekly for quality control and customer satisfaction"]
        },
        {
          title: "Completion Best Practices",
          description: "Follow these best practices when completing jobs: Complete jobs same-day - Don't leave jobs in 'In Progress' overnight, Add detailed notes - Document what was done and any observations, Verify line items - Ensure all work performed is listed, Check customer satisfaction - Confirm customer is happy before completing, Review total amount - Make sure pricing is accurate, Follow up quickly - Address any payment delays within 24 hours.",
          tips: [
            "Prompt job completion leads to faster payment and better cash flow",
            "Detailed completion notes help with warranty claims and callbacks"
          ]
        }
      ],
      relatedArticles: [
        { id: "job-status", title: "Understanding Job Status" },
        { id: "create-job", title: "Creating a Job" },
        { id: "job-notes", title: "Adding Job Notes" }
      ]
    },
    "job-notes": {
      title: "Adding Job Notes",
      time: "3 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Understanding Job Notes",
          description: "The system supports two types of notes for jobs: Internal Notes - Private, only visible to you and your team (never shown to customers), and Job Description - Customer-facing details about the work to be performed (may appear on documents). Understanding the difference is critical for maintaining professionalism.",
          warnings: ["Never put sensitive information (access codes, passwords) in customer-facing fields"]
        },
        {
          title: "Internal Notes Purpose",
          description: "Internal notes are perfect for recording: Technician assignments ('Assigned to John - he knows the site'), Access instructions ('Key under mat, dog in backyard'), Special tools needed ('Bring 6-inch pipe wrench'), Parts to bring ('Customer already purchased tiles'), Site conditions ('Narrow driveway, park on street'), Private business notes ('Customer is price-sensitive'). These notes help your team prepare and work efficiently without exposing information to customers.",
          tips: ["Use internal notes liberally - they make jobs run smoother"]
        },
        {
          title: "Adding Internal Notes During Creation",
          description: "When creating a new job: Scroll to the 'Location & Notes' section near the bottom of the form, Find the 'Internal Notes' text area, Type your notes (supports multi-line text), Click 'Schedule Job' or 'Save as Draft' to save. Internal notes are preserved when you edit the job later.",
        },
        {
          title: "Adding Notes to Existing Jobs",
          description: "To add notes to a job that's already created: Navigate to Dashboard → Jobs, Find the job in the list, Click the three-dot menu (⋮), Select 'Edit Job', Scroll to 'Location & Notes' section, Add or update the 'Internal Notes' field, Click 'Schedule Job' to save changes. The notes are immediately available to anyone viewing the job.",
          tips: ["Update notes after site visits to capture new information"]
        },
        {
          title: "Job Description vs Internal Notes",
          description: "Job Description field: Visible to customers on confirmations and communications, Should be professional and customer-friendly, Describes what work will be done, Example: 'Install new kitchen faucet and repair leaking drain pipe'. Internal Notes field: NEVER visible to customers, Can be informal and technical, Records operational details, Example: 'Site has no water shutoff - bring valve clamps. Customer works from home, schedule after 2pm.'",
          warnings: ["Double-check which field you're using before adding sensitive information"]
        },
        {
          title: "Completion Notes",
          description: "When completing a job, you can add completion notes that: Document what was actually done (may differ from plan), Record observations or recommendations, Note any parts used or issues found, Appear on the invoice sent to customer. Completion notes are different from internal notes - they ARE shown to customers as part of the completed work record.",
          tips: [
            "Use completion notes to explain any changes from the original scope",
            "Include recommendations for future work to upsell services"
          ]
        },
        {
          title: "Viewing Job Notes",
          description: "To view notes for a job: On Jobs page, click the job row to open details dialog, or on Calendar, click a job block to open details popup. The dialog shows: Job description at the top, Internal notes in a separate section (labeled 'Internal Notes - Not visible to customer'), Completion notes (if job is completed). This layout makes it easy to see all information at a glance.",
        },
        {
          title: "Mobile Access to Notes",
          description: "Team members using mobile devices can: View internal notes before arriving on-site, Add notes while at the job location, Update completion notes immediately after finishing work. This ensures information is captured in real-time and available to the whole team.",
          tips: ["Encourage technicians to update notes from the field for accurate records"]
        },
        {
          title: "Notes Best Practices",
          description: "Get the most value from job notes by: Being specific - 'Replace two broken tiles near shower' is better than 'Fix tiles', Including measurements - 'Customer wants 3x6 meter deck' helps with estimation, Recording time - 'Took 4 hours including travel' tracks efficiency, Noting customer requests - 'Customer asked about maintenance plans', Adding photos reference - 'Photos uploaded to attachments', Updating promptly - Add notes immediately while details are fresh.",
        },
        {
          title: "Security and Privacy",
          description: "Follow these guidelines for secure notes: Never store passwords - Use a password manager instead, Be careful with access codes - Only include if necessary, don't add them to customer-facing fields, Respect customer privacy - Don't record personal information unrelated to the job, Use professional language - Internal notes may be reviewed by managers. While internal notes are private, they're still business records and should be professional.",
        },
        {
          title: "Searching Notes",
          description: "Currently, notes are not directly searchable from the main Jobs page search bar. To find jobs with specific notes: Use the job number if you remember it, Search by customer name, Filter by date range, Open jobs individually to review notes. Future updates will include full-text note search.",
          tips: ["Keep a separate log of important notes if you need to search them frequently"]
        },
        {
          title: "Notes and Reporting",
          description: "Job notes help with business analysis: Review completed job notes to identify common issues, Analyze time estimates vs actual completion notes, Track which services require follow-up work, Identify training needs based on technician notes, Improve future quotes based on what actually happened. Well-documented jobs lead to better business insights and improved operations over time.",
          tips: ["Set aside 30 minutes weekly to review completed job notes for patterns and improvements"]
        }
      ],
      relatedArticles: [
        { id: "create-job", title: "Creating a Job" },
        { id: "complete-job", title: "Completing Jobs" },
        { id: "job-status", title: "Understanding Job Status" }
      ]
    }
  },
  "quotes": {
    "create-quote": {
      title: "Creating a Quote",
      time: "5 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Navigate to Quotes",
          description: "Click 'Quotes' in the sidebar menu.",
        },
        {
          title: "Click 'New Quote'",
          description: "Click the '+ New Quote' button to start creating a quote.",
        },
        {
          title: "Select Customer",
          description: "Choose an existing contact or create a new one.",
          tips: ["You can search by name, email, or phone number"]
        },
        {
          title: "Add Line Items",
          description: "Add services from your catalog or create custom line items with description, quantity, and price.",
          tips: ["Each line item shows the calculated total (quantity × unit price)"]
        },
        {
          title: "Apply Discounts (Optional)",
          description: "Add a percentage or fixed amount discount if needed.",
        },
        {
          title: "Review Totals",
          description: "Verify the subtotal, tax (15% VAT), and total amount are correct.",
          warnings: ["Tax is automatically calculated based on your VAT settings"]
        },
        {
          title: "Set Valid Until Date",
          description: "Choose how long the quote remains valid (default is 30 days).",
        },
        {
          title: "Save or Send",
          description: "Save as draft or send immediately to the customer via email and WhatsApp.",
        }
      ],
      relatedArticles: [
        { id: "quote-line-items", title: "Adding Line Items & Services" },
        { id: "send-quote", title: "Sending Quotes to Customers" }
      ]
    },
    "quote-line-items": {
      title: "Adding Line Items & Services",
      time: "4 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Understanding Line Items",
          description: "Line items are the individual services or products you're quoting. Each line item has a description, quantity, unit price, and automatically calculated total. You can add unlimited line items to a single quote.",
          tips: ["Line items appear on the customer-facing quote in the order you add them"]
        },
        {
          title: "Select from Service Catalog",
          description: "When adding a line item, first use the dropdown menu to select from your pre-configured services. This automatically fills in the service name and can pre-populate pricing if you've set a base price for that service.",
          tips: [
            "Services are managed in Dashboard → Services",
            "Using catalog services ensures consistent naming and pricing"
          ]
        },
        {
          title: "Add Custom Description",
          description: "Below the service dropdown, you can type a custom description or modify the service name. This description appears on the customer's quote, so make it clear and professional. You can describe what's included, materials used, or specific details about this particular job.",
          tips: [
            "Be specific: 'Replace 3 broken windows in living room' is better than 'Window work'",
            "Mention materials if relevant: 'Install oak hardwood flooring (includes materials and labor)'"
          ]
        },
        {
          title: "Set Quantity",
          description: "Enter the quantity for this line item. This can be: Hours of labor (e.g., 4.5 hours), Square meters of area (e.g., 25 sqm), Number of items (e.g., 3 windows), or any other unit that makes sense for your service. The quantity must be at least 1 and can include decimals.",
          tips: ["Use clear units: '4.5 hours' or '25 square meters' in the description helps customers understand your pricing"]
        },
        {
          title: "Enter Unit Price",
          description: "The unit price is what you charge per unit of quantity. For example: R500 per hour for labor, R1,200 per square meter for tiling, R850 per window replacement. Click in the field and type the amount. Don't include the 'R' symbol—the system adds it automatically.",
          tips: [
            "Focus the field and it will auto-select for easy typing",
            "Unit price must be greater than 0"
          ]
        },
        {
          title: "Review Line Total",
          description: "The line total is automatically calculated as Quantity × Unit Price. This amount is read-only and updates immediately when you change quantity or unit price. For example: 4.5 hours × R500/hour = R2,250.00",
        },
        {
          title: "Add Multiple Line Items",
          description: "Click '+ Add Line Item' button below the existing items to add more services to the quote. You can add as many line items as needed. Each line item is independent with its own description, quantity, and pricing.",
          tips: ["Break down complex jobs into multiple line items for clarity and transparency"]
        },
        {
          title: "Remove Line Items",
          description: "Click the trash icon (🗑️) on the right side of any line item to remove it. You must have at least one line item—you can't remove the last item. Removing a line item immediately updates the quote totals.",
          warnings: ["Removing a line item cannot be undone. You'll need to add it again if removed by mistake."]
        },
        {
          title: "Reorder Line Items",
          description: "Line items appear in the order you add them. Currently, to reorder items, you'll need to remove and re-add them in your preferred sequence. The order on the quote form matches the order customers see.",
        },
        {
          title: "Best Practices for Line Items",
          description: "Use clear, customer-friendly descriptions that explain what's included. Break complex jobs into logical sections (e.g., 'Preparation', 'Installation', 'Cleanup'). Be specific about materials and labor. Include measurements and units where relevant. Group related services together. Avoid jargon or technical terms customers won't understand.",
          tips: [
            "Good example: 'Install ceramic floor tiles in bathroom (20 sqm, includes waterproofing and grout)'",
            "Poor example: 'Bathroom floor job'"
          ]
        }
      ],
      relatedArticles: [
        { id: "create-quote", title: "Creating a Quote" },
        { id: "discounts-tax", title: "Applying Discounts & Tax" }
      ]
    },
    "discounts-tax": {
      title: "Applying Discounts & Tax",
      time: "3 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Understanding Quote Calculations",
          description: "Quotes calculate totals in this order: 1) Subtotal = Sum of all line item totals, 2) Discount = Percentage off the subtotal, 3) Subtotal after discount = Subtotal - Discount, 4) Tax (VAT) = Percentage of subtotal after discount, 5) Final Total = Subtotal after discount + Tax. This ensures tax is calculated on the discounted amount, which is the standard accounting practice.",
        },
        {
          title: "Adding a Discount",
          description: "In the Totals section of the quote form, enter a discount percentage in the 'Discount (%)' field. The discount applies to the entire subtotal (sum of all line items). For example, a 10% discount on a R10,000 subtotal reduces it by R1,000.",
          tips: [
            "Discount must be between 0% and 100%",
            "You can use decimals like 12.5% for precise discounts",
            "Leave blank or enter 0 for no discount"
          ]
        },
        {
          title: "When to Use Discounts",
          description: "Common scenarios for discounts include: Early payment incentives ('Pay within 7 days for 5% off'), Bulk or package deals ('10% off for booking 3+ rooms'), Seasonal promotions ('15% off winter service'), Repeat customer loyalty ('Returning customers get 10% off'), or Price matching ('We'll match competitor prices').",
          tips: ["Clearly explain discount conditions in the quote notes so customers understand the offer"]
        },
        {
          title: "Configuring Tax/VAT Rate",
          description: "The tax rate is set in your business settings (Dashboard → Settings → Business Information). The default is 15% VAT for South African businesses. This tax rate applies to all quotes you create. Tax is calculated on the subtotal after discounts are applied.",
          warnings: ["Changing your VAT rate in settings will affect all new quotes, but won't retroactively change existing quotes"]
        },
        {
          title: "Adjusting Tax on Individual Quotes",
          description: "In the Totals section, you can override the default tax rate for a specific quote by entering a different percentage in the 'Tax/VAT (%)' field. This is useful for: Tax-exempt customers or services, Reduced VAT rates for specific industries, Zero-rated supplies, or International customers (0% VAT).",
          tips: [
            "The quote will show the tax percentage you entered",
            "Enter 0 for no tax on this quote"
          ]
        },
        {
          title: "Reviewing the Totals Breakdown",
          description: "The Totals section shows: Subtotal (sum of line items), Discount amount and percentage (if applicable), Tax/VAT amount and percentage, and Final Total. All amounts are displayed in South African Rand (R) with two decimal places. This breakdown appears on both your quote form and the customer-facing quote.",
        },
        {
          title: "Examples of Quote Calculations",
          description: "Example 1 - No Discount: Subtotal R5,000.00 | Discount 0% = R0.00 | Subtotal after discount R5,000.00 | Tax 15% = R750.00 | Total R5,750.00. Example 2 - With Discount: Subtotal R10,000.00 | Discount 10% = -R1,000.00 | Subtotal after discount R9,000.00 | Tax 15% = R1,350.00 | Total R10,350.00.",
          tips: ["Notice how tax is calculated on R9,000 (after discount), not the original R10,000"]
        },
        {
          title: "Discount Best Practices",
          description: "Be consistent with discount policies across customers. Document discount reasons in quote notes for accounting purposes. Use round percentages (5%, 10%, 15%) rather than complex decimals. Consider the impact on profit margins before offering large discounts. Communicate discount conditions clearly (e.g., 'Valid for payment within 7 days').",
          warnings: ["Excessive discounting can devalue your services. Use strategically, not as standard practice."]
        }
      ],
      relatedArticles: [
        { id: "quote-line-items", title: "Adding Line Items & Services" },
        { id: "create-quote", title: "Creating a Quote" }
      ]
    },
    "send-quote": {
      title: "Sending Quotes to Customers",
      time: "5 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Understanding Quote Statuses",
          description: "Before sending, understand the quote status flow: Draft = Not yet sent, still editable; Sent = Delivered to customer, awaiting response; Viewed = Customer has opened the quote; Accepted = Customer approved the quote; Declined = Customer rejected the quote; Expired = Valid until date has passed; Archived = Hidden from active list. Only 'Draft' and 'AI Quote' status quotes can be sent for the first time.",
        },
        {
          title: "Review Before Sending",
          description: "Before clicking send, verify: Customer contact information is correct (email and/or phone number), All line items are accurate with correct pricing, Discount and tax calculations are correct, Valid until date gives customer enough time to decide (typically 7-30 days), Service address is specified if required, and Notes contain all necessary terms and conditions.",
          warnings: ["Once sent, the quote status changes and major edits become more restricted"]
        },
        {
          title: "Send from Quote List",
          description: "From the Quotes dashboard (Dashboard → Quotes), find the quote you want to send. Click the three-dot menu (⋮) on the right side of the quote row. Select 'Send Quote' or 'Resend Quote' from the dropdown menu. The system will send the quote via all available channels (email and WhatsApp if configured).",
          tips: ["You can send from either the main quotes list or from within the quote edit view"]
        },
        {
          title: "Send from Quote Editor",
          description: "When creating or editing a draft quote, click 'Save & Send' instead of just 'Save as Draft'. This saves the quote and immediately sends it to the customer. The system validates all required fields before allowing you to send.",
          tips: ["If any required fields are missing, you'll see an error message explaining what needs to be fixed"]
        },
        {
          title: "Multi-Channel Delivery",
          description: "Quotes are automatically sent via multiple channels based on customer contact preferences: Email is sent if the customer has an email address, WhatsApp message is sent if the customer has WhatsApp opt-in enabled and a phone number, and SMS fallback (if configured) when WhatsApp is unavailable. Customers receive a notification with a secure link to view and respond to the quote.",
          tips: [
            "Check customer contact preferences in their profile to ensure they receive notifications",
            "WhatsApp opt-in can be managed in the customer's contact details"
          ]
        },
        {
          title: "What Customers Receive",
          description: "Customers get a notification containing: Your business name and logo, Quote number for reference, Total amount and valid until date, Secure link to view the full quote details, and Instructions on how to accept, decline, or request changes. The quote link is unique and secure, tied to that specific customer and quote.",
          warnings: ["Quote links are publicly accessible with the token. Don't share links in public forums."]
        },
        {
          title: "Tracking Quote Status",
          description: "After sending, monitor the quote status in the Quotes dashboard: 'Sent' badge = Delivered but not yet viewed, 'Viewed' badge = Customer has opened the quote, 'Accepted' badge = Customer approved the quote, 'Declined' badge = Customer rejected (you'll see their reason if provided). You can also see timestamps for when each action occurred.",
          tips: ["Set up automated follow-ups in Settings to remind customers who haven't responded"]
        },
        {
          title: "Resending Quotes",
          description: "You can resend a quote that's already been sent by clicking the three-dot menu and selecting 'Resend Quote'. Use this when: Customer says they didn't receive the original, The quote link was lost or expired, You've updated quote details and want to notify the customer, or You need to send a reminder. Resending creates a new notification but uses the same quote.",
        },
        {
          title: "Quote Follow-Ups",
          description: "The system can automatically send follow-up reminders to customers who haven't responded. Configure this in Dashboard → Settings → Quote Settings. Set reminder days (e.g., 3, 7, 14 days after sending). Follow-ups include: Friendly reminder to review the quote, Current quote status and valid until date, and Direct link to view and respond. This automates the follow-up process without manual tracking.",
          tips: ["Most quotes are accepted within 7 days. Set your first reminder for day 3 or 4."]
        },
        {
          title: "Customer Quote View",
          description: "When customers click the quote link, they see: Complete quote details with all line items, Subtotal, discounts, tax, and total breakdown, Service address and any special notes, Valid until date showing urgency, and Action buttons to Accept, Decline, or Request Changes. The interface is mobile-friendly and easy to use on any device.",
        },
        {
          title: "After Customer Accepts",
          description: "When a customer accepts a quote: Quote status changes to 'Accepted', You receive an instant notification via email, The contact automatically upgrades from 'Lead' to 'Customer', If deposit is required, customer is prompted to pay before booking, If site visit is required, customer can book an appointment time, and A job is automatically created and linked to the quote. You can then schedule the work in your Jobs calendar.",
          tips: ["Check your Jobs dashboard after quote acceptance to schedule the work"]
        },
        {
          title: "Handling Declined Quotes",
          description: "If a customer declines: Quote status changes to 'Declined', You can see the reason they provided (price, timing, chose another company, etc.), The contact remains in your system for future opportunities, and You can learn from patterns in decline reasons to improve your quotes. Use decline feedback to adjust pricing, improve descriptions, or refine your sales process.",
        },
        {
          title: "Best Practices for Sending",
          description: "Send quotes promptly—within 24 hours of customer request when possible. Personalize quote notes with customer's name and specific job details. Include clear terms, conditions, and what's included in the price. Set realistic valid until dates (7-30 days is common). Follow up if you don't hear back within 3-5 days. Keep communication professional and responsive. Use the automated follow-up system to save time.",
          tips: ["Fast response times increase quote acceptance rates significantly"]
        }
      ],
      relatedArticles: [
        { id: "create-quote", title: "Creating a Quote" },
        { id: "quote-acceptance", title: "Quote Acceptance & Next Steps" }
      ]
    },
    "quote-acceptance": {
      title: "Quote Acceptance & Next Steps",
      time: "6 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "How Customers Accept Quotes",
          description: "Customers receive a secure link via email and/or WhatsApp to view their quote. On the quote page, they see three main action buttons: Accept Quote (green button) to approve and proceed, Decline (red button) to reject with optional reason, or Request Changes to ask for modifications. The interface is mobile-friendly, so customers can accept quotes from their phone, tablet, or computer.",
        },
        {
          title: "Instant Acceptance Notifications",
          description: "When a customer accepts a quote, you receive immediate notifications via: Email to your business email address with quote details and customer information, WhatsApp notification (if configured) for instant mobile alerts, and In-app notification in your dashboard showing the acceptance. The notification includes the quote number, customer name, total amount, and next steps required.",
          tips: ["Enable browser notifications to get real-time alerts even when not logged into the dashboard"]
        },
        {
          title: "Automatic Status Updates",
          description: "Upon acceptance, several automatic updates occur: Quote status changes from 'Sent' or 'Viewed' to 'Accepted', The accepted_at timestamp is recorded for your records, Contact type automatically upgrades from 'Lead' to 'Customer' (if they were a lead), and A new job record is created and linked to the accepted quote. These updates happen instantly without manual intervention.",
        },
        {
          title: "Quote to Job Conversion",
          description: "The system automatically creates a job when a quote is accepted. This job includes: All quote line items copied to the job, Total amount from the quote, Customer contact information, Service address from the quote, Job status set to 'Pending Deposit' if deposit required, or 'Draft' if booking appointment first, and A unique job number for tracking. This ensures seamless transition from quoting to work execution.",
          tips: ["View the new job in Dashboard → Jobs to schedule and manage the work"]
        },
        {
          title: "Deposit Requirements",
          description: "If the quote requires a deposit (configured when creating the quote): Customer must pay the deposit before booking an appointment, Deposit invoice is automatically generated, Payment link is provided to the customer, Job status is 'Pending Deposit' until payment received, and Customer receives deposit payment reminders (48h, 24h, 12h before deadline). Once deposit is paid, job status changes to 'Deposit Paid' and customer can book their appointment.",
          warnings: ["Jobs requiring deposits will auto-cancel if deposit isn't paid by the deadline"]
        },
        {
          title: "Appointment Booking Flow",
          description: "For services requiring a site visit or scheduled appointment: After accepting (and paying deposit if required), customer sees available time slots based on your calendar settings, They select a preferred date and time from available options, Appointment is confirmed with automatic email and WhatsApp confirmations sent, Job status changes to 'Scheduled' with the booking details, and The appointment appears in your Jobs calendar for visibility and planning.",
          tips: ["Configure your availability in Settings → Calendar to control which time slots customers can book"]
        },
        {
          title: "Managing Accepted Quotes",
          description: "After acceptance, you can: View the full quote details (marked as 'Accepted') in the Quotes list, Access the linked job in the Jobs dashboard, Schedule or reschedule the appointment if needed, Communicate with the customer via email or WhatsApp, Mark the job as 'In Progress' when you start work, and Track progress through completion. The quote remains in your system as a historical record of what was agreed.",
          warnings: ["Don't edit accepted quotes. Create a new quote if scope changes. This maintains audit trail."]
        },
        {
          title: "Customer Communication After Acceptance",
          description: "Keep customers informed with: Booking confirmation email/WhatsApp with appointment details, Job reminder notifications (1-3 days before scheduled date), Updates if you need to reschedule, Day-of reminder on appointment morning, and Job completion notification when work is done. Most of these are automated, reducing manual communication overhead while keeping customers informed.",
        },
        {
          title: "Scope Changes After Acceptance",
          description: "If the job scope changes after quote acceptance: Don't modify the original accepted quote (this breaks the agreement), Create a new quote for the additional work or changes, Clearly explain what changed and why, Get customer approval for the new quote, and Update the job with revised details once new quote is accepted. This approach maintains transparency and protects both parties.",
          tips: ["Keep detailed notes on why scope changed to justify cost increases to customers"]
        },
        {
          title: "Monitoring Accepted Quotes",
          description: "Track your accepted quotes using: Quotes dashboard filtered to 'Accepted' status to see all approved work, Conversion rate metric showing % of sent quotes that get accepted, Accepted value metric showing total revenue from accepted quotes this month, and Activity log showing acceptance timestamps and customer details. Use these metrics to measure sales effectiveness and forecast revenue.",
        },
        {
          title: "Handling Multiple Acceptances",
          description: "When you receive several quote acceptances: Prioritize based on job size, urgency, and scheduling availability, Schedule appointments efficiently to minimize travel time between jobs, Communicate realistic timelines to customers (don't overcommit), Update job statuses to track progress, and Use the Jobs calendar for visual planning of all accepted work. Efficient scheduling after acceptance maximizes productivity and profitability.",
          tips: ["Group nearby jobs on the same day to reduce travel time and fuel costs"]
        },
        {
          title: "Quote Acceptance Best Practices",
          description: "To maximize acceptance rates: Respond quickly to quote requests (within 24 hours), Provide detailed, clear line item descriptions, Price competitively but don't undervalue your work, Include professional terms and conditions, Set reasonable valid until dates (7-30 days), Follow up with customers who don't respond, Make the acceptance process easy (mobile-friendly, clear buttons), and Request feedback from declined quotes to improve. High quote acceptance rates indicate effective pricing and clear communication.",
        },
        {
          title: "From Acceptance to Completion",
          description: "The full workflow after acceptance is: 1) Quote accepted by customer, 2) Deposit paid (if required), 3) Appointment booked by customer, 4) Job reminder sent automatically, 5) You perform the work, 6) Job marked as 'Completed', 7) Final invoice generated, 8) Payment collected, 9) Review request sent to customer. The system automates most steps, allowing you to focus on delivering quality service.",
          tips: ["Use the Jobs dashboard to track each accepted quote through this complete workflow"]
        }
      ],
      relatedArticles: [
        { id: "send-quote", title: "Sending Quotes to Customers" },
        { id: "deposit-quotes", title: "Deposit Requirements for Quotes" }
      ]
    },
    "deposit-quotes": {
      title: "Deposit Requirements for Quotes",
      time: "7 min",
      lastUpdated: "Dec 6, 2024",
      steps: [
        {
          title: "Understanding Deposit Quotes",
          description: "Deposit quotes require customers to pay a percentage or fixed amount upfront before booking their appointment. This protects your business from no-shows and cancellations while securing customer commitment. Deposits are common for: Large or expensive jobs, Custom work requiring material purchases, Services with high demand and limited availability, or Jobs requiring significant travel or preparation. The deposit is subtracted from the final invoice—it's not an extra charge.",
        },
        {
          title: "Enabling Deposits on a Quote",
          description: "When creating or editing a quote, scroll to the 'Deposit Settings' section. Check the box labeled 'Require deposit before booking'. This section appears after you've added line items and calculated totals. Once enabled, you'll see additional fields to configure the deposit amount and payment deadline.",
          tips: ["You can enable deposits on new quotes or edit existing draft quotes to add deposit requirements"]
        },
        {
          title: "Choosing Deposit Type: Percentage",
          description: "Select 'Percentage of Total' as the deposit type. Enter a percentage between 0% and 100% (typically 20-50% for most services). The system automatically calculates the deposit amount based on your quote total. For example: Quote total R10,000 × 30% deposit = R3,000 deposit required. The percentage approach scales with quote value—larger quotes require larger deposits proportionally.",
          tips: [
            "30% is a common deposit for most service businesses",
            "Higher deposits (50%) for custom work or expensive materials"
          ]
        },
        {
          title: "Choosing Deposit Type: Fixed Amount",
          description: "Select 'Fixed Amount' as the deposit type. Enter a specific Rand amount for the deposit (e.g., R1,500). This deposit amount stays the same regardless of quote total. Use fixed deposits when: You want consistent deposits across similar jobs, The deposit covers specific costs (e.g., materials, travel), or You prefer simple, round numbers. For example, all bathroom renovations require a R2,000 deposit regardless of final price.",
          tips: ["Fixed amounts work well for standardized services with predictable costs"]
        },
        {
          title: "Deposit Payment Preview",
          description: "After setting the deposit type and amount, you'll see a Payment Preview box showing: Deposit Required: The exact amount customer must pay upfront (e.g., R3,000), Balance on Completion: The remaining amount due after work is done (e.g., R7,000), and Total: The full quote amount (e.g., R10,000). This preview helps you verify the deposit is calculated correctly before sending the quote to the customer.",
        },
        {
          title: "Configuring Deposit Deadlines",
          description: "In Dashboard → Settings → Deposit Settings, configure: Deposit Cancellation Threshold: How many hours before the appointment deposit must be paid (default 24 hours), Deposit Reminder Schedule: When to send payment reminders (e.g., 48h, 24h, 12h before deadline), and Auto-Cancellation Mode: Whether to automatically cancel bookings with unpaid deposits, or require manual cancellation. These global settings apply to all deposit quotes unless overridden per quote.",
          warnings: ["Setting auto-cancellation requires careful communication to avoid customer frustration"]
        },
        {
          title: "Customer Deposit Payment Flow",
          description: "When a customer accepts a deposit quote: 1) Quote status changes to 'Accepted', 2) System creates a deposit invoice automatically, 3) Customer receives deposit payment request via email and WhatsApp, 4) They click the payment link to pay the deposit, 5) Upon payment, job status changes to 'Deposit Paid', 6) Customer can now book their appointment from available time slots. Until deposit is paid, the booking calendar is locked—customers can't schedule the appointment.",
        },
        {
          title: "Deposit Invoice Details",
          description: "The automatically generated deposit invoice includes: Invoice type: 'Deposit' (clearly marked), Amount: The deposit amount from the quote, Due date: Based on your payment terms and deposit deadline, Payment link: Secure link for customer to pay online, Quote reference: Links back to the original quote, and Balance notification: Explains the remaining balance due on completion. This invoice appears in your Invoices dashboard for tracking.",
          tips: ["Deposit invoices are tracked separately from final invoices for clear accounting"]
        },
        {
          title: "Automated Deposit Reminders",
          description: "The system sends automatic payment reminders based on your schedule: First reminder (e.g., 48 hours before deadline): Friendly payment prompt, Second reminder (e.g., 24 hours before deadline): Urgent reminder with deadline emphasis, Final reminder (e.g., 12 hours before deadline): Last chance notification before auto-cancellation, and Payment confirmation: Sent immediately when deposit is received. Reminders go via email and WhatsApp to maximize visibility.",
          tips: ["Most customers pay deposits within 24 hours of the first reminder"]
        },
        {
          title: "Handling Unpaid Deposits",
          description: "If a customer doesn't pay the deposit by the deadline: In Manual Mode: Job remains 'Pending Deposit', you receive a notification, you contact customer to follow up or manually cancel the booking. In Auto-Cancel Mode: Job status automatically changes to 'Cancelled', customer receives cancellation notification with reason, appointment time slot is released for other bookings, and you can still accept late payment and rebook if desired. Choose the mode that fits your business style.",
          warnings: ["Auto-cancellation frees up your schedule but may frustrate customers with good intentions"]
        },
        {
          title: "Deposit Payment Methods",
          description: "Customers can pay deposits via: Online payment gateway (credit/card, instant EFT), Bank transfer (EFT with reference number), or In-person payment (cash/card at your location). Configure payment options in Settings → Payment Settings. Online payments are instant and automatically update job status. Bank transfers require manual confirmation once you verify payment receipt.",
          tips: ["Online payments provide the best customer experience and instant status updates"]
        },
        {
          title: "Final Invoice with Deposit Credit",
          description: "After completing the work, generate the final invoice. The system automatically: Shows the original quote total, Subtracts the deposit already paid as a credit, Calculates the balance due (Total - Deposit), and Clearly marks 'Deposit Paid: R3,000' on the invoice. Customers only pay the remaining balance. For example: Total R10,000 - Deposit R3,000 = Balance Due R7,000. This transparent calculation prevents confusion about what's owed.",
        },
        {
          title: "Deposit Refunds and Changes",
          description: "If you need to cancel or reschedule: For your cancellations: Offer full deposit refund or reschedule at customer's convenience. For customer cancellations: Follow your cancellation policy (e.g., 'Deposits non-refundable within 48 hours of appointment'). For reschedules: Deposit transfers to the new appointment date—no refund needed. Document your deposit and cancellation policy in quote notes so customers understand terms upfront.",
          warnings: ["Have a clear, written cancellation policy to avoid disputes about deposit refunds"]
        },
        {
          title: "Deposit Settings Best Practices",
          description: "For most service businesses: Use 30-50% deposits for jobs over R5,000, Use fixed deposits (e.g., R500-R1,000) for smaller standardized jobs, Set 24-48 hour payment deadlines to allow time but maintain urgency, Send 3 reminders (48h, 24h, 12h) to maximize payment rate, Start with manual cancellation mode until you're comfortable with the flow, and Clearly communicate deposit requirements in your quote notes. Monitor deposit payment rates and adjust your process as needed.",
        },
        {
          title: "When to Require Deposits",
          description: "Require deposits for: Jobs over R3,000-R5,000 in value, Custom work requiring material orders, Services with high no-show rates historically, Peak season bookings with high demand, New customers (no prior relationship), or Travel-intensive jobs. Don't require deposits for: Small jobs under R1,000, Repeat customers with good payment history, or Emergency services where immediate booking is needed. Balance revenue protection with customer convenience.",
          tips: ["Track your no-show rate by customer type to inform deposit requirements"]
        },
        {
          title: "Communicating Deposit Requirements",
          description: "Be transparent about deposits: Explain the deposit in your quote notes ('30% deposit required to secure booking'), Justify it professionally ('Deposits allow us to reserve materials and block your preferred time slot'), State refund policy clearly ('Deposits are refundable if we cancel, non-refundable if you cancel within 48 hours'), and Emphasize the deposit is credited toward final payment, not an extra fee. Clear communication reduces resistance and misunderstandings.",
        },
        {
          title: "Tracking Deposit Performance",
          description: "Monitor these metrics in your dashboard: Deposit payment rate: % of deposit invoices paid on time, Average time to deposit payment: How quickly customers pay after quote acceptance, Cancellation rate: How many bookings are cancelled due to unpaid deposits, and Revenue protection: Money saved from no-shows prevented by deposits. Use these insights to refine your deposit strategy—increase or decrease amounts, adjust deadlines, or change which services require deposits.",
          tips: ["If deposit payment rate is below 70%, consider reducing the deposit percentage or amount"]
        }
      ],
      relatedArticles: [
        { id: "create-quote", title: "Creating a Quote" },
        { id: "quote-acceptance", title: "Quote Acceptance & Next Steps" }
      ]
    }
  }
};

export default function HelpArticlePage() {
  const [, params] = useRoute("/help/:category/:article");
  const [, setLocation] = useLocation();

  const categoryId = params?.category || "";
  const articleId = params?.article || "";

  const article = articles[categoryId]?.[articleId];

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <Button onClick={() => setLocation("/help")}>
            Back to Help Center
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">HELP CENTER</h2>
          <Link href="/">
            <Button variant="ghost" className="text-gray-900 font-semibold hover:text-gray-700" data-testid="link-home-help">
              HOME
            </Button>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="bg-black text-white border-b border-white/10">
        <div className="container mx-auto px-6 py-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/help")}
            className="text-white hover:text-white/80 hover:bg-white/10 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Help Center
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Article Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-normal mb-4">{article.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 font-light">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{article.time} read</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <span>Last updated: {article.lastUpdated}</span>
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Steps */}
          <div className="prose prose-lg max-w-none">
            {article.steps.map((step: any, index: number) => (
              <div key={index} className="mb-8">
                <h2 className="text-2xl font-normal mb-3 flex items-baseline gap-3">
                  <span className="text-black">{index + 1}.</span>
                  {step.title}
                </h2>
                <p className="text-base text-gray-700 leading-relaxed mb-4 font-light">
                  {step.description}
                </p>

                {step.tips && (
                  <div className="bg-gray-50 border-l-4 border-black p-4 mb-4">
                    <div className="flex gap-3">
                      <Lightbulb className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">Tip</div>
                        {step.tips.map((tip: string, i: number) => (
                          <p key={i} className="text-sm text-gray-700 mb-0 font-light">{tip}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step.warnings && (
                  <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mb-4">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">Important</div>
                        {step.warnings.map((warning: string, i: number) => (
                          <p key={i} className="text-sm text-gray-700 mb-0 font-light">{warning}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Related Articles */}
          {article.relatedArticles && article.relatedArticles.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-xl font-normal mb-4">Related Articles</h3>
              <div className="space-y-2">
                {article.relatedArticles.map((related: any) => (
                  <div
                    key={related.id}
                    className="border-b pb-3 hover:bg-gray-50 -mx-2 px-2 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/help/${categoryId}/${related.id}`)}
                  >
                    <div className="flex items-center justify-between py-2">
                      <span className="text-black hover:underline font-normal">{related.title}</span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          <div className="mt-12 pt-8 border-t text-center">
            <p className="text-sm text-gray-600 mb-4 font-light">Was this article helpful?</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="border-gray-300">👍 Yes</Button>
              <Button variant="outline" className="border-gray-300">👎 No</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}