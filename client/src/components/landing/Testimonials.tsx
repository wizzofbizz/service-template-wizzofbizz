import { Reveal } from "./Reveal";

interface Testimonial {
  quote: string;
  name: string;
  detail: string;
}

/**
 * Quotes fade up once and then hold. No other motion.
 *
 * This is the only section on the page the visitor has to READ rather than scan.
 * The eye tracks movement involuntarily and loses its line, so motion here would be
 * actively hostile. The stillness is the design.
 */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;

  return (
    <section className="bg-neutral-950 px-6 py-28 md:py-36" id="testimonials">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="mb-14 font-display text-3xl font-semibold uppercase tracking-tight text-white md:text-5xl">
            What clients say
          </h2>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.1}>
              <figure
                className="flex h-full flex-col justify-between rounded-2xl bg-white/[0.04] p-8 ring-1 ring-white/10"
                data-testid={`testimonial-${i}`}
              >
                <blockquote className="text-base leading-relaxed text-white/85">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-8 border-t border-white/10 pt-5">
                  <div className="font-medium text-white">{t.name}</div>
                  <div className="mt-1 text-sm text-white/50">{t.detail}</div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
