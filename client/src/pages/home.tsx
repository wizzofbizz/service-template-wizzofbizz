import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import CountUp from "react-countup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Check, TreePine, Sparkles, Hammer, Plug, Fan, Wrench, Scissors, Flower2, PaintBucket, Home as HomeIcon, Droplet, CheckCircle2 } from "lucide-react";
import { SEOMetaTags } from "@/components/SEOMetaTags";
import { createOrganizationSchema, createSoftwareApplicationSchema, createWebSiteSchema } from "@/lib/structured-data";
import { FeatureNavigation } from "@/components/FeatureNavigation";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Footer } from "@/components/Footer";
import { PillBadge } from "@/components/ui/pill-badge";

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
    layoutEffect: false
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  // Hero image slider state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const heroImages = [
    "/attached_assets/hero-dashboard.png",
    "/attached_assets/hero-quote-web.png",
    "/attached_assets/hero-whatsapp.png"
  ];

  // Auto-rotate images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Typewriter effect state and logic
  const [typewriterText, setTypewriterText] = useState("");
  const typewriterWords = ["Quotes", "Bookings", "Follow-ups", "Invoicing", "Growth"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = typewriterWords[currentWordIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && typewriterText.length < currentWord.length) {
      // Typing forward
      timeout = setTimeout(() => {
        setTypewriterText(currentWord.slice(0, typewriterText.length + 1));
      }, 100);
    } else if (!isDeleting && typewriterText.length === currentWord.length) {
      // Finished typing, pause before deleting
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
    } else if (isDeleting && typewriterText.length > 0) {
      // Deleting
      timeout = setTimeout(() => {
        setTypewriterText(currentWord.slice(0, typewriterText.length - 1));
      }, 50);
    } else if (isDeleting && typewriterText.length === 0) {
      // Finished deleting, move to next word
      setIsDeleting(false);
      setCurrentWordIndex((prevIndex) => (prevIndex + 1) % typewriterWords.length);
    }

    return () => clearTimeout(timeout);
  }, [typewriterText, isDeleting, currentWordIndex, typewriterWords]);


  const baseUrl = window.location.origin;
  const canonicalUrl = `${baseUrl}/`;

  // Combine multiple schemas
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      createOrganizationSchema(baseUrl),
      createSoftwareApplicationSchema(baseUrl),
      createWebSiteSchema(baseUrl)
    ]
  };

  // Authentication state and related logic
  const { isAuthenticated, isLoading } = useAuth();
  const loginPath = "/login";
  const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '';
  const getStartedLink = isAuthenticated ? "/pricing" : "/register";

  // Early return during loading to prevent flicker
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <SEOMetaTags 
        title="ServiceLoop - Smart Website for South African Service Businesses | R350/month"
        description="Get your professional website up and running in 24 hours. Perfect for plumbers, electricians, cleaners & more. Includes booking system, CRM & invoicing from R350/month."
        keywords="service business website, small business website south africa, plumber website, electrician website, cleaning company website, booking system, CRM, invoicing, whatsapp automation, quote management"
        canonicalUrl={canonicalUrl}
        ogImage={`${baseUrl}/hero-dashboard-mockup.png`}
        structuredData={structuredData}
      />

      <div className="min-h-screen bg-white">
        {/* Feature Navigation */}
        <FeatureNavigation />

        {/* Section 1: Hero - Two Column Split */}
        <section className="relative min-h-screen flex items-center bg-white overflow-hidden pt-24 md:pt-32">
          <div className="container mx-auto px-6 md:px-12 lg:px-20 pb-24 md:pb-32">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Column - Content */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <h1 className="mb-6 leading-tight" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 700, letterSpacing: '-0.02em', color: '#42474d' }}>
                  <div className="text-[40px] sm:text-5xl md:text-[56px] lg:text-[64px] mb-2">
                    Automate your
                  </div>
                  <div className="text-[56px] sm:text-6xl md:text-7xl lg:text-[84px]">
                    <span className="inline-block font-bold relative">
                      <span className="bg-gradient-to-r from-[#b47fff] via-[#612fff] to-[#4a1fcc] bg-clip-text text-transparent">
                        {typewriterText}
                      </span>
                      <span className="inline-block w-0.5 h-[0.9em] bg-[#612fff] animate-blink ml-0.5 align-middle"></span>
                    </span>
                  </div>
                </h1>

                <p className="mb-8 text-base sm:text-lg leading-relaxed" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, color: '#42474d' }}>
                  Save 10+ hours a week with automated quotes, scheduling, and follow-ups. The all-in-one platform for <span style={{ color: '#612fff' }}>service professionals</span>.
                </p>

                <div className="mb-10 space-y-4">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={3} style={{ color: '#42474d' }} />
                    <span className="text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 500, color: '#42474d' }}><strong>Quote on Autopilot:</strong> Instant Quotes & Client Scheduling 24/7.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={3} style={{ color: '#42474d' }} />
                    <span className="text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 500, color: '#42474d' }}><strong>Zero-Touch Follow-Up:</strong> Auto-Notifications via WhatsApp & Email.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={3} style={{ color: '#42474d' }} />
                    <span className="text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 500, color: '#42474d' }}><strong>Professional website:</strong> Setup in 1 hour</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={3} style={{ color: '#42474d' }} />
                    <span className="text-sm sm:text-base leading-relaxed" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 500, color: '#42474d' }}><strong>Low Cost, Zero Headache:</strong> Starts from R350/month.</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href={isAuthenticated ? "/dashboard" : "/register"} className="w-full sm:w-auto">
                    <Button 
                      size="lg" 
                      className="w-full rounded-full px-6 py-6 text-sm sm:text-base whitespace-normal sm:whitespace-nowrap"
                      style={{ 
                        fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif',
                        fontStyle: 'normal',
                        fontWeight: 500,
                        backgroundColor: '#612fff',
                        color: 'white'
                      }}
                      disabled={isLoading}
                    >
                      {isAuthenticated ? "Go to Dashboard" : "Get Started Free – No Credit Card Required"}
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* Right Column - Product Visual Slider */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="relative mt-8 lg:mt-0"
              >
                <div className="relative w-full min-h-[250px] md:min-h-[350px] lg:min-h-[400px]">
                  {heroImages.map((image, index) => (
                    <motion.img
                      key={image}
                      src={image}
                      alt={`Smart Website Platform - ${index === 0 ? 'Dashboard' : index === 1 ? 'Quote Generation' : 'WhatsApp Integration'}`}
                      className="w-full h-auto absolute top-0 left-0"
                      style={{ mixBlendMode: 'normal' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: currentImageIndex === index ? 1 : 0 }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                    />
                  ))}
                  {/* Placeholder for layout */}
                  <img 
                    src={heroImages[0]}
                    alt=""
                    className="w-full h-auto opacity-0"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 2: Vision - Black Background */}
        <section className="bg-black text-white py-24 md:py-32">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                {/* Animated Line - More visible */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className="h-[2px] w-32 md:w-48 bg-white mb-12 origin-left"
                />

                <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '12px', lineHeight: '18px', letterSpacing: '0.3em' }} className="uppercase mb-8">
                  Our Vision
                </p>
                <h2 style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 700, fontSize: '48px', lineHeight: '60px' }} className="md:text-5xl lg:text-6xl mb-12">
                  Empowering Home Service Pros to Thrive
                </h2>
                <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '18px', lineHeight: '27px' }} className="text-white/70 mb-8">
                  Our platform exists to help local service businesses grow, save time, and increase revenue through simplified tools. We empower you to focus on what you do best: serving your customers.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="relative hidden lg:block"
              >
                <img 
                  src="https://images.unsplash.com/photo-1581578731548-669559177177?w=800&q=80" 
                  alt="Professional service provider assisting satisfied customer"
                  className="rounded-lg shadow-2xl w-full h-auto"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 3: Product - Sticky Parallax Cards */}
        <section className="bg-white py-24 md:py-32 relative">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            {/* Section Header - Fixed */}
            <div className="mb-32">
              <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '12px', lineHeight: '18px', letterSpacing: '0.3em' }} className="uppercase mb-8">
                Our Product
              </p>
              <h3 style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 700, fontSize: '48px', lineHeight: '60px' }} className="md:text-5xl lg:text-6xl leading-tight max-w-2xl">
                Everything You Need to Run Your Business
              </h3>
            </div>

            {/* Sticky Cascading Cards Container */}
            <div className="space-y-[15vh]">
              {/* Card 1: Get Noticed */}
              <div className="sticky top-28 z-[10]">
                <div className="bg-white py-12 -mx-6 md:-mx-12 lg:-mx-20 px-6 md:px-12 lg:px-20">
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid md:grid-cols-2 gap-12 items-start"
                  >
                    <div className="border-l-2 border-black pl-8 flex flex-col justify-center min-h-[300px]">
                      <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '12px', lineHeight: '18px', letterSpacing: '0.3em' }} className="uppercase mb-6">
                        Get Noticed
                      </p>
                      <h4 style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 700, fontSize: '36px', lineHeight: '45px' }} className="md:text-4xl mb-6 leading-tight">Attract New Customers Effortlessly</h4>
                      <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '16px', lineHeight: '24px' }} className="text-gray-600 mb-8">
                        Stand out online with a professional website, Google Business Profile integration, and WhatsApp communication that brings customers to your door.
                      </p>
                      <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                        <Button 
                          size="lg" 
                          className="rounded-full px-8 py-6"
                          style={{ 
                            fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif',
                            fontStyle: 'normal',
                            fontWeight: 500,
                            fontSize: '16px',
                            backgroundColor: '#612fff',
                            color: 'white'
                          }}
                          disabled={isLoading}
                        >
                          {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                        </Button>
                      </Link>
                    </div>
                    <div className="rounded-lg overflow-hidden h-[400px] md:h-[450px]">
                      <img 
                        src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80" 
                        alt="Professional website on devices"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Card 2: Win Jobs */}
              <div className="sticky top-28 z-[20]">
                <div className="bg-white py-12 -mx-6 md:-mx-12 lg:-mx-20 px-6 md:px-12 lg:px-20">
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid md:grid-cols-2 gap-12 items-start"
                  >
                    <div className="border-l-2 border-black pl-8 flex flex-col justify-center min-h-[300px]">
                      <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '12px', lineHeight: '18px', letterSpacing: '0.3em' }} className="uppercase mb-6">
                        Win Jobs
                      </p>
                      <h4 style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 700, fontSize: '36px', lineHeight: '45px' }} className="md:text-4xl mb-6 leading-tight">Automated Quotes & Client Self-Scheduling</h4>
                      <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '16px', lineHeight: '24px' }} className="text-gray-600 mb-8">
                        Set your custom business rules once. The system sends an automated quote 24/7. When a customer accepts the quote online, they instantly gain access to your live calendar to self-schedule the job or call-out—no phone tag needed. You receive a warm, pre-qualified, and pre-scheduled job ready for review. (Includes option for a 'Subject to Job Site Visit' disclaimer.)
                      </p>
                      <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                        <Button 
                          size="lg" 
                          className="rounded-full px-8 py-6"
                          style={{ 
                            fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif',
                            fontStyle: 'normal',
                            fontWeight: 500,
                            fontSize: '16px',
                            backgroundColor: '#612fff',
                            color: 'white'
                          }}
                        >
                          {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                        </Button>
                      </Link>
                    </div>
                    <div className="rounded-lg overflow-hidden h-[400px] md:h-[450px]">
                      <img 
                        src="https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=800&q=80" 
                        alt="Quote creation on tablet"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Card 3: Work Smarter */}
              <div className="sticky top-28 z-[30]">
                <div className="bg-white py-12 -mx-6 md:-mx-12 lg:-mx-20 px-6 md:px-12 lg:px-20">
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid md:grid-cols-2 gap-12 items-start"
                  >
                    <div className="border-l-2 border-black pl-8 flex flex-col justify-center min-h-[300px]">
                      <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '12px', lineHeight: '18px', letterSpacing: '0.3em' }} className="uppercase mb-6">
                        Work Smarter
                      </p>
                      <h4 style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 700, fontSize: '36px', lineHeight: '45px' }} className="md:text-4xl mb-6 leading-tight">Zero-Touch Administration</h4>
                      <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '16px', lineHeight: '24px' }} className="text-gray-600 mb-8">
                        Manage your calendar, track job progress, and simplify communication. From "Job Started" to "Payment Due," the system sends automatic, two-way WhatsApp notifications to clients, eliminating your need for manual calls. Real-time Visibility: All automated chats are tracked in your CRM, allowing you to instantly jump in to take over the conversation when needed.
                      </p>
                      <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                        <Button 
                          size="lg" 
                          className="rounded-full px-8 py-6"
                          style={{ 
                            fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif',
                            fontStyle: 'normal',
                            fontWeight: 500,
                            fontSize: '16px',
                            backgroundColor: '#612fff',
                            color: 'white'
                          }}
                        >
                          {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                        </Button>
                      </Link>
                    </div>
                    <div className="rounded-lg overflow-hidden h-[400px] md:h-[450px]">
                      <img 
                        src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80" 
                        alt="Calendar and scheduling interface"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Card 4: Boost Profits */}
              <div className="sticky top-28 z-[40]">
                <div className="bg-white py-12 -mx-6 md:-mx-12 lg:-mx-20 px-6 md:px-12 lg:px-20">
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid md:grid-cols-2 gap-12 items-start"
                  >
                    <div className="border-l-2 border-black pl-8 flex flex-col justify-center min-h-[300px]">
                      <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '12px', lineHeight: '18px', letterSpacing: '0.3em' }} className="uppercase mb-6">
                        Boost Profits
                      </p>
                      <h4 style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 700, fontSize: '36px', lineHeight: '45px' }} className="md:text-4xl mb-6 leading-tight">Maximize Revenue and Insights</h4>
                      <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '16px', lineHeight: '24px' }} className="text-gray-600 mb-8">
                        Get paid faster with professional invoicing, track your finances, and make data-driven decisions with powerful analytics.
                      </p>
                      <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                        <Button 
                          size="lg" 
                          className="rounded-full px-8 py-6"
                          style={{ 
                            fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif',
                            fontStyle: 'normal',
                            fontWeight: 500,
                            fontSize: '16px',
                            backgroundColor: '#612fff',
                            color: 'white'
                          }}
                        >
                          {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                        </Button>
                      </Link>
                    </div>
                    <div className="rounded-lg overflow-hidden h-[400px] md:h-[450px]">
                      <img 
                        src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80" 
                        alt="Financial dashboard and analytics"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Testimonials & Social Proof - Black Background */}
        <section className="bg-black text-white py-24 md:py-32">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mb-20"
            >
              <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '12px', lineHeight: '18px', letterSpacing: '0.3em' }} className="uppercase mb-8">
                Testimonials
              </p>
              <h2 style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 700, fontSize: '48px', lineHeight: '60px' }} className="md:text-5xl lg:text-6xl mb-12 max-w-3xl">
                See Why Pros Like You Trust Us
              </h2>
            </motion.div>

            {/* Testimonial Cards Grid */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.15 } },
              }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.div
                variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
                className="border border-white/20 rounded-lg p-8 bg-white/5"
              >
                <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'italic', fontWeight: 400, fontSize: '16px', lineHeight: '24px' }} className="text-white/90 mb-6">
                  "Smart Website transformed how I run my plumbing business. I get more leads, close more jobs, and spend less time on admin. Best investment I've made."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600 }}>
                    JM
                  </div>
                  <div>
                    <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 500 }} className="text-white">James Malan</p>
                    <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px' }} className="text-white/60">Plumber, Cape Town</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
                className="border border-white/20 rounded-lg p-8 bg-white/5"
              >
                <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'italic', fontWeight: 400, fontSize: '16px', lineHeight: '24px' }} className="text-white/90 mb-6">
                  "The WhatsApp integration is a game-changer. My customers love the instant communication, and I can manage everything from my phone."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600 }}>
                    SN
                  </div>
                  <div>
                    <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 500 }} className="text-white">Sarah Naidoo</p>
                    <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px' }} className="text-white/60">Cleaning Services, Durban</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
                className="border border-white/20 rounded-lg p-8 bg-white/5"
              >
                <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'italic', fontWeight: 400, fontSize: '16px', lineHeight: '24px' }} className="text-white/90 mb-6">
                  "Finally, a platform built for trades. The quote system alone saves me 5 hours a week, and my conversion rate has doubled."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600 }}>
                    DP
                  </div>
                  <div>
                    <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 500 }} className="text-white">David Petersen</p>
                    <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px' }} className="text-white/60">Electrician, Johannesburg</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Stats Block */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="text-center">
                <div style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 700, fontSize: '60px' }} className="mb-3">
                  <CountUp end={15} duration={2.5} />+
                </div>
                <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px', letterSpacing: '0.05em' }} className="uppercase text-white/70">Industries Served</p>
              </div>
              <div className="text-center">
                <div style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 700, fontSize: '60px' }} className="mb-3">
                  <CountUp end={10} duration={2.5} />+
                </div>
                <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px', letterSpacing: '0.05em' }} className="uppercase text-white/70">Hours Saved Per Week</p>
              </div>
              <div className="text-center">
                <div style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 700, fontSize: '60px' }} className="mb-3">
                  <CountUp end={40} duration={2.5} />%
                </div>
                <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px', letterSpacing: '0.05em' }} className="uppercase text-white/70">Average Revenue Growth</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 5: Pricing - White Background */}
        <section className="bg-white py-24 md:py-32">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '12px', lineHeight: '18px', letterSpacing: '0.3em', color: '#42474d' }} className="uppercase mb-8">
                Pricing
              </p>
              <h3 style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 700, fontSize: '48px', lineHeight: '60px', color: '#42474d' }} className="md:text-5xl mb-8">
                Simple, Transparent Pricing
              </h3>
              <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#42474d' }} className="mb-20 max-w-2xl">
                Start with a 14-day free trial. No credit card required. Cancel anytime.
              </p>

              <div className="flex justify-center">
                <div className="w-full max-w-md">
                  <Card className="border-2 border-black transition-all duration-300 h-full flex flex-col">
                    {/* Launch Price Badge */}
                    <div className="bg-black text-white py-3 px-6 text-center">
                      <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '0.05em' }} className="uppercase">LAUNCH PRICE</p>
                    </div>

                    <CardHeader className="text-center pt-8">
                      <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px', color: '#42474d' }} className="mb-2">1 user</p>
                      <CardTitle style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 700, fontSize: '36px', color: '#42474d' }} className="mb-3">
                        Connect
                      </CardTitle>
                      <CardDescription style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#42474d' }}>
                        Automations and must-have integrations to reduce admin work and impress customers.
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-grow px-8">
                      {/* Price */}
                      <div className="mb-8 text-center">
                        <div className="flex items-baseline justify-center gap-1">
                          <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 700, fontSize: '48px', color: '#42474d' }}>R350</span>
                          <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 500, fontSize: '20px', color: '#42474d' }}>/mo</span>
                        </div>
                        <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 500, fontSize: '14px', color: '#42474d' }} className="mt-2">
                          Billed monthly
                        </p>
                      </div>

                      {/* CTA Button */}
                      <Link href={isAuthenticated ? "/dashboard" : "/register"} className="flex justify-center">
                        <Button
                          size="lg" 
                          className="rounded-full px-8 py-6 mb-8"
                          style={{ 
                            fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif',
                            fontStyle: 'normal',
                            fontWeight: 500,
                            fontSize: '16px',
                            backgroundColor: '#612fff',
                            color: 'white'
                          }}
                          disabled={isLoading}
                        >
                          {isAuthenticated ? "Go to Dashboard" : "Get Started Free – No Credit Card Required"}
                        </Button>
                      </Link>

                      {/* Features */}
                      <div className="space-y-3">
                        <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 700, fontSize: '14px', color: '#42474d' }} className="mb-4">Everything you need to run your business:</p>

                        {/* Get Noticed & Capture Leads */}
                        <div>
                          <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '13px', color: '#42474d' }} className="mb-2">Get Noticed & Capture Leads</p>
                          <div className="flex items-start gap-3 mb-1">
                            <Check className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={3} style={{ color: '#612fff' }} />
                            <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px', color: '#42474d' }}>Professional business website</span>
                          </div>
                        </div>

                        {/* Win Jobs with Automated Quotes */}
                        <div>
                          <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '13px', color: '#42474d' }} className="mb-2 mt-3">Win Jobs with Automated Quotes</p>
                          <div className="flex items-start gap-3 mb-1">
                            <Check className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={3} style={{ color: '#612fff' }} />
                            <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px', color: '#42474d' }}>Instant quote generation from customer requests</span>
                          </div>
                          <div className="flex items-start gap-3 mb-1">
                            <Check className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={3} style={{ color: '#612fff' }} />
                            <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px', color: '#42474d' }}>Customer self-scheduling (book directly from quote)</span>
                          </div>
                        </div>

                        {/* Smart Communication & Scheduling */}
                        <div>
                          <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '13px', color: '#42474d' }} className="mb-2 mt-3">Smart Communication & Scheduling</p>
                          <div className="flex items-start gap-3 mb-1">
                            <Check className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={3} style={{ color: '#612fff' }} />
                            <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px', color: '#42474d' }}>Automated appointment reminders</span>
                          </div>
                          <div className="flex items-start gap-3 mb-1">
                            <Check className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={3} style={{ color: '#612fff' }} />
                            <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px', color: '#42474d' }}>WhatsApp and email automation for quotes, invoices, reminders</span>
                          </div>
                        </div>

                        {/* Secure Deposits & Payments */}
                        <div>
                          <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '13px', color: '#42474d' }} className="mb-2 mt-3">Secure Deposits & Payments</p>
                          <div className="flex items-start gap-3 mb-1">
                            <Check className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={3} style={{ color: '#612fff' }} />
                            <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px', color: '#42474d' }}>Automated deposit requests on quote acceptance</span>
                          </div>
                          <div className="flex items-start gap-3 mb-1">
                            <Check className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={3} style={{ color: '#612fff' }} />
                            <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px', color: '#42474d' }}>Deposit tracking and payment confirmations</span>
                          </div>
                          <div className="flex items-start gap-3 mb-1">
                            <Check className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={3} style={{ color: '#612fff' }} />
                            <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px', color: '#42474d' }}>Professional invoicing</span>
                          </div>
                        </div>

                        {/* Customer Experience & Insights */}
                        <div>
                          <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '13px', color: '#42474d' }} className="mb-2 mt-3">Customer Experience & Insights</p>
                          <div className="flex items-start gap-3 mb-1">
                            <Check className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={3} style={{ color: '#612fff' }} />
                            <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px', color: '#42474d' }}>Customer portal for self-service</span>
                          </div>
                          <div className="flex items-start gap-3 mb-1">
                            <Check className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={3} style={{ color: '#612fff' }} />
                            <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px', color: '#42474d' }}>Dashboard with key business metrics</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Trial Info */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
                className="mt-12 text-center max-w-2xl mx-auto"
                style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px', color: '#42474d' }}
              >
                <p className="mb-2">
                  <strong style={{ color: '#42474d' }}>14-Day Free Trial:</strong> Full access to all features. No credit card required to start.
                </p>
                <p>
                  After your trial, choose to continue with monthly or annual billing. Cancel anytime with no questions asked.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Section 6: Industries - Black Background */}
        <section className="bg-black text-white py-24 md:py-32">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '12px', lineHeight: '18px', letterSpacing: '0.3em' }} className="uppercase mb-8">
                Industries
              </p>
              <h3 style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 700, fontSize: '48px', lineHeight: '60px' }} className="md:text-5xl mb-8">
                Built for Home Service Pros Across Industries
              </h3>
              <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '16px', lineHeight: '24px' }} className="text-white/70 mb-20 max-w-2xl">
                Get industry-specific tools that adapt to your needs, from recurring jobs to custom quotes
              </p>

              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
                }}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
              >
                <Link href="/industries/landscaping-software" className="block border border-white/20 rounded-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(255,255,255,0.12)]">
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    className="p-6 flex items-center gap-4"
                  >
                    <TreePine className="h-8 w-8 flex-shrink-0" />
                    <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '18px' }}>Landscaping</span>
                  </motion.div>
                </Link>

                <Link href="/industries/cleaning-software" className="block border border-white/20 rounded-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(255,255,255,0.12)]">
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    className="p-6 flex items-center gap-4"
                  >
                    <Sparkles className="h-8 w-8 flex-shrink-0" />
                    <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '18px' }}>Cleaning</span>
                  </motion.div>
                </Link>

                <Link href="/industries/plumbing-software" className="block border border-white/20 rounded-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(255,255,255,0.12)]">
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    className="p-6 flex items-center gap-4"
                  >
                    <Droplet className="h-8 w-8 flex-shrink-0" />
                    <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '18px' }}>Plumbing</span>
                  </motion.div>
                </Link>

                <Link href="/industries/electrical-software" className="block border border-white/20 rounded-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(255,255,255,0.12)]">
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    className="p-6 flex items-center gap-4"
                  >
                    <Plug className="h-8 w-8 flex-shrink-0" />
                    <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '18px' }}>Electrical</span>
                  </motion.div>
                </Link>

                <Link href="/industries/hvac-software" className="block border border-white/20 rounded-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(255,255,255,0.12)]">
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    className="p-6 flex items-center gap-4"
                  >
                    <Fan className="h-8 w-8 flex-shrink-0" />
                    <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '18px' }}>HVAC</span>
                  </motion.div>
                </Link>

                <Link href="/industries/handyman-software" className="block border border-white/20 rounded-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(255,255,255,0.12)]">
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    className="p-6 flex items-center gap-4"
                  >
                    <Wrench className="h-8 w-8 flex-shrink-0" />
                    <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '18px' }}>Handyman</span>
                  </motion.div>
                </Link>

                <Link href="/industries/painting-software" className="block border border-white/20 rounded-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(255,255,255,0.12)]">
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    className="p-6 flex items-center gap-4"
                  >
                    <PaintBucket className="h-8 w-8 flex-shrink-0" />
                    <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '18px' }}>Painting</span>
                  </motion.div>
                </Link>

                <Link href="/industries/roofing-software" className="block border border-white/20 rounded-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(255,255,255,0.12)]">
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    className="p-6 flex items-center gap-4"
                  >
                    <HomeIcon className="h-8 w-8 flex-shrink-0" />
                    <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '18px' }}>Roofing</span>
                  </motion.div>
                </Link>

                <Link href="/industries/construction-software" className="block border border-white/20 rounded-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(255,255,255,0.12)]">
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    className="p-6 flex items-center gap-4"
                  >
                    <Hammer className="h-8 w-8 flex-shrink-0" />
                    <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '18px' }}>Construction</span>
                  </motion.div>
                </Link>

                <Link href="/industries/pool-maintenance-software" className="block border border-white/20 rounded-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(255,255,255,0.12)]">
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    className="p-6 flex items-center gap-4"
                  >
                    <Flower2 className="h-8 w-8 flex-shrink-0" />
                    <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '18px' }}>Pool Maintenance</span>
                  </motion.div>
                </Link>

                <Link href="/industries/pest-control-software" className="block border border-white/20 rounded-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(255,255,255,0.12)]">
                  <motion.div 
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    className="p-6 flex items-center gap-4"
                  >
                    <Scissors className="h-8 w-8 flex-shrink-0" />
                    <span style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '18px' }}>Pest Control</span>
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Section 7: FAQ Section - White Background */}
        <section className="bg-white py-24 md:py-32">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <div className="max-w-4xl mx-auto mb-12">
                <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '12px', lineHeight: '18px', letterSpacing: '0.3em' }} className="uppercase mb-8">
                  Frequently Asked Questions
                </p>
                <h3 style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 700, fontSize: '48px', lineHeight: '60px' }} className="md:text-5xl mb-8">
                  Common Questions
                </h3>
              </div>

              <div className="max-w-4xl mx-auto">
                <Accordion type="single" collapsible className="space-y-0">
                  <AccordionItem value="what-is" className="border-b border-gray-200">
                    <AccordionTrigger 
                      className="text-left py-6 hover:no-underline"
                      style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '20px', color: '#42474d' }}
                    >
                      What is ServiceLoop?
                    </AccordionTrigger>
                    <AccordionContent 
                      className="pb-6 pt-2"
                      style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#42474d' }}
                    >
                      ServiceLoop is an all-in-one business management platform for service professionals in South Africa. We help plumbers, electricians, landscapers, and other home service businesses automate quotes, manage schedules, and get paid faster—all from one simple platform.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="pricing" className="border-b border-gray-200">
                    <AccordionTrigger 
                      className="text-left py-6 hover:no-underline"
                      style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '20px', color: '#42474d' }}
                    >
                      How much does ServiceLoop cost?
                    </AccordionTrigger>
                    <AccordionContent 
                      className="pb-6 pt-2"
                      style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#42474d' }}
                    >
                      ServiceLoop starts at R350/month with our Connect plan. This includes your professional website, automated quotes, WhatsApp integration, calendar scheduling, invoicing, and more. We offer a 14-day free trial with no credit card required.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="free-trial" className="border-b border-gray-200">
                    <AccordionTrigger 
                      className="text-left py-6 hover:no-underline"
                      style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '20px', color: '#42474d' }}
                    >
                      Can I try ServiceLoop for free?
                    </AccordionTrigger>
                    <AccordionContent 
                      className="pb-6 pt-2"
                      style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#42474d' }}
                    >
                      Yes! We offer a 14-day free trial with full access to all features. No credit card required to start. You can explore automated quotes, calendar booking, WhatsApp notifications, and everything else ServiceLoop offers before committing.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="mobile" className="border-b border-gray-200">
                    <AccordionTrigger 
                      className="text-left py-6 hover:no-underline"
                      style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '20px', color: '#42474d' }}
                    >
                      Does ServiceLoop work on mobile?
                    </AccordionTrigger>
                    <AccordionContent 
                      className="pb-6 pt-2"
                      style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#42474d' }}
                    >
                      Absolutely. ServiceLoop is mobile-first. Manage jobs, send quotes, view your calendar, and communicate with customers—all from your phone. The dashboard is fully responsive and works perfectly on any device.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="industries" className="border-b border-gray-200">
                    <AccordionTrigger 
                      className="text-left py-6 hover:no-underline"
                      style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '20px', color: '#42474d' }}
                    >
                      Which industries does ServiceLoop support?
                    </AccordionTrigger>
                    <AccordionContent 
                      className="pb-6 pt-2"
                      style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#42474d' }}
                    >
                      ServiceLoop is built for home service professionals including: Plumbing, Electrical, HVAC, Landscaping, Cleaning, Painting, Roofing, Pool Maintenance, Pest Control, Handyman services, and more. Our platform adapts to your industry with custom service catalogs and pricing.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="mt-8 text-center">
                  <Link href="/faq">
                    <Button 
                      variant="link" 
                      className="text-black p-0 h-auto font-normal uppercase tracking-[0.2em] text-xs"
                      style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif' }}
                    >
                      View All FAQs →
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 8: Additional Benefits Teaser - White Background */}
        <section className="bg-white py-24 md:py-32">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '12px', lineHeight: '18px', letterSpacing: '0.3em' }} className="uppercase mb-8">
                More Ways We Help You Succeed
              </p>
              <h3 style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 700, fontSize: '48px', lineHeight: '60px' }} className="md:text-5xl mb-20">
                More Ways We Help You Succeed
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
                <div className="border border-gray-200 rounded-lg p-8 flex flex-col justify-between">
                  <div>
                    <h4 style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '24px' }} className="mb-4">Multi-Channel Communication</h4>
                    <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px' }} className="text-gray-600 mb-8">
                      Connect with your customers instantly through WhatsApp, Email, and SMS, all from one platform.
                    </p>
                  </div>
                  <Link href={isAuthenticated ? "/communication" : loginPath + "?returnUrl=/communication"}>
                    <Button variant="link" className="text-black p-0 h-auto font-light uppercase tracking-[0.2em] text-xs justify-start">
                      Learn More →
                    </Button>
                  </Link>
                </div>
                <div className="border border-gray-200 rounded-lg p-8 flex flex-col justify-between">
                  <div>
                    <h4 style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '24px' }} className="mb-4">Mobile-First Capabilities</h4>
                    <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px' }} className="text-gray-600 mb-8">
                      Manage your business on the go with our fully responsive, mobile-first platform. Access your dashboard from any device.
                    </p>
                  </div>
                  <Link href={isAuthenticated ? "/features" : loginPath + "?returnUrl=/features"}>
                    <Button variant="link" className="text-black p-0 h-auto uppercase tracking-[0.2em] text-xs justify-start" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400 }}>
                      Learn More →
                    </Button>
                  </Link>
                </div>
                <div className="border border-gray-200 rounded-lg p-8 flex flex-col justify-between">
                  <div>
                    <h4 style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '24px' }} className="mb-4">Security & Trust</h4>
                    <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px' }} className="text-gray-600 mb-8">
                      Your data is safe with us. We employ robust security measures to protect your business information and client data.
                    </p>
                  </div>
                  <Link href={isAuthenticated ? "/features" : loginPath + "?returnUrl=/features"}>
                    <Button variant="link" className="text-black p-0 h-auto font-light uppercase tracking-[0.2em] text-xs justify-start">
                      Learn More →
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative flex items-center overflow-hidden py-24 md:py-32" style={{ background: 'linear-gradient(to bottom right, rgba(97, 47, 255, 0.7), rgba(74, 31, 204, 0.7), rgba(56, 24, 160, 0.7))' }}>
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1920&q=80)` }}
          />

          <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-3xl"
            >
              <h2 style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 700, fontSize: '72px', lineHeight: '90px' }} className="md:text-6xl lg:text-7xl mb-12 text-white">
                Ready to Grow Your Business?
              </h2>
              <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontStyle: 'normal', fontWeight: 400, fontSize: '18px', lineHeight: '27px' }} className="mb-16 text-white/80">
                Join service businesses across South Africa who are attracting more customers and increasing revenue with Smart Website.
              </p>
              <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                <Button 
                  size="lg" 
                  className="bg-white text-black hover:bg-gray-100 rounded-full px-12 py-6 uppercase tracking-wider"
                  style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 500, fontSize: '14px' }}
                  data-testid="button-cta-signup"
                  disabled={isLoading}
                >
                  {isAuthenticated ? "Go to Dashboard" : "Start Your Free Trial"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '14px', letterSpacing: '0.025em' }} className="mt-8 text-white/60">
                No credit card required • Setup in 24 hours • Cancel anytime
              </p>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}