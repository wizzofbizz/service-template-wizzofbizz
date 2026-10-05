import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { EASE } from "./Reveal";

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

/**
 * Counts 0 -> value once, when scrolled into view.
 *
 * A static number is a fact you read; a number climbing to its total is a quantity
 * being accumulated. This is the one place on the page where motion adds meaning
 * rather than emphasis, so it is worth the extra machinery.
 */
function useCountUp(target: number, active: boolean, durationMs = 1400) {
  const reduceMotion = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (reduceMotion) {
      setN(target);
      return;
    }

    let raf = 0;
    let start: number | null = null;

    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / durationMs, 1);
      // Ease-out cubic: fast accumulation that decelerates, matching the card arrival.
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, durationMs, reduceMotion]);

  return reduceMotion && !active ? target : n;
}

function StatCard({ stat, index, total }: { stat: Stat; index: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  /*
   * No negative margin here. The cards start translated 346px down and 200px sideways,
   * so a shrunken root box meant the offset ones never intersected and stayed stuck at
   * opacity 0 with their counters on zero. Triggering as soon as any part enters the
   * viewport is both safer and closer to the intent.
   */
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const reduceMotion = useReducedMotion();
  const n = useCountUp(stat.value, inView);

  // Alternating entry sides so the cards converge rather than reading as a list
  // loading in. Same distance, opposite directions.
  const fromLeft = index % 2 === 0;
  const isLast = index === total - 1;

  // Three cards establish the rule; the fourth breaks it with a spring overshoot.
  // By card three the eye has learned what to expect and stops watching — the
  // overshoot re-catches attention exactly where it would otherwise drop.
  const transition = isLast
    ? { type: "spring" as const, stiffness: 260, damping: 12, mass: 0.9 }
    : { duration: 0.85, ease: EASE };

  // Every card must separate from the near-black page ground, so the "dark" entries
  // are mid-greys rather than another black. The accent card lands on the last one —
  // the same card that springs — so the pattern break is reinforced by colour.
  const palette = [
    "bg-neutral-700 text-white",
    "bg-white text-neutral-950",
    "bg-neutral-600 text-white",
    "bg-[#C6F24E] text-neutral-950",
  ];

  return (
    <motion.div
      ref={ref}
      className={`rounded-2xl px-8 py-10 md:px-12 md:py-14 ${palette[index % palette.length]}`}
      style={{
        // Offsets break the rigid column so the stack reads as composed.
        marginLeft: fromLeft ? 0 : "auto",
        width: "min(100%, 46rem)",
        marginRight: fromLeft ? "auto" : 0,
      }}
      initial={reduceMotion ? false : { opacity: 0, x: fromLeft ? -200 : 200, y: 346 }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : undefined}
      transition={transition}
      data-testid={`card-stat-${index}`}
    >
      <div className="font-display text-6xl font-extrabold leading-none tracking-tight md:text-8xl">
        {n}
        {stat.suffix}
      </div>
      <div className="mt-3 text-sm uppercase tracking-[0.18em] opacity-70 md:text-base">
        {stat.label}
      </div>
    </motion.div>
  );
}

export function Numbers({ stats }: { stats: Stat[] }) {
  return (
    <section className="bg-neutral-950 px-6 py-24 md:py-32" id="numbers">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-14 font-display text-3xl font-semibold uppercase tracking-tight text-white md:text-5xl">
          Us in numbers
        </h2>
        <div className="flex flex-col gap-4 md:gap-5">
          {stats.map((s, i) => (
            <StatCard key={s.label} stat={s} index={i} total={stats.length} />
          ))}
        </div>
      </div>
    </section>
  );
}
