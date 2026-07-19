# Design Guidelines: Smart Website SaaS Platform

## Design Approach

**Hybrid Strategy:** Wix-inspired public sites (bold, conversion-focused) + Linear/Notion dashboards (clean, efficiency-focused)

**Reference Inspirations:**
- Dashboard: Linear (data density, clean typography, subtle interactions), Notion (flexible layouts, minimal chrome)
- Public Sites: Wix (bold imagery, conversion patterns), Airbnb (trust-building, professional photography)

**Core Principles:**
- Public sites maximize visual impact and emotional connection for small business credibility
- Dashboards prioritize information density and task efficiency with minimal decoration
- Mobile-first across all interfaces (320px → 768px → 1024px breakpoints)
- 44px minimum touch targets universally

---

## Typography

**Font Stack:** Inter (all contexts) via Google Fonts CDN

**Hierarchy:**
- Hero Headlines: 56-80px desktop / 36-48px mobile, font-weight-700, line-height-tight
- Section Headers: 36-48px desktop / 28-36px mobile, font-weight-600, line-height-snug
- Card Titles: 24-28px, font-weight-600
- Body Text: 16-18px, font-weight-400, line-height-relaxed
- Dashboard Labels: 14-16px, font-weight-500
- Microcopy: 12-14px, font-weight-400
- Data Tables: Tabular figures, 14-16px, font-weight-500

**Implementation:** Use font-weight utilities (400, 500, 600, 700), tracking-tight for large headings, tracking-normal for body

---

## Layout System

**Spacing Primitives:** Tailwind units 2, 4, 6, 8, 12, 16, 20, 24, 32

**Application:**
- Icon-text gaps: 2-4
- Card internal padding: 6-8
- Component spacing: 12-16
- Section vertical rhythm: 20-32
- Page margins: 16-24

**Grid Systems:**
- Public Sites: 12-column responsive (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Dashboard: Sidebar layout (w-64 expanded, w-20 collapsed) + flexible main content area

**Container Widths:**
- Full sections: w-full with inner max-w-7xl mx-auto
- Content blocks: max-w-6xl
- Text content: max-w-prose
- Dashboard workspace: max-w-screen-2xl

---

## Component Library

### Navigation

**Public Header:**
- Fixed top, backdrop-blur-md on scroll
- Logo h-16, horizontal menu items gap-8, mobile hamburger drawer
- Primary CTA button (px-6 py-3 rounded-lg font-medium)
- Transparent hero → solid bg on scroll transition

**Dashboard Sidebar:**
- Fixed left, w-64 expanded/w-20 collapsed states
- Logo + collapse toggle at top
- Navigation items with icon (w-5 h-5) + label, 3px left border on active state
- Grouped sections with subtle dividers (border-t mt-4 pt-4)

**Dashboard Top Bar:**
- Breadcrumb navigation (text-sm, slash separators)
- Business/workspace switcher dropdown
- Search command palette trigger
- Notifications + profile menu (right-aligned)

### Heroes (Public Sites)

**Structure:** min-h-screen or 85vh sections
- Large hero image (1920x1080 minimum, industry action shots)
- Gradient overlay from-black/70 to-transparent
- Content container: max-w-4xl, z-10
- Headline: text-6xl-7xl font-bold mb-6
- Subheadline: text-xl-2xl max-w-2xl mb-8 leading-relaxed
- CTA group: backdrop-blur-md bg-white/10 border border-white/30 rounded-lg px-8 py-4

### Cards

**Feature Cards (Public):**
- Image aspect-16/9, rounded-xl overflow-hidden
- Content padding: p-8
- Icon or badge at top (w-12 h-12)
- Title: text-2xl font-semibold mb-3
- Description: text-base leading-relaxed mb-4
- Link with arrow icon
- Hover: shadow-xl transition-shadow duration-300

**Dashboard Cards:**
- Border rounded-lg p-6, minimal shadow
- Header row: title (text-lg font-semibold) + action menu (3-dot icon button)
- Content area with appropriate spacing
- Footer for metadata (text-sm) or action buttons

**Stat Cards:**
- Grid layout (grid-cols-2 lg:grid-cols-4 gap-6)
- Large metric: text-5xl-6xl font-bold tabular-nums
- Label: text-sm uppercase tracking-wide mt-2
- Trend indicator: small arrow + percentage change

### Forms & Inputs

**Input Fields:**
- Height h-12, padding px-4 py-3, rounded-lg
- Border width 1px, focus ring-2
- Label above (text-sm font-medium mb-2)
- Helper text/errors below (text-sm)
- Disabled state with reduced opacity

**Buttons:**
- Primary: solid fill, px-6 py-3, rounded-lg, font-medium
- Secondary: border-2 outline style
- Ghost: transparent with subtle hover
- Icon-only: square p-3, rounded-md
- Image overlay buttons: backdrop-blur-md bg-white/10 border border-white/30, px-6 py-3

**Form Layouts:**
- Single column mobile, 2-column desktop (gap-6)
- Full-width submit buttons on mobile
- Grouped related fields with shared labels

### Data Display

**Tables:**
- Full-width, sticky header row
- Alternating row backgrounds (even:bg-gray-50)
- Hover states (hover:bg-gray-100)
- Mobile: transform to stacked cards
- Action columns right-aligned
- Sort indicators in headers

**Status Badges:**
- Inline-flex items-center, px-3 py-1, rounded-full
- Small text (text-xs font-medium uppercase tracking-wide)
- Semantic variations for different states

**Kanban Boards:**
- Horizontal scroll on mobile, full columns on desktop
- Column headers with count badges
- Card items with drag handle, compact info
- Status-coded left borders

**Modals:**
- Backdrop: bg-black/50
- Container: max-w-lg (forms) or max-w-4xl (content), rounded-xl, shadow-2xl
- Header: text-xl font-semibold with close button (top-right)
- Scrollable body: max-h-[80vh] overflow-y-auto p-6
- Footer: right-aligned action buttons with gap-3

---

## Public Site Section Patterns

**Hero:** Full-screen with large image, headline, subheadline, dual CTAs (primary + secondary)

**Services Grid:** py-24, 3-column grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8), icon + title + description cards

**Social Proof Stats:** py-20, 4-column grid (grid-cols-2 lg:grid-cols-4), large numbers with labels

**Portfolio/Work Gallery:** Masonry or matched grid (grid-cols-2 lg:grid-cols-3 gap-6), hover overlays with project titles, filter tabs above

**Testimonials:** py-24, 2-3 column grid, customer photo (rounded-full w-16 h-16) + quote + name + company + star rating

**Features Showcase:** Alternating image-text sections (2-column grid, swap order each row), large feature images with descriptive content

**Contact Section:** 2-column split (form left 60%, contact info + map right 40%, stacked mobile), py-24

**Footer:** 4-column grid (About, Services, Quick Links, Contact), newsletter signup bar, social icons, copyright

---

## Dashboard Section Patterns

**Overview:** 4 stat cards top row → 2-column layout (activity feed left, upcoming appointments right) → quick action cards

**Leads Pipeline:** Filter/search bar → view toggle (kanban/table) → kanban columns (New, Contacted, Quoted, Won, Lost) with drag-drop

**Quote Builder:** 3-panel layout desktop (client selector left sidebar w-64, line items table center, live preview right w-96), stacked mobile

**Job Calendar:** Full calendar component with side panel for job details, status update forms, time tracking

**Settings:** Horizontal tab navigation → form sections with clear groupings, save buttons per section

---

## Images

**Hero Sections:** Use large, high-quality images (1920x1080 minimum). Industry-specific action photography: electricians at work, plumbers on jobs, landscapers in action, contractors measuring, etc. Dark gradient overlays (from-black/70 to-transparent) for text legibility.

**Feature/Service Cards:** 16:9 aspect ratio images (1200x675), showing equipment, completed work, team members in branded attire. Rounded corners (rounded-xl).

**Portfolio Grid:** Varied dimensions for masonry or matched 4:3 images for comparison layouts. Before/after shots, completed projects, satisfied customers.

**Testimonials:** Customer headshots (square, 200x200 minimum), rounded-full treatment.

**Dashboard:** Minimal imagery - profile avatars only (w-10 h-10 rounded-full), small job thumbnails in lists.

---

## Accessibility

- Text contrast: 4.5:1 minimum (body), 3:1 large text
- Focus indicators: ring-2 offset-2 on all interactive elements
- Touch targets: 44px minimum consistently
- Keyboard navigation: full support, logical tab order
- ARIA landmarks: nav, main, aside, complementary properly used
- Form labels: always explicit label elements, no placeholder-only
- Icon buttons: aria-label for all icon-only buttons
- Alt text: descriptive for meaningful images, decorative="" for presentational

---

## Animation Strategy

**Public Sites (Wix-Inspired Animations):**

*Scroll Animations:*
- **Fade-in-up sections**: Each section fades in from below (translateY: 40px → 0) as it enters viewport
- **Stagger children**: Elements within sections animate sequentially with 100ms delays
- **Parallax hero**: Background image moves at 0.5x scroll speed (creates depth)
- **Number counters**: Stats count from 0 to final value when visible (use react-countup)
- **Progress reveals**: Horizontal bars/metrics animate width 0% → 100%

*Framer Motion Patterns:*
```tsx
// Section fade-in
<motion.section
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, ease: "easeOut" }}
  viewport={{ once: true, margin: "-100px" }}
>

// Stagger children
<motion.div
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }}
  initial="hidden"
  whileInView="show"
>
```

*Interaction Animations:*
- Card hovers: translateY(-8px) + shadow-2xl transition-all duration-300
- Button hovers: subtle lift scale-105 + shadow-lg
- Image overlays: opacity 0 → 100 duration-300 on hover
- CTA pulse: gentle scale animation (1 → 1.05 → 1) every 2s

*Performance Guidelines:*
- Use `transform` and `opacity` only (GPU-accelerated)
- `viewport={{ once: true }}` for one-time animations
- Lazy load below-fold animations
- Disable animations on mobile if causing jank
- Preload hero image to prevent layout shift

**Dashboard:**
- Page transitions: fade only, duration-200
- Loading states: skeleton screens with pulse animation
- Toast notifications: slide-in-right from top-right corner
- Dropdown menus: fade-in scale-95 origin-top-right duration-150
- Modal dialogs: fade backdrop + scale-95 to scale-100 content
- Keep animations minimal for perceived performance

---

## Responsive Breakpoints

**Mobile-first:** 375px baseline → md:768px → lg:1024px → xl:1280px

**Key Adaptations:**
- Navigation: hamburger mobile → horizontal desktop
- Grids: 1-column → 2-column → 3-4 column progression
- Hero text: reduce font sizes 30-40% on mobile
- Forms: stack mobile → 2-column grid desktop
- Dashboard sidebar: hidden/overlay mobile → fixed desktop
- Tables: card transformation mobile → full table desktop