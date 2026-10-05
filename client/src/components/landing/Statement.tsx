import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";

/**
 * One drifting line. Extracted so the `useTransform` hook is called at a stable
 * position per component rather than inside a map callback.
 */
function StatementLine({
  line,
  drift,
  travel,
  index,
  reduceMotion,
}: {
  line: string;
  drift: MotionValue<number>;
  travel: number;
  index: number;
  reduceMotion: boolean | null;
}) {
  const x = useTransform(drift, (d) => d * travel);

  return (
    <motion.div
      className="whitespace-nowrap text-center font-display text-[clamp(2rem,7.5vw,6.5rem)] font-extrabold uppercase leading-[1.02] tracking-[-0.03em] text-white will-change-transform"
      style={reduceMotion ? undefined : { x }}
      data-testid={`text-statement-${index}`}
    >
      {line}
    </motion.div>
  );
}

/**
 * Three lines of display type drifting horizontally at alternating directions, which
 * converge into perfect alignment as the section reaches the centre of the viewport,
 * then continue past each other.
 *
 * Drifting type on its own is decoration. Type that assembles itself into order and
 * then comes apart is a statement about the service — chaos resolving into intent for
 * one held moment. Visitors who scroll straight past see it half-formed; the ones who
 * slow down get the alignment. That asymmetry is deliberate.
 *
 * This is the page's only parallax, and it is horizontal. It sits between sections
 * because it is pure typography with nothing to read — the one kind of content that
 * can afford to move. The rule elsewhere on the page: never move what must be read.
 */
export function Statement({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // 0 -> 0.5 converge, 0.5 -> 1 diverge again. At 0.5 the section is centred and every
  // line sits at x=0, so the alignment is exact rather than approximate.
  const drift = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0, -1]);

  // Distances differ per line so they don't move as a rigid block. The middle line
  // travels furthest and in the opposite direction, which makes the moment of
  // alignment read as an event.
  const travel = [-260, 320, -200];

  return (
    <section ref={ref} className="overflow-hidden bg-neutral-950 py-24 md:py-32">
      {/*
        The lines are split across separate elements for the drift, which would read to
        a screen reader as three unrelated fragments. Expose the claim once as a real
        heading and hide the decorative copies, so assistive tech gets the sentence and
        the page keeps a sane heading outline.
      */}
      <h2 className="sr-only">{lines.join(" ")}</h2>
      <div className="mx-auto max-w-[1600px]" aria-hidden="true">
        {lines.map((line, i) => (
          <StatementLine
            key={line}
            line={line}
            drift={drift}
            travel={travel[i % travel.length]}
            index={i}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </section>
  );
}
