import { motion } from "framer-motion";
import { Image, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface AIProgressOrbProps {
  progress: number; // 0-100
  status: 'analyzing' | 'generating' | 'finalizing';
  statusText?: string;
}

export function AIProgressOrb({ progress, status, statusText }: AIProgressOrbProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const appFont = 'AxLLCircular, Helvetica, Arial, sans-serif';

  // Smooth progress animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  // Determine colors based on progress - using a matte purple/lavender palette
  const getOrbColors = (): [string, string] => {
    if (progress < 100) {
      return ['#7c3aed', '#a78bfa']; // Purple → Lavender (Matte/Subtle)
    } else {
      return ['#10b981', '#34d399']; // Green → Emerald (Success state)
    }
  };

  const colors = getOrbColors();

  const getStatusText = () => {
    if (statusText) return statusText.replace(/📸 |🤖 |✨ /g, '');
    if (status === 'analyzing') return 'Analyzing photos...';
    if (status === 'generating') return 'Processing your quote...';
    return 'Finalizing...';
  };

  const displayStatusText = getStatusText();

  // Icon based on status
  const StatusIcon = progress >= 100 ? CheckCircle : Image;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" style={{ fontFamily: appFont }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center"
      >
        {/* Glowing Ring Container */}
        <div className="relative flex items-center justify-center" style={{ width: '280px', height: '280px' }}>
          {/* Subtle Matte Glowing Ring */}
          <div 
            className="absolute rounded-full" 
            style={{ 
              width: '220px', 
              height: '220px',
              border: '6px solid rgba(255, 255, 255, 0.05)',
              borderTop: `6px solid ${colors[0]}`,
              borderRight: `6px solid ${colors[1]}`,
              boxShadow: `0 0 20px ${colors[0]}22`,
              animation: 'spin 2s linear infinite'
            }} 
          />
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>

          {/* Centered Content Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-1 z-10">
              {/* Simple Line-based Icon */}
              <motion.div
                animate={{
                  scale: progress < 100 ? [1, 1.05, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <StatusIcon 
                  className="h-10 w-10 text-white/90" 
                  strokeWidth={1.5}
                />
              </motion.div>

              {/* Percentage - Smaller and centered */}
              <div className="text-2xl font-medium text-white/80 tracking-tight mt-1">
                {Math.round(displayProgress)}%
              </div>
            </div>
          </div>
        </div>

        {/* Status Text - Centered with ample spacing */}
        <motion.div
          className="text-white/90 text-lg font-normal text-center px-8 max-w-md mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {displayStatusText}
        </motion.div>

        {/* Minimal Animated Dots */}
        <div className="flex gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/40"
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
