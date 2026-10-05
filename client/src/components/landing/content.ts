/**
 * Demo content for the landing page.
 *
 * Written for a landscaping company because the before/after mechanic that drives
 * the whole page needs a service where the transformation IS the sale. Landscaping
 * also carries an idea the others don't: the "after" keeps growing, which the copy
 * leans on.
 *
 * Images are Unsplash stock so every effect is visible without client assets. In a
 * real deployment these come from the business record / admin; see the fallbacks in
 * each section component for what happens when a pair is missing.
 */

export interface BeforeAfter {
  before: string;
  after: string;
  alt: string;
}

const u = (id: string, w = 1920) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const hero = {
  eyebrow: "Landscape Design & Build",
  /* Two words so the mask reads at display size — long headlines kill the cut-out. */
  headline: "GROUND\nUP",
  sub: "We take gardens that have been left to themselves and give them back with intent. Design, build, and the first two years of growing in.",
  cta: "Get a Quote",
  /*
   * Pairs are chosen for SHARED COMPOSITION, not just subject: both frames are a
   * wide view of a garden behind a house, so the slide reads as one place changing
   * rather than two unrelated photos. A mismatched pair reads as a slideshow and
   * kills the whole mechanic.
   */
  image: {
    before: u("1598902108854-10e335adac99"),
    after: u("1600585154340-be6161a56a0c"),
    alt: "An overgrown garden transformed into a designed landscape",
  } satisfies BeforeAfter,
};

export const stats = [
  { value: 340, suffix: "+", label: "Gardens Rebuilt" },
  { value: 18, suffix: "", label: "Years On The Tools" },
  { value: 96, suffix: "%", label: "Clients Who Refer Us" },
  /* The fourth is the one that overshoots — it should be the most human number. */
  { value: 12, suffix: "k", label: "Plants In The Ground" },
];

export const statement = ["WE DON'T", "TIDY GARDENS", "WE REDRAW THEM"];

export const services: Array<{
  index: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  image: BeforeAfter;
}> = [
  {
    index: "01",
    name: "Full Garden Redesign",
    description:
      "Everything comes out and a drawing goes in. Levels, drainage, hard landscaping, planting — one team from the survey to the last plant. You get the plan before anyone lifts a spade.",
    price: "From R48,000",
    duration: "3–6 weeks",
    image: {
      before: u("1598902108854-10e335adac99", 1400),
      after: u("1570129477492-45c003edd2be", 1400),
      alt: "Overgrown plot redesigned into a structured garden",
    },
  },
  {
    index: "02",
    name: "Paving & Structures",
    description:
      "Patios, retaining walls, steps and decks built to hold their line. Proper foundations, proper falls, no settling in year three. The part of a garden you only notice when it's wrong.",
    price: "From R25,000",
    duration: "1–3 weeks",
    image: {
      before: u("1598902108854-10e335adac99", 1400),
      after: u("1416331108676-a22ccb276e35", 1400),
      alt: "Bare yard rebuilt as a paved terrace and pool surround",
    },
  },
  {
    index: "03",
    name: "Planting & Maintenance",
    description:
      "The design is only half of it. We plant for the climate you actually have, then come back through the seasons while it fills in. Most gardens look their best in year two.",
    price: "From R3,200/mo",
    duration: "Ongoing",
    image: {
      before: u("1589923188900-85dae523342b", 1400),
      after: u("1585320806297-9794b3e4eeae", 1400),
      alt: "Bare beds grown into established planting",
    },
  },
];

export const gallery = [
  u("1600585154340-be6161a56a0c", 1000),
  u("1585320806297-9794b3e4eeae", 800),
  u("1512917774080-9991f1c4c750", 900),
  u("1570129477492-45c003edd2be", 800),
  u("1416331108676-a22ccb276e35", 900),
  u("1591857177580-dc82b9ac4e1e", 800),
];

export const galleryLabels = [
  { name: "Oakfield", place: "Constantia", type: "Residential", year: "2025" },
  { name: "The Long Wall", place: "Newlands", type: "Structural", year: "2025" },
  { name: "Sisters' Garden", place: "Claremont", type: "Residential", year: "2024" },
  { name: "Stone Terrace", place: "Bishopscourt", type: "Hard Landscaping", year: "2024" },
  { name: "Riverbend", place: "Tokai", type: "Full Redesign", year: "2024" },
  { name: "Slow Border", place: "Kenilworth", type: "Planting", year: "2023" },
];

export const testimonials = [
  {
    quote:
      "They spent an hour walking the garden before they quoted anything. The plan that came back had solved a drainage problem we'd lived with for nine years and stopped mentioning.",
    name: "Ruth Mokoena",
    detail: "Full redesign, Constantia",
  },
  {
    quote:
      "Two winters on and the wall hasn't moved a millimetre. The last people we used built one that was leaning by the following spring.",
    name: "Daniel Fourie",
    detail: "Retaining wall & steps, Newlands",
  },
  {
    quote:
      "What sold me was being told the garden would look thin for a year. Everyone else promised instant. They were right, and now it's the best room in the house.",
    name: "Priya Naidoo",
    detail: "Planting scheme, Claremont",
  },
];

export const contact = {
  heading: "LET'S WALK\nTHE SITE",
  body: "Quotes start with an hour in your garden, not a price list. Tell us what you've got and we'll come and look at it.",
  cta: "Book a Site Visit",
};
