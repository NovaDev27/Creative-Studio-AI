import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Book, Trash2, LogOut, Search, Filter, Clock, ChevronRight, Coffee, Sparkles } from 'lucide-react';
import { db, logout } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { useStore } from '../store/useStore';
import { useTranslation } from '../contexts/TranslationContext';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import Tutorial from '../components/Tutorial';
import LanguageSelector from '../components/LanguageSelector';

export default function Library() {
  const [works, setWorks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [workToDelete, setWorkToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { user, isLoading, credits, isLifetime, isDarkMode } = useStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const worksRef = collection(db, 'works');
    const q = query(
      worksRef,
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const worksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWorks(worksData);
    }, (error) => {
      console.error("Fetch error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async () => {
    if (!workToDelete) return;
    setIsDeleting(true);
    try {
      setDeleteError(null);
      // 1. Delete associated chapters
      const chaptersRef = collection(db, 'works', workToDelete, 'chapters');
      const chaptersSnap = await getDocs(chaptersRef);
      
      // 1.5. Delete associated characters
      const charactersRef = collection(db, 'works', workToDelete, 'characters');
      const charactersSnap = await getDocs(charactersRef);
      
      const batch = writeBatch(db);
      chaptersSnap.forEach((chapterDoc) => {
        batch.delete(chapterDoc.ref);
      });
      
      charactersSnap.forEach((charDoc) => {
        batch.delete(charDoc.ref);
      });
      
      // 2. Delete the work itself
      batch.delete(doc(db, 'works', workToDelete));
      
      await batch.commit();
      setWorkToDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
      setDeleteError("Erro ao excluir a obra. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWorkToDelete(id);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const filteredWorks = works.filter(w => 
    w.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const WRITING_PROMPTS = [
    "Um aroma de café que desperta memórias de uma vida que você nunca viveu.",
    "Uma carta encontrada dentro de um livro antigo em uma biblioteca esquecida.",
    "O som da chuva batendo no vidro enquanto uma decisão impossível precisa ser tomada.",
    "Um encontro inesperado em uma estação de trem vazia à meia-noite.",
    "Uma lanterna solitária brilhando em uma floresta onde ninguém deveria estar.",
    "O reflexo no espelho que começa a agir de forma independente.",
    "Uma melodia de piano que só você consegue ouvir vindo do apartamento vizinho.",
    "Um relógio que parou exatamente no momento em que tudo mudou."
  ];

  const [dailyPrompt] = useState(() => WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)]);

  const getCoverStyle = (aesthetic: string) => {
    if (aesthetic?.includes('Noite')) return 'bg-ink text-creme border-white/10';
    if (aesthetic?.includes('Sakura')) return 'bg-[#FFF0F3] text-[#4A1D1F] border-sakura/20';
    if (aesthetic?.includes('Sépia')) return 'bg-[#F4ECD8] text-[#5C4033] border-caramel/20';
    if (aesthetic?.includes('Mossa')) return 'bg-mossa text-creme border-white/10';
    if (aesthetic?.includes('Sora')) return 'bg-sora text-ink border-umi/20';
    return 'bg-white dark:bg-white/5 text-ink dark:text-creme border-coffee/10 dark:border-white/10';
  };

  return (
    <div className="min-h-screen bg-creme dark:bg-ink p-6 md:p-12 selection:bg-sakura/30 transition-colors duration-500">
      <LoadingScreen isLoading={isLoading} />
      <Tutorial />
      
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
          <div className="flex items-center gap-6">
            <motion.div 
              whileHover={{ rotate: 360 }}
              transition={{ duration: 1 }}
              className="p-4 bg-mossa dark:bg-matcha rounded-[2rem] shadow-xl"
            >
              <Coffee className="w-8 h-8 text-creme dark:text-ink" />
            </motion.div>
            <div>
              <h1 className="text-4xl md:text-5xl font-serif text-coffee dark:text-creme tracking-tight">{t('library.title')}</h1>
              <p className="text-sm text-ink/60 dark:text-creme/60 font-sans tracking-widest uppercase mt-1">{t('library.refuge')} {user?.displayName || user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSelector />
            <div className="flex flex-col items-end mr-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-coffee/60 dark:text-creme/60">{t('library.credits')}</span>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-sakura" />
                <span className="text-sm font-serif text-coffee dark:text-creme">
                  {isLifetime ? t('editor.lifetime') : `${credits} ${t('library.remaining')}`}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/upgrade')}
              aria-label="Fazer upgrade para vitalício"
              className="flex items-center gap-2 px-6 py-4 bg-momiji text-creme rounded-full font-bold uppercase tracking-widest text-xs hover:bg-yuzu hover:text-ink transition-all shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              {t('library.upgrade')}
            </button>
            <button
              onClick={() => navigate('/create')}
              aria-label="Criar nova obra"
              className="flex items-center gap-2 px-6 py-4 bg-mossa dark:bg-matcha text-creme dark:text-ink rounded-full font-bold uppercase tracking-widest text-xs hover:bg-umi dark:hover:bg-sora transition-all shadow-xl"
            >
              <Plus className="w-4 h-4" />
              {t('library.new_work')}
            </button>
            <button
              onClick={handleLogout}
              aria-label="Sair da conta"
              className="p-4 bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 rounded-full text-ink/60 dark:text-creme/60 hover:text-red-500 transition-all border border-coffee/5 dark:border-white/5"
              title={t('library.logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Daily Inspiration Prompt */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 p-8 rounded-[2.5rem] bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-coffee/5 dark:border-white/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles className="w-24 h-24 text-sakura" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-sora" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-coffee/60 dark:text-creme/60">Inspiração do Dia</span>
            </div>
            <p className="text-xl md:text-2xl font-serif text-coffee/80 dark:text-creme/80 italic leading-relaxed">
              "{dailyPrompt}"
            </p>
            <button 
              onClick={() => navigate('/create')}
              className="mt-6 text-[10px] uppercase tracking-widest font-bold text-sora hover:text-mossa dark:hover:text-matcha transition-colors flex items-center gap-2"
            >
              Começar uma nova história <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40 dark:text-creme/40" />
            <input
              type="text"
              placeholder={t('library.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar manuscritos"
              className="w-full pl-12 pr-6 py-4 bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-coffee/5 dark:border-white/5 rounded-2xl focus:border-coffee dark:focus:border-sakura outline-none transition-all text-ink dark:text-creme"
            />
          </div>
          <div className="flex gap-2">
            <button 
              aria-label="Filtrar obras"
              className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-coffee/5 dark:border-white/5 text-ink/60 dark:text-creme/60 hover:text-coffee dark:hover:text-sakura transition-all"
            >
              <Filter className="w-5 h-5" />
            </button>
            <button 
              aria-label="Ordenar por data"
              className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-coffee/5 dark:border-white/5 text-ink/60 dark:text-creme/60 hover:text-coffee dark:hover:text-sakura transition-all"
            >
              <Clock className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Works Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {/* New Work Card */}
            {!searchTerm && (
              <motion.div
                key="new-work-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => navigate('/create')}
                className="group cursor-pointer"
              >
                <div className="aspect-[3/4] rounded-[2.5rem] border-2 border-dashed border-coffee/20 dark:border-white/10 flex flex-col items-center justify-center gap-4 hover:border-sora hover:bg-sora/5 transition-all group-hover:-translate-y-2">
                  <div className="w-16 h-16 rounded-full bg-coffee/5 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8 text-coffee/40 dark:text-creme/40 group-hover:text-sora" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-coffee/60 dark:text-creme/60 group-hover:text-sora">
                    {t('library.new_work')}
                  </span>
                </div>
              </motion.div>
            )}

            {filteredWorks.map((work, i) => (
              <motion.div
                key={work.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/editor/${work.id}`)}
                className="group cursor-pointer perspective-1000"
              >
                <div className={`aspect-[3/4] rounded-[2rem] border-2 ${getCoverStyle(work.aesthetic)} p-8 flex flex-col justify-between shadow-sm group-hover:shadow-2xl group-hover:-rotate-y-6 transition-all relative overflow-hidden`}>
                  {/* Spine Effect */}
                  <div className="absolute left-0 top-0 bottom-0 w-4 bg-black/5 dark:bg-white/5 border-r border-black/5 dark:border-white/5" />
                  
                  {/* Cover Decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.03] rounded-bl-full" />
                  
                  <div className="pl-4">
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60">{work.type}</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-serif leading-tight mb-4 group-hover:text-sakura transition-colors line-clamp-2">{work.title}</h3>
                    <p className="text-xs opacity-60 line-clamp-3 leading-relaxed font-sans">{work.synopsis || t('library.no_synopsis')}</p>
                    
                    {/* Cover Preview Placeholder */}
                    <div className="mt-6 h-28 w-full bg-current/5 rounded-2xl flex items-center justify-center overflow-hidden relative group-hover:bg-current/10 transition-colors border border-current/5">
                      <Sparkles className="w-6 h-6 opacity-10 animate-pulse" />
                      <div className="absolute inset-0 bg-gradient-to-t from-current/10 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 text-[8px] uppercase tracking-widest opacity-60 font-bold text-center">
                        KŌHĪRA ORIGINAL
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-end pl-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {work.genres?.slice(0, 2).map((g: string, idx: number) => (
                          <span key={`${work.id}-genre-${idx}`} className="text-[8px] uppercase tracking-widest px-2 py-0.5 bg-current/5 rounded-full border border-current/5">{g}</span>
                        ))}
                      </div>
                      <p className="text-[9px] opacity-60 tracking-wider">
                        {t('library.updated')} {work.updatedAt?.toDate ? work.updatedAt.toDate().toLocaleDateString() : new Date(work.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => confirmDelete(work.id, e)}
                        className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 backdrop-blur-md shadow-lg border border-red-500/20"
                        title="Excluir obra"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all text-sakura" />
                    </div>
                  </div>

                  {/* Texture Overlay */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                </div>
              </motion.div>
            ))}

            {/* Empty State */}
            {filteredWorks.length === 0 && !isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-32 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-snow rounded-full flex items-center justify-center mb-6">
                  <Book className="w-10 h-10 text-coffee/20" />
                </div>
                <h3 className="text-2xl font-serif text-coffee mb-2">{t('library.empty_title')}</h3>
                <p className="text-ink/60 max-w-xs mx-auto mb-8">{t('library.empty_desc')}</p>
                <button
                  onClick={() => navigate('/create')}
                  className="px-10 py-4 bg-coffee text-creme rounded-full font-bold uppercase tracking-widest text-xs hover:bg-ink transition-all shadow-xl"
                >
                  {t('library.create_first')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed bottom-10 left-10 opacity-5 pointer-events-none">
        <h2 className="text-[15vw] font-serif leading-none">LIBRARY</h2>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {workToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setWorkToDelete(null)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-creme dark:bg-ink rounded-[2.5rem] shadow-2xl p-8 border border-coffee/10 dark:border-white/10 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-serif text-coffee dark:text-creme mb-4">Excluir Obra?</h2>
              <p className="text-sm opacity-60 leading-relaxed mb-8">
                Tem certeza que deseja excluir esta obra permanentemente? Todos os capítulos e dados associados serão removidos.
              </p>
              {deleteError && (
                <p className="text-xs text-red-500 mb-4 font-bold">{deleteError}</p>
              )}
              <div className="flex gap-3">
                <button 
                  onClick={() => setWorkToDelete(null)}
                  className="flex-1 py-4 rounded-2xl text-[10px] uppercase tracking-widest font-bold opacity-60 hover:opacity-100 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-[10px] uppercase tracking-widest font-bold hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Sparkles className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
