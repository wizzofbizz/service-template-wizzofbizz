import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { BeforeAfter } from "./content";

export interface StackService {
  index: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  image: BeforeAfter;
}

const PIN_OFFSET = 88;

/**
 * One pinned card. Its before/after reveal is driven by how far through its own
 * pinned life the card is: it arrives showing the before and is fully transformed by
 * the time the next card starts to cover it.
 *
 * This is what earns the pinning. A pinned card that merely sits there holds the
 * visitor hostage; a pinned card that is visibly changing has a reason for the hold —
 * the pin is the duration the transformation needs, so mechanic and message become
 * the same thing.
 */
function StackCard({
  service,
  index,
  bookingHref,
  accent,
}: {
  service: StackService;
  index: number;
  bookingHref: string;
  accent: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const hasPair = Boolean(
    service.image.before && service.image.after && service.image.before !== service.image.after,
  );

  /*
   * Progress is measured against the TRACK, not the pinned card.
   *
   * A pinned element stops moving relative to the viewport, so its own scroll
   * progress barely advances until it unpins — driving the curtain from it meant the
   * transformation only played after the card had already been buried. The track is a
   * taller wrapper that keeps scrolling normally behind the pinned card, so it gives
   * the reveal real travel to run against while the card is held.
   */
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  /*
   * Spread across most of the pinned life rather than a narrow band in the middle.
   * A tight window meant the curtain retracted in ~180px of scroll — one flick of a
   * trackpad — which is too fast to read as a transformation. Starting at 15% lets the
   * card settle into its pin first; finishing at 78% still leaves a beat of the
   * completed state before the next card slides over it.
   *
   * Retracts by height so the image is uncovered in place rather than sliding away.
   */
  const curtainHeight = useTransform(scrollYProgress, [0.1, 0.62], ["100%", "0%"]);

  const showCurtain = hasPair && !reduceMotion;
  const mediaLeft = index % 2 === 1;

  /*
   * Track height sets how long each card is held, and the PINNED life is the
   * difference between the track and the card (160vh - 80vh = 80vh of hold). That
   * pinned distance is what the reveal actually runs against, so a track only slightly
   * taller than the card left the transformation completing in ~150px of scroll — a
   * single trackpad flick. 160vh gives roughly two-thirds of a screen of held reveal
   * while keeping the whole section under four screens.
   */
  return (
    <div
      ref={trackRef}
      className="relative mb-6 md:mb-0 md:h-[160vh]"
      style={{ zIndex: 10 + index }}
    >
      <div
        className="relative h-auto md:sticky md:h-[80vh] md:min-h-[560px]"
        style={{ top: PIN_OFFSET }}
      >
      <article
        className="grid h-full overflow-hidden rounded-[1.75rem] bg-neutral-900 text-white ring-1 ring-white/10 md:grid-cols-2"
        data-testid={`sticky-service-${index}`}
      >
        {/* Media — order flips per card so three cards don't read as one template. */}
        <div
          className={`relative h-64 overflow-hidden sm:h-80 md:h-auto ${mediaLeft ? "md:order-1" : "md:order-2"}`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${service.image.after})` }}
            role="img"
            aria-label={service.image.alt}
          />
          {showCurtain && (
            <motion.div
              className="absolute inset-x-0 top-0 overflow-hidden will-change-[height]"
              style={{ height: curtainHeight }}
              aria-hidden="true"
            >
              {/* Full-card height so the image is uncovered in place, never squashed. */}
              <div
                className="absolute inset-x-0 top-0 h-[80vh] min-h-[560px] bg-cover bg-center"
                style={{ backgroundImage: `url(${service.image.before})` }}
              />
              <div className="absolute inset-x-0 bottom-0 h-px bg-white/60" />
            </motion.div>
          )}

          <div className="pointer-events-none absolute left-5 top-5 rounded-full bg-black/55 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.2em] backdrop-blur-sm">
            {showCurtain ? "Before → After" : service.duration}
          </div>
        </div>

        {/* Copy */}
        <div
          className={`flex flex-col justify-center p-8 md:p-14 ${mediaLeft ? "md:order-2" : "md:order-1"}`}
        >
          <div className="font-display text-6xl font-extrabold leading-none tracking-tight text-white/25 md:text-8xl">
            {service.index}
          </div>

          <div className="my-6 h-px w-full bg-white/20" />

          <h3 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
            {service.name}
          </h3>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 md:text-base">
            {service.description}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
            <span className="font-medium">{service.price}</span>
            <span className="text-white/55">{service.duration}</span>
          </div>

          <Button
            asChild
            className="mt-8 h-auto w-fit rounded-full px-7 py-5 text-sm font-medium text-neutral-950 hover:opacity-90"
            style={{ backgroundColor: accent }}
            data-testid={`button-service-${index}`}
          >
            <a href={bookingHref}>Book {service.name}</a>
          </Button>
        </div>
        </article>
      </div>
    </div>
  );
}

/**
 * The stack. Cards pin in sequence, each parking on top of the last.
 *
 * Capped at three: at roughly a viewport of scroll each, a fourth card puts real
 * distance between the visitor and the pricing. Three is the most that reads as
 * deliberate rather than stuck.
 *
 * Below the `md` breakpoint every card is `position: static` (the `sticky` class only
 * applies with the height), because pinning on a short viewport means the visitor
 * scrolls and nothing appears to happen.
 */
export function ServiceStack({
  services,
  bookingHref,
  accent,
}: {
  services: StackService[];
  bookingHref: string;
  accent: string;
}) {
  const stacked = services.slice(0, 3);

  return (
    <section id="services" className="bg-neutral-950 px-4 pb-32 pt-8 md:px-6">
      <div className="mx-auto max-w-6xl">
        {stacked.map((s, i) => (
          <StackCard
            key={s.name}
            service={s}
            index={i}
            bookingHref={bookingHref}
            accent={accent}
          />
        ))}
      </div>
    </section>
  );
}
