import { motion } from "framer-motion";
import { CheckCircle as Check } from "lucide-react";

interface AlternatingFeatureProps {
  sectionLabel?: string;
  title: string; // Renamed from 'heading' to 'title' to match the changes
  description: string;
  image: string;
  imageAlt: string;
  imagePosition?: "left" | "right";
  darkMode?: boolean;
  features: string[]; // Added features prop to match the changes
}

export function AlternatingFeature({
  sectionLabel,
  title, // Renamed from 'heading' to 'title'
  description,
  image,
  imageAlt,
  imagePosition = "right",
  darkMode = false,
  features, // Added features prop
}: AlternatingFeatureProps) {
  // The original code used 'heading' and 'description' directly.
  // The provided changes use 'title', 'description', and 'features'.
  // Since the intention is to update the template and all feature pages,
  // and the changes provide a new structure with 'title', 'description', and 'features',
  // I'm adapting the component to use these new props.
  // If 'sectionLabel' is not present, it will not be rendered.
  // The 'darkMode' prop controls the background and text colors.
  // The 'imagePosition' prop determines the layout of text and image.

  return (
    <section className={`py-12 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="container mx-auto px-6 md:px-12 lg:px-20">
        <div className={`grid md:grid-cols-2 gap-12 items-center ${imagePosition === 'left' ? 'md:flex-row-reverse' : ''}`}>
          <motion.div
            initial={{ opacity: 0, x: imagePosition === 'left' ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className={imagePosition === 'left' ? 'md:order-2' : ''}
          >
            {sectionLabel && (
              <p className={`text-xs uppercase tracking-[0.3em] mb-8 font-light ${darkMode ? 'text-white/70' : 'text-gray-600'}`}>
                {sectionLabel}
              </p>
            )}
            <h2 className={`text-2xl md:text-3xl font-normal mb-3 leading-tight ${darkMode ? 'text-white' : 'text-black'}`}>
              {title}
            </h2>
            <p className={`text-sm mb-4 leading-normal ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {description}
            </p>
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#612fff' }} />
                  <span className="text-base text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: imagePosition === 'left' ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className={imagePosition === 'left' ? 'md:order-1' : ''}
          >
            <img
              src={image}
              alt={imageAlt}
              className="rounded-lg shadow-2xl w-full"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}