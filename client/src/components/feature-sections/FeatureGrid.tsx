import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  link?: string; // Optional for now
}

interface FeatureGridProps {
  features: Feature[];
  darkMode?: boolean;
}

export function FeatureGrid({
  features,
  darkMode = false,
}: FeatureGridProps) {
  const textColor = darkMode ? "text-white" : "text-black";
  const mutedColor = darkMode ? "text-white/70" : "text-gray-600";

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.15 } },
      }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
    >
      {features.map((feature, idx) => (
        <motion.div
          key={idx}
          variants={{
            hidden: { opacity: 0, y: 30 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <Card className={`h-full ${darkMode ? "bg-white/5 border-white/10" : ""}`}>
            <CardContent className="p-8">
              <feature.icon
                className={`h-12 w-12 mb-6 ${darkMode ? "text-white" : "text-black"}`}
              />
              <h3
                className={`text-2xl font-semibold mb-4 ${darkMode ? "text-white" : "text-black"}`}
              >
                {feature.title}
              </h3>
              <p className={`leading-relaxed ${mutedColor}`}>{feature.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}