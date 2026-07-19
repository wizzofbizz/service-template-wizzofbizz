import { z } from "zod";

// Image analysis config schema
export const imageAnalysisConfigSchema = z.object({
  enabled: z.boolean().default(false),
  requiredPhotos: z.array(z.string()).default([]),
  analysisHints: z.string().optional(),
});

// Template validation schema
export const serviceTemplateSchema = z.object({
  serviceName: z.string().min(1),
  description: z.string().min(1),
  category: z.string().optional(),
  basePrice: z.string(),
  pricingFormula: z.string(),
  ruleConfig: z.record(z.any()),
  aiGuidancePrompt: z.string(),
  durationMinutes: z.number().int().positive(),
  requiresSiteVisit: z.boolean(),
  pricingType: z.enum(["fixed", "hourly", "per_item", "custom"]),
  serviceQuestions: z.array(z.object({
    question: z.string(),
    type: z.enum(["text", "number", "select"]),
    options: z.array(z.string()).optional(),
    required: z.boolean().optional(),
    variableName: z.string().optional(),
  })).optional(),
  imageAnalysisConfig: imageAnalysisConfigSchema.optional(),
});

export type ServiceTemplate = z.infer<typeof serviceTemplateSchema>;

// Industry-specific service templates
export const INDUSTRY_SERVICE_TEMPLATES: Record<string, ServiceTemplate[]> = {
  Plumbing: [
    {
      serviceName: "Emergency Leak Repair",
      description: "Urgent repair for burst pipes, leaking geysers, or water damage",
      category: "Emergency",
      basePrice: "500.00",
      pricingFormula: "base_price + (hours * hourly_rate * urgency_multiplier) + (km * travel_rate) + materials_cost",
      ruleConfig: {
        hourly_rate: 800,
        travel_rate: 20,
        emergency_multiplier: 2.0,
        materials_markup: 1.3,
      },
      aiGuidancePrompt: "Extract: 1) hours: estimate repair time (burst pipe=2-4h, leak=1-2h), 2) km: travel distance from business location, 3) urgency: high for active flooding/geyser burst (use emergency_multiplier), normal for dripping taps, 4) materials_needed: pipes, fittings, valves (apply materials_markup). Suggest: water damage assessment if flooding mentioned, geyser replacement if unit is old (>10 years).",
      durationMinutes: 120,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "Where is the leak?",
          type: "select",
          options: ["Burst pipe", "Leaking geyser", "Dripping tap", "Toilet", "Other"],
          required: true,
          variableName: "leak_type",
        },
        {
          question: "How urgent is this?",
          type: "select",
          options: ["Emergency - Water everywhere!", "Urgent - Active leak", "Not urgent - Slow drip"],
          required: true,
          variableName: "urgency_multiplier",
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
          variableName: "address",
        },
        {
          question: "How far are you from us (rough estimate in km)?",
          type: "number",
          required: false,
          variableName: "km",
        },
      ],
      imageAnalysisConfig: {
        enabled: true,
        requiredPhotos: ["Photo of the leak/damage", "Photo showing surrounding area"],
        analysisHints: "Look for: water damage severity, pipe material (copper/PVC/galvanized), leak location, visible corrosion, water stains indicating duration of leak",
      },
    },
    {
      serviceName: "Geyser Installation",
      description: "Installation of new geyser including removal of old unit",
      category: "Installation",
      basePrice: "1500.00",
      pricingFormula: "base_price + (hours * hourly_rate) + (geyser_size * size_multiplier) + materials_cost",
      ruleConfig: {
        hourly_rate: 700,
        size_multiplier: 50,
        materials_markup: 1.2,
      },
      aiGuidancePrompt: "Extract: 1) hours: standard installation 3-4h, difficult access +2h, 2) geyser_size: liters (100L, 150L, 200L), 3) materials_needed: pipes, valves, drip tray, overflow pipe (apply materials_markup). Suggest: upgrade to solar geyser if budget allows, pressure valve replacement if old, ceiling insulation check.",
      durationMinutes: 240,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What size geyser do you need?",
          type: "select",
          options: ["100 liters", "150 liters", "200 liters", "Not sure"],
          required: true,
          variableName: "geyser_size",
        },
        {
          question: "Where is the geyser located?",
          type: "select",
          options: ["Inside ceiling (easy access)", "Inside ceiling (difficult access)", "Outside on roof", "Ground level"],
          required: true,
        },
        {
          question: "Do you need the old geyser removed?",
          type: "select",
          options: ["Yes - remove old geyser", "No - new installation only"],
          required: true,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
          variableName: "address",
        },
      ],
      imageAnalysisConfig: {
        enabled: true,
        requiredPhotos: ["Photo of current geyser location", "Photo of access area to geyser"],
        analysisHints: "Look for: geyser size label, age/condition, mounting location, access difficulty, visible rust or leaks, surrounding ceiling space",
      },
    },
    {
      serviceName: "Drain Cleaning",
      description: "Unblocking of drains, toilets, or sewage lines",
      category: "Maintenance",
      basePrice: "400.00",
      pricingFormula: "base_price + (hours * hourly_rate) + (severity * urgency_multiplier)",
      ruleConfig: {
        hourly_rate: 600,
        urgency_multiplier: 150,
      },
      aiGuidancePrompt: "Extract: 1) hours: simple blockage 1h, complex/main line 2-3h, 2) severity: 1-3 scale (1=slow drain, 2=completely blocked, 3=sewage backup requiring urgency_multiplier). Suggest: camera inspection for recurring blockages, drain maintenance schedule, tree root removal if garden drains affected.",
      durationMinutes: 90,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What's blocked?",
          type: "select",
          options: ["Kitchen sink", "Bathroom sink", "Shower/bath", "Toilet", "Outside drain", "Main sewer line"],
          required: true,
        },
        {
          question: "How bad is it?",
          type: "select",
          options: ["Slow draining", "Completely blocked", "Sewage backing up - emergency!"],
          required: true,
          variableName: "severity",
        },
        {
          question: "How long has it been blocked?",
          type: "select",
          options: ["Just now", "A few days", "Over a week", "Recurring problem"],
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
      imageAnalysisConfig: {
        enabled: true,
        requiredPhotos: ["Photo of blocked drain", "Photo showing any water backup"],
        analysisHints: "Look for: blockage severity, water pooling, any visible debris, drain type, signs of root intrusion for outdoor drains",
      },
    },
    {
      serviceName: "Bathroom/Kitchen Plumbing",
      description: "Installation or repair of bathroom and kitchen fixtures",
      category: "Installation",
      basePrice: "800.00",
      pricingFormula: "base_price + (hours * hourly_rate) + (fixtures * fixture_rate)",
      ruleConfig: {
        hourly_rate: 650,
        fixture_rate: 200,
      },
      aiGuidancePrompt: "Extract: 1) hours: per fixture installation 1-2h, full bathroom 6-8h, 2) fixtures: count of taps, toilets, basins, showers being installed/repaired (multiply by fixture_rate). Suggest: upgrade to water-saving fixtures, check for leaks in existing plumbing, pressure test after installation.",
      durationMinutes: 180,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What needs to be done?",
          type: "select",
          options: ["Install new fixtures", "Repair existing fixtures", "Replace old fixtures", "Full bathroom/kitchen renovation"],
          required: true,
        },
        {
          question: "Which fixtures? (Select all that apply)",
          type: "select",
          options: ["Taps/faucets", "Toilet", "Basin/sink", "Shower", "Bath", "Kitchen sink"],
          required: true,
        },
        {
          question: "How many fixtures in total?",
          type: "number",
          required: true,
          variableName: "fixtures",
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "General Plumbing Service",
      description: "General plumbing maintenance, inspections, and minor repairs",
      category: "Maintenance",
      basePrice: "350.00",
      pricingFormula: "base_price + (hours * hourly_rate) + (km * travel_rate)",
      ruleConfig: {
        hourly_rate: 600,
        travel_rate: 15,
      },
      aiGuidancePrompt: "Extract: 1) hours: inspection 1h, minor repairs 1-2h, 2) km: travel distance from business location. Suggest: geyser pressure check, leak detection survey, tap washer replacements, toilet mechanism service.",
      durationMinutes: 90,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What do you need help with?",
          type: "text",
          required: true,
        },
        {
          question: "Is this urgent?",
          type: "select",
          options: ["Not urgent", "Fairly urgent", "Very urgent"],
          required: true,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
          variableName: "address",
        },
      ],
    },
  ],

  Electrical: [
    {
      serviceName: "COC (Certificate of Compliance)",
      description: "Electrical compliance certificate for property sales/insurance",
      category: "Certification",
      basePrice: "1200.00",
      pricingFormula: "base_price + (property_size * size_rate) + (complexity * 300)",
      ruleConfig: {
        size_rate: 5,
        complexity_multiplier: 300,
      },
      aiGuidancePrompt: "Extract: 1) property_size: square meters or room count, 2) complexity: 1-3 scale (1=small flat/house, 2=medium house with pool/borehole, 3=large property/commercial with multiple DBs). Price range: R1200 (small flat) to R2500 (large complex property). Suggest: defect repairs if non-compliant items found, earth leakage testing, surge protection installation.",
      durationMinutes: 120,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What type of property is this?",
          type: "select",
          options: ["Apartment/Flat", "Small house (1-2 bedrooms)", "Medium house (3-4 bedrooms)", "Large house (5+ bedrooms)", "Commercial property"],
          required: true,
          variableName: "complexity",
        },
        {
          question: "How many bedrooms?",
          type: "number",
          required: false,
          variableName: "property_size",
        },
        {
          question: "Do you have any of these? (Select all that apply)",
          type: "select",
          options: ["Pool pump", "Borehole", "Solar panels", "Multiple DB boards", "None of these"],
          required: false,
        },
        {
          question: "When do you need the COC?",
          type: "select",
          options: ["ASAP - Property transfer pending", "Within 2 weeks", "Within a month", "No rush"],
          required: true,
        },
      ],
      imageAnalysisConfig: {
        enabled: true,
        requiredPhotos: ["Photo of main DB board", "Photo of property exterior"],
        analysisHints: "Look for: DB board age/condition, number of circuits, visible wiring issues, property size indicators, pool pump or solar installations",
      },
    },
    {
      serviceName: "House Rewiring",
      description: "Complete or partial electrical rewiring of property",
      category: "Installation",
      basePrice: "2000.00",
      pricingFormula: "base_price + (points * point_rate) + (complexity * complexity_multiplier)",
      ruleConfig: {
        point_rate: 150,
        complexity_multiplier: 500,
      },
      aiGuidancePrompt: "Extract: 1) points: number of electrical points (lights, plugs, switches) to be rewired, 2) complexity: 1-3 scale (1=single room, 2=multiple rooms/partial house, 3=full house/difficult access). Calculate: base + (points * R150) + complexity adjustment. Suggest: upgrade to modern earth leakage protection, surge protection for sensitive equipment, additional plug points in kitchen/study areas.",
      durationMinutes: 480,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What needs rewiring?",
          type: "select",
          options: ["Single room", "A few rooms", "Whole house", "Just add extra plugs/lights"],
          required: true,
          variableName: "complexity",
        },
        {
          question: "Roughly how many plug points and lights?",
          type: "number",
          required: false,
          variableName: "points",
        },
        {
          question: "Type of property?",
          type: "select",
          options: ["House", "Flat/Apartment", "Office", "Other"],
          required: true,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "DB Board Installation",
      description: "New distribution board installation or replacement",
      category: "Installation",
      basePrice: "3500.00",
      pricingFormula: "base_price + (hours * hourly_rate) + (circuits * circuit_rate)",
      ruleConfig: {
        hourly_rate: 750,
        circuit_rate: 150,
      },
      aiGuidancePrompt: "Extract: 1) hours: standard DB replacement 3-4h, new installation with wiring 6-8h, 2) circuits: number of circuits needed (typically 8-20 for residential). Suggest: earth leakage protection on all circuits, surge protection module, clearly labeled circuits, spare capacity for future additions.",
      durationMinutes: 240,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What do you need?",
          type: "select",
          options: ["Replace existing DB board", "New DB board installation", "Upgrade/add circuits to existing"],
          required: true,
        },
        {
          question: "How many circuits do you need?",
          type: "number",
          required: false,
          variableName: "circuits",
        },
        {
          question: "Type of property?",
          type: "select",
          options: ["Residential house", "Flat/Apartment", "Office/Commercial"],
          required: true,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Emergency Electrical Call-Out",
      description: "Urgent electrical repairs for power failures, tripping, sparking",
      category: "Emergency",
      basePrice: "800.00",
      pricingFormula: "base_price + (hours * hourly_rate * emergency_multiplier) + (km * travel_rate)",
      ruleConfig: {
        hourly_rate: 1000,
        emergency_multiplier: 2.0,
        travel_rate: 25,
      },
      aiGuidancePrompt: "Extract: 1) hours: fault finding 1-2h, repair 1-3h depending on issue, 2) km: travel distance, 3) time_of_day: apply emergency_multiplier for after-hours/weekends. Common issues: tripping DB, power failure, burning smell, sparking plugs. Suggest: full electrical inspection after emergency repair, earth leakage testing, replace old wiring if recurring issues.",
      durationMinutes: 120,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What's the problem?",
          type: "select",
          options: ["No power at all", "DB keeps tripping", "Sparking plug/switch", "Burning smell", "Other electrical emergency"],
          required: true,
        },
        {
          question: "When did this happen?",
          type: "select",
          options: ["Just now", "Today", "Yesterday", "A few days ago"],
          required: true,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
          variableName: "address",
        },
      ],
    },
    {
      serviceName: "General Electrical Repairs",
      description: "Installation and repair of lights, plugs, switches, and appliances",
      category: "Maintenance",
      basePrice: "450.00",
      pricingFormula: "base_price + (hours * hourly_rate) + (km * travel_rate)",
      ruleConfig: {
        hourly_rate: 700,
        travel_rate: 15,
      },
      aiGuidancePrompt: "Extract: 1) hours: per item 0.5-1h, multiple items 2-3h, 2) km: travel distance. Common jobs: replace light fittings, install plugs/switches, fix faulty appliances, install ceiling fans. Suggest: upgrade to LED lighting, install dimmers for ambiance, check earth leakage on bathroom circuits.",
      durationMinutes: 90,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What needs fixing or installing?",
          type: "text",
          required: true,
        },
        {
          question: "How many items?",
          type: "number",
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
  ],

  HVAC: [
    {
      serviceName: "Aircon Installation",
      description: "Installation of new air conditioning unit (split or ducted)",
      category: "Installation",
      basePrice: "3000.00",
      pricingFormula: "base_price + (units * unit_rate) + (complexity * complexity_multiplier)",
      ruleConfig: {
        unit_rate: 2500,
        complexity_multiplier: 800,
      },
      aiGuidancePrompt: "Extract: 1) units: number of indoor/outdoor units, 2) complexity: 1-3 scale (1=ground floor easy access, 2=first floor/multi-story, 3=difficult access/ducted system). Calculate per unit and add complexity. Suggest: inverter units for energy saving, appropriate BTU for room size, regular maintenance plan.",
      durationMinutes: 360,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "How many rooms need aircon?",
          type: "number",
          required: true,
          variableName: "units",
        },
        {
          question: "What type of building?",
          type: "select",
          options: ["Single-story house", "Double-story house", "Apartment/Flat", "Office/Commercial"],
          required: true,
          variableName: "complexity",
        },
        {
          question: "Where will the outdoor unit be installed?",
          type: "select",
          options: ["Ground level - easy access", "On wall - first floor", "Roof - difficult access", "Not sure yet"],
          required: false,
        },
        {
          question: "What size rooms? (helps us recommend the right BTU)",
          type: "select",
          options: ["Small bedrooms", "Medium bedrooms", "Large bedrooms/lounge", "Open plan area", "Mixed sizes"],
          required: false,
        },
      ],
      imageAnalysisConfig: {
        enabled: true,
        requiredPhotos: ["Photo of room(s) to be cooled", "Photo of proposed outdoor unit location"],
        analysisHints: "Look for: room size estimation, ceiling height, sun exposure, existing electrical points, outdoor unit mounting options, access difficulty",
      },
    },
    {
      serviceName: "Aircon Servicing",
      description: "Regular maintenance and cleaning of air conditioning units",
      category: "Maintenance",
      basePrice: "450.00",
      pricingFormula: "base_price + (units * unit_service_rate)",
      ruleConfig: {
        unit_service_rate: 350,
      },
      aiGuidancePrompt: "Extract: 1) units: number of units requiring service. Service includes: filter cleaning, coil cleaning, drain cleaning, refrigerant level check, performance test. Suggest: service before summer season, quarterly service for commercial units, gas top-up if cooling is weak.",
      durationMinutes: 90,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "How many aircon units need servicing?",
          type: "number",
          required: true,
          variableName: "units",
        },
        {
          question: "When was the last service?",
          type: "select",
          options: ["Never serviced", "Within 6 months", "6-12 months ago", "Over a year ago", "Not sure"],
          required: false,
        },
        {
          question: "Any issues with cooling?",
          type: "select",
          options: ["No - just routine service", "Yes - not cooling well", "Yes - making noise", "Yes - leaking water"],
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Aircon Repair",
      description: "Diagnosis and repair of faulty air conditioning units",
      category: "Repair",
      basePrice: "600.00",
      pricingFormula: "base_price + (hours * hourly_rate) + parts_cost",
      ruleConfig: {
        hourly_rate: 700,
        parts_markup: 1.3,
      },
      aiGuidancePrompt: "Extract: 1) hours: diagnosis 1h, simple repair 1-2h, complex repair 3-4h, 2) parts_needed: compressor, fan motor, circuit board, sensors (apply parts_markup). Common faults: not cooling, leaking water, noisy operation, not turning on. Suggest: replacement if unit is old (>10 years) and repair cost high.",
      durationMinutes: 120,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What's wrong with the aircon?",
          type: "select",
          options: ["Not cooling", "Not turning on", "Leaking water", "Making loud noise", "Other problem"],
          required: true,
        },
        {
          question: "How old is the unit?",
          type: "select",
          options: ["Less than 2 years", "2-5 years", "5-10 years", "Over 10 years", "Not sure"],
          required: false,
        },
        {
          question: "How many units are affected?",
          type: "number",
          required: true,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Aircon Gas Refill",
      description: "Refrigerant gas top-up and leak detection",
      category: "Maintenance",
      basePrice: "800.00",
      pricingFormula: "base_price + (units * gas_rate) + (leak_repair * 500)",
      ruleConfig: {
        gas_rate: 600,
        leak_repair_rate: 500,
      },
      aiGuidancePrompt: "Extract: 1) units: number of units needing gas, 2) leak_repair: 0 or 1 (if leak needs fixing add leak_repair_rate). Gas types: R22 (old), R410A (common), R32 (new). Suggest: leak test before refill, replace old R22 units (phase-out), pressure test after refill, investigate cause if gas loss is rapid.",
      durationMinutes: 120,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "How many units need gas?",
          type: "number",
          required: true,
          variableName: "units",
        },
        {
          question: "Is the aircon cooling at all?",
          type: "select",
          options: ["Not cooling at all", "Cooling weakly", "Cooling but not as well as before"],
          required: true,
        },
        {
          question: "When did you last have gas filled?",
          type: "select",
          options: ["Never", "Within a year", "1-2 years ago", "Over 2 years ago", "Not sure"],
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
  ],

  Cleaning: [
    {
      serviceName: "Office Cleaning",
      description: "Professional cleaning of office spaces and commercial buildings",
      category: "Commercial",
      basePrice: "250.00",
      pricingFormula: "base_price + (sqm * rate_per_sqm) + (frequency_discount * -0.15)",
      ruleConfig: {
        rate_per_sqm: 3.5,
        frequency_discount_factor: 0.15,
      },
      aiGuidancePrompt: "Extract: 1) sqm: office area in square meters, 2) frequency: daily/weekly/monthly (apply frequency_discount for recurring contracts - 15% off). Services: vacuum, mop, dust, empty bins, clean bathrooms, kitchen areas. Suggest: weekly deep clean, window cleaning monthly, carpet shampooing quarterly.",
      durationMinutes: 120,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "How large is your office?",
          type: "select",
          options: ["Small (under 100 sqm)", "Medium (100-300 sqm)", "Large (300-500 sqm)", "Very large (500+ sqm)"],
          required: true,
          variableName: "sqm",
        },
        {
          question: "How often do you need cleaning?",
          type: "select",
          options: ["Daily", "3 times per week", "Weekly", "Bi-weekly", "Monthly", "One-time deep clean"],
          required: true,
          variableName: "frequency_discount",
        },
        {
          question: "How many bathrooms?",
          type: "number",
          required: false,
        },
        {
          question: "Do you need window cleaning?",
          type: "select",
          options: ["Yes - inside only", "Yes - inside and outside", "No"],
          required: false,
        },
      ],
    },
    {
      serviceName: "Deep Clean Residential",
      description: "Thorough deep cleaning of home including all rooms and surfaces",
      category: "Residential",
      basePrice: "800.00",
      pricingFormula: "base_price + (rooms * room_rate) + (hours * 150)",
      ruleConfig: {
        room_rate: 200,
        hourly_rate: 150,
      },
      aiGuidancePrompt: "Extract: 1) rooms: number of bedrooms/bathrooms to deep clean, 2) hours: estimate time (small house 3-4h, large house 6-8h). Includes: detailed dusting, appliance cleaning, cupboard wiping, window cleaning, bathroom sanitizing, floor scrubbing. Suggest: spring cleaning twice yearly, move-in/move-out service, add carpet shampooing.",
      durationMinutes: 240,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "How many bedrooms?",
          type: "number",
          required: true,
          variableName: "rooms",
        },
        {
          question: "How many bathrooms?",
          type: "number",
          required: true,
        },
        {
          question: "What type of property?",
          type: "select",
          options: ["House", "Flat/Apartment", "Townhouse"],
          required: true,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Move-In/Move-Out Cleaning",
      description: "Comprehensive cleaning for tenants moving in or out",
      category: "Specialized",
      basePrice: "1200.00",
      pricingFormula: "base_price + (sqm * rate_per_sqm)",
      ruleConfig: {
        rate_per_sqm: 8,
      },
      aiGuidancePrompt: "Extract: 1) sqm: property size in square meters. Includes: deep clean all rooms, cupboards inside/out, oven cleaning, window cleaning, wall spot cleaning, bathroom deep sanitizing, floor scrubbing. Suggest: before final inspection, same-day service if urgent, garden cleanup add-on.",
      durationMinutes: 300,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "How many bedrooms?",
          type: "number",
          required: true,
        },
        {
          question: "When do you need it done?",
          type: "select",
          options: ["ASAP - moving tomorrow!", "Within a week", "Within 2 weeks", "Flexible"],
          required: true,
        },
        {
          question: "Moving in or moving out?",
          type: "select",
          options: ["Moving out", "Moving in"],
          required: true,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Window Cleaning",
      description: "Professional window and glass cleaning (interior and exterior)",
      category: "Specialized",
      basePrice: "400.00",
      pricingFormula: "base_price + (windows * window_rate) + (height_multiplier * 200)",
      ruleConfig: {
        window_rate: 50,
        height_multiplier_rate: 200,
      },
      aiGuidancePrompt: "Extract: 1) windows: count of window panes (standard/large), 2) height_multiplier: 0-2 scale (0=ground floor, 1=first floor, 2=multi-story requiring scaffolding/ladder). Includes: both sides, frames, sills. Suggest: quarterly service, post-construction cleaning, gutter cleaning add-on.",
      durationMinutes: 120,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "Roughly how many windows?",
          type: "number",
          required: true,
          variableName: "windows",
        },
        {
          question: "Type of building?",
          type: "select",
          options: ["Single-story house", "Double-story house", "Multi-story building", "Office/Commercial"],
          required: true,
          variableName: "height_multiplier",
        },
        {
          question: "Inside, outside, or both?",
          type: "select",
          options: ["Inside only", "Outside only", "Both sides"],
          required: true,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Carpet Cleaning",
      description: "Deep carpet shampooing and stain removal",
      category: "Specialized",
      basePrice: "150.00",
      pricingFormula: "base_price + (sqm * rate_per_sqm) + (stain_treatment * 100)",
      ruleConfig: {
        rate_per_sqm: 15,
        stain_treatment_rate: 100,
      },
      aiGuidancePrompt: "Extract: 1) sqm: carpet area in square meters, 2) stain_treatment: 0-3 count of stubborn stains needing special treatment (pet stains, wine, grease). Method: hot water extraction or dry cleaning. Suggest: scotch guard protection after cleaning, annual deep clean, move furniture carefully.",
      durationMinutes: 90,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "How many rooms have carpet?",
          type: "number",
          required: true,
        },
        {
          question: "Any stubborn stains?",
          type: "select",
          options: ["No stains - just general clean", "A few stains", "Several stubborn stains", "Heavily stained"],
          required: true,
          variableName: "stain_treatment",
        },
        {
          question: "Type of stains? (if any)",
          type: "select",
          options: ["None", "Pet stains", "Food/drink spills", "Dirt/mud", "Other"],
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
  ],

  Landscaping: [
    {
      serviceName: "Garden Maintenance",
      description: "Regular garden upkeep including mowing, trimming, weeding",
      category: "Maintenance",
      basePrice: "400.00",
      pricingFormula: "base_price + (garden_size * size_rate) + (frequency_discount * -0.20)",
      ruleConfig: {
        size_rate: 2,
        frequency_discount_factor: 0.20,
      },
      aiGuidancePrompt: "Extract: 1) garden_size: square meters or small/medium/large, 2) frequency: weekly/bi-weekly/monthly (apply 20% discount for recurring). Services: lawn mowing, edge trimming, weeding, basic pruning, debris removal. Suggest: fertilizing schedule, pest control, irrigation check, seasonal planting.",
      durationMinutes: 180,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "How big is your garden?",
          type: "select",
          options: ["Small (under 100 sqm)", "Medium (100-300 sqm)", "Large (300-500 sqm)", "Very large (500+ sqm)"],
          required: true,
          variableName: "garden_size",
        },
        {
          question: "How often do you need service?",
          type: "select",
          options: ["Weekly", "Every 2 weeks", "Monthly", "One-time only"],
          required: true,
          variableName: "frequency_discount",
        },
        {
          question: "Current garden condition?",
          type: "select",
          options: ["Well maintained", "Needs some work", "Overgrown/neglected"],
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Lawn Mowing",
      description: "Professional lawn cutting and edge trimming service",
      category: "Maintenance",
      basePrice: "250.00",
      pricingFormula: "base_price + (sqm * rate_per_sqm) + (frequency_discount * -0.15)",
      ruleConfig: {
        rate_per_sqm: 1.5,
        frequency_discount_factor: 0.15,
      },
      aiGuidancePrompt: "Extract: 1) sqm: lawn area in square meters, 2) frequency: weekly/bi-weekly for discount. Includes: mowing, edge trimming, grass removal. Suggest: weekly summer service, bi-weekly winter, fertilizing after mowing, weed control treatment.",
      durationMinutes: 90,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "How big is your lawn?",
          type: "select",
          options: ["Small (under 100 sqm)", "Medium (100-300 sqm)", "Large (300-500 sqm)", "Very large (500+ sqm)"],
          required: true,
          variableName: "sqm",
        },
        {
          question: "How often do you need mowing?",
          type: "select",
          options: ["Weekly", "Every 2 weeks", "Monthly", "One-time only"],
          required: true,
          variableName: "frequency_discount",
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Hedge Trimming",
      description: "Trimming and shaping of hedges and shrubs",
      category: "Maintenance",
      basePrice: "300.00",
      pricingFormula: "base_price + (linear_meters * meter_rate) + (height_multiplier * 100)",
      ruleConfig: {
        meter_rate: 25,
        height_multiplier_rate: 100,
      },
      aiGuidancePrompt: "Extract: 1) linear_meters: length of hedge in meters, 2) height_multiplier: 0-2 scale (0=low hedge <1.5m, 1=medium 1.5-3m, 2=tall >3m requiring ladder). Includes: trimming, shaping, debris removal. Suggest: twice yearly trimming, mulching after trim, fertilizing for growth.",
      durationMinutes: 120,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "Roughly how long is your hedge (in meters)?",
          type: "number",
          required: true,
          variableName: "linear_meters",
        },
        {
          question: "How tall is the hedge?",
          type: "select",
          options: ["Low (under 1.5m)", "Medium (1.5-3m)", "Tall (over 3m - needs ladder)"],
          required: true,
          variableName: "height_multiplier",
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Garden Design & Installation",
      description: "Complete garden redesign with plant selection and installation",
      category: "Installation",
      basePrice: "2000.00",
      pricingFormula: "base_price + (sqm * sqm_rate) + (complexity * complexity_rate)",
      ruleConfig: {
        sqm_rate: 150,
        complexity_rate: 1000,
      },
      aiGuidancePrompt: "Extract: 1) sqm: garden area to be designed/planted, 2) complexity: 1-3 scale (1=simple planting, 2=mixed beds with features, 3=complete redesign with irrigation/hardscaping). Includes: design consultation, plant selection, soil preparation, planting, mulching. Suggest: indigenous plants for water saving, irrigation system, seasonal color rotation.",
      durationMinutes: 480,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What type of garden project?",
          type: "select",
          options: ["Simple planting", "Mixed beds with features", "Complete redesign with irrigation/hardscaping"],
          required: true,
          variableName: "complexity",
        },
        {
          question: "How big is the garden area?",
          type: "select",
          options: ["Small (under 50 sqm)", "Medium (50-150 sqm)", "Large (150-300 sqm)", "Very large (300+ sqm)"],
          required: true,
          variableName: "sqm",
        },
        {
          question: "What's your vision for the garden?",
          type: "text",
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Tree Felling",
      description: "Safe removal of trees including stump grinding",
      category: "Specialized",
      basePrice: "800.00",
      pricingFormula: "base_price + (trees * tree_rate) + (height_multiplier * 500) + (difficulty * 400)",
      ruleConfig: {
        tree_rate: 400,
        height_multiplier_rate: 500,
        difficulty_rate: 400,
      },
      aiGuidancePrompt: "Extract: 1) trees: count of trees to remove, 2) height_multiplier: 0-2 scale (0=small <5m, 1=medium 5-10m, 2=large >10m), 3) difficulty: 0-2 scale (0=open area, 1=near structures, 2=confined space/power lines). Includes: felling, branch removal, stump grinding, debris removal. Suggest: municipal permit check, stump removal, replanting native trees.",
      durationMinutes: 240,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "How many trees need to be removed?",
          type: "number",
          required: true,
          variableName: "trees",
        },
        {
          question: "How tall are the trees?",
          type: "select",
          options: ["Small (under 5m)", "Medium (5-10m)", "Large (over 10m)"],
          required: true,
          variableName: "height_multiplier",
        },
        {
          question: "Where are the trees located?",
          type: "select",
          options: ["Open area - easy access", "Near buildings/structures", "Confined space or near power lines"],
          required: true,
          variableName: "difficulty",
        },
        {
          question: "Do you need the stumps removed?",
          type: "select",
          options: ["Yes - grind stumps", "No - leave stumps"],
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
  ],

  "Pool Maintenance": [
    {
      serviceName: "Weekly Pool Service",
      description: "Regular pool cleaning and chemical balancing",
      category: "Maintenance",
      basePrice: "350.00",
      pricingFormula: "base_price + (pool_size * size_rate) + (frequency_discount * -0.20)",
      ruleConfig: {
        size_rate: 0.5,
        frequency_discount_factor: 0.20,
      },
      aiGuidancePrompt: "Extract: 1) pool_size: liters or small/medium/large, 2) frequency: weekly (standard) or bi-weekly (apply discount for weekly contract). Services: vacuum, brush, skim, test & balance chemicals, backwash filter. Suggest: weekly service in summer, bi-weekly in winter, green pool shock treatment if needed.",
      durationMinutes: 90,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What size is your pool?",
          type: "select",
          options: ["Small (up to 30,000L)", "Medium (30,000-50,000L)", "Large (50,000L+)", "Not sure"],
          required: true,
          variableName: "pool_size",
        },
        {
          question: "How often would you like service?",
          type: "select",
          options: ["Weekly", "Bi-weekly (every 2 weeks)", "Monthly"],
          required: true,
          variableName: "frequency_discount",
        },
        {
          question: "What's the current condition of your pool?",
          type: "select",
          options: ["Crystal clear", "Slightly cloudy", "Green/dirty", "Very bad condition"],
          required: false,
        },
        {
          question: "Do you have a pool cover?",
          type: "select",
          options: ["Yes", "No"],
          required: false,
        },
      ],
    },
    {
      serviceName: "Pool Equipment Repair",
      description: "Repair or replacement of pool pumps, filters, and equipment",
      category: "Repair",
      basePrice: "600.00",
      pricingFormula: "base_price + (hours * hourly_rate) + parts_cost",
      ruleConfig: {
        hourly_rate: 650,
        parts_markup: 1.25,
      },
      aiGuidancePrompt: "Extract: 1) hours: diagnosis 1h, simple repair 1-2h, major repair/replacement 3-4h, 2) parts_needed: pump motor, filter cartridge, valves, chlorinator (apply parts_markup). Common issues: pump not running, leaking pipes, filter not cleaning, suction problems. Suggest: upgrade to energy-efficient pump, automated chlorinator, solar heating.",
      durationMinutes: 120,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What's the problem with your pool equipment?",
          type: "select",
          options: ["Pump not working", "Leaking pipes", "Filter not cleaning", "Suction problems", "Other issue"],
          required: true,
        },
        {
          question: "What type of equipment needs fixing?",
          type: "select",
          options: ["Pool pump", "Filter system", "Chlorinator", "Valves/pipes", "Multiple items"],
          required: true,
        },
        {
          question: "How old is the equipment?",
          type: "select",
          options: ["Less than 2 years", "2-5 years", "5-10 years", "Over 10 years", "Not sure"],
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Green Pool Recovery",
      description: "Algae treatment and restoration of neglected green pools",
      category: "Specialized",
      basePrice: "1200.00",
      pricingFormula: "base_price + (pool_size * treatment_rate) + (severity * 300)",
      ruleConfig: {
        treatment_rate: 1.5,
        severity_multiplier: 300,
      },
      aiGuidancePrompt: "Extract: 1) pool_size: liters, 2) severity: 1-3 scale (1=light green, 2=dark green, 3=black/swamp). Process: shock treatment, filtration, brushing, chemical balance, multiple visits. Suggest: drain & acid wash if severe, replace filter sand/cartridge, ongoing weekly maintenance to prevent recurrence.",
      durationMinutes: 180,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What size is your pool?",
          type: "select",
          options: ["Small (up to 30,000L)", "Medium (30,000-50,000L)", "Large (50,000L+)", "Not sure"],
          required: true,
          variableName: "pool_size",
        },
        {
          question: "How bad is the pool condition?",
          type: "select",
          options: ["Light green", "Dark green - can't see bottom", "Black/swamp - very bad"],
          required: true,
          variableName: "severity",
        },
        {
          question: "How long has it been like this?",
          type: "select",
          options: ["A few days", "A few weeks", "Months", "Over a year"],
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Pool Renovation",
      description: "Resurfacing, tiling, or structural repairs to pools",
      category: "Installation",
      basePrice: "8000.00",
      pricingFormula: "base_price + (pool_size * sqm_rate) + (complexity * 2000)",
      ruleConfig: {
        sqm_rate: 400,
        complexity_multiplier: 2000,
      },
      aiGuidancePrompt: "Extract: 1) pool_size: surface area in sqm, 2) complexity: 1-3 scale (1=fibreglass coating, 2=marblite resurface, 3=full structural repair with tiling). Includes: surface preparation, application, curing. Suggest: upgrade to pebble finish for longevity, LED lighting installation, water feature add-on.",
      durationMinutes: 960,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What type of renovation do you need?",
          type: "select",
          options: ["Fibreglass coating", "Marblite resurfacing", "Full structural repair with tiling", "Not sure - need advice"],
          required: true,
          variableName: "complexity",
        },
        {
          question: "What size is your pool?",
          type: "select",
          options: ["Small (up to 30,000L)", "Medium (30,000-50,000L)", "Large (50,000L+)", "Not sure"],
          required: true,
          variableName: "pool_size",
        },
        {
          question: "What are the main issues?",
          type: "text",
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
  ],

  "Pest Control": [
    {
      serviceName: "General Pest Control Treatment",
      description: "Comprehensive pest treatment for common household pests",
      category: "Treatment",
      basePrice: "600.00",
      pricingFormula: "base_price + (property_size * size_rate) + (pest_severity * 200)",
      ruleConfig: {
        size_rate: 3,
        severity_multiplier: 200,
      },
      aiGuidancePrompt: "Extract: 1) property_size: square meters or number of rooms, 2) pest_severity: 1-3 scale (1=preventative, 2=moderate infestation, 3=severe infestation). Treats: ants, cockroaches, spiders, flies. Suggest: quarterly treatments for prevention, seal entry points, follow-up visit in 2 weeks if severe.",
      durationMinutes: 90,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What type of pests are you seeing?",
          type: "select",
          options: ["Ants", "Cockroaches", "Spiders", "Flies", "Multiple pests", "Not sure"],
          required: true,
        },
        {
          question: "How bad is the problem?",
          type: "select",
          options: ["Just prevention - no pests seen", "Moderate - see pests occasionally", "Severe - see pests daily"],
          required: true,
          variableName: "pest_severity",
        },
        {
          question: "Type of property?",
          type: "select",
          options: ["Small flat/apartment", "Medium house", "Large house", "Office/Commercial"],
          required: true,
          variableName: "property_size",
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Termite Treatment",
      description: "Specialized termite/white ant treatment and prevention",
      category: "Specialized",
      basePrice: "2500.00",
      pricingFormula: "base_price + (linear_meters * meter_rate) + (treatment_type * 500)",
      ruleConfig: {
        meter_rate: 80,
        treatment_type_multiplier: 500,
      },
      aiGuidancePrompt: "Extract: 1) linear_meters: perimeter of building to treat, 2) treatment_type: 0-2 (0=preventative barrier, 1=active infestation spot treatment, 2=comprehensive soil treatment with drilling). Suggest: annual inspections, wood treatment for roof trusses, moisture control, guarantee period explanation.",
      durationMinutes: 240,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "Have you seen termites/white ants?",
          type: "select",
          options: ["Yes - active infestation", "Signs of activity (mud tubes, damage)", "No - just prevention"],
          required: true,
          variableName: "treatment_type",
        },
        {
          question: "Type of property?",
          type: "select",
          options: ["Small house/flat", "Medium house", "Large house", "Commercial building"],
          required: true,
        },
        {
          question: "Where have you seen the termites?",
          type: "text",
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Rodent Control",
      description: "Rat and mouse control including trapping and exclusion",
      category: "Treatment",
      basePrice: "800.00",
      pricingFormula: "base_price + (property_size * size_rate) + (infestation_level * 300)",
      ruleConfig: {
        size_rate: 4,
        infestation_multiplier: 300,
      },
      aiGuidancePrompt: "Extract: 1) property_size: square meters, 2) infestation_level: 1-3 scale (1=signs of activity, 2=active infestation, 3=severe widespread infestation). Methods: bait stations, traps, exclusion work. Suggest: seal entry points, remove food sources, follow-up visits weekly until clear, ongoing monitoring stations.",
      durationMinutes: 120,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What are you seeing?",
          type: "select",
          options: ["Just signs (droppings, noises)", "Seen rats/mice a few times", "Severe problem - see them often"],
          required: true,
          variableName: "infestation_level",
        },
        {
          question: "Type of property?",
          type: "select",
          options: ["Apartment/Flat", "Small house", "Large house", "Office/Warehouse"],
          required: true,
          variableName: "property_size",
        },
        {
          question: "Where are you seeing them?",
          type: "text",
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Bed Bug Treatment",
      description: "Heat or chemical treatment for bed bug infestations",
      category: "Specialized",
      basePrice: "1500.00",
      pricingFormula: "base_price + (rooms * room_rate) + (treatment_rounds * 600)",
      ruleConfig: {
        room_rate: 400,
        treatment_round_rate: 600,
      },
      aiGuidancePrompt: "Extract: 1) rooms: number of bedrooms affected, 2) treatment_rounds: typically 2-3 rounds needed (first treatment + follow-ups at 2-week intervals). Methods: heat treatment or chemical spray. Suggest: mattress encasements, launder all bedding/clothing on hot cycle, inspect furniture, multiple treatments guarantee.",
      durationMinutes: 180,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "How many bedrooms are affected?",
          type: "number",
          required: true,
          variableName: "rooms",
        },
        {
          question: "When did you first notice bed bugs?",
          type: "select",
          options: ["This week", "1-2 weeks ago", "A month ago", "Longer"],
          required: false,
        },
        {
          question: "Have you tried treating it yourself?",
          type: "select",
          options: ["No", "Yes - didn't work"],
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
  ],

  Handyman: [
    {
      serviceName: "General Handyman Service",
      description: "Minor repairs and odd jobs around the home",
      category: "General",
      basePrice: "350.00",
      pricingFormula: "base_price + (hours * hourly_rate) + (km * travel_rate)",
      ruleConfig: {
        hourly_rate: 300,
        travel_rate: 15,
      },
      aiGuidancePrompt: "Extract: 1) hours: estimate time for tasks listed (hanging pictures 0.5h, fixing door 1h, etc), 2) km: travel distance. Common jobs: hanging pictures, fixing doors, installing shelves, minor carpentry, tap washers. Suggest: make list of multiple small jobs to maximize visit, tool hire if specialized equipment needed.",
      durationMinutes: 120,
      requiresSiteVisit: false,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What jobs do you need done?",
          type: "text",
          required: true,
        },
        {
          question: "How many separate tasks/jobs?",
          type: "number",
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
          variableName: "address",
        },
      ],
    },
    {
      serviceName: "Furniture Assembly",
      description: "Assembly of flat-pack furniture and installations",
      category: "Assembly",
      basePrice: "250.00",
      pricingFormula: "base_price + (items * item_rate) + (complexity * 150)",
      ruleConfig: {
        item_rate: 200,
        complexity_multiplier: 150,
      },
      aiGuidancePrompt: "Extract: 1) items: count of furniture pieces to assemble, 2) complexity: 0-2 scale (0=simple shelves/table, 1=wardrobes/desks, 2=complex built-in units). Includes: full assembly, secure mounting if wall-hung. Suggest: check all parts before assembly, wall anchoring for safety, level adjustment.",
      durationMinutes: 90,
      requiresSiteVisit: false,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "How many items need assembling?",
          type: "number",
          required: true,
          variableName: "items",
        },
        {
          question: "What type of furniture?",
          type: "select",
          options: ["Simple (shelves, small table)", "Medium (wardrobe, desk, bed)", "Complex (built-in units, large items)"],
          required: true,
          variableName: "complexity",
        },
        {
          question: "Do you have all the parts and instructions?",
          type: "select",
          options: ["Yes - everything is here", "Not sure yet"],
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Door & Window Repairs",
      description: "Repair or adjustment of doors, windows, locks, and handles",
      category: "Repair",
      basePrice: "400.00",
      pricingFormula: "base_price + (hours * hourly_rate) + parts_cost",
      ruleConfig: {
        hourly_rate: 350,
        parts_markup: 1.2,
      },
      aiGuidancePrompt: "Extract: 1) hours: per door/window 0.5-1.5h, 2) parts_needed: locks, handles, hinges, weatherstripping (apply parts_markup). Common issues: sticking doors, broken locks, damaged frames, drafty windows. Suggest: upgrade to security locks, weatherstripping for energy saving, door closer installation.",
      durationMinutes: 90,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What needs fixing?",
          type: "select",
          options: ["Door repair", "Window repair", "Lock replacement", "Handle/hinge repair", "Multiple items"],
          required: true,
        },
        {
          question: "What's the problem?",
          type: "text",
          required: true,
        },
        {
          question: "How many doors/windows?",
          type: "number",
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Wall Mounting Service",
      description: "Professional mounting of TVs, shelves, mirrors, and artwork",
      category: "Installation",
      basePrice: "300.00",
      pricingFormula: "base_price + (items * item_rate) + (wall_type * 100)",
      ruleConfig: {
        item_rate: 150,
        wall_type_multiplier: 100,
      },
      aiGuidancePrompt: "Extract: 1) items: count of items to mount, 2) wall_type: 0-2 scale (0=brick/concrete, 1=drywall with studs, 2=hollow wall requiring special fixings). Includes: stud finding, drilling, mounting, cable management for TVs. Suggest: hide cables in conduit, surge protection for electronics, check wall strength for heavy items.",
      durationMinutes: 60,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What needs mounting?",
          type: "select",
          options: ["TV", "Shelves", "Mirror", "Artwork/pictures", "Multiple items"],
          required: true,
        },
        {
          question: "How many items?",
          type: "number",
          required: true,
          variableName: "items",
        },
        {
          question: "What type of wall?",
          type: "select",
          options: ["Brick/concrete", "Drywall (plasterboard)", "Not sure"],
          required: true,
          variableName: "wall_type",
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Home Maintenance Package",
      description: "Comprehensive home maintenance and safety checks",
      category: "Maintenance",
      basePrice: "800.00",
      pricingFormula: "base_price + (hours * hourly_rate)",
      ruleConfig: {
        hourly_rate: 300,
      },
      aiGuidancePrompt: "Extract: 1) hours: standard package 3-4h for full home check. Includes: gutter cleaning, tap washer checks, door adjustments, smoke alarm testing, minor repairs, safety assessment. Suggest: seasonal maintenance (pre-winter/pre-summer), create maintenance schedule, prioritize safety items.",
      durationMinutes: 240,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What type of property?",
          type: "select",
          options: ["Small flat/apartment", "Medium house", "Large house"],
          required: true,
        },
        {
          question: "Any specific areas of concern?",
          type: "text",
          required: false,
        },
        {
          question: "When was the last maintenance check?",
          type: "select",
          options: ["Never", "Within 6 months", "6-12 months ago", "Over a year ago"],
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
  ],

  Painting: [
    {
      serviceName: "Interior Painting",
      description: "Professional interior painting of walls and ceilings",
      category: "Interior",
      basePrice: "800.00",
      pricingFormula: "base_price + (sqm * sqm_rate) + (coats * coat_multiplier)",
      ruleConfig: {
        sqm_rate: 35,
        coat_multiplier: 1.4,
      },
      aiGuidancePrompt: "Extract: 1) sqm: wall area in square meters (room dimensions), 2) coats: 1-3 (1=touch-up, 2=standard repaint, 3=color change/dark to light). Includes: surface prep, fill cracks, prime if needed, paint, cleanup. Suggest: move furniture, protect floors, low-VOC paint for health, accent wall feature.",
      durationMinutes: 480,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What area needs painting?",
          type: "text",
          required: true,
          variableName: "sqm",
        },
        {
          question: "How many coats are needed?",
          type: "select",
          options: ["1 coat (touch-up/same color)", "2 coats (standard repaint)", "3 coats (major color change)"],
          required: true,
          variableName: "coats",
        },
        {
          question: "Are there any cracks or damage to repair?",
          type: "select",
          options: ["No - walls are in good condition", "Yes - minor cracks/damage", "Yes - significant damage"],
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
      imageAnalysisConfig: {
        enabled: true,
        requiredPhotos: ["Photo of walls/room to be painted", "Close-up of any damage or cracks"],
        analysisHints: "Look for: wall condition, crack severity, previous paint quality, wall texture, ceiling height, amount of prep work needed",
      },
    },
    {
      serviceName: "Exterior Painting",
      description: "Exterior house painting including walls and trims",
      category: "Exterior",
      basePrice: "1500.00",
      pricingFormula: "base_price + (sqm * sqm_rate) + (height_multiplier * 500) + (condition * 300)",
      ruleConfig: {
        sqm_rate: 45,
        height_multiplier_rate: 500,
        condition_multiplier: 300,
      },
      aiGuidancePrompt: "Extract: 1) sqm: exterior wall area, 2) height_multiplier: 0-2 scale (0=single story, 1=double story, 2=multi-story requiring scaffolding), 3) condition: 0-2 scale (0=good condition, 1=minor repairs needed, 2=extensive prep/repair work). Includes: pressure wash, scraping, filling, priming, 2 coats paint. Suggest: weather-resistant paint, roof painting add-on, gutter painting.",
      durationMinutes: 960,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What's the approximate exterior wall area?",
          type: "text",
          required: true,
          variableName: "sqm",
        },
        {
          question: "How many stories is the building?",
          type: "select",
          options: ["Single-story", "Double-story", "Three or more stories (requires scaffolding)"],
          required: true,
          variableName: "height_multiplier",
        },
        {
          question: "What's the condition of the exterior walls?",
          type: "select",
          options: ["Good - minimal prep needed", "Fair - some cracks/peeling", "Poor - extensive repairs needed"],
          required: true,
          variableName: "condition",
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
      imageAnalysisConfig: {
        enabled: true,
        requiredPhotos: ["Photo of exterior walls", "Photo showing building height", "Close-up of any problem areas"],
        analysisHints: "Look for: wall surface condition, peeling paint, cracks, building height/stories, scaffolding requirements, sun damage, water stains",
      },
    },
    {
      serviceName: "Roof Painting",
      description: "Roof cleaning, sealing, and painting service",
      category: "Exterior",
      basePrice: "3000.00",
      pricingFormula: "base_price + (sqm * sqm_rate) + (roof_type * roof_type_multiplier)",
      ruleConfig: {
        sqm_rate: 50,
        roof_type_multiplier: 500,
      },
      aiGuidancePrompt: "Extract: 1) sqm: roof area, 2) roof_type: 0-2 scale (0=flat/easy access, 1=pitched tile roof, 2=IBR/complex roof structure). Includes: pressure wash, replace broken tiles, waterproofing/sealing, 2 coats roof paint. Suggest: waterproofing treatment before painting, gutter cleaning, heat-reflective paint for cooling.",
      durationMinutes: 480,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What's the approximate roof area?",
          type: "text",
          required: true,
          variableName: "sqm",
        },
        {
          question: "What type of roof do you have?",
          type: "select",
          options: ["Flat or easy access", "Pitched tile roof", "IBR or corrugated sheeting", "Complex structure/multiple levels"],
          required: true,
          variableName: "roof_type",
        },
        {
          question: "Are there any broken tiles or damage?",
          type: "select",
          options: ["No - roof is in good condition", "Yes - a few broken tiles", "Yes - significant damage"],
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Damp Proofing & Painting",
      description: "Damp treatment and repainting of affected areas",
      category: "Specialized",
      basePrice: "1200.00",
      pricingFormula: "base_price + (sqm * sqm_rate) + (severity * 400)",
      ruleConfig: {
        sqm_rate: 80,
        severity_multiplier: 400,
      },
      aiGuidancePrompt: "Extract: 1) sqm: affected wall area, 2) severity: 1-3 scale (1=minor surface damp, 2=moderate damp with damage, 3=severe rising damp requiring injection). Process: identify source, treat damp, scrape & fill, damp-proof prime, anti-mold paint. Suggest: fix water source first, improve ventilation, exterior waterproofing, ongoing monitoring.",
      durationMinutes: 360,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What's the approximate area affected by damp?",
          type: "text",
          required: true,
          variableName: "sqm",
        },
        {
          question: "How severe is the damp issue?",
          type: "select",
          options: ["Minor surface dampness", "Moderate damp with some damage", "Severe damp, possibly rising damp"],
          required: true,
          variableName: "severity",
        },
        {
          question: "Where is the damp located?",
          type: "text",
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
  ],

  Roofing: [
    {
      serviceName: "Roof Leak Repair",
      description: "Emergency or planned roof leak detection and repair",
      category: "Repair",
      basePrice: "800.00",
      pricingFormula: "base_price + (hours * hourly_rate) + (urgency * emergency_rate) + materials_cost",
      ruleConfig: {
        hourly_rate: 600,
        emergency_rate: 400,
        materials_markup: 1.3,
      },
      aiGuidancePrompt: "Extract: 1) hours: leak finding 1-2h, simple repair 2-3h, extensive repair 4-6h, 2) urgency: 0-1 (1=emergency active leak requiring emergency_rate), 3) materials_needed: tiles, flashing, sealant, waterproofing (apply markup). Suggest: full roof inspection after repair, gutter cleaning, waterproofing treatment, replace old tiles proactively.",
      durationMinutes: 180,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "When did you notice the leak?",
          type: "select",
          options: ["Just now", "Today", "Within the last week", "It's an ongoing issue"],
          required: true,
        },
        {
          question: "How urgent is the repair?",
          type: "select",
          options: ["Emergency - active leak", "Needs fixing soon but not urgent", "Can schedule for a convenient time"],
          required: true,
          variableName: "urgency",
        },
        {
          question: "Where is the leak located?",
          type: "text",
          required: true,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Roof Tile Replacement",
      description: "Replacement of broken or missing roof tiles",
      category: "Repair",
      basePrice: "600.00",
      pricingFormula: "base_price + (tiles * tile_rate) + (height_multiplier * 300)",
      ruleConfig: {
        tile_rate: 45,
        height_multiplier_rate: 300,
      },
      aiGuidancePrompt: "Extract: 1) tiles: number of tiles to replace, 2) height_multiplier: 0-2 scale (0=single story, 1=double story, 2=difficult access/steep pitch). Includes: remove broken tiles, install new tiles, seal and secure. Suggest: match existing tiles or upgrade section, check underlayment, inspect ridge capping, gutter cleaning.",
      durationMinutes: 120,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "Approximately how many tiles need replacing?",
          type: "number",
          required: true,
          variableName: "tiles",
        },
        {
          question: "How many stories is your building?",
          type: "select",
          options: ["Single-story", "Double-story", "Three or more stories (difficult access)"],
          required: true,
          variableName: "height_multiplier",
        },
        {
          question: "What type of tiles are they?",
          type: "select",
          options: ["Concrete tiles", "Clay tiles", "Metal sheeting", "Asphalt shingles", "Not sure"],
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "New Roof Installation",
      description: "Complete new roof installation or replacement",
      category: "Installation",
      basePrice: "15000.00",
      pricingFormula: "base_price + (sqm * sqm_rate) + (roof_type * type_multiplier)",
      ruleConfig: {
        sqm_rate: 400,
        type_multiplier: 5000,
      },
      aiGuidancePrompt: "Extract: 1) sqm: roof area in square meters, 2) roof_type: 0-3 scale (0=IBR sheets, 1=concrete tiles, 2=clay tiles, 3=slate/premium tiles). Includes: remove old roof, battens, underlayment, new roof, flashing, ridge capping, cleanup. Suggest: upgrade insulation, install gutters/downpipes, solar panel prep, 10-year guarantee.",
      durationMinutes: 1920,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What's the approximate roof area?",
          type: "text",
          required: true,
          variableName: "sqm",
        },
        {
          question: "What type of roofing material do you prefer?",
          type: "select",
          options: ["IBR sheeting", "Concrete tiles", "Clay tiles", "Slate/Premium tiles", "Not sure - need recommendation"],
          required: true,
          variableName: "roof_type",
        },
        {
          question: "Do you need removal of the old roof?",
          type: "select",
          options: ["Yes - remove old roof", "No - new installation on existing structure"],
          required: true,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Gutter Installation & Repair",
      description: "Installation or repair of gutters and downpipes",
      category: "Installation",
      basePrice: "1000.00",
      pricingFormula: "base_price + (linear_meters * meter_rate) + (downpipes * downpipe_rate)",
      ruleConfig: {
        meter_rate: 120,
        downpipe_rate: 250,
      },
      aiGuidancePrompt: "Extract: 1) linear_meters: length of gutter to install/repair, 2) downpipes: number of downpipes needed. Materials: aluminum (standard), PVC (budget), seamless aluminum (premium). Suggest: mesh guards to prevent blockages, proper fall for drainage, connect to rainwater harvesting, annual cleaning service.",
      durationMinutes: 240,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "How many linear meters of guttering are needed?",
          type: "number",
          required: true,
          variableName: "linear_meters",
        },
        {
          question: "How many downpipes are required?",
          type: "number",
          required: true,
          variableName: "downpipes",
        },
        {
          question: "What type of gutters do you prefer?",
          type: "select",
          options: ["Aluminum (standard)", "PVC (budget)", "Seamless aluminum (premium)"],
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
  ],

  Construction: [
    {
      serviceName: "Home Extension",
      description: "Room additions and home extension projects",
      category: "Major Works",
      basePrice: "50000.00",
      pricingFormula: "base_price + (sqm * sqm_rate) + (complexity * complexity_multiplier)",
      ruleConfig: {
        sqm_rate: 8000,
        complexity_multiplier: 10000,
      },
      aiGuidancePrompt: "Extract: 1) sqm: extension area in square meters, 2) complexity: 1-3 scale (1=simple single room, 2=multi-room with plumbing, 3=double story/complex structure). Includes: foundations, walls, roof, windows, doors, finishes. Excludes: electrical, plumbing (separate quotes). Suggest: building plans approval, engineer certification, phased payment schedule.",
      durationMinutes: 9600,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What's the approximate area of the extension (sqm)?",
          type: "text",
          required: true,
          variableName: "sqm",
        },
        {
          question: "What's the complexity of the extension?",
          type: "select",
          options: ["Simple single room", "Multi-room with plumbing", "Double story or complex structure"],
          required: true,
          variableName: "complexity",
        },
        {
          question: "What type of rooms are you adding?",
          type: "text",
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Bathroom Renovation",
      description: "Complete bathroom renovation including tiling and fixtures",
      category: "Renovation",
      basePrice: "25000.00",
      pricingFormula: "base_price + (bathrooms * bathroom_rate) + (luxury_level * 15000)",
      ruleConfig: {
        bathroom_rate: 20000,
        luxury_multiplier: 15000,
      },
      aiGuidancePrompt: "Extract: 1) bathrooms: count of bathrooms to renovate, 2) luxury_level: 0-2 scale (0=standard finishes, 1=mid-range tiles/fixtures, 2=premium finishes/underfloor heating). Includes: demolition, waterproofing, tiling, plumbing, electrical, fixtures, painting. Suggest: plan layout changes carefully, upgrade to water-saving fixtures, heated towel rail, ventilation fan.",
      durationMinutes: 4800,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "How many bathrooms need renovating?",
          type: "number",
          required: true,
          variableName: "bathrooms",
        },
        {
          question: "What's the desired luxury level?",
          type: "select",
          options: ["Standard finishes", "Mid-range upgrades", "Premium finishes/luxury features"],
          required: true,
          variableName: "luxury_level",
        },
        {
          question: "Are you changing the layout significantly?",
          type: "select",
          options: ["No - keeping existing layout", "Yes - minor layout changes", "Yes - major layout changes"],
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Boundary Wall Construction",
      description: "Construction of perimeter walls and fences",
      category: "Major Works",
      basePrice: "8000.00",
      pricingFormula: "base_price + (linear_meters * meter_rate) + (height_multiplier * 400) + (wall_type * 200)",
      ruleConfig: {
        meter_rate: 800,
        height_multiplier_rate: 400,
        wall_type_multiplier: 200,
      },
      aiGuidancePrompt: "Extract: 1) linear_meters: wall length, 2) height_multiplier: 0-2 scale (0=1.8m standard, 1=2.1m, 2=2.4m+ with columns), 3) wall_type: 0-2 (0=facebrick, 1=plastered, 2=precast panels). Includes: foundations, brickwork/panels, capping, gates. Suggest: steel reinforcing for height, electric fence prep, automated gate option, council approval check.",
      durationMinutes: 2400,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What's the total length of the boundary wall (in meters)?",
          type: "number",
          required: true,
          variableName: "linear_meters",
        },
        {
          question: "What height do you require?",
          type: "select",
          options: ["1.8 meters (standard)", "2.1 meters", "2.4 meters or higher"],
          required: true,
          variableName: "height_multiplier",
        },
        {
          question: "What type of wall finish do you prefer?",
          type: "select",
          options: ["Facebrick", "Plastered finish", "Precast concrete panels"],
          required: true,
          variableName: "wall_type",
        },
        {
          question: "Do you need a gate included?",
          type: "select",
          options: ["Yes - standard gate", "Yes - automated gate", "No gate needed"],
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "Paving & Driveway",
      description: "Paving of driveways, patios, and walkways",
      category: "Outdoor",
      basePrice: "5000.00",
      pricingFormula: "base_price + (sqm * sqm_rate) + (paver_type * type_multiplier)",
      ruleConfig: {
        sqm_rate: 350,
        type_multiplier: 150,
      },
      aiGuidancePrompt: "Extract: 1) sqm: area to be paved, 2) paver_type: 0-3 scale (0=concrete pavers, 1=brick pavers, 2=stone pavers, 3=porcelain/premium pavers). Includes: excavation, compacted base, sand bed, pavers, edging, sand sealing. Suggest: slope for drainage, porous pavers for water management, sealing for longevity, border design.",
      durationMinutes: 1440,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What's the area to be paved (sqm)?",
          type: "text",
          required: true,
          variableName: "sqm",
        },
        {
          question: "What type of pavers do you prefer?",
          type: "select",
          options: ["Concrete pavers", "Brick pavers", "Stone pavers", "Porcelain/Premium pavers"],
          required: true,
          variableName: "paver_type",
        },
        {
          question: "Do you need a specific pattern or border?",
          type: "text",
          required: false,
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
    {
      serviceName: "General Building Maintenance",
      description: "Repairs and maintenance for buildings and structures",
      category: "Maintenance",
      basePrice: "800.00",
      pricingFormula: "base_price + (hours * hourly_rate) + materials_cost",
      ruleConfig: {
        hourly_rate: 450,
        materials_markup: 1.25,
      },
      aiGuidancePrompt: "Extract: 1) hours: estimate repair time based on scope, 2) materials_needed: bricks, cement, sand, timber (apply markup). Common work: crack repairs, retaining walls, paving repairs, minor alterations. Suggest: address underlying causes (drainage, settling), preventative maintenance schedule, waterproofing where needed.",
      durationMinutes: 240,
      requiresSiteVisit: true,
      pricingType: "custom",
      serviceQuestions: [
        {
          question: "What building maintenance is needed?",
          type: "text",
          required: true,
        },
        {
          question: "Estimate the number of hours needed?",
          type: "number",
          required: false,
          variableName: "hours",
        },
        {
          question: "What's your address?",
          type: "text",
          required: true,
        },
      ],
    },
  ],
};

// Helper function to get templates by industry
export function getTemplatesByIndustry(industry: string): ServiceTemplate[] {
  return INDUSTRY_SERVICE_TEMPLATES[industry] || [];
}

// Helper function to get all industries
export function getAllIndustries(): string[] {
  return Object.keys(INDUSTRY_SERVICE_TEMPLATES);
}

// Helper function to validate a template
export function validateTemplate(template: any): boolean {
  try {
    serviceTemplateSchema.parse(template);
    return true;
  } catch (error) {
    console.error("Template validation failed:", error);
    return false;
  }
}

// Helper function to get template count
export function getTemplateCount(): number {
  return Object.values(INDUSTRY_SERVICE_TEMPLATES).reduce(
    (total, templates) => total + templates.length,
    0
  );
}

// Helper function to get default/fallback templates for "Other" industry
export function getDefaultTemplates(): ServiceTemplate[] {
  return [
    {
      serviceName: "General Service",
      description: "Standard service offering for your industry",
      category: "General",
      basePrice: "500.00",
      pricingFormula: "base_price + (hours * hourly_rate) + (km * travel_rate)",
      ruleConfig: {
        hourly_rate: 500,
        travel_rate: 15,
      },
      aiGuidancePrompt: "Extract: 1) hours: estimate time needed for service, 2) km: travel distance from business location, 3) complexity: simple/moderate/complex for pricing adjustments. Suggest: additional services based on customer needs.",
      durationMinutes: 120,
      requiresSiteVisit: true,
      pricingType: "custom",
    },
    {
      serviceName: "Emergency Call-Out",
      description: "Urgent service request outside of normal hours",
      category: "Emergency",
      basePrice: "750.00",
      pricingFormula: "base_price + (hours * hourly_rate * emergency_multiplier) + (km * travel_rate)",
      ruleConfig: {
        hourly_rate: 600,
        emergency_multiplier: 1.5,
        travel_rate: 20,
      },
      aiGuidancePrompt: "Extract: 1) hours: time needed, 2) km: distance, 3) urgency level. Apply emergency_multiplier for after-hours or urgent requests.",
      durationMinutes: 90,
      requiresSiteVisit: true,
      pricingType: "custom",
    },
  ];
}

// Helper function with fallback for industries without templates
export function getTemplatesWithFallback(industry: string): ServiceTemplate[] {
  const templates = INDUSTRY_SERVICE_TEMPLATES[industry];

  // If industry has templates, return them
  if (templates && templates.length > 0) {
    return templates;
  }

  // Otherwise, return default templates
  console.log(`⚠️ [Templates] No templates found for industry: ${industry}, returning defaults`);
  return getDefaultTemplates();
}