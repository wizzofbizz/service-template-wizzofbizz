import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "Work", href: "#gallery" },
  { label: "Reviews", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

/**
 * Pill navigation floating over the hero.
 *
 * Absolute rather than fixed: it scrolls away with the hero instead of following the
 * page, which keeps it clear of the sticky service cards further down.
 */
export function Header({
  businessName,
  bookingHref,
  cta,
  accent,
}: {
  businessName: string;
  bookingHref: string;
  cta: string;
  accent: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-50 pt-5">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between gap-4 rounded-full bg-neutral-950/70 py-3 pl-6 pr-3 ring-1 ring-white/10 backdrop-blur-md">
          <a
            href="#top"
            className="font-display text-lg font-semibold tracking-tight text-white"
            data-testid="link-wordmark"
          >
            {businessName}
          </a>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-white/75 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              asChild
              className="hidden rounded-full px-6 text-sm font-medium text-neutral-950 hover:opacity-90 sm:inline-flex"
              style={{ backgroundColor: accent }}
              data-testid="button-header-cta"
            >
              <a href={bookingHref}>{cta}</a>
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-white hover:bg-white/10 hover:text-white lg:hidden"
                  aria-label="Open menu"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetTitle className="text-left">Menu</SheetTitle>
                <nav className="mt-8 flex flex-col gap-1">
                  {NAV_LINKS.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-3 text-lg transition-colors hover:bg-muted"
                    >
                      {l.label}
                    </a>
                  ))}
                  <Button
                    asChild
                    className="mt-4 w-full rounded-full text-neutral-950"
                    style={{ backgroundColor: accent }}
                  >
                    <a href={bookingHref}>{cta}</a>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Footer({ businessName }: { businessName: string }) {
  return (
    <footer className="border-t border-white/10 bg-neutral-950 px-6 py-14">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="font-display text-lg font-semibold text-white">{businessName}</div>
          <p className="mt-3 text-sm text-white/45">
            Landscape design, build and maintenance.
          </p>
        </div>

        <nav>
          <h3 className="mb-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40">
            Menu
          </h3>
          <ul className="space-y-2 text-sm text-white/70">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="transition-colors hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="mb-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40">
            Legal
          </h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li>Terms &amp; Conditions</li>
            <li>Privacy Policy</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40">
            Hours
          </h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li>Mon–Fri, 7am–5pm</li>
            <li>Sat, 8am–1pm</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-sm text-white/35">
        © {new Date().getFullYear()} {businessName}
      </div>
    </footer>
  );
}
