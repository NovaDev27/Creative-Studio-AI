import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  ChevronLeft, 
  Settings, 
  Maximize2, 
  Minimize2, 
  Coffee, 
  Library as LibraryIcon, 
  CloudRain, 
  Wind, 
  Sparkles, 
  Save, 
  Menu,
  X,
  Plus,
  Trash2,
  Edit3,
  Type as TypeIcon,
  Palette,
  Volume2,
  VolumeX,
  BookOpen,
  Loader2,
  GripVertical,
  Check,
  Sun,
  Moon,
  MessageSquare,
  FileText,
  Cloud,
  Type,
  Copy,
  ExternalLink,
  AlertCircle,
  RotateCcw,
  Wand2
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { useStore } from '../store/useStore';
import { useTranslation } from '../contexts/TranslationContext';
import { assistantActions, generateDetailedCharacters, generateDetailedWorld, generateCoverPrompt, generateCoverImage } from '../services/ai';
import { Howl } from 'howler';
import LoadingScreen from '../components/LoadingScreen';
import { canGenerateWork, consumeCreditsForWork, canPerformAction, consumeCreditsForAction } from '../lib/credits';
import LanguageSelector from '../components/LanguageSelector';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, AlignmentType } from 'docx';

const AMBIENT_SOUNDS: Record<string, string> = {
  coffee: 'https://assets.mixkit.co/sfx/preview/mixkit-coffee-shop-ambience-with-people-talking-and-cups-clinking-2970.mp3',
  library: 'https://assets.mixkit.co/sfx/preview/mixkit-library-ambience-with-pages-turning-and-whispering-2971.mp3',
  rain: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3',
  urban: 'https://assets.mixkit.co/sfx/preview/mixkit-city-park-ambience-with-birds-and-distant-traffic-2972.mp3'
};

const FONTS = [
  { id: 'font-sans', name: 'Poppins (Moderno)' },
  { id: 'font-serif', name: 'Playfair Display (Clássico)' },
  { id: 'font-jp', name: 'Noto Serif JP (Elegante)' },
];

const AESTHETICS = [
  'Creme (Clássico)',
  'Noite (Escuro)',
  'Sakura (Rosa)',
  'Sépia (Antigo)',
  'Mossa (Verde Musgo)',
  'Sora (Azul Céu)'
];

const AI_MESSAGES: Record<string, string> = {
  expand: 'Expandindo trecho...',
  rewrite: 'Reescrevendo trecho...',
  dialogue: 'Gerando diálogos...',
  emotion: 'Ajustando emoção...',
  rewriteChapter: 'Reescrevendo capítulo inteiro...',
  synopsis: 'Gerando sinopse detalhada...',
  character: 'Gerando perfil de personagem...',
  world: 'Tecendo ambientação...',
};

const TUTORIAL_STEPS = [
  {
    title: 'Bem-vindo ao KŌHĪRA (コヒーラ)',
    content: 'Este é o seu santuário de escrita lo-fi. Um refúgio onde o café e as palavras se misturam para criar mundos eternos.',
    target: 'sidebar'
  },
  {
    title: 'O Oráculo de Ideias',
    content: 'Sua inteligência criativa. Selecione qualquer trecho para expandir horizontes, polir diálogos ou infundir emoções profundas.',
    target: 'editor'
  },
  {
    title: 'Cosmogonia e Almas',
    content: 'Gerencie a lore do seu mundo e a essência dos seus personagens nestas abas. O Oráculo pode ajudar a tecer detalhes que você nem imaginou.',
    target: 'tabs'
  },
  {
    title: 'Modo Zen & Foco',
    content: 'Precisa de silêncio absoluto? Use o Modo Zen (canto inferior) ou o Modo Foco (topo) para remover todas as distrações e ouvir apenas seus pensamentos.',
    target: 'zen-toggle'
  },
  {
    title: 'Manifestação Final',
    content: 'Quando sua jornada estiver pronta, use o botão "Finalizar Obra" para que o Oráculo realize a alquimia final no seu manuscrito.',
    target: 'finalize-button'
  }
];

export default function Editor() {
  const { workId } = useParams();
  const navigate = useNavigate();
  const { 
    user, 
    isAuthReady,
    ambientMode, 
    setAmbientMode, 
    isFocusMode, 
    setFocusMode, 
    isZenMode,
    setZenMode,
    credits, 
    isLifetime, 
    isDarkMode, 
    toggleDarkMode,
    wordCountGoal,
    setWordCountGoal,
    dailyGoal,
    setDailyGoal,
    dailyWordCount,
    setDailyWordCount,
    lastWordCountDate,
    setLastWordCountDate
  } = useStore();
  const { isTypewriterSound, setTypewriterSound } = useStore();
  const { t } = useTranslation();
  
  const [work, setWork] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [activeChapter, setActiveChapter] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chapters' | 'characters' | 'world'>('chapters');
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState('');
  const [isEditingCharacter, setIsEditingCharacter] = useState<number | null>(null);
  const [newCharacter, setNewCharacter] = useState({ name: '', description: '' });
  const [isAddingCharacter, setIsAddingCharacter] = useState(false);
  const [isEditingWorld, setIsEditingWorld] = useState(false);
  const [isEditingLore, setIsEditingLore] = useState(false);
  const [isCoverPreviewOpen, setIsCoverPreviewOpen] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [coverPrompt, setCoverPrompt] = useState('');
  const [userCoverDescription, setUserCoverDescription] = useState('');
  const [pendingAiResult, setPendingAiResult] = useState<{ text: string, actionId: string, originalText: string } | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isCharConfirmOpen, setIsCharConfirmOpen] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [worldContent, setWorldContent] = useState('');
  const [charGenCount, setCharGenCount] = useState(5);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastAiAction, setLastAiAction] = useState<{ type: string, id?: string, customText?: string, count?: number } | null>(null);
  const [pendingAiAction, setPendingAiAction] = useState<{ id: string, label: string, desc: string, data?: any } | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [previousState, setPreviousState] = useState<{
    type: 'content' | 'world' | 'synopsis' | 'cover' | 'characters';
    data: any;
    chapterId?: string;
  } | null>(null);
  const [tutorialTargetRect, setTutorialTargetRect] = useState<DOMRect | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const lastSessionWordCount = useRef(0);
  const [theme, setTheme] = useState({
    bg: 'bg-creme',
    text: 'text-ink',
    paper: 'bg-white',
    accent: 'text-coffee',
    border: 'border-coffee/10',
    sidebar: 'bg-white/80',
    font: 'font-sans'
  });
  
  const soundRef = useRef<Howl | null>(null);
  const typewriterRef = useRef<Howl | null>(null);

  useEffect(() => {
    typewriterRef.current = new Howl({
      src: ['https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'],
      volume: 0.2,
    });
  }, []);

  const playTypewriter = () => {
    if (isTypewriterSound && typewriterRef.current) {
      typewriterRef.current.play();
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: t('editor.rich_text_active'),
      }),
      CharacterCount,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      playTypewriter();
      
      // Daily word count tracking
      const currentWords = editor.storage.characterCount.words();
      const today = new Date().toDateString();
      const state = useStore.getState();
      
      if (today !== state.lastWordCountDate) {
        state.setLastWordCountDate(today);
        state.setDailyWordCount(0);
        lastSessionWordCount.current = currentWords;
      } else {
        const delta = currentWords - lastSessionWordCount.current;
        if (delta > 0) {
          state.setDailyWordCount(state.dailyWordCount + delta);
        }
        lastSessionWordCount.current = currentWords;
      }
    }
  });

  const worldEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: t('editor.world_placeholder'),
      }),
      CharacterCount,
    ],
    content: '',
  });

  const loreEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Descreva a mitologia, leis e história do seu mundo...",
      }),
      CharacterCount,
    ],
    content: '',
  });

  const charEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: t('editor.char_placeholder'),
      }),
      CharacterCount,
    ],
    content: '',
  });

  const applyTheme = (aesthetic: string, font: string = 'font-sans') => {
    let themeObj = {
      bg: 'bg-creme',
      text: 'text-ink',
      paper: 'bg-white',
      accent: 'text-coffee',
      border: 'border-coffee/10',
      sidebar: 'bg-white/80',
      font: font || 'font-sans'
    };

    if (aesthetic.includes('Noite')) {
      themeObj = { ...themeObj, bg: 'bg-ink', text: 'text-creme', paper: 'bg-white/5', accent: 'text-sakura', border: 'border-white/10', sidebar: 'bg-black/40' };
    } else if (aesthetic.includes('Sakura')) {
      themeObj = { ...themeObj, bg: 'bg-[#FFF0F3]', text: 'text-[#4A1D1F]', paper: 'bg-white', accent: 'text-[#F2A7B5]', border: 'border-[#F2A7B5]/20', sidebar: 'bg-white/80' };
    } else if (aesthetic.includes('Sépia')) {
      themeObj = { ...themeObj, bg: 'bg-[#F4ECD8]', text: 'text-[#5C4033]', paper: 'bg-[#FCF5E5]', accent: 'text-[#C49A6C]', border: 'border-[#C49A6C]/20', sidebar: 'bg-[#F4ECD8]/80' };
    } else if (aesthetic.includes('Mossa')) {
      themeObj = { ...themeObj, bg: 'bg-mossa', text: 'text-creme', paper: 'bg-white/10', accent: 'text-matcha', border: 'border-white/10', sidebar: 'bg-black/20' };
    } else if (aesthetic.includes('Sora')) {
      themeObj = { ...themeObj, bg: 'bg-sora', text: 'text-ink', paper: 'bg-white/90', accent: 'text-umi', border: 'border-umi/20', sidebar: 'bg-white/60' };
    }
    
    setTheme(themeObj);
  };

  // Load Work and Chapters
  useEffect(() => {
    if (!workId) return;

    const workRef = doc(db, 'works', workId);
    const unsubscribeWork = onSnapshot(workRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWork({ id: docSnap.id, ...data });
        applyTheme(data.aesthetic || 'Creme (Clássico)', data.font);
        
        // Show tutorial for new works if not seen
        const hasSeenTutorial = localStorage.getItem(`tutorial_${workId}`);
        if (!hasSeenTutorial) {
          setIsTutorialOpen(true);
        }
      }
    }, (error) => {
      console.error("Work fetch error:", error);
    });

    const chaptersRef = collection(db, 'works', workId, 'chapters');
    const q = query(
      chaptersRef,
      orderBy('order', 'asc')
    );

    const unsubscribeChapters = onSnapshot(q, (snapshot) => {
      const chaptersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setChapters(chaptersData);
      if (!activeChapter && chaptersData.length > 0) {
        setActiveChapter(chaptersData[0]);
        editor?.commands.setContent(chaptersData[0].content);
        lastSessionWordCount.current = editor?.storage.characterCount.words() || 0;
      }
    }, (error) => {
      console.error("Chapters fetch error:", error);
    });

    const charactersRef = collection(db, 'works', workId, 'characters');
    const unsubscribeCharacters = onSnapshot(charactersRef, (snapshot) => {
      const charData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCharacters(charData);
    }, (error) => {
      console.error("Characters fetch error:", error);
    });

    return () => {
      unsubscribeWork();
      unsubscribeChapters();
      unsubscribeCharacters();
    };
  }, [workId, editor, activeChapter]);

  useEffect(() => {
    if (editor && activeChapter) {
      lastSessionWordCount.current = editor.storage.characterCount.words();
    }
  }, [activeChapter?.id, editor]);

  // Persist daily word count to Firestore
  useEffect(() => {
    if (!user || !isAuthReady) return;
    
    const saveDailyCount = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          dailyWordCount,
          lastWordCountDate,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error saving daily word count:", error);
      }
    };

    const timeoutId = setTimeout(saveDailyCount, 5000); // Debounce save
    return () => clearTimeout(timeoutId);
  }, [dailyWordCount, lastWordCountDate, user, isAuthReady]);

  // Tutorial spotlight tracking
  useEffect(() => {
    if (isTutorialOpen) {
      const targetId = `tutorial-${TUTORIAL_STEPS[tutorialStep].target}`;
      const element = document.getElementById(targetId);
      if (element) {
        setTutorialTargetRect(element.getBoundingClientRect());
      } else {
        setTutorialTargetRect(null);
      }
    } else {
      setTutorialTargetRect(null);
    }
  }, [isTutorialOpen, tutorialStep]);

  // Handle Ambient Sound
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.unload();
    }

    if (ambientMode !== 'none' && !isMuted) {
      soundRef.current = new Howl({
        src: [AMBIENT_SOUNDS[ambientMode]],
        loop: true,
        volume: 0.3,
        autoplay: true
      });
    }

    return () => {
      soundRef.current?.stop();
    };
  }, [ambientMode, isMuted]);

  const handleSave = async () => {
    if (!activeChapter || !editor || !workId) return;
    setIsSaving(true);
    try {
      const content = editor.getHTML();
      
      // Check if content is too large for a single document (approx 1MB limit, but we should be safer)
      // A safe limit for a chapter might be around 500KB to leave room for metadata
      if (content.length > 500000) {
        setAiError("O capítulo está muito grande. Considere dividi-lo em capítulos menores para garantir a integridade dos dados.");
        setIsSaving(false);
        return;
      }

      const chapterRef = doc(db, 'works', workId, 'chapters', activeChapter.id);
      
      // Update main chapter
      await updateDoc(chapterRef, {
        content,
        updatedAt: serverTimestamp(),
      });

      // Also save a draft for history/autosave consistency
      const draftsRef = collection(db, 'works', workId, 'chapters', activeChapter.id, 'drafts');
      await addDoc(draftsRef, {
        content,
        createdAt: serverTimestamp(),
        type: 'manual'
      });

      await updateDoc(doc(db, 'works', workId), {
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `works/${workId}/chapters/${activeChapter.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Autosave logic
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!editor || !activeChapter || !workId) return;

    const handleUpdate = () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      
      autosaveTimerRef.current = setTimeout(async () => {
        setIsAutosaving(true);
        try {
          const chapterRef = doc(db, 'works', workId, 'chapters', activeChapter.id);
          await updateDoc(chapterRef, {
            content: editor.getHTML(),
            updatedAt: serverTimestamp(),
          });
          console.log("Autosaved chapter:", activeChapter.id);
          setTimeout(() => setIsAutosaving(false), 1000);
        } catch (error) {
          console.error("Autosave error:", error);
          setIsAutosaving(false);
        }
      }, 3000); // 3 seconds debounce
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [editor, activeChapter, workId]);

  const handleAddChapter = async () => {
    if (!workId) return;
    try {
      const newChapterData = {
        title: `Capítulo ${chapters.length + 1}`,
        content: '<p></p>',
        order: chapters.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const chaptersRef = collection(db, 'works', workId, 'chapters');
      const docRef = await addDoc(chaptersRef, newChapterData);
      
      const addedChapter = { id: docRef.id, ...newChapterData };
      setActiveChapter(addedChapter);
      editor?.commands.setContent('<p></p>');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `works/${workId}/chapters`);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !workId) return;

    const items = Array.from(chapters);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({ ...item, order: index }));
    setChapters(updatedItems);

    try {
      const batch = writeBatch(db);
      updatedItems.forEach(item => {
        const ref = doc(db, 'works', workId, 'chapters', item.id);
        batch.update(ref, { order: item.order });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `works/${workId}/chapters/reorder`);
    }
  };

  const handleRenameChapter = async (id: string) => {
    if (!editingChapterTitle.trim() || !workId) return;
    try {
      await updateDoc(doc(db, 'works', workId, 'chapters', id), { title: editingChapterTitle });
      setEditingChapterId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `works/${workId}/chapters/${id}`);
    }
  };

  const handleUpdateWorkSettings = async (updates: any) => {
    if (!workId) return;
    try {
      await updateDoc(doc(db, 'works', workId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `works/${workId}`);
    }
  };

  const handleUpdateCharacter = async (charId: string, updates: any) => {
    if (!workId) return;
    try {
      await updateDoc(doc(db, 'works', workId, 'characters', charId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      setIsEditingCharacter(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `works/${workId}/characters/${charId}`);
    }
  };

  const handleSaveCharacter = async (index: number) => {
    if (!charEditor || !characters[index]) return;
    await handleUpdateCharacter(characters[index].id, { description: charEditor.getHTML() });
  };

  const handleGenerateCharacterProfile = async (index: number) => {
    if (!workId || !characters[index] || isAiLoading) return;
    
    const char = characters[index];
    setIsAiLoading('character');
    try {
      const context = {
        title: work.title,
        synopsis: work.synopsis || work.description
      };
      const profile = await assistantActions.characterProfile(char, context);
      
      // Update character with all fields from profile
      await handleUpdateCharacter(char.id, { 
        ...profile,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Character Profile Error:", error);
      setAiError("Erro ao gerar perfil. Tente novamente.");
    } finally {
      setIsAiLoading(null);
    }
  };

  const handleAddCharacter = async () => {
    if (!workId || !newCharacter.name.trim() || !charEditor) return;
    try {
      const charData = {
        ...newCharacter,
        description: charEditor.getHTML(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await addDoc(collection(db, 'works', workId, 'characters'), charData);
      setNewCharacter({ name: '', description: '' });
      charEditor.commands.setContent('');
      setIsAddingCharacter(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `works/${workId}/characters`);
    }
  };

  const handleDeleteCharacter = async (index: number) => {
    if (!workId || !characters[index]) return;
    // Using a state to confirm deletion instead of window.confirm
    setPendingAiAction({ 
      id: `delete-char-${characters[index].id}`, 
      label: 'Excluir Personagem', 
      desc: `Tem certeza que deseja excluir ${characters[index].name}?` 
    });
  };

  const confirmDeleteCharacter = async (charId: string) => {
    if (!workId) return;
    try {
      await deleteDoc(doc(db, 'works', workId, 'characters', charId));
      setPendingAiAction(null);
      setSuccessMessage("Personagem excluído com sucesso.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `works/${workId}/characters/${charId}`);
    }
  };

  const getAiErrorMessage = (error: any) => {
    const msg = (error?.message || '').toLowerCase();
    
    if (msg.includes('cota') || msg.includes('quota') || msg.includes('limite') || msg.includes('429')) {
      return "Cota do Gemini excedida. Isso geralmente significa que seu plano atingiu o limite ou o faturamento precisa ser verificado no Google Cloud Console.";
    }
    if (msg.includes('autenticação') || msg.includes('authentication') || msg.includes('chave')) {
      return "Erro de autenticação com o Gemini. Verifique se a chave API está correta.";
    }
    if (msg.includes('safety') || msg.includes('políticas') || msg.includes('segurança') || msg.includes('content_filter')) {
      return "O conteúdo foi bloqueado pelas políticas de segurança do Gemini. Tente reformular.";
    }
    if (msg.includes('conexão') || msg.includes('fetch') || msg.includes('failed')) {
      return "Falha na conexão com o servidor. Tente novamente em instantes.";
    }
    
    return error.message || "Ocorreu um erro inesperado na geração de IA.";
  };

  const handleAiAction = async (actionId: string, customText?: string) => {
    if (!editor || isAiLoading) return;

    const selection = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');
    const textToProcess = customText || selection || editor.getText();
    
    if (!textToProcess) {
      setAiError("Nenhum texto selecionado para processar.");
      return;
    }
    
    setIsAiLoading(actionId);
    setAiError(null);
    setSuccessMessage(null);
    setPreviousState({
      type: 'content',
      data: editor.getHTML(),
      chapterId: activeChapter?.id
    });
    setLastAiAction({ type: 'assistant', id: actionId, customText });
    try {
      const context = {
        title: work.title,
        synopsis: work.synopsis || work.description,
        theme: work.theme,
        recentContent: editor.getText().slice(-2000)
      };

      let result = '';
      if (actionId === 'emotion') {
        result = await assistantActions.emotion(textToProcess, 'Melancólico', context);
      } else if (actionId === 'rewriteChapter') {
        result = await assistantActions.rewriteChapter(editor.getHTML(), context);
      } else if (actionId === 'synopsis') {
        result = await assistantActions.synopsis(textToProcess, context);
      } else if (actionId === 'finalize-work') {
        // ... (finalize logic remains the same as it's a multi-step process)
        if (!canGenerateWork()) {
          setAiError("Créditos insuficientes para finalizar a obra.");
          return;
        }
        
        const success = await consumeCreditsForWork();
        if (!success) {
          setAiError("Erro ao processar créditos.");
          return;
        }

        const finalSynopsis = await assistantActions.synopsis(work.synopsis || work.description, context);
        const finalWorld = await assistantActions.worldLore(work.worldDescription || "", context);
        
        await handleUpdateWorkSettings({ 
          synopsis: finalSynopsis,
          worldLore: finalWorld.lore,
          updatedAt: serverTimestamp()
        });
        
        setSuccessMessage("Obra finalizada com sucesso! O Oráculo refinou sua sinopse e expandiu a cosmogonia do seu mundo.");
        return;
      } else {
        const action = (assistantActions as any)[actionId];
        if (typeof action === 'function') {
          result = await action(textToProcess, context);
        } else {
          throw new Error(`Ação de IA desconhecida: ${actionId}`);
        }
      }
      
      if (selection && !customText && !['synopsis', 'rewriteChapter'].includes(actionId)) {
        setPendingAiResult({ text: result, actionId, originalText: selection });
      } else if (customText && actionId !== 'synopsis') {
        setPendingAiResult({ text: result, actionId, originalText: customText });
      } else if (actionId === 'rewriteChapter') {
        setPendingAiResult({ text: result, actionId, originalText: editor.getHTML() });
      } else if (!selection && !customText) {
        setPendingAiResult({ text: result, actionId, originalText: editor.getHTML() });
      }

      setSuccessMessage("Ação concluída com sucesso!");
      setShowUndo(true);
      setTimeout(() => {
        setSuccessMessage(null);
        setShowUndo(false);
      }, 8000);
    } catch (error) {
      console.error("AI Action Error:", error);
      setAiError(getAiErrorMessage(error));
    } finally {
      setIsAiLoading(null);
    }
  };

  const applyAiResult = () => {
    if (!pendingAiResult || !editor) return;

    const { text, actionId } = pendingAiResult;

    if (actionId === 'rewriteChapter' || (!editor.state.selection.from && !editor.state.selection.to)) {
      editor.commands.setContent(text);
    } else {
      editor.chain().focus().insertContent(text).run();
    }

    setPendingAiResult(null);
    setSuccessMessage("Mudanças aplicadas com sucesso.");
    setShowUndo(true);
    setTimeout(() => {
      setSuccessMessage(null);
      setShowUndo(false);
    }, 8000);
  };

  const cancelAiResult = () => {
    setPendingAiResult(null);
  };

  const handleUndo = async () => {
    if (!previousState) return;

    try {
      switch (previousState.type) {
        case 'content':
          if (editor && previousState.chapterId === activeChapter?.id) {
            editor.commands.setContent(previousState.data);
          } else if (workId && previousState.chapterId) {
            // If we switched chapters, we need to update Firestore directly
            await updateDoc(doc(db, 'works', workId, 'chapters', previousState.chapterId), {
              content: previousState.data,
              updatedAt: serverTimestamp()
            });
          }
          break;
        case 'world':
          if (workId) {
            await updateDoc(doc(db, 'works', workId), {
              worldDescription: previousState.data.description,
              worldLore: previousState.data.lore,
              updatedAt: serverTimestamp()
            });
          }
          break;
        case 'synopsis':
          if (workId) {
            await updateDoc(doc(db, 'works', workId), {
              synopsis: previousState.data,
              updatedAt: serverTimestamp()
            });
          }
          break;
        case 'cover':
          if (workId) {
            await updateDoc(doc(db, 'works', workId), {
              coverUrl: previousState.data,
              updatedAt: serverTimestamp()
            });
          }
          break;
        case 'characters':
          if (workId && previousState.data && Array.isArray(previousState.data)) {
            const batch = writeBatch(db);
            previousState.data.forEach((id: string) => {
              batch.delete(doc(db, 'works', workId, 'characters', id));
            });
            await batch.commit();
          }
          break;
      }

      setPreviousState(null);
      setShowUndo(false);
      setSuccessMessage("Ação desfeita com sucesso.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Undo Error:", error);
      setAiError("Falha ao desfazer a ação.");
    }
  };

  const handleRetryLastAction = () => {
    if (!lastAiAction) return;
    
    switch (lastAiAction.type) {
      case 'assistant':
        if (lastAiAction.id) handleAiAction(lastAiAction.id, lastAiAction.customText);
        break;
      case 'cover':
        handleGenerateCover();
        break;
      case 'characters':
        if (lastAiAction.count) handleGenerateMultipleCharacters();
        break;
      case 'world':
        handleGenerateWorldPreview();
        break;
      case 'synopsis':
        handleGenerateDetailedSynopsis();
        break;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleGenerateCover = async () => {
    if (!workId || isGeneratingCover) return;
    setIsGeneratingCover(true);
    setAiError(null);
    setLastAiAction({ type: 'cover' });
    try {
      let result;
      if (userCoverDescription.trim()) {
        result = await generateCoverImage(userCoverDescription, {
          title: work.title,
          genres: work.genres,
          theme: work.theme,
          coverStyle: work.coverStyle
        });
      } else {
        result = await generateCoverPrompt({
          title: work.title,
          synopsis: work.synopsis || work.description,
          theme: work.theme,
          type: work.type,
          coverStyle: work.coverStyle
        });
      }
      setCoverPrompt(result);
      // We don't save to DB here, user must click "Apply" in the modal
    } catch (error) {
      console.error("Cover Generation Error:", error);
      setAiError(getAiErrorMessage(error));
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const applyCover = async () => {
    if (!workId || !coverPrompt) return;
    try {
      setPreviousState({
        type: 'cover',
        data: work.coverUrl || ''
      });
      await updateDoc(doc(db, 'works', workId), {
        coverUrl: coverPrompt,
        updatedAt: serverTimestamp()
      });
      setSuccessMessage("Capa aplicada com sucesso!");
      setShowUndo(true);
      setTimeout(() => setShowUndo(false), 8000);
    } catch (error) {
      console.error("Apply Cover Error:", error);
      setAiError("Falha ao aplicar a capa.");
    }
  };

  const handleGenerateMultipleCharacters = async () => {
    if (!workId || isAiLoading) return;
    
    setIsAiLoading('character');
    setAiError(null);
    setLastAiAction({ type: 'characters', count: charGenCount });
    try {
      setPreviousState({
        type: 'characters',
        data: [] // Will populate with IDs
      });
      
      const generated = await generateDetailedCharacters(charGenCount, {
        title: work.title,
        synopsis: work.synopsis || work.description
      });
      
      const batch = writeBatch(db);
      const newIds: string[] = [];
      
      generated.forEach((char: any) => {
        const charRef = doc(collection(db, 'works', workId, 'characters'));
        newIds.push(charRef.id);
        batch.set(charRef, {
          ...char,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      setPreviousState(prev => prev ? { ...prev, data: newIds } : null);

      setSuccessMessage(`${charGenCount} personagens gerados com sucesso!`);
      setShowUndo(true);
      setTimeout(() => {
        setSuccessMessage(null);
        setShowUndo(false);
      }, 8000);
    } catch (error) {
      console.error("Multiple Character Generation Error:", error);
      setAiError(getAiErrorMessage(error));
    } finally {
      setIsAiLoading(null);
      setIsCharConfirmOpen(false);
    }
  };

  const handleGenerateWorldPreview = async () => {
    if (!workId || isAiLoading) return;
    
    setIsAiLoading('world');
    setAiError(null);
    setLastAiAction({ type: 'world' });
    try {
      setPreviousState({
        type: 'world',
        data: {
          description: work.worldDescription || work.world || '',
          lore: work.worldLore || ''
        }
      });

      const result = await generateDetailedWorld({
        title: work.title,
        setting: work.setting,
        genres: work.genres,
        worldDescription: work.worldDescription || work.description
      });
      
      await handleUpdateWorkSettings({ 
        worldDescription: result.description,
        worldLore: result.lore 
      });
      
      setSuccessMessage("Ambientação gerada com sucesso!");
      setShowUndo(true);
      setTimeout(() => {
        setSuccessMessage(null);
        setShowUndo(false);
      }, 8000);
    } catch (error) {
      console.error("World Preview Generation Error:", error);
      setAiError(getAiErrorMessage(error));
    } finally {
      setIsAiLoading(null);
    }
  };
  const handleGenerateDetailedSynopsis = async () => {
    if (!workId || isAiLoading) return;
    
    setIsAiLoading('synopsis');
    setAiError(null);
    setLastAiAction({ type: 'synopsis' });
    try {
      // Gather context
      const chaptersContext = chapters.map(ch => `Capítulo: ${ch.title}\n${ch.content.replace(/<[^>]*>/g, '')}`).join('\n\n');
      const charactersContext = characters.map((char: any) => `Personagem: ${char.name}\n${char.description.replace(/<[^>]*>/g, '')}`).join('\n');
      const worldContext = `Mundo/Ambientação: ${work.world?.replace(/<[^>]*>/g, '') || 'Não definido'}`;

      const fullContext = `
        Título da Obra: ${work.title}
        Sinopse Atual: ${work.synopsis || 'Nenhuma'}
        
        Conteúdo dos Capítulos:
        ${chaptersContext.slice(0, 5000)} // Limit context size
        
        Personagens:
        ${charactersContext}
        
        ${worldContext}
      `;

      setPreviousState({
        type: 'synopsis',
        data: work.synopsis || ''
      });

      const result = await assistantActions.synopsis(fullContext, {
        title: work.title,
        synopsis: work.synopsis || work.description,
        theme: work.theme
      });

      await handleUpdateWorkSettings({ synopsis: result });
      setSuccessMessage("Sinopse detalhada gerada com sucesso!");
      setShowUndo(true);
      setTimeout(() => {
        setSuccessMessage(null);
        setShowUndo(false);
      }, 8000);
    } catch (error) {
      console.error("Detailed Synopsis Error:", error);
      setAiError(getAiErrorMessage(error));
    } finally {
      setIsAiLoading(null);
    }
  };

  const handleDownloadChapter = async (chapter: any) => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: chapter.title,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({ text: "" }),
          ...chapter.content.split('</p>').map((p: string) => {
            const text = p.replace(/<[^>]*>/g, '').trim();
            if (!text) return null;
            return new Paragraph({
              children: [new TextRun(text)],
              spacing: { after: 200 }
            });
          }).filter(Boolean) as Paragraph[]
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${work.title} - ${chapter.title}.docx`);
  };

  const handleDownloadFullWork = async () => {
    setIsAiLoading('download');
    try {
      const children: any[] = [
        new Paragraph({
          text: work.title,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: work.subtitle || "",
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),
      ];

      // Add cover if exists
      if (work.coverUrl) {
        try {
          const response = await fetch(work.coverUrl);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          
          children.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: arrayBuffer,
                  transformation: {
                    width: 400,
                    height: 600,
                  },
                } as any),
              ],
            }),
            new Paragraph({ text: "", pageBreakBefore: true })
          );
        } catch (e) {
          console.error("Error adding cover to docx:", e);
        }
      }

      children.push(
        new Paragraph({
          text: "Sinopse",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [new TextRun(work.synopsis || work.description || "")],
          spacing: { after: 400 }
        }),
        ...chapters.flatMap(ch => [
          new Paragraph({
            text: ch.title,
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: true,
          }),
          new Paragraph({ text: "" }),
          ...ch.content.split('</p>').map((p: string) => {
            const text = p.replace(/<[^>]*>/g, '').trim();
            if (!text) return null;
            return new Paragraph({
              children: [new TextRun(text)],
              spacing: { after: 200 }
            });
          }).filter(Boolean) as Paragraph[]
        ])
      );

      const doc = new Document({
        sections: [{
          properties: {},
          children
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${work.title} - Completo.docx`);
    } catch (error) {
      console.error("Download Error:", error);
      setAiError("Erro ao gerar o documento. Tente novamente.");
    } finally {
      setIsAiLoading(null);
    }
  };

  const handleDownloadTxt = () => {
    let fullText = `${work.title}\n${work.subtitle || ''}\n\nSINOPSE\n${work.synopsis || work.description}\n\n`;
    
    chapters.forEach((ch, i) => {
      // Simple HTML to text conversion
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = ch.content || '';
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      fullText += `CAPÍTULO ${i + 1}: ${ch.title}\n\n${textContent}\n\n`;
    });

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${work.title}.txt`);
  };

  const handleChapterSelect = (chapter: any) => {
    if (activeChapter) handleSave();
    setActiveChapter(chapter);
    editor?.commands.setContent(chapter.content);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
    
    // Smooth scroll to top of editor
    editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDeleteChapter = async (id: string) => {
    if (!workId) return;
    const chapter = chapters.find(c => c.id === id);
    setPendingAiAction({ 
      id: `delete-chapter-${id}`, 
      label: 'Excluir Capítulo', 
      desc: `Tem certeza que deseja excluir "${chapter?.title || 'este capítulo'}"?` 
    });
  };

  const confirmDeleteChapter = async (id: string) => {
    if (!workId) return;
    try {
      await deleteDoc(doc(db, 'works', workId, 'chapters', id));
      setPendingAiAction(null);

      if (activeChapter?.id === id) {
        setActiveChapter(null);
        editor?.commands.setContent('');
      }
      setSuccessMessage("Capítulo excluído com sucesso.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `works/${workId}/chapters/${id}`);
    }
  };

  const handleDeleteWork = async () => {
    if (!workId) return;
    
    try {
      setIsAiLoading('deleting');
      
      // 1. Delete associated chapters
      const chaptersRef = collection(db, 'works', workId, 'chapters');
      const chaptersSnap = await getDocs(chaptersRef);
      
      // 1.5. Delete associated characters
      const charactersRef = collection(db, 'works', workId, 'characters');
      const charactersSnap = await getDocs(charactersRef);
      
      const batch = writeBatch(db);
      chaptersSnap.forEach((chapterDoc) => {
        batch.delete(chapterDoc.ref);
      });
      
      charactersSnap.forEach((charDoc) => {
        batch.delete(charDoc.ref);
      });
      
      // 2. Delete the work itself
      batch.delete(doc(db, 'works', workId));
      
      await batch.commit();
      navigate('/library');
    } catch (error) {
      console.error("Delete work error:", error);
      setAiError("Erro ao excluir a obra. Tente novamente.");
    } finally {
      setIsAiLoading(null);
      setIsDeleteModalOpen(false);
    }
  };

  if (!work) return null;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-ink text-creme' : theme.bg} ${isDarkMode ? 'text-creme' : theme.text} transition-colors duration-1000 flex overflow-hidden selection:bg-sakura/30 ${theme.font}`}>
      <LoadingScreen isLoading={!work} />
      
      {/* Zen Mode Toggle */}
      <button
        id="zen-toggle"
        onClick={() => setZenMode(!isZenMode)}
        className={`fixed bottom-8 right-8 p-4 rounded-full shadow-2xl z-[100] transition-all ${
          isZenMode 
            ? 'bg-coffee dark:bg-sakura text-creme dark:text-ink scale-110' 
            : 'bg-white/80 dark:bg-white/10 text-ink/40 dark:text-creme/40 hover:text-sakura backdrop-blur-xl border border-coffee/10 dark:border-white/10'
        }`}
        title={isZenMode ? "Sair do Modo Zen" : "Entrar no Modo Zen"}
      >
        {isZenMode ? <Maximize2 className="w-6 h-6" /> : <Minimize2 className="w-6 h-6" />}
      </button>

      {/* Sidebar - Technical/Organized Vibe */}
      <AnimatePresence>
        {isSidebarOpen && !isFocusMode && !isZenMode && (
          <motion.aside
            id="tutorial-sidebar"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={`w-80 ${isDarkMode ? 'bg-black/60' : 'bg-white/90'} backdrop-blur-2xl border-r ${isDarkMode ? 'border-white/10' : 'border-coffee/10'} flex flex-col z-30 shadow-2xl`}
          >
            <div className="p-8 border-b border-coffee/10 dark:border-white/10 bg-creme/20 dark:bg-white/5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${isDarkMode ? 'bg-white/5' : 'bg-coffee/5'} rounded-xl border border-coffee/10 dark:border-white/10`}>
                    <Coffee className={`w-5 h-5 ${isDarkMode ? 'text-sakura' : 'text-coffee'}`} />
                  </div>
                  <h1 className="font-serif text-xl tracking-tighter font-bold">KŌHĪRA</h1>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    aria-label="Configurações da obra"
                    className={`p-2 hover:${isDarkMode ? 'bg-white/10' : 'bg-coffee/5'} rounded-xl transition-colors border border-transparent hover:border-coffee/10 dark:hover:border-white/10`}
                  >
                    <Settings className="w-4 h-4 opacity-70" />
                  </button>
                  <button 
                    onClick={() => setIsDeleteModalOpen(true)}
                    aria-label="Excluir obra"
                    className={`p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all group border border-transparent hover:border-red-500/20`}
                  >
                    <Trash2 className="w-4 h-4 opacity-60 group-hover:opacity-100" />
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => navigate('/library')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-snow/50 dark:bg-white/5 border border-coffee/10 dark:border-white/10 rounded-xl text-[10px] uppercase tracking-widest opacity-80 hover:opacity-100 transition-all font-mono"
                >
                  <ChevronLeft className="w-3 h-3" />
                  [VOLTAR]
                </button>
                <button 
                  onClick={handleDownloadFullWork}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-coffee/10 dark:bg-sakura/20 border border-coffee/20 dark:border-sakura/30 rounded-xl text-[10px] uppercase tracking-widest font-bold text-coffee dark:text-sakura hover:bg-coffee/20 dark:hover:bg-sakura/30 transition-all"
                >
                  <FileText className="w-3 h-3" />
                  [EXPORTAR]
                </button>
              </div>

              {/* Writing Goals Tracker - Technical Style */}
              <div className="mt-2 p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-coffee/10 dark:border-white/10 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-sakura" />
                    <span className="text-[9px] uppercase tracking-widest font-bold opacity-60 font-mono">SYSTEM.GOAL_TRACKER</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-coffee dark:text-creme bg-coffee/5 dark:bg-white/10 px-1.5 py-0.5 rounded">
                    {Math.round((editor?.storage.characterCount.words() / wordCountGoal) * 100)}%
                  </span>
                </div>
                <div className="h-1 w-full bg-coffee/10 dark:bg-white/10 rounded-full overflow-hidden mb-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (editor?.storage.characterCount.words() / wordCountGoal) * 100)}%` }}
                    className="h-full bg-mossa dark:bg-matcha shadow-[0_0_10px_rgba(74,103,65,0.5)]"
                  />
                </div>
                <div className="flex justify-between text-[8px] uppercase tracking-widest font-mono opacity-40">
                  <span>{editor?.storage.characterCount.words() || 0} WDS</span>
                  <span>TARGET: {wordCountGoal}</span>
                </div>
              </div>

              {/* Daily Goal Tracker - Technical Style */}
              <div className="mt-2 p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-coffee/10 dark:border-white/10 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-3 h-3 text-caramel" />
                    <span className="text-[9px] uppercase tracking-widest font-bold opacity-60 font-mono">SYSTEM.DAILY_QUOTA</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-coffee dark:text-creme bg-coffee/5 dark:bg-white/10 px-1.5 py-0.5 rounded">
                    {Math.round((dailyWordCount / dailyGoal) * 100)}%
                  </span>
                </div>
                <div className="h-1 w-full bg-coffee/10 dark:bg-white/10 rounded-full overflow-hidden mb-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (dailyWordCount / dailyGoal) * 100)}%` }}
                    className="h-full bg-sora dark:bg-sora shadow-[0_0_10px_rgba(93,173,226,0.5)]"
                  />
                </div>
                <div className="flex justify-between text-[8px] uppercase tracking-widest font-mono opacity-40">
                  <span>{dailyWordCount} WDS TODAY</span>
                  <span>TARGET: {dailyGoal}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div id="tutorial-tabs" className="flex border-b border-coffee/10 dark:border-white/10 bg-coffee/5 dark:bg-white/5">
                {(['chapters', 'characters', 'world'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 text-[9px] uppercase tracking-[0.2em] font-mono transition-all border-b-2 ${
                      activeTab === tab 
                        ? 'border-mossa dark:border-matcha opacity-100 bg-white/50 dark:bg-white/10' 
                        : 'border-transparent opacity-60 hover:opacity-80'
                    }`}
                  >
                    {tab === 'chapters' && t('editor.chapters')}
                    {tab === 'characters' && t('editor.characters')}
                    {tab === 'world' && t('editor.world')}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'chapters' && (
                  <div id="tutorial-chapters">
                    <div className="mb-8 p-4 rounded-2xl bg-coffee/5 dark:bg-white/5 border border-coffee/10 dark:border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">Sinopse da Obra</span>
                        <div className="flex gap-2">
                          {work.synopsis && (
                            <button 
                              onClick={() => copyToClipboard(work.synopsis)}
                              className="p-1 hover:bg-coffee/10 rounded transition-colors"
                              title="Copiar sinopse"
                            >
                              <Copy className="w-3 h-3 opacity-40" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleAiAction('synopsis', work.synopsis || work.description)}
                            className="p-1 hover:bg-coffee/10 rounded transition-colors text-sakura"
                            title="Gerar/Atualizar Sinopse"
                          >
                            <Sparkles className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] opacity-60 leading-relaxed line-clamp-3 italic">
                        {work.synopsis || 'Nenhuma sinopse gerada ainda. Use a IA para criar uma baseada na sua visão.'}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">{t('editor.chapters')}</h2>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleAiAction('synopsis', work.synopsis || work.description)}
                          title="Gerar Sinopse Detalhada da Obra"
                          className={`p-1 hover:${theme.bg} rounded-lg transition-colors text-sakura`}
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={handleAddChapter}
                          className={`p-1 hover:${theme.bg} rounded-lg transition-colors`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="chapters">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {chapters.map((ch, index) => (
                              <Draggable key={ch.id} draggableId={ch.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`group relative transition-all ${snapshot.isDragging ? 'z-50 scale-[1.02] rotate-1' : ''}`}
                                  >
                                    <div
                                      onClick={() => handleChapterSelect(ch)}
                                      className={`w-full p-4 rounded-2xl text-left text-sm transition-all relative overflow-hidden flex items-center gap-3 ${
                                        activeChapter?.id === ch.id 
                                          ? `${theme.bg} shadow-md font-medium` 
                                          : `hover:${theme.bg}/50 opacity-60 hover:opacity-100`
                                      } ${snapshot.isDragging ? `border-2 border-sakura shadow-2xl ${theme.bg}` : ''}`}
                                    >
                                      <div {...provided.dragHandleProps} className="opacity-0 group-hover:opacity-60 cursor-grab active:cursor-grabbing">
                                        <GripVertical className="w-4 h-4" />
                                      </div>
                                      
                                      <div className="flex-1 truncate flex items-center gap-3">
                                        <span className="text-[10px] font-mono opacity-20 shrink-0">
                                          {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <div className="flex flex-col min-w-0">
                                          {editingChapterId === ch.id ? (
                                            <input
                                              autoFocus
                                              value={editingChapterTitle}
                                              onChange={(e) => setEditingChapterTitle(e.target.value)}
                                              onBlur={() => handleRenameChapter(ch.id)}
                                              onKeyDown={(e) => e.key === 'Enter' && handleRenameChapter(ch.id)}
                                              className="w-full bg-transparent outline-none border-b border-coffee/20"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          ) : (
                                            <span className="truncate">{ch.title}</span>
                                          )}
                                          <span className="text-[8px] uppercase tracking-widest opacity-30 font-mono">
                                            {ch.content.replace(/<[^>]*>/g, '').split(/\s+/).length} WDS
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingChapterId(ch.id);
                                            setEditingChapterTitle(ch.title);
                                          }}
                                          className="p-1 hover:bg-coffee/5 rounded"
                                        >
                                          <Edit3 className="w-3 h-3 opacity-60" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteChapter(ch.id);
                                          }}
                                          className="p-1 hover:bg-red-500/10 rounded"
                                        >
                                          <Trash2 className="w-3 h-3 opacity-60 hover:text-red-500" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadChapter(ch);
                                          }}
                                          className="p-1 hover:bg-coffee/5 rounded"
                                          title="Baixar Capítulo"
                                        >
                                          <FileText className="w-3 h-3 opacity-60" />
                                        </button>
                                      </div>

                                      {activeChapter?.id === ch.id && (
                                        <motion.div 
                                          layoutId="active-ch" 
                                          className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.accent.replace('text-', 'bg-')} shadow-[0_0_15px_rgba(242,167,181,0.6)]`} 
                                        />
                                      )}
                                      {activeChapter?.id === ch.id && (
                                        <div className={`absolute inset-0 ${isDarkMode ? 'bg-white/5' : 'bg-coffee/5'} pointer-events-none`} />
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                )}

                {activeTab === 'characters' && (
                  <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex justify-between items-center mb-12">
                      <div>
                        <h2 className="text-3xl font-serif text-coffee dark:text-creme tracking-tighter mb-1 italic">Dramatis Personae</h2>
                        <p className="text-[10px] uppercase tracking-[0.3em] opacity-30 font-sans">Os fios da sua narrativa</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIsCharConfirmOpen(true)}
                          className="p-3 bg-mossa dark:bg-matcha text-creme dark:text-ink rounded-full shadow-xl hover:scale-110 transition-all"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Character Generation Section */}
                    <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-snow/50'} border ${isDarkMode ? 'border-white/10' : 'border-coffee/10'} space-y-4`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">Gerar Personagens</span>
                        <span className="text-xs font-bold text-coffee dark:text-sakura">{charGenCount}</span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="20"
                        value={charGenCount}
                        onChange={(e) => setCharGenCount(parseInt(e.target.value))}
                        className="w-full h-1 bg-coffee/10 rounded-full appearance-none accent-coffee dark:accent-sakura cursor-pointer"
                      />
                      <button 
                        onClick={() => setIsCharConfirmOpen(true)}
                        disabled={!!isAiLoading}
                        className="w-full py-2 bg-coffee dark:bg-sakura text-creme dark:text-ink rounded-xl text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                      >
                        {isAiLoading === 'character' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        Gerar {charGenCount} Personagens
                      </button>
                    </div>

                    {isAddingCharacter && (
                      <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/10' : 'bg-snow'} border ${isDarkMode ? 'border-white/10' : 'border-coffee/10'} space-y-3`}>
                        <input 
                          type="text"
                          placeholder="Nome do Personagem"
                          value={newCharacter.name}
                          onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                          className="w-full bg-transparent border-b border-coffee/20 text-sm py-1 outline-none"
                        />
                        <div className="min-h-[100px] max-h-[200px] overflow-y-auto custom-scrollbar">
                          <EditorContent 
                            editor={charEditor} 
                            className="prose prose-sm max-w-none focus:outline-none text-xs"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-[8px] uppercase tracking-widest font-bold opacity-30">Rich Text Ativo</span>
                            <span className={`text-[10px] font-bold transition-colors ${charEditor?.storage.characterCount?.characters() > 2000 ? 'text-red-500' : 'text-coffee/60 dark:text-sakura/60'}`}>
                              {charEditor?.storage.characterCount?.characters() || 0} caracteres
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setIsAddingCharacter(false)} className="text-[10px] uppercase tracking-widest opacity-60">Cancelar</button>
                            <button onClick={handleAddCharacter} className="text-[10px] uppercase tracking-widest font-bold text-coffee dark:text-sakura">Adicionar</button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {characters.map((char: any, i: number) => (
                        <div key={`char-${char.id}`} className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-snow/50'} border ${isDarkMode ? 'border-white/5' : 'border-coffee/5'} group`}>
                          {isEditingCharacter === i ? (
                            <div className="space-y-3">
                              <input 
                                type="text"
                                value={char.name}
                                onChange={(e) => {
                                  const updatedCharacters = [...characters];
                                  updatedCharacters[i].name = e.target.value;
                                  setCharacters(updatedCharacters);
                                }}
                                className="w-full bg-transparent border-b border-coffee/20 text-sm py-1 outline-none"
                              />
                              <div className="min-h-[150px] max-h-[300px] overflow-y-auto custom-scrollbar">
                                <EditorContent 
                                  editor={charEditor} 
                                  className="prose prose-sm max-w-none focus:outline-none text-xs"
                                />
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                  <span className="text-[8px] uppercase tracking-widest font-bold opacity-30">Rich Text Ativo</span>
                                  <span className={`text-[10px] font-bold transition-colors ${charEditor?.storage.characterCount?.characters() > 2000 ? 'text-red-500' : 'text-coffee/60 dark:text-sakura/60'}`}>
                                    {charEditor?.storage.characterCount?.characters() || 0} caracteres
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => setIsEditingCharacter(null)} className="text-[10px] uppercase tracking-widest opacity-60">Cancelar</button>
                                  <button onClick={() => handleSaveCharacter(i)} className="text-[10px] uppercase tracking-widest font-bold text-coffee dark:text-sakura">Salvar</button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-serif text-sm text-coffee dark:text-sakura">{char.name}</h3>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => copyToClipboard(`${char.name}\n${char.age ? `Idade: ${char.age}\n` : ''}${char.role ? `Papel: ${char.role}\n` : ''}${char.description}`)} 
                                    className="p-1 hover:bg-coffee/5 rounded"
                                    title="Copiar perfil"
                                  >
                                    <Copy className="w-3 h-3 opacity-60" />
                                  </button>
                                  <button 
                                    onClick={() => setPendingAiAction({
                                      id: 'generate-char-profile',
                                      label: 'Revelar Essência',
                                      desc: 'O Oráculo irá mergulhar na alma deste personagem para revelar sua aparência, personalidade e história oculta.',
                                      data: i
                                    })} 
                                    className="p-1 hover:bg-coffee/5 rounded text-sakura"
                                    title="Gerar Perfil com IA"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setIsEditingCharacter(i);
                                      charEditor?.commands.setContent(char.description);
                                    }} 
                                    className="p-1 hover:bg-coffee/5 rounded"
                                  >
                                    <Edit3 className="w-3 h-3 opacity-40" />
                                  </button>
                                  <button onClick={() => handleDeleteCharacter(i)} className="p-1 hover:bg-red-500/10 rounded"><Trash2 className="w-3 h-3 opacity-60 hover:text-red-500" /></button>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                {char.age && (
                                  <div className="flex gap-2 text-[10px]">
                                    <span className="font-bold opacity-60 uppercase tracking-wider">Idade:</span>
                                    <span className="opacity-80">{char.age}</span>
                                  </div>
                                )}
                                {char.role && (
                                  <div className="flex gap-2 text-[10px]">
                                    <span className="font-bold opacity-60 uppercase tracking-wider">Papel:</span>
                                    <span className="opacity-80">{char.role}</span>
                                  </div>
                                )}
                                {char.appearance && (
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em]">Aparência</span>
                                    <p className="text-[10px] opacity-70 leading-relaxed">{char.appearance}</p>
                                  </div>
                                )}
                                {char.personality && (
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em]">Personalidade</span>
                                    <p className="text-[10px] opacity-70 leading-relaxed">{char.personality}</p>
                                  </div>
                                )}
                                {char.backstory && (
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em]">História</span>
                                    <p className="text-[10px] opacity-70 leading-relaxed">{char.backstory}</p>
                                  </div>
                                )}
                                <div className="space-y-1">
                                  <span className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em]">Descrição</span>
                                  <div 
                                    className="text-xs opacity-70 leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{ __html: char.description }}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {characters.length === 0 && !isAddingCharacter && (
                        <p className="text-xs opacity-60 italic text-center py-10">Nenhum personagem gerado ainda.</p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'world' && (
                  <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex justify-between items-center mb-12">
                      <div>
                        <h2 className="text-3xl font-serif text-coffee dark:text-creme tracking-tighter mb-1 italic">Cosmogonia</h2>
                        <p className="text-[10px] uppercase tracking-[0.3em] opacity-30 font-sans">O palco da eternidade</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setPendingAiAction({
                            id: 'generate-world-preview',
                            label: 'Manifestar Cosmogonia',
                            desc: 'O Oráculo irá tecer os fios da realidade para criar uma ambientação rica e detalhada para o seu mundo.'
                          })}
                          title="Gerar Ambientação com IA"
                          className="p-3 bg-sora text-white rounded-full shadow-xl hover:scale-110 transition-all disabled:opacity-50"
                        >
                          <Sparkles className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Description Section */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em]">Descrição Geográfica e Atmosfera</span>
                          <button 
                            onClick={() => {
                              setIsEditingWorld(true);
                              worldEditor?.commands.setContent(work.worldDescription || work.world || '');
                            }}
                            className={`p-1 hover:${theme.bg} rounded-lg transition-colors`}
                          >
                            <Edit3 className="w-3.5 h-3.5 opacity-40" />
                          </button>
                        </div>
                        
                        <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-snow/50'} border ${isDarkMode ? 'border-white/5' : 'border-coffee/5'}`}>
                          {isEditingWorld ? (
                            <div className="space-y-3">
                              <EditorContent 
                                editor={worldEditor} 
                                className="prose prose-sm max-w-none focus:outline-none min-h-[150px] text-xs"
                              />
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setIsEditingWorld(false)} className="text-[10px] uppercase tracking-widest opacity-60">Cancelar</button>
                                <button 
                                  onClick={async () => {
                                    await handleUpdateWorkSettings({ worldDescription: worldEditor?.getHTML() });
                                    setIsEditingWorld(false);
                                  }} 
                                  className="text-[10px] uppercase tracking-widest font-bold text-coffee dark:text-sakura"
                                >
                                  Salvar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="text-xs opacity-70 leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: work.worldDescription || work.world || 'A ambientação do seu mundo aparecerá aqui.' }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Lore Section */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em]">Lore, Mitologia e História</span>
                          <button 
                            onClick={() => {
                              setIsEditingLore(true);
                              loreEditor?.commands.setContent(work.worldLore || '');
                            }}
                            className={`p-1 hover:${theme.bg} rounded-lg transition-colors`}
                          >
                            <Edit3 className="w-3.5 h-3.5 opacity-40" />
                          </button>
                        </div>
                        
                        <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-snow/50'} border ${isDarkMode ? 'border-white/5' : 'border-coffee/5'}`}>
                          {isEditingLore ? (
                            <div className="space-y-3">
                              <EditorContent 
                                editor={loreEditor} 
                                className="prose prose-sm max-w-none focus:outline-none min-h-[150px] text-xs"
                              />
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setIsEditingLore(false)} className="text-[10px] uppercase tracking-widest opacity-60">Cancelar</button>
                                <button 
                                  onClick={async () => {
                                    await handleUpdateWorkSettings({ worldLore: loreEditor?.getHTML() });
                                    setIsEditingLore(false);
                                  }} 
                                  className="text-[10px] uppercase tracking-widest font-bold text-coffee dark:text-sakura"
                                >
                                  Salvar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="text-xs opacity-70 leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: work.worldLore || 'A lore e mitologia do seu mundo aparecerão aqui.' }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-coffee/5 space-y-6">
              {/* Cover Concept Section */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">Personalizar Capa</span>
                <textarea
                  value={userCoverDescription}
                  onChange={(e) => setUserCoverDescription(e.target.value)}
                  placeholder="Descreva a capa que você imagina (ex: Um dragão dourado sobre um castelo)..."
                  className={`w-full p-4 text-[10px] rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-snow border-coffee/10'} focus:border-sakura outline-none transition-all resize-none h-24`}
                />
              </div>

              {/* Cover Preview Button */}
              <button 
                onClick={() => setIsCoverPreviewOpen(true)}
                disabled={isGeneratingCover}
                className={`w-full p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-snow border-coffee/10'} flex items-center gap-3 group transition-all hover:scale-[1.02] disabled:opacity-50`}
              >
                <div className="w-10 h-14 bg-coffee/20 rounded-lg flex items-center justify-center overflow-hidden relative">
                  {isGeneratingCover ? (
                    <Loader2 className="w-4 h-4 text-sakura animate-spin z-10" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-sakura animate-pulse z-10" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-br from-sakura/20 to-transparent" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] uppercase tracking-widest font-bold block">{t('editor.cover_concept')}</span>
                  <span className="text-[8px] opacity-70">{isGeneratingCover ? t('editor.generating_prompt') : t('editor.view_art')}</span>
                </div>
                <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-60 transition-opacity" />
              </button>

              {/* Credit Indicator */}
              <div className={`p-4 rounded-2xl ${credits < 5 ? 'bg-red-500/10 border-red-500/30' : 'bg-coffee/10 border-coffee/20'} border`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">{t('editor.ai_credits')}</span>
                  <span className={`text-xs font-bold ${credits < 5 ? 'text-red-500' : 'text-coffee dark:text-sakura'}`}>
                    {isLifetime ? '∞' : credits}
                  </span>
                </div>
                <div className="w-full h-1 bg-coffee/10 rounded-full overflow-hidden mb-3">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: isLifetime ? '100%' : `${Math.min(100, (credits / 50) * 100)}%` }}
                    className={`h-full ${credits < 5 ? 'bg-red-500' : 'bg-coffee dark:bg-sakura'}`}
                  />
                </div>
                <button 
                  onClick={() => navigate('/upgrade')}
                  className="w-full py-2 text-[8px] uppercase tracking-[0.2em] font-bold text-center hover:text-sakura transition-colors"
                >
                  {credits < 5 ? t('editor.reload_now') : t('editor.get_more_credits')}
                </button>
              </div>

              {/* Finalize Work Button */}
              <button
                id="finalize-button"
                onClick={() => setPendingAiAction({
                  id: 'finalize-work',
                  label: 'Finalizar Manuscrito',
                  desc: 'O Oráculo irá realizar uma revisão profunda, polir o estilo e gerar uma sinopse final para sua obra. Esta ação consome 2 créditos.'
                })}
                className="w-full py-4 bg-mossa dark:bg-matcha text-white dark:text-ink rounded-2xl text-[10px] uppercase tracking-widest font-bold hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-2 group mb-6"
              >
                <Sparkles className="w-3 h-3 group-hover:animate-pulse" />
                Finalizar Obra
              </button>

              {/* Word Count Goal Setting */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase tracking-widest font-bold opacity-70">Meta de Palavras</span>
                  <span className="text-xs font-bold text-coffee dark:text-sakura">{wordCountGoal}</span>
                </div>
                <input 
                  type="range"
                  min="500"
                  max="100000"
                  step="500"
                  value={wordCountGoal}
                  onChange={(e) => setWordCountGoal(parseInt(e.target.value))}
                  className="w-full h-1 bg-coffee/10 rounded-full appearance-none accent-coffee dark:accent-sakura cursor-pointer"
                />
              </div>

              {/* Daily Goal Setting */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase tracking-widest font-bold opacity-70">Meta Diária</span>
                  <span className="text-xs font-bold text-coffee dark:text-sakura">{dailyGoal}</span>
                </div>
                <input 
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                  className="w-full h-1 bg-coffee/10 rounded-full appearance-none accent-coffee dark:accent-sakura cursor-pointer"
                />
              </div>

              {/* Typewriter Sound Toggle */}
              <button
                onClick={() => setTypewriterSound(!isTypewriterSound)}
                className={`w-full p-4 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-snow border-coffee/10'} flex items-center justify-between group transition-all`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isTypewriterSound ? 'bg-sakura/20 text-sakura' : 'bg-coffee/10 text-coffee/40'}`}>
                    <Type className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest font-bold">Som de Máquina</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${isTypewriterSound ? 'bg-sakura' : 'bg-coffee/20'}`}>
                  <motion.div 
                    animate={{ x: isTypewriterSound ? 20 : 2 }}
                    className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                  />
                </div>
              </button>

              {/* Soundscape Control */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase tracking-widest font-bold opacity-70">Soundscape</span>
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 hover:bg-coffee/5 rounded-lg transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 opacity-60" /> : <Volume2 className="w-3.5 h-3.5 text-sakura" />}
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['none', 'coffee', 'library', 'rain', 'urban'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setAmbientMode(mode)}
                      className={`p-2 rounded-xl transition-all flex flex-col items-center gap-1.5 border ${
                        ambientMode === mode 
                          ? 'bg-coffee/10 border-coffee/20 dark:bg-sakura/10 dark:border-sakura/20' 
                          : 'border-transparent hover:bg-coffee/5 opacity-60 hover:opacity-100'
                      }`}
                      title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                    >
                      {mode === 'none' && <X className="w-3.5 h-3.5" />}
                      {mode === 'coffee' && <Coffee className="w-3.5 h-3.5" />}
                      {mode === 'library' && <BookOpen className="w-3.5 h-3.5" />}
                      {mode === 'rain' && <CloudRain className="w-3.5 h-3.5" />}
                      {mode === 'urban' && <Wind className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-20 px-8 flex items-center justify-between z-20">
          <div className={`flex items-center gap-4 transition-opacity duration-500 ${isFocusMode ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
            {!isFocusMode && (
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 hover:${theme.paper} rounded-xl transition-colors`}
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
            <div>
              <h2 className="font-serif text-lg">{work?.title || 'Carregando...'}</h2>
              <p className="text-[10px] uppercase tracking-widest opacity-70">{activeChapter?.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-3 transition-opacity duration-500 ${isFocusMode ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
              <LanguageSelector />
              {!isFocusMode && (
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-[8px] uppercase tracking-widest font-bold opacity-30">{t('editor.ai_credits')}</span>
                  <span className="text-[10px] font-serif opacity-60">
                    {isLifetime ? t('editor.lifetime') : credits}
                  </span>
                </div>
              )}
              <button
                onClick={toggleDarkMode}
                aria-label={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
                className={`p-3 rounded-xl transition-all hover:${isDarkMode ? 'bg-white/10' : theme.paper}`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setFocusMode(!isFocusMode)}
                className={`p-3 rounded-xl transition-all ${isFocusMode ? `${theme.accent.replace('text-', 'bg-')} text-creme shadow-lg` : `hover:${theme.paper}`}`}
                title="Modo Foco"
              >
                {isFocusMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] uppercase tracking-widest font-bold opacity-30">Status</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-sakura rounded-full animate-pulse" />
                    <span className="text-[10px] font-sans opacity-60">KŌHĪRA AI Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAutosaving ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-sakura" />
                        <span className="text-[10px] font-sans opacity-60">Sincronizando...</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-3 h-3 text-green-500" />
                        <span className="text-[10px] font-sans opacity-60">Salvo na Nuvem</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-6 py-3 ${theme.accent.replace('text-', 'bg-')} text-creme rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg disabled:opacity-50 z-30`}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('common.save')}
            </button>
          </div>
        </header>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex justify-center p-8 md:p-12">
          <motion.div 
            ref={editorRef}
            layout
            animate={isAiLoading ? { scale: [1, 0.99, 1] } : {}}
            transition={isAiLoading ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
            className={`w-full max-w-4xl ${theme.paper} ${isFocusMode ? 'shadow-none' : 'shadow-2xl'} rounded-[2.5rem] p-12 md:p-24 min-h-[1200px] relative transition-all duration-700 ${
              isAiLoading ? 'ring-2 ring-sakura/30 ring-offset-4' : ''
            }`}
          >
            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-multiply rounded-[2.5rem] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
            
            {/* Shimmer effect when loading */}
            {isAiLoading && (
              <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none z-40">
                <div className="w-full h-full bg-gradient-to-r from-transparent via-sakura/10 to-transparent animate-shimmer" />
                <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[2px]">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-sakura animate-spin" />
                    <span className="text-sm font-bold uppercase tracking-widest text-coffee dark:text-sakura animate-pulse">
                      {AI_MESSAGES[isAiLoading] || 'Processando...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Success Feedback */}
            <AnimatePresence>
              {successMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 z-50 text-xs font-bold"
                >
                  <Check className="w-4 h-4" />
                  <span>{successMessage}</span>
                  {showUndo && (
                    <button 
                      onClick={handleUndo}
                      className="ml-4 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-all flex items-center gap-2 border border-white/10 group"
                    >
                      <RotateCcw className="w-3 h-3 group-hover:rotate-[-45deg] transition-transform" />
                      <span>Desfazer</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Error Feedback */}
            <AnimatePresence>
              {aiError && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 z-50 text-xs font-bold"
                >
                  <AlertCircle className="w-4 h-4" />
                  {aiError}
                </motion.div>
              )}
            </AnimatePresence>
            {/* AI Assistant Toolbar - Atmospheric Vibe */}
            <AnimatePresence>
              {editor && !isFocusMode && !isZenMode && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`absolute -top-10 left-1/2 -translate-x-1/2 ${isDarkMode ? 'bg-ink/60' : 'bg-white/60'} backdrop-blur-2xl border ${isDarkMode ? 'border-white/10' : 'border-sakura/20'} p-1.5 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center gap-1 z-30 overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-sakura/5 via-transparent to-sora/5 pointer-events-none" />
                  {[
                    { id: 'rewriteChapter', label: t('editor.ai_actions.rewriteChapter.label'), desc: t('editor.ai_actions.rewriteChapter.desc'), icon: BookOpen },
                    { id: 'expand', label: t('editor.ai_actions.expand.label'), desc: t('editor.ai_actions.expand.desc'), icon: Sparkles },
                    { id: 'continueWriting', label: t('editor.ai_actions.continueWriting.label'), desc: t('editor.ai_actions.continueWriting.desc'), icon: Plus },
                    { id: 'rewrite', label: t('editor.ai_actions.rewrite.label'), desc: t('editor.ai_actions.rewrite.desc'), icon: Edit3 },
                    { id: 'dialogue', label: t('editor.ai_actions.dialogue.label'), desc: t('editor.ai_actions.dialogue.desc'), icon: MessageSquare },
                    { id: 'emotion', label: t('editor.ai_actions.emotion.label'), desc: t('editor.ai_actions.emotion.desc'), icon: Palette },
                  ].map((action) => (
                    <button
                      key={action.id}
                      onClick={() => setPendingAiAction(action)}
                      disabled={!!isAiLoading}
                      className={`flex items-center gap-2 px-4 py-2.5 hover:${isDarkMode ? 'bg-white/10' : 'bg-sakura/10'} rounded-full text-[9px] uppercase tracking-[0.15em] font-bold transition-all disabled:opacity-50 relative z-10 ${
                        isAiLoading === action.id ? 'bg-sakura/20 text-sakura animate-pulse' : ''
                      }`}
                    >
                      {isAiLoading === action.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <action.icon className={`w-3.5 h-3.5 ${action.id === 'expand' ? 'text-sakura' : 'opacity-60'}`} />
                      )}
                      {action.label}
                    </button>
                  ))}
                  {isAiLoading && <Loader2 className="w-4 h-4 animate-spin mx-2 text-sakura" />}
                  
                  {showUndo && (
                    <button
                      onClick={handleUndo}
                      className="flex items-center gap-2 px-5 py-2.5 bg-sakura text-white dark:text-ink rounded-full text-[9px] uppercase tracking-widest font-bold transition-all shadow-lg hover:scale-105 ml-1 relative z-10"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Desfazer
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating AI Menu - Atmospheric Vibe */}
            <AnimatePresence>
              {editor && !editor.state.selection.empty && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className={`fixed flex items-center gap-1 p-1.5 rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.3)] border ${isDarkMode ? 'bg-ink/80 border-white/10' : 'bg-white/80 border-sakura/20'} backdrop-blur-2xl z-50 overflow-hidden`}
                  style={{
                    left: '50%',
                    bottom: '120px',
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-sakura/10 via-transparent to-sora/10 pointer-events-none" />
                  <button
                    onClick={() => setPendingAiAction({ id: 'rewrite', label: t('editor.ai_actions.rewrite.label'), desc: t('editor.ai_actions.rewrite.desc') })}
                    className="p-3 hover:bg-sakura/10 rounded-full transition-all flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold relative z-10"
                    title="Reescrever"
                  >
                    <Type className="w-4 h-4 text-sakura" />
                    {t('editor.ai_actions.rewrite.label')}
                  </button>
                  <div className="w-px h-4 bg-coffee/10 dark:bg-white/10 mx-1 relative z-10" />
                  <button
                    onClick={() => setPendingAiAction({ id: 'expand', label: t('editor.ai_actions.expand.label'), desc: t('editor.ai_actions.expand.desc') })}
                    className="p-3 hover:bg-sakura/10 rounded-full transition-all flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold relative z-10"
                    title="Expandir"
                  >
                    <Maximize2 className="w-4 h-4 text-sakura" />
                    {t('editor.ai_actions.expand.label')}
                  </button>
                  <button
                    onClick={() => setPendingAiAction({ id: 'continueWriting', label: t('editor.ai_actions.continueWriting.label'), desc: t('editor.ai_actions.continueWriting.desc') })}
                    className="p-3 hover:bg-sakura/10 rounded-full transition-all flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold relative z-10"
                    title="Continuar"
                  >
                    <Plus className="w-4 h-4 text-sakura" />
                    {t('editor.ai_actions.continueWriting.label')}
                  </button>
                  <button
                    onClick={() => setPendingAiAction({ id: 'dialogue', label: t('editor.ai_actions.dialogue.label'), desc: t('editor.ai_actions.dialogue.desc') })}
                    className="p-3 hover:bg-sakura/10 rounded-full transition-all flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold relative z-10"
                    title="Gerar Diálogo"
                  >
                    <MessageSquare className="w-4 h-4 text-sakura" />
                    {t('editor.ai_actions.dialogue.label')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Editor - Clean Minimal Vibe */}
            <div id="tutorial-editor" className="relative">
              <div className="absolute -left-12 top-0 h-full w-px bg-gradient-to-b from-coffee/10 via-transparent to-coffee/10 hidden lg:block" />
              <EditorContent 
                editor={editor} 
                className="prose prose-lg max-w-none focus:outline-none selection:bg-sakura/20 selection:text-ink" 
              />
            </div>
          </motion.div>
        </div>

        {/* Word Count & Status */}
        <footer className={`h-12 px-8 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] font-bold opacity-30 ${isFocusMode ? 'opacity-0' : ''}`}>
          <div className="flex gap-6">
            <span>{editor?.storage.characterCount.words()} Palavras</span>
            <span>{chapters.length} Capítulos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
            {isSaving ? 'Salvando...' : 'Sincronizado'}
          </div>
        </footer>
      </main>

      {/* Settings Modal - Warm Organic Vibe */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-ink/30 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-sm ${theme.paper} rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.2)] p-10 border ${theme.border} overflow-hidden`}
            >
              {/* Decorative organic shape */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-sakura/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-mossa/5 rounded-full blur-3xl" />

              <div className="flex justify-between items-center mb-8 relative z-10">
                <h2 className="text-2xl font-serif text-coffee dark:text-creme tracking-tight">Personalização</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-coffee/5 dark:hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-5 h-5 opacity-60" />
                </button>
              </div>

              <div className="space-y-6 relative z-10">
                <div className={`p-6 rounded-[2rem] ${isDarkMode ? 'bg-white/5' : 'bg-creme/30'} border ${isDarkMode ? 'border-white/10' : 'border-coffee/5'} space-y-4`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">Sinopse da Obra</span>
                    <Sparkles className="w-4 h-4 text-sakura" />
                  </div>
                  <p className="text-xs opacity-60 leading-relaxed italic font-serif">
                    Gere uma sinopse detalhada baseada em todos os seus capítulos, personagens e ambientação.
                  </p>
                  <button 
                    onClick={handleGenerateDetailedSynopsis}
                    disabled={!!isAiLoading}
                    className="w-full py-3.5 bg-coffee dark:bg-sakura text-creme dark:text-ink rounded-2xl text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl"
                  >
                    {isAiLoading === 'synopsis' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Gerar Sinopse
                  </button>
                </div>

                <div>
                  <h3 className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-70 mb-2.5">Estética da Página</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {AESTHETICS.map((aes) => (
                      <button
                        key={aes}
                        onClick={() => handleUpdateWorkSettings({ aesthetic: aes })}
                        className={`p-2.5 rounded-xl text-[9px] text-left transition-all border ${
                          work.aesthetic === aes ? `border-coffee bg-coffee/5` : `border-transparent hover:bg-coffee/5`
                        }`}
                      >
                        {aes}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-70 mb-2.5">Tipografia</h3>
                  <div className="space-y-1">
                    {FONTS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleUpdateWorkSettings({ font: f.id })}
                        className={`w-full p-2.5 rounded-xl text-[10px] text-left transition-all flex items-center justify-between border ${
                          work.font === f.id ? `border-coffee bg-coffee/5` : `border-transparent hover:bg-coffee/5`
                        } ${f.id}`}
                      >
                        {f.name}
                        {work.font === f.id && <Check className="w-3 h-3 text-coffee" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal - Technical/Brutalist Vibe */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full max-w-sm ${isDarkMode ? 'bg-black' : 'bg-white'} border-4 ${isDarkMode ? 'border-red-500' : 'border-red-600'} p-10 shadow-[20px_20px_0px_rgba(239,68,68,0.2)]`}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-red-500 text-white">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-mono font-black uppercase tracking-tighter leading-none">
                  Ação<br />Crítica
                </h2>
              </div>
              <p className="text-sm font-mono opacity-60 leading-relaxed mb-10 uppercase">
                Aviso: A exclusão da obra "{work.title}" é irreversível. Todos os dados serão purgados do sistema.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDeleteWork}
                  disabled={isAiLoading === 'deleting'}
                  className="w-full py-4 bg-red-500 text-white font-mono font-black uppercase tracking-[0.2em] hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  [ CONFIRMAR_PURGA ]
                </button>
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full py-4 border-2 border-current font-mono font-black uppercase tracking-[0.2em] opacity-60 hover:opacity-100 transition-all"
                >
                  CANCELAR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Error Overlay */}
      <AnimatePresence>
        {aiError && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-4 rounded-[2rem] shadow-2xl flex flex-col items-center gap-3 z-[100] max-w-md text-center"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{aiError}</span>
              <button onClick={() => setAiError(null)} className="p-1 hover:bg-white/20 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={handleRetryLastAction}
              className="px-4 py-2 bg-white text-red-500 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-creme transition-colors"
            >
              Tentar Novamente
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character Generation Confirmation - Atmospheric Vibe */}
      <AnimatePresence>
        {isCharConfirmOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCharConfirmOpen(false)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-sm ${theme.paper} rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] p-10 border ${theme.border} text-center overflow-hidden`}
            >
              {/* Atmospheric background */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-sakura/20 via-transparent to-sora/20 animate-pulse" />
              </div>

              <div className="relative z-10">
                <div className="w-20 h-20 bg-sakura/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(242,167,181,0.3)]">
                  <Sparkles className="w-10 h-10 text-sakura animate-pulse" />
                </div>
                <h2 className="text-2xl font-serif text-coffee dark:text-creme mb-4 tracking-tight italic">Manifestar Personagens?</h2>
                <p className="text-sm opacity-60 leading-relaxed mb-10 font-serif italic">
                  Você está prestes a invocar <span className="font-bold text-sakura">{charGenCount}</span> novas almas para habitar o seu mundo. 
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsCharConfirmOpen(false)}
                    className="flex-1 py-4 rounded-2xl text-[10px] uppercase tracking-widest font-bold opacity-60 hover:opacity-100 transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    onClick={handleGenerateMultipleCharacters}
                    className="flex-1 py-4 bg-gradient-to-r from-sakura to-matcha text-white dark:text-ink rounded-2xl text-[10px] uppercase tracking-widest font-bold hover:scale-105 transition-all shadow-xl"
                  >
                    Manifestar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Generic Pending Action Modal (Delete Confirmation or AI Action) */}
      <AnimatePresence>
        {pendingAiAction && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingAiAction(null)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-sm ${theme.paper} rounded-[2.5rem] shadow-2xl p-8 border ${theme.border} text-center overflow-hidden`}
            >
              {/* Decorative background for AI actions */}
              {!pendingAiAction.id.startsWith('delete-') && (
                <div className="absolute inset-0 pointer-events-none opacity-20">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-sakura/20 via-transparent to-sora/20" />
                </div>
              )}

              <div className={`w-16 h-16 ${pendingAiAction.id.startsWith('delete-') ? 'bg-red-500/10' : 'bg-sakura/10'} rounded-full flex items-center justify-center mx-auto mb-6 relative z-10`}>
                {pendingAiAction.id.startsWith('delete-') ? (
                  <Trash2 className="w-8 h-8 text-red-500" />
                ) : (
                  <Sparkles className="w-8 h-8 text-sakura" />
                )}
              </div>
              <h2 className="text-xl font-serif text-coffee dark:text-creme mb-4 relative z-10">{pendingAiAction.label}</h2>
              <p className="text-sm opacity-60 leading-relaxed mb-8 relative z-10">
                {pendingAiAction.desc}
              </p>
              <div className="flex gap-3 relative z-10">
                <button 
                  onClick={() => setPendingAiAction(null)}
                  className="flex-1 py-4 rounded-2xl text-[10px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  onClick={() => {
                    if (pendingAiAction.id.startsWith('delete-char-')) {
                      confirmDeleteCharacter(pendingAiAction.id.replace('delete-char-', ''));
                    } else if (pendingAiAction.id.startsWith('delete-chapter-')) {
                      confirmDeleteChapter(pendingAiAction.id.replace('delete-chapter-', ''));
                    } else if (pendingAiAction.id === 'generate-char-profile') {
                      handleGenerateCharacterProfile(pendingAiAction.data);
                    } else if (pendingAiAction.id === 'generate-world-preview') {
                      handleGenerateWorldPreview();
                    } else {
                      handleAiAction(pendingAiAction.id);
                    }
                    setPendingAiAction(null);
                  }}
                  className={`flex-1 py-4 ${pendingAiAction.id.startsWith('delete-') ? 'bg-red-500' : 'bg-mossa dark:bg-matcha'} text-white dark:text-ink rounded-2xl text-[10px] uppercase tracking-widest font-bold hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2`}
                >
                  {pendingAiAction.id.startsWith('delete-') ? <Trash2 className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                  {pendingAiAction.id.startsWith('delete-') ? 'Confirmar' : 'Manifestar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Loading Overlay */}
      <AnimatePresence>
        {isAiLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-coffee text-creme px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[100]"
          >
            <Sparkles className="w-5 h-5 text-sakura animate-pulse" />
            <span className="text-sm font-medium tracking-wide">Gemini está tecendo palavras...</span>
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-creme rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 bg-creme rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 bg-creme rounded-full animate-bounce" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(92, 64, 51, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(92, 64, 51, 0.2);
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>

      {/* Cover Preview Modal */}
      <AnimatePresence>
        {isCoverPreviewOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-5xl w-full bg-creme dark:bg-ink rounded-[3rem] overflow-hidden shadow-2xl relative flex flex-col md:flex-row h-[80vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-full md:w-1/2 h-full relative group">
                <img 
                  src={coverPrompt || work.coverUrl || `https://picsum.photos/seed/${encodeURIComponent(work.title)}/1024/1792`}
                  alt="Capa da Obra"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Zoom/View Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                   <button 
                    onClick={() => window.open(coverPrompt || work.coverUrl, '_blank')}
                    className="p-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-110"
                   >
                     <Maximize2 className="w-8 h-8" />
                   </button>
                </div>
              </div>
              
              <div className="w-full md:w-1/2 h-full p-8 md:p-12 flex flex-col bg-creme dark:bg-ink relative overflow-y-auto">
                <div className="mb-8">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-sakura">{work.type}</span>
                    <button 
                      onClick={() => setIsCoverPreviewOpen(false)}
                      className="p-2 hover:bg-coffee/5 dark:hover:bg-white/5 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <h2 className="text-4xl font-serif leading-tight mb-4 text-coffee dark:text-creme">{work.title}</h2>
                  <div className="w-16 h-1 bg-sakura/30 mb-6" />
                  <p className="text-sm opacity-70 italic mb-8 text-coffee dark:text-creme/80 leading-relaxed line-clamp-3">{work.synopsis || work.description}</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest font-bold opacity-60 flex items-center gap-2">
                      <Edit3 className="w-3 h-3" />
                      {t('editor.cover_prompt_label')}
                    </label>
                    <textarea
                      value={userCoverDescription}
                      onChange={(e) => setUserCoverDescription(e.target.value)}
                      placeholder="Descreva a estética (ex: lo-fi, chuvoso, melancólico, cyberpunk...)"
                      className={`w-full p-4 text-xs rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-snow border-coffee/10'} focus:border-sakura outline-none transition-all resize-none h-32 font-mono`}
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleGenerateCover}
                      disabled={isGeneratingCover}
                      className="w-full py-4 bg-coffee dark:bg-sakura text-white dark:text-ink rounded-2xl text-[10px] uppercase tracking-widest font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isGeneratingCover ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('editor.manifesting_new_version')}
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          {t('editor.generate_new_version')}
                        </>
                      )}
                    </button>

                    {coverPrompt && coverPrompt !== work.coverUrl && (
                      <button
                        onClick={applyCover}
                        className="w-full py-4 bg-mossa text-white rounded-2xl text-[10px] uppercase tracking-widest font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        {t('editor.apply_this_cover')}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-8 border-t border-coffee/5 dark:border-white/5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-px flex-1 bg-coffee/10 dark:bg-white/10" />
                    <span className="text-[9px] uppercase tracking-widest font-bold opacity-40">KŌHĪRA ART ENGINE</span>
                    <div className="h-px flex-1 bg-coffee/10 dark:bg-white/10" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Result Preview Modal */}
      <AnimatePresence>
        {pendingAiResult && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-4xl w-full bg-white dark:bg-ink rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-coffee/5 dark:border-white/5 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-serif text-coffee dark:text-creme flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-sakura" />
                    {t('editor.ai_suggestion_title')}
                  </h3>
                  <p className="text-xs opacity-50 uppercase tracking-widest mt-1">
                    {AI_MESSAGES[pendingAiResult.actionId] || t('editor.ai_assistant')}
                  </p>
                </div>
                <button 
                  onClick={cancelAiResult}
                  className="p-2 hover:bg-coffee/5 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">{t('editor.original')}</span>
                  <div 
                    className="p-6 rounded-2xl bg-coffee/5 dark:bg-white/5 text-sm leading-relaxed opacity-60 prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: pendingAiResult.originalText }}
                  />
                </div>
                <div className="space-y-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-sakura">{t('editor.suggestion')}</span>
                  <div 
                    className="p-6 rounded-2xl bg-sakura/5 border border-sakura/20 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: pendingAiResult.text }}
                  />
                </div>
              </div>

              <div className="p-8 bg-coffee/5 dark:bg-white/5 flex gap-4">
                <button
                  onClick={cancelAiResult}
                  className="flex-1 py-4 px-6 rounded-2xl border border-coffee/10 dark:border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-coffee/5 transition-all"
                >
                  {t('editor.discard')}
                </button>
                <button
                  onClick={applyAiResult}
                  className="flex-[2] py-4 px-6 rounded-2xl bg-coffee dark:bg-sakura text-white dark:text-ink text-[10px] uppercase tracking-widest font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {t('editor.apply_changes')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {isTutorialOpen && (
          <div className="fixed inset-0 z-[200] pointer-events-none">
            {/* Spotlight Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/60 backdrop-blur-[2px]"
              style={{
                clipPath: tutorialTargetRect ? `polygon(
                  0% 0%, 
                  0% 100%, 
                  ${tutorialTargetRect.left}px 100%, 
                  ${tutorialTargetRect.left}px ${tutorialTargetRect.top}px, 
                  ${tutorialTargetRect.right}px ${tutorialTargetRect.top}px, 
                  ${tutorialTargetRect.right}px ${tutorialTargetRect.bottom}px, 
                  ${tutorialTargetRect.left}px ${tutorialTargetRect.bottom}px, 
                  ${tutorialTargetRect.left}px 100%, 
                  100% 100%, 
                  100% 0%
                )` : 'none'
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-auto">
              <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  y: tutorialTargetRect ? 0 : 0, 
                  opacity: 1,
                  x: tutorialTargetRect ? (tutorialTargetRect.left > window.innerWidth / 2 ? -200 : 200) : 0
                }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className={`relative w-full max-w-sm ${theme.paper} rounded-[2.5rem] shadow-2xl p-8 border ${theme.border} overflow-hidden`}
                style={tutorialTargetRect ? {
                  position: 'absolute',
                  left: tutorialTargetRect.left > window.innerWidth / 2 ? tutorialTargetRect.left - 400 : tutorialTargetRect.right + 20,
                  top: Math.max(100, Math.min(window.innerHeight - 400, tutorialTargetRect.top))
                } : {}}
              >
              <div className="absolute top-0 left-0 w-full h-1 bg-coffee/10">
                <motion.div 
                  className="h-full bg-sakura"
                  initial={{ width: 0 }}
                  animate={{ width: `${((tutorialStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                />
              </div>

              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-sakura/10 rounded-2xl">
                  <Sparkles className="w-6 h-6 text-sakura" />
                </div>
                <button 
                  onClick={() => {
                    setIsTutorialOpen(false);
                    localStorage.setItem(`tutorial_${workId}`, 'true');
                  }}
                  className="p-2 hover:bg-coffee/5 rounded-full opacity-60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-xl font-serif text-coffee mb-3">{TUTORIAL_STEPS[tutorialStep].title}</h2>
              <p className="text-sm opacity-60 leading-relaxed mb-8">{TUTORIAL_STEPS[tutorialStep].content}</p>

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {TUTORIAL_STEPS.map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1.5 h-1.5 rounded-full transition-all ${i === tutorialStep ? 'bg-sakura w-4' : 'bg-coffee/10'}`} 
                    />
                  ))}
                </div>
                <button 
                  onClick={() => {
                    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
                      setTutorialStep(tutorialStep + 1);
                    } else {
                      setIsTutorialOpen(false);
                      localStorage.setItem(`tutorial_${workId}`, 'true');
                    }
                  }}
                  className="px-6 py-3 bg-coffee text-creme rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform"
                >
                  {tutorialStep === TUTORIAL_STEPS.length - 1 ? 'Começar' : 'Próximo'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
        )}
      </AnimatePresence>
    </div>
  );
}
