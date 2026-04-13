import { motion } from 'motion/react';
import { Coffee, BookOpen, PenTool, Sparkles, Zap, LogIn, Library as LibraryIcon, Search, Sun, Moon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../contexts/TranslationContext';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import LanguageSelector from '../components/LanguageSelector';

export default function Home() {
  const { user, isLoading, isDarkMode } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogin = (target: string) => {
    if (user) {
      navigate(target);
    } else {
      navigate('/login');
    }
  };

  const cards = [
    { 
      id: 'create', 
      title: t('home.cards.create.title'), 
      desc: t('home.cards.create.desc'), 
      icon: PenTool, 
      color: 'bg-mossa', 
      target: '/create' 
    },
    { 
      id: 'library', 
      title: t('home.cards.library.title'), 
      desc: t('home.cards.library.desc'), 
      icon: LibraryIcon, 
      color: 'bg-momiji', 
      target: '/library' 
    },
    { 
      id: 'explore', 
      title: t('home.cards.explore.title'), 
      desc: t('home.cards.explore.desc'), 
      icon: Sparkles, 
      color: 'bg-sora', 
      target: '/create' 
    },
    { 
      id: 'focus', 
      title: t('home.cards.focus.title'), 
      desc: t('home.cards.focus.desc'), 
      icon: Zap, 
      color: 'bg-sumire', 
      target: '/library' 
    },
  ];

  return (
    <div className="min-h-screen bg-creme dark:bg-ink flex flex-col items-center p-6 relative overflow-hidden selection:bg-sakura/30 transition-colors duration-500">
      <LoadingScreen isLoading={isLoading} />

      {/* Header */}
      <div className="w-full max-w-6xl flex justify-between items-center z-20 pt-4">
        <LanguageSelector />

        {!user ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            aria-label="Entrar na conta"
            className="flex items-center gap-2 px-6 py-2 bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-coffee/10 dark:border-white/10 rounded-full text-coffee dark:text-creme font-medium text-sm hover:bg-white dark:hover:bg-white/20 transition-all shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            {t('home.login')}
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/library')}
            aria-label="Ir para minha biblioteca"
            className="flex items-center gap-2 px-6 py-2 bg-coffee dark:bg-sakura text-creme dark:text-ink rounded-full font-medium text-sm hover:bg-ink dark:hover:bg-creme transition-all shadow-md"
          >
            <LibraryIcon className="w-4 h-4" />
            {t('home.my_library')}
          </motion.button>
        )}
      </div>

      {/* Animated Background Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
              opacity: 0.1
            }}
            animate={{ 
              y: [null, Math.random() * -200],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ 
              duration: Math.random() * 10 + 10, 
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute w-1 h-1 bg-coffee dark:bg-creme rounded-full"
          />
        ))}
      </div>

      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-center z-10 max-w-4xl pt-20 md:pt-32 pb-20"
      >
        <motion.div 
          whileHover={{ rotate: [0, -5, 5, 0] }}
          className="inline-block p-5 bg-coffee dark:bg-sakura rounded-[2rem] shadow-2xl mb-8 relative"
        >
          <Coffee className="w-12 h-12 text-creme dark:text-ink" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-sakura dark:bg-creme rounded-full animate-ping opacity-40" />
        </motion.div>
        
        <h1 className="text-7xl md:text-9xl font-serif text-coffee dark:text-creme mb-6 tracking-tighter leading-none">
          KŌHĪRA <span className="text-3xl md:text-4xl block md:inline font-jp opacity-60 align-middle ml-2">コヒーラ</span>
        </h1>
        
        <p className="text-xl md:text-3xl text-ink/70 dark:text-creme/70 font-sans mb-12 max-w-2xl mx-auto leading-relaxed">
          {t('home.tagline')}
        </p>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleLogin('/create')}
          aria-label="Criar nova obra"
          className="px-12 py-5 bg-coffee dark:bg-sakura text-creme dark:text-ink rounded-full font-medium text-lg shadow-[0_20px_40px_rgba(92,64,51,0.3)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] hover:bg-ink dark:hover:bg-creme transition-all flex items-center gap-3 mx-auto"
        >
          <PenTool className="w-6 h-6" />
          {t('home.create_work')}
        </motion.button>
      </motion.section>

      {/* Interactive Cards Grid */}
      <section className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 z-10">
        {cards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            whileHover={{ y: -10 }}
            onClick={() => handleLogin(card.target)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin(card.target)}
            aria-label={`${card.title}: ${card.desc}`}
            className="group cursor-pointer bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-coffee/5 dark:border-white/5 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:bg-white dark:hover:bg-white/10 transition-all relative overflow-hidden"
          >
            <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
              <card.icon className="w-7 h-7 text-creme" />
            </div>
            <h3 className="text-2xl font-serif text-coffee dark:text-creme mb-2">{card.title}</h3>
            <p className="text-sm text-ink/50 dark:text-creme/50 leading-relaxed">{card.desc}</p>
            
            {/* Hover Glow */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-sakura/5 rounded-full blur-3xl group-hover:bg-sakura/20 transition-all" />
          </motion.div>
        ))}
      </section>

      {/* Footer Details */}
      <footer className="w-full max-w-6xl border-t border-coffee/10 dark:border-white/10 pt-12 pb-20 flex flex-col md:flex-row justify-between items-center gap-8 opacity-60 dark:opacity-80">
        <div className="flex gap-12 text-coffee dark:text-creme">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold mb-2">Aesthetic</span>
            <span className="text-xs">Lo-Fi Japanese</span>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold mb-2">Engine</span>
            <span className="text-xs">Gemini Orchestrator</span>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold mb-2">Experience</span>
            <span className="text-xs">Immersive Writing</span>
          </div>
        </div>
        <div className="text-center md:text-right text-coffee dark:text-creme">
          <p className="text-xs italic">“Nostalgia, silêncio e o aroma de café.”</p>
        </div>
      </footer>
    </div>
  );
}
