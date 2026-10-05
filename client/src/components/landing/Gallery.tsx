import { Reveal } from "./Reveal";

interface Label {
  name: string;
  place: string;
  type: string;
  year: string;
}

/**
 * Asymmetric panels of unequal weight, sized so the grid reads as one composed image
 * rather than a photo gallery. Deliberately static: after the stack the page needs to
 * cool down, and a moving gallery here would compete with the booking CTA.
 *
 * The project label appears on hover — it rewards curiosity without demanding
 * attention. Nothing moves until it is asked to.
 */
export function Gallery({ images, labels }: { images: string[]; labels: Label[] }) {
  if (images.length === 0) return null;

  // Unequal spans: the first and fourth panels carry more weight, so the eye reads a
  // composition instead of a repeating tile.
  const spans = [
    "md:col-span-7 md:row-span-2",
    "md:col-span-5",
    "md:col-span-5",
    "md:col-span-4 md:row-span-2",
    "md:col-span-4",
    "md:col-span-4",
  ];

  return (
    <section id="gallery" className="bg-neutral-950 px-6 pb-28 pt-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-semibold uppercase tracking-tight text-white md:text-5xl">
              Recent work
            </h2>
            <p className="text-sm text-white/50">Cape Town & surrounds</p>
          </div>
        </Reveal>

        <div className="grid auto-rows-[180px] grid-cols-1 gap-3 sm:grid-cols-2 md:auto-rows-[200px] md:grid-cols-12">
          {images.map((src, i) => {
            const label = labels[i % labels.length];
            return (
              <Reveal key={src} delay={i * 0.06} className={`${spans[i % spans.length]} h-full`}>
                <figure
                  className="group relative h-full w-full overflow-hidden rounded-xl"
                  data-testid={`gallery-panel-${i}`}
                >
                  <img
                    src={src}
                    alt={`${label.name}, ${label.place}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                  <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/85 to-transparent p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="flex items-baseline justify-between gap-3 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-white">
                      <span className="font-medium">{label.name}</span>
                      <span className="text-white/60">{label.place}</span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between gap-3 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/50">
                      <span>{label.type}</span>
                      <span>{label.year}</span>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
