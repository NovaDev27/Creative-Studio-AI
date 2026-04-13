import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { ChevronLeft, Sparkles, Coffee, CreditCard, CheckCircle2, Copy, Check, ExternalLink, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useTranslation } from '../contexts/TranslationContext';

const Upgrade: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useStore();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const paymentLink = "https://mpago.la/1j116Bi";

  const handlePayment = () => {
    window.open(paymentLink, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-creme dark:bg-ink font-sans text-ink dark:text-creme p-6 md:p-12 flex flex-col items-center transition-colors duration-500 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
              opacity: 0.05
            }}
            animate={{ 
              y: [null, Math.random() * -300],
              opacity: [0.05, 0.15, 0.05],
              rotate: [0, 360]
            }}
            transition={{ 
              duration: Math.random() * 20 + 20, 
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute w-2 h-2 bg-sakura dark:bg-creme rounded-full blur-[1px]"
          />
        ))}
      </div>

      {/* Decorative Japanese Text */}
      <div className="absolute top-20 right-[-5%] text-[15vh] font-jp opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none vertical-text tracking-[0.5em]">
        アップグレード
      </div>
      <div className="absolute bottom-20 left-[-5%] text-[15vh] font-jp opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none vertical-text tracking-[0.5em]">
        プレミアム
      </div>

      <div className="w-full max-w-5xl z-10">
        <motion.button 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          aria-label="Voltar para a página anterior"
          className="group flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-bold opacity-60 hover:opacity-100 transition-all mb-16"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t('common.back')}
        </motion.button>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-10"
          >
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-5 py-2 bg-mossa/10 dark:bg-matcha/20 text-mossa dark:text-matcha rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-mossa/20 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t('upgrade.special_offer')}
              </motion.div>
              
              <h1 className="text-6xl md:text-7xl font-serif text-coffee dark:text-creme tracking-tight leading-[1.1]">
                {t('upgrade.title')} <span className="text-mossa dark:text-matcha block md:inline">∞</span>
              </h1>
              
              <p className="text-lg text-ink/60 dark:text-creme/60 leading-relaxed max-w-lg">
                {t('upgrade.description')}
              </p>
            </div>

            <div className="grid gap-4">
              {[
                { text: t('upgrade.benefits.unlimited_credits'), icon: Zap },
                { text: t('upgrade.benefits.all_themes'), icon: Sparkles },
                { text: t('upgrade.benefits.export_formats'), icon: Coffee },
                { text: t('upgrade.benefits.priority_support'), icon: CheckCircle2 },
                { text: t('upgrade.benefits.no_subscriptions'), icon: Coffee }
              ].map((benefit, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-white/30 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-coffee/5 dark:border-white/5 group hover:bg-white/50 dark:hover:bg-white/10 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-creme dark:bg-white/10 flex items-center justify-center text-sakura group-hover:scale-110 transition-transform">
                    <benefit.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-ink/80 dark:text-creme/80 tracking-wide">{benefit.text}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePayment}
                className="flex-1 px-10 py-5 bg-mossa dark:bg-matcha text-creme dark:text-ink rounded-2xl font-bold uppercase tracking-widest text-xs shadow-[0_20px_40px_rgba(74,103,65,0.2)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:bg-umi dark:hover:bg-creme transition-all flex items-center justify-center gap-3"
              >
                <CreditCard className="w-5 h-5" />
                {t('upgrade.pay_button')}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={copyLink}
                className="px-8 py-5 bg-white/50 dark:bg-white/10 backdrop-blur-sm text-ink/60 dark:text-creme/60 rounded-2xl font-bold uppercase tracking-widest text-xs border border-coffee/10 dark:border-white/10 hover:bg-white dark:hover:bg-white/20 transition-all flex items-center justify-center gap-3"
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                {copied ? t('common.copied') : t('common.copy_link')}
              </motion.button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            {/* Decorative Card Background */}
            <div className="absolute -inset-4 bg-gradient-to-br from-sakura/20 via-transparent to-coffee/10 dark:from-sakura/10 dark:to-transparent rounded-[4rem] blur-2xl -z-10" />
            
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl p-12 rounded-[3.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.1)] border border-white/20 dark:border-white/10 flex flex-col items-center gap-10 relative overflow-hidden">
              {/* Card Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-sakura/5 rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-coffee/5 rounded-tr-full" />

              <div className="p-8 bg-white rounded-[2.5rem] shadow-inner border border-coffee/5">
                <QRCodeSVG 
                  value={paymentLink} 
                  size={240}
                  level="H"
                  includeMargin={true}
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                />
              </div>
              
              <div className="text-center space-y-4">
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-coffee/40 dark:text-creme/40">
                    {t('upgrade.scan_to_pay')}
                  </p>
                  <div className="w-12 h-0.5 bg-sakura/30 rounded-full" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-ink/60 dark:text-creme/60 max-w-[240px] leading-relaxed font-medium">
                    {t('upgrade.qr_instructions')}
                  </p>
                  <p className="text-[10px] text-ink/40 dark:text-creme/40 italic">
                    Compatível com todos os bancos via Pix
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 w-full">
                <div className="flex items-center gap-3 p-5 bg-creme dark:bg-white/5 rounded-3xl w-full justify-center border border-coffee/5 dark:border-white/5">
                  <Coffee className="w-5 h-5 text-sakura" />
                  <span className="text-xs font-serif italic text-coffee/60 dark:text-creme/60 tracking-wide">KŌHĪRA Premium Experience</span>
                </div>
                
                <button 
                  onClick={handlePayment}
                  className="text-[10px] uppercase tracking-widest font-bold text-sakura hover:text-coffee dark:hover:text-creme transition-colors flex items-center gap-2"
                >
                  Abrir link de pagamento <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Background Decoration Blurs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-20 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-sakura/10 dark:bg-sakura/5 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-coffee/5 dark:bg-coffee/10 rounded-full blur-[150px]" 
        />
      </div>

      <style>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: upright;
        }
      `}</style>
    </div>
  );
};

export default Upgrade;
