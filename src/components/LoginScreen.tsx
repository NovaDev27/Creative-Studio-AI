import React, { useState } from 'react';
import { signInWithGoogle, signInWithEmail } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      navigate('/library');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao entrar com email');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate('/library');
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('auth/unauthorized-domain') || err.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        setError(`Domínio não autorizado (${currentDomain}). Por favor, adicione este domínio aos "Domínios autorizados" nas configurações de Autenticação do Console do Firebase.`);
      } else {
        setError(err.message || 'Erro ao entrar com Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-creme dark:bg-ink font-sans relative overflow-hidden transition-colors duration-500">
      {/* Background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-sakura/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-caramel/10 rounded-full blur-3xl animate-pulse" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-white dark:bg-white/5 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-snow dark:border-white/5 relative z-10 mx-4"
      >
        <div className="flex justify-center mb-8">
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="p-4 bg-mossa dark:bg-matcha rounded-2xl shadow-lg"
          >
            <Coffee className="w-8 h-8 text-creme dark:text-ink" />
          </motion.div>
        </div>

        <h2 className="text-3xl md:text-4xl font-serif text-coffee dark:text-creme text-center mb-2 tracking-tight">
          {t('login.welcome')}
        </h2>
        <p className="text-center text-ink/60 dark:text-creme/60 text-sm mb-8 font-sans">
          {t('login.subtitle')}
        </p>

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-coffee/70 dark:text-creme/70 ml-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-5 py-3 bg-creme/50 dark:bg-white/5 border border-snow dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-caramel/30 focus:border-caramel transition-all text-ink dark:text-creme placeholder:text-ink/30"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-coffee/70 dark:text-creme/70 ml-1">
              Senha
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-5 py-3 bg-creme/50 dark:bg-white/5 border border-snow dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-caramel/30 focus:border-caramel transition-all text-ink dark:text-creme placeholder:text-ink/30"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs border border-red-100 dark:border-red-900/50"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-4 px-6 bg-mossa dark:bg-matcha text-creme dark:text-ink rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-umi dark:hover:bg-creme transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {t('login.welcome')}
          </motion.button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-snow dark:border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-white dark:bg-ink px-4 text-ink/30 dark:text-creme/30 font-bold">Ou continue com</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex justify-center items-center py-4 px-6 bg-white dark:bg-white/10 border border-snow dark:border-white/10 text-ink dark:text-creme rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-creme dark:hover:bg-white/20 transition-all shadow-sm disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </motion.button>
        </form>

        <div className="mt-10 pt-8 border-t border-snow dark:border-white/10 text-center">
          <p className="text-sm text-ink/60 dark:text-creme/60">
            Ainda não tem um refúgio?{' '}
            <Link to="/signup" className="font-bold text-mossa dark:text-matcha hover:text-umi dark:hover:text-creme transition-colors">
              Crie sua conta
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Decorative leaf */}
      <div className="absolute top-1/4 left-10 opacity-20 pointer-events-none">
        <Sparkles className="w-12 h-12 text-sakura animate-bounce" style={{ animationDuration: '3s' }} />
      </div>
    </div>
  );
};

export default LoginScreen;
