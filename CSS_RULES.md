# Smart Website SaaS - CSS Rules & Design System

This document outlines all CSS rules, custom utilities, and design tokens used in the Smart Website SaaS platform.

---

## Table of Contents

1. [Color System](#color-system)
2. [Typography](#typography)
3. [Spacing & Layout](#spacing--layout)
4. [Custom Tailwind Utilities](#custom-tailwind-utilities)
5. [Animation Classes](#animation-classes)
6. [Component Patterns](#component-patterns)
7. [Shadow System](#shadow-system)
8. [Accessibility](#accessibility)

---

## Color System

### CSS Custom Properties

All colors use HSL format for easy theming and dark mode support.

#### Light Mode
```css
--background: 0 0% 100%;           /* Pure white */
--foreground: 222 13% 9%;          /* Almost black text */
--border: 220 9% 88%;              /* Light borders */
--card: 0 0% 98%;                  /* Off-white cards */
--card-foreground: 222 13% 9%;
--card-border: 220 9% 91%;
--primary: 217 91% 48%;            /* Blue */
--primary-foreground: 0 0% 100%;
--secondary: 220 10% 89%;
--secondary-foreground: 222 13% 9%;
--muted: 220 12% 92%;
--muted-foreground: 222 13% 35%;
```

#### Dark Mode
```css
--background: 222 13% 9%;
--foreground: 0 0% 98%;
--border: 220 9% 18%;
--card: 222 13% 11%;
--card-foreground: 0 0% 98%;
--card-border: 220 9% 15%;
```

---

## Typography

### Font Families
```css
--font-sans: Open Sans, sans-serif;
--font-serif: Georgia, serif;
--font-mono: Menlo, monospace;
```

### Font Sizes
- `text-xs`: 0.75rem (12px) - uppercase labels
- `text-sm`: 0.875rem (14px) - body small
- `text-base`: 1rem (16px) - body text
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)
- `text-4xl`: 2.25rem (36px)
- `text-5xl`: 3rem (48px)
- `text-6xl`: 3.75rem (60px)
- `text-7xl`: 4.5rem (72px)

### Font Weights
- `font-light`: 300 - body text, descriptions
- `font-normal`: 400 - headings in modern style
- `font-medium`: 500 - buttons
- `font-semibold`: 600 - emphasis
- `font-bold`: 700 - strong emphasis

### Letter Spacing
```css
tracking-[0.2em]  /* 0.2em - subtle uppercase */
tracking-[0.3em]  /* 0.3em - uppercase labels */
tracking-wide     /* 0.025em */
tracking-wider    /* 0.05em */
```

---

## Spacing & Layout

### Container System
```css
/* Page containers */
container mx-auto px-6 md:px-12 lg:px-20

/* Content max-widths */
max-w-xl   /* 36rem - narrow content */
max-w-2xl  /* 42rem - standard text */
max-w-4xl  /* 56rem - wide content */
```

### Section Padding
```css
py-32 md:py-40  /* Standard section vertical padding */
```

### Spacing Scale
```css
space-y-[20vh]  /* Cascading cards vertical spacing */
gap-6           /* Standard grid gap */
gap-16          /* Large grid gap */
mb-6, mb-8, mb-12  /* Standard bottom margins */
```

---

## Custom Tailwind Utilities

### Elevation System

#### Toggle Elevate
```css
.toggle-elevate::before {
  content: "";
  position: absolute;
  inset: 0px;
  border-radius: inherit;
  z-index: -1;
}

.toggle-elevate.toggle-elevated::before {
  background-color: var(--elevate-2);
}
```

#### Hover/Active Elevate
```css
.hover-elevate:hover::after {
  background-color: var(--elevate-1);
}

.active-elevate-2:active::after {
  background-color: var(--elevate-2);
}
```

---

## Animation Classes

### Framer Motion Patterns

#### Fade In from Bottom
```tsx
initial={{ opacity: 0, y: 40 }}
whileInView={{ opacity: 1, y: 0 }}
transition={{ duration: 0.8 }}
viewport={{ once: true }}
```

#### Parallax Scroll
```tsx
const { scrollYProgress } = useScroll({
  target: heroRef,
  offset: ["start start", "end start"]
});
const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
```

#### Horizontal Line Animation
```tsx
initial={{ scaleX: 0 }}
whileInView={{ scaleX: 1 }}
transition={{ duration: 1.5, ease: "easeOut" }}
className="origin-left"
```

---

## Component Patterns

### Hero Section
```tsx
<section className="relative min-h-screen flex items-center overflow-hidden">
  <motion.div style={{ y: heroY }}>
    <div className="absolute inset-0 bg-cover bg-center" />
    <div className="absolute inset-0 bg-black/40" />
  </motion.div>
  <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-20 pt-32 md:pt-40">
    <h1 className="text-5xl md:text-6xl lg:text-7xl font-normal text-white">
      Heading
    </h1>
  </div>
</section>
```

### Sticky Cascading Cards
```tsx
<div className="space-y-[20vh]">
  <div className="sticky top-32 z-10">
    <div className="bg-white py-8 -mx-6 md:-mx-12 lg:-mx-20 px-6 md:px-12 lg:px-20">
      <div className="border-l-2 border-black pl-8 max-w-xl">
        {/* Content */}
      </div>
    </div>
  </div>
</div>
```

### Partner/Logo Cards
```tsx
<div className="grid grid-cols-2 gap-6">
  <div className="bg-white rounded-md border border-gray-200 h-32 flex items-center justify-center p-6 shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
    <div className="text-center">
      <div className="text-2xl font-bold mb-1">Logo</div>
      <div className="text-xs uppercase tracking-wider text-gray-600">Tagline</div>
    </div>
  </div>
</div>
```

### Stat Display
```tsx
<div className="border-b border-white/30 pb-4">
  <div className="text-5xl md:text-6xl font-light mb-3">
    <CountUp end={50} duration={2.5} enableScrollSpy scrollSpyOnce />
  </div>
  <p className="text-sm font-light tracking-wide">Label</p>
</div>
```

### Section Headers
```tsx
<p className="text-xs uppercase tracking-[0.3em] mb-8 font-light">
  Label
</p>
<h2 className="text-4xl md:text-5xl lg:text-6xl font-normal mb-12 leading-tight">
  Main Heading
</h2>
```

---

## Shadow System

### Custom Shadows (from index.css)
```css
--shadow-2xs: 0px 2px 0px 0px hsl(220 13% 13% / 0.02);
--shadow-xs: 0px 2px 0px 0px hsl(220 13% 13% / 0.04);
--shadow-sm: 0px 2px 0px 0px hsl(220 13% 13% / 0.03), 0px 1px 2px -1px hsl(220 13% 13% / 0.06);
--shadow: 0px 2px 0px 0px hsl(220 13% 13% / 0.04), 0px 1px 2px -1px hsl(220 13% 13% / 0.08);
--shadow-md: 0px 2px 0px 0px hsl(220 13% 13% / 0.05), 0px 2px 4px -1px hsl(220 13% 13% / 0.10);
--shadow-lg: 0px 2px 0px 0px hsl(220 13% 13% / 0.06), 0px 4px 6px -1px hsl(220 13% 13% / 0.12);
```

### Usage
```css
shadow-[0_2px_4px_rgba(0,0,0,0.08)]  /* Subtle card shadow */
```

---

## Responsive Breakpoints

### Tailwind Defaults
```css
sm: 640px   /* @media (min-width: 640px) */
md: 768px   /* @media (min-width: 768px) */
lg: 1024px  /* @media (min-width: 1024px) */
xl: 1280px  /* @media (min-width: 1280px) */
2xl: 1536px /* @media (min-width: 1536px) */
```

### Common Patterns
```tsx
className="text-5xl md:text-6xl lg:text-7xl"  /* Responsive text */
className="px-6 md:px-12 lg:px-20"            /* Responsive padding */
className="grid grid-cols-1 md:grid-cols-2"   /* Responsive grid */
```

---

## Accessibility

### Focus States
```css
focus-visible:outline-2
focus-visible:outline-ring
focus-visible:outline-offset-2
```

### Color Contrast
- All text meets WCAG AA (4.5:1 minimum)
- Primary buttons: white text on blue background
- Links: underlined for clarity

### Keyboard Navigation
- Tab order follows visual order
- All interactive elements keyboard accessible
- Skip links for screen readers

---

## Border Radius

```css
--radius: 0.5rem;  /* 8px - default */
rounded-md         /* 0.375rem - 6px */
rounded-lg         /* 0.5rem - 8px */
rounded-xl         /* 0.75rem - 12px */
rounded-full       /* 9999px - pills */
```

---

## Version History

- **Oct 24, 2025**: Initial CSS system with elevation utilities
- **Oct 24, 2025**: Added Wix-inspired animations and parallax scrolling
- **Oct 24, 2025**: Implemented sticky cascading cards pattern
- **Oct 24, 2025**: Updated partner cards with proper alignment and shadows

---

_This document serves as the source of truth for all CSS styling in Smart Website SaaS._