import { motion, AnimatePresence } from 'motion/react';
import { Coffee, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

const SUBTEXTS = [
  "Aquecendo o café...",
  "Organizando ideias...",
  "Criando personagens...",
  "Afiando a pena...",
  "Consultando as musas...",
  "Limpando a mesa de escrita...",
  "Ouvindo a chuva cair...",
  "Buscando inspiração em Kyoto..."
];

interface LoadingScreenProps {
  isLoading: boolean;
  text?: string;
  progress?: number;
}

export default function LoadingScreen({ isLoading, text, progress }: LoadingScreenProps) {
  const [subtextIndex, setSubtextIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setSubtextIndex((prev) => (prev + 1) % SUBTEXTS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-ink flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Particles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: Math.random() * window.innerHeight,
                  opacity: 0 
                }}
                animate={{ 
                  y: [null, Math.random() * -100 - 50],
                  opacity: [0, 0.3, 0],
                  scale: [0, 1, 0]
                }}
                transition={{ 
                  duration: Math.random() * 3 + 2, 
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
                className="absolute w-1 h-1 bg-sakura rounded-full"
              />
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="mb-8 p-6 bg-coffee rounded-3xl shadow-[0_0_50px_rgba(92,64,51,0.5)]"
            >
              <Coffee className="w-16 h-16 text-creme" />
            </motion.div>

            <h2 className="text-3xl font-serif text-creme mb-2 tracking-tight">
              {text || "Preparando sua história..."}
            </h2>

            {progress !== undefined && (
              <div className="flex flex-col items-center gap-2 mb-4">
                <span className="text-4xl font-serif text-sakura">{progress}%</span>
                <div className="w-64 h-2 bg-creme/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-sakura shadow-[0_0_15px_rgba(255,183,197,0.5)]"
                  />
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.p
                key={subtextIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sakura/60 font-sans text-sm italic tracking-widest uppercase"
              >
                {SUBTEXTS[subtextIndex]}
              </motion.p>
            </AnimatePresence>

            <div className="mt-12 w-48 h-1 bg-creme/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="w-full h-full bg-gradient-to-r from-transparent via-sakura to-transparent"
              />
            </div>
          </div>

          {/* Decorative Gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-coffee/20 to-transparent pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
