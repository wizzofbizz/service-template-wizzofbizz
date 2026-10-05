import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface RevealProps {
  children: ReactNode;
  /** Stagger offset in seconds, for siblings revealing in sequence. */
  delay?: number;
  className?: string;
}

/** Shared easing: fast out of the gate, long settle. Used page-wide. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Fade up once on entry — the page's quietest motion primitive.
 *
 * Deliberately one-shot (`once: true`): it runs on its own timeline and never
 * replays, so scrolling back up leaves content settled rather than re-animating.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 47 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
