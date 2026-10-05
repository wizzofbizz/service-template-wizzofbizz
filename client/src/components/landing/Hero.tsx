import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EASE } from "./Reveal";
import type { BeforeAfter } from "./content";

interface HeroProps {
  eyebrow: string;
  headline: string;
  sub: string;
  cta: string;
  bookingHref: string;
  accent: string;
  image: BeforeAfter;
  businessName: string;
}

/**
 * The opening move: a before image that slides away to uncover the after, with the
 * headline cut out of the before so the after shows through the letterforms from the
 * first frame.
 *
 * The reveal is scroll-driven — the visitor causes the transformation, which is what
 * makes it read as proof rather than decoration. It completes inside the first ~45%
 * of one screen of scrolling and then releases; the hero is never pinned, so it can't
 * delay anyone reaching the booking CTA.
 *
 * Falls back to a plain image hero when only one image is configured (see `hasPair`) —
 * most template deployments won't have matched pairs, and a one-image before/after is
 * broken rather than subtle.
 */
export function Hero({
  eyebrow,
  headline,
  sub,
  cta,
  bookingHref,
  accent,
  image,
  businessName,
}: HeroProps) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const hasPair = Boolean(image.before && image.after && image.before !== image.after);

  /*
   * The cut-out needs large, simple letterforms AND a readable image behind them.
   * Below ~640px a phone gives neither: the glyphs are too small for the after image
   * to resolve inside them and the type reads as mottled texture. Solid white is the
   * better headline there — the curtain reveal still carries the transformation.
   */
  const [wideEnoughForMask, setWideEnoughForMask] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => setWideEnoughForMask(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  /*
   * The curtain is pinned to the viewport while it retracts, so the reveal plays out
   * against a full-height hero instead of sliding off with the page. Without this the
   * section scrolls away faster than the curtain clears and the transformation is only
   * half visible when the hero leaves.
   *
   * Retracts via height rather than translate for the same reason: a translated
   * curtain exposes empty space above it once the page has moved.
   */
  const curtainHeight = useTransform(scrollYProgress, [0, 0.5], ["100%", "0%"]);
  const driftScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  // Static when reduced motion is on — but the AFTER image is what shows, since that
  // is the information the animation would otherwise be carrying.
  const showCurtain = hasPair && !reduceMotion;

  return (
    <section
      ref={ref}
      id="top"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950"
    >
      {/* AFTER — the resting state, revealed as the curtain leaves */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${image.after})`,
          scale: reduceMotion ? 1 : driftScale,
        }}
        role="img"
        aria-label={`${businessName} — ${image.alt}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/75" />
      </motion.div>

      {/*
        BEFORE — the curtain. Retracts upward to uncover the after beneath.

        The wrapper's height shrinks while the image inside keeps a fixed viewport
        height, so the photograph itself never moves or squashes — only the amount of
        it that is visible changes. That is what makes it read as a curtain being
        pulled rather than a picture sliding.
      */}
      {showCurtain && (
        <motion.div
          className="absolute inset-x-0 top-0 z-10 overflow-hidden will-change-[height]"
          style={{ height: curtainHeight }}
          aria-hidden="true"
        >
          <div
            className="absolute inset-x-0 top-0 h-screen bg-cover bg-center"
            style={{ backgroundImage: `url(${image.before})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/85" />
          </div>
          {/* Hard bottom edge — reads as a curtain pulled, not a crossfade. */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/70" />
        </motion.div>
      )}

      {/*
        Radial plate behind the copy. The cut-out headline relies on contrast between
        the glyph fill and whatever sits behind it; over busy foliage the letterforms
        stop separating, and this darkens the centre without flattening the frame.
      */}
      {showCurtain && wideEnoughForMask && (
        <div
          className="pointer-events-none absolute inset-0 z-[15]"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 48%, rgba(0,0,0,0.55), rgba(0,0,0,0.15) 60%, transparent 80%)",
          }}
        />
      )}

      <div className="relative z-20 w-full px-6 text-center">
        <motion.p
          className="mb-5 text-xs font-medium uppercase tracking-[0.32em] text-white/85 md:text-sm"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          {eyebrow}
        </motion.p>

        <motion.h1
          className="mx-auto font-display font-extrabold uppercase leading-[0.82] tracking-[-0.035em] whitespace-pre-line"
          style={{
            /*
             * Scales harder on narrow screens than a plain clamp would: below roughly
             * 500px the cut-out stops resolving as letterforms and reads as noise, so
             * the type has to stay large relative to the viewport.
             */
            fontSize: "clamp(4.25rem, 19vw, 13rem)",
            /*
             * The cut-out: the after image is painted INTO the glyphs, so the
             * transformation is visible inside the words before any scrolling. Once the
             * curtain has gone the letters read as solid white against the same image.
             */
            ...(showCurtain && wideEnoughForMask
              ? {
                  backgroundImage: `url(${image.after})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  WebkitTextStroke: "1px rgba(255,255,255,0.28)",
                }
              : {
                  color: "white",
                  // Solid type still has to survive busy foliage on small screens.
                  textShadow: "0 2px 24px rgba(0,0,0,0.55)",
                }),
          }}
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
          data-testid="text-hero-heading"
        >
          {headline}
        </motion.h1>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
        >
          <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
            {sub}
          </p>

          <Button
            asChild
            size="lg"
            className="mt-9 h-auto rounded-full px-9 py-6 text-base font-medium text-neutral-950 hover:opacity-90"
            style={{ backgroundColor: accent }}
            data-testid="button-hero-cta"
          >
            <a href={bookingHref}>{cta}</a>
          </Button>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-6 z-20 font-mono text-[0.7rem] uppercase tracking-[0.25em] text-white/55">
        01 / Transformation
      </div>
    </section>
  );
}
