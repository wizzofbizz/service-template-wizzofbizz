import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Orbit, ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const productCategories = {
  "Get Noticed": [
    { name: "Website Builder", href: "/features/get-noticed#website" },
    { name: "WhatsApp Communication", href: "/features/get-noticed#whatsapp" },
    { name: "Google Business Profile", href: "/features/get-noticed#gbp" },
  ],
  "Win Jobs": [
    { name: "Lead & Contact Management", href: "/features/win-jobs#crm" },
    { name: "Quote Management", href: "/features/win-jobs#quotes" },
    { name: "Online Booking", href: "/features/win-jobs#booking" },
  ],
  "Work Smarter": [
    { name: "Calendar & Scheduling", href: "/features/work-smarter#calendar" },
    { name: "Complete Job Workflow", href: "/features/work-smarter#workflow" },
    { name: "Client Portal", href: "/features/work-smarter#portal" },
  ],
  "Boost Profits": [
    { name: "Invoice Management", href: "/features/boost-profits#invoicing" },
    { name: "Financial Insights", href: "/features/boost-profits#insights" },
    { name: "Deposit Management", href: "/features/boost-profits#deposits" },
  ],
};

const industries = [
  { name: "Plumbing", href: "/industries/plumbing-software" },
  { name: "Cleaning", href: "/industries/cleaning-software" },
  { name: "Electrical", href: "/industries/electrical-software" },
  { name: "HVAC", href: "/industries/hvac-software" },
  { name: "Landscaping", href: "/industries/landscaping-software" },
  { name: "Handyman", href: "/industries/handyman-software" },
  { name: "Painting", href: "/industries/painting-software" },
  { name: "Roofing", href: "/industries/roofing-software" },
  { name: "Construction", href: "/industries/construction-software" },
  { name: "Pool Maintenance", href: "/industries/pool-maintenance-software" },
  { name: "Pest Control", href: "/industries/pest-control-software" },
];

const resources = [
  { name: "Blog", href: "/blog" },
  { name: "Help Center", href: "/help" },
  { name: "FAQ", href: "/faq" },
];

function MobileMenuSection({ 
  title, 
  items, 
  onItemClick 
}: { 
  title: string; 
  items: { name: string; href: string; }[] | Record<string, { name: string; href: string; }[]>; 
  onItemClick: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isNested = !Array.isArray(items);

  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 text-white hover:text-white/80 transition-colors"
      >
        <span className="font-medium">{title}</span>
        <ChevronDown 
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-3 space-y-1">
              {isNested ? (
                Object.entries(items as Record<string, { name: string; href: string; }[]>).map(([category, categoryItems]) => (
                  <div key={category} className="mb-3">
                    <div className="text-xs uppercase text-white/60 font-semibold mb-2 pl-4">
                      {category}
                    </div>
                    {categoryItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <button 
                          onClick={onItemClick}
                          className="block pl-6 py-2 text-sm text-white/70 hover:text-white transition-colors w-full text-left"
                        >
                          {item.name}
                        </button>
                      </Link>
                    ))}
                  </div>
                ))
              ) : (
                (items as { name: string; href: string; }[]).map((item) => (
                  <Link key={item.href} href={item.href}>
                    <button 
                      onClick={onItemClick}
                      className="block pl-4 py-2 text-sm text-white/70 hover:text-white transition-colors w-full text-left"
                    >
                      {item.name}
                    </button>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FeatureNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-md z-50 border-b border-white/10"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <Orbit className="h-6 w-6 text-white" />
            <span className="text-lg font-semibold text-white tracking-tight">
              ServiceLoop
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6">
            {/* Product Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-white hover:text-white/80 transition-colors py-2">
                <span className="text-sm font-medium">Product</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-4 min-w-[600px]">
                  <div className="grid grid-cols-2 gap-6 px-4">
                    {Object.entries(productCategories).map(([category, items]) => (
                      <div key={category}>
                        <div className="text-xs uppercase text-gray-500 font-semibold mb-2">
                          {category}
                        </div>
                        {items.map((item) => (
                          <Link key={item.href} href={item.href}>
                            <button className="block px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors w-full text-left">
                              {item.name}
                            </button>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Industries Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-white hover:text-white/80 transition-colors py-2">
                <span className="text-sm font-medium">Industries</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px]">
                  {industries.map((industry) => (
                    <Link key={industry.href} href={industry.href}>
                      <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left">
                        {industry.name}
                      </button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing - Direct Link */}
            <Link href="/pricing">
              <button className="text-sm font-medium text-white hover:text-white/80 transition-colors">
                Pricing
              </button>
            </Link>

            {/* Resources Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-white hover:text-white/80 transition-colors py-2">
                <span className="text-sm font-medium">Resources</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[160px]">
                  {resources.map((resource) => (
                    <Link key={resource.href} href={resource.href}>
                      <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left">
                        {resource.name}
                      </button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button className="bg-white text-black hover:bg-white/90">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-white hover:text-white/80"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-white text-black hover:bg-white/90">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden bg-black/95 backdrop-blur-md border-t border-white/10"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="container mx-auto px-6 py-6">
              {/* Product Section */}
              <MobileMenuSection
                title="Product"
                items={productCategories}
                onItemClick={() => setMobileMenuOpen(false)}
              />

              {/* Industries Section */}
              <MobileMenuSection
                title="Industries"
                items={industries}
                onItemClick={() => setMobileMenuOpen(false)}
              />

              {/* Pricing - Direct Link */}
              <div className="border-b border-white/10">
                <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>
                  <button className="block py-3 text-white hover:text-white/80 transition-colors font-medium w-full text-left">
                    Pricing
                  </button>
                </Link>
              </div>

              {/* Resources Section */}
              <MobileMenuSection
                title="Resources"
                items={resources}
                onItemClick={() => setMobileMenuOpen(false)}
              />

              {/* Mobile CTA Buttons */}
              <div className="pt-3 mt-3 space-y-3 border-t border-white/10">
                {isAuthenticated ? (
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-white text-black hover:bg-white/90">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full text-white hover:text-white/80">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-white text-black hover:bg-white/90">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}