import { motion } from "framer-motion";

interface Step {
  number: string;
  title: string;
  description: string;
}

interface HowItWorksProps {
  sectionLabel?: string;
  heading: string;
  steps: Step[];
  darkMode?: boolean;
}

export function HowItWorks({ sectionLabel, heading, steps, darkMode = false }: HowItWorksProps) {
  const textColor = darkMode ? "text-white" : "text-black";
  const mutedColor = darkMode ? "text-white/70" : "text-gray-600";

  return (
    <section className={`py-10 md:py-12 ${darkMode ? "bg-black" : "bg-white"}`}>
      <div className="container mx-auto px-6 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          {sectionLabel && (
            <p className={`text-xs uppercase tracking-[0.3em] mb-4 font-light ${mutedColor}`}>
              {sectionLabel}
            </p>
          )}
          <h2
            className={`text-2xl md:text-3xl lg:text-4xl font-normal mb-6 md:mb-8 leading-tight ${textColor}`}
          >
            {heading}
          </h2>

          <div className="space-y-6 md:space-y-8">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                className="border-l-2 border-current pl-4 md:pl-6 max-w-2xl"
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.15, duration: 0.6 }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <div className={`text-3xl md:text-4xl font-light mb-2 ${textColor}`}>
                  {step.number}
                </div>
                <h3 className={`text-lg md:text-xl font-normal mb-2 ${textColor}`}>
                  {step.title}
                </h3>
                <p className={`text-sm md:text-base leading-normal ${mutedColor}`}>{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}