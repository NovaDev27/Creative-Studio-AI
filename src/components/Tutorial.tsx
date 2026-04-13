import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Sparkles, Coffee, PenTool, Library } from 'lucide-react';
import { useStore } from '../store/useStore';

const STEPS = [
  {
    title: 'Bem-vindo ao KŌHĪRA',
    content: 'Sua jornada literária começa aqui. Vamos te mostrar o básico para você começar a escrever.',
    icon: Coffee,
    color: 'bg-coffee'
  },
  {
    title: 'Crie sua Obra',
    content: 'Use o botão "Nova Obra" para iniciar o Wizard. Lá você define o gênero, estilo e a IA ajuda a estruturar sua história.',
    icon: PenTool,
    color: 'bg-caramel'
  },
  {
    title: 'Assistência de IA',
    content: 'No editor, selecione um texto e use as ferramentas de IA para expandir diálogos, mudar emoções ou reescrever trechos.',
    icon: Sparkles,
    color: 'bg-sakura'
  },
  {
    title: 'Sua Biblioteca',
    content: 'Aqui você gerencia todos os seus manuscritos. Você pode renomear capítulos e organizar sua obra como desejar.',
    icon: Library,
    color: 'bg-ink'
  }
];

export default function Tutorial() {
  const { hasSeenTutorial, setHasSeenTutorial } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!hasSeenTutorial) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenTutorial]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setHasSeenTutorial(true), 500);
  };

  if (!isVisible) return null;

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-ink/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-creme dark:bg-ink w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-coffee/10 dark:border-white/10"
      >
        <div className="p-8 md:p-12">
          <div className="flex justify-between items-start mb-8">
            <div className={`p-4 ${step.color} rounded-2xl shadow-lg`}>
              <step.icon className="w-6 h-6 text-creme" />
            </div>
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-coffee/5 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-5 h-5 opacity-20 hover:opacity-100" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="min-h-[160px]"
            >
              <h2 className="text-3xl font-serif text-coffee dark:text-creme mb-4 leading-tight">
                {step.title}
              </h2>
              <p className="text-ink/60 dark:text-creme/60 leading-relaxed">
                {step.content}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div 
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === currentStep ? 'w-8 bg-coffee dark:bg-sakura' : 'w-1.5 bg-coffee/10 dark:bg-white/10'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-4 bg-coffee dark:bg-sakura text-creme dark:text-ink rounded-full font-bold uppercase tracking-widest text-xs hover:bg-ink dark:hover:bg-creme transition-all shadow-xl"
            >
              {currentStep === STEPS.length - 1 ? 'Começar' : 'Próximo'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
