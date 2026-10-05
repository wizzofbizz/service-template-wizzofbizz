import { Button } from "@/components/ui/button";
import { SiWhatsapp } from "react-icons/si";
import { Reveal } from "./Reveal";
import type { Business } from "./types";

interface ContactProps {
  heading: string;
  body: string;
  cta: string;
  bookingHref: string;
  accent: string;
  business?: Business;
  whatsappLink: string | null;
}

/**
 * The close. Deliberately motionless.
 *
 * By this point the visitor has decided, and motion at the point of action is
 * friction. The page has performed for six sections; this one gets out of the way.
 * The stillness here is what the escalation curve was building toward.
 */
export function Contact({
  heading,
  body,
  cta,
  bookingHref,
  accent,
  business,
  whatsappLink,
}: ContactProps) {
  return (
    <section id="contact" className="bg-neutral-950 px-6 py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-2 md:gap-20">
        <Reveal>
          <h2 className="whitespace-pre-line font-display text-[clamp(2.5rem,7vw,6rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.03em] text-white">
            {heading}
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="flex h-full flex-col justify-center">
            <p className="max-w-md text-lg leading-relaxed text-white/70">{body}</p>

            <div className="mt-10 space-y-3 text-white/85">
              {business?.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="block text-lg transition-colors hover:text-white"
                  data-testid="link-phone"
                >
                  {business.phone}
                </a>
              )}
              {business?.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="block text-lg transition-colors hover:text-white"
                  data-testid="link-email"
                >
                  {business.email}
                </a>
              )}
              {business?.addressLine1 && (
                <p className="text-white/50">
                  {business.addressLine1}
                  {business.city ? `, ${business.city}` : ""}
                </p>
              )}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="h-auto rounded-full px-8 py-6 text-base font-medium text-neutral-950 hover:opacity-90"
                style={{ backgroundColor: accent }}
                data-testid="button-contact-cta"
              >
                <a href={bookingHref}>{cta}</a>
              </Button>

              {whatsappLink && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-auto rounded-full border-white/25 bg-transparent px-8 py-6 text-base text-white hover:bg-white/10 hover:text-white"
                  data-testid="button-whatsapp"
                >
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <SiWhatsapp className="mr-2 h-5 w-5" />
                    WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
