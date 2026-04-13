import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, ChevronLeft, Coffee, Sparkles, Loader2, Search, X, Check, 
  UserPlus, Globe, Download, FileText, Trash2, Edit3, Plus, Palette,
  Book, Scroll, Heart, Zap, Ghost, Sword, Moon, Sun, Clock, Map, Shield, 
  UserCircle, Star, Languages, MessageSquare, List, Layout, PenTool, 
  Compass, Flame, Wind, Mountain, Music, Smile, Frown, Theater, History, 
  Rocket, Dna, Atom, Brain, Eye, Glasses, BookOpen, Feather,
  User, Users, MapPin, Target, Zap as ActionIcon, Ghost as HorrorIcon,
  Sword as EpicIcon, Heart as RomanceIcon, Coffee as CozyIcon,
  CloudMoon as DarkIcon, Wind as WhimsicalIcon, History as NostalgicIcon,
  Quote, AlignLeft, Type, Smile as HumorousIcon, AlertCircle as CynicalIcon,
  Eye as FirstPersonIcon, Users as ThirdPersonIcon, Globe as OmniscientIcon,
  Navigation as SecondPersonIcon, ArrowRight as LinearIcon, Shuffle as NonLinearIcon,
  History as PastIcon, Rocket as FutureIcon, Repeat as AlternatingIcon,
  Home as LocalIcon, Map as RegionalIcon, Globe as GlobalIcon, Layers as UniversalIcon,
  Sparkles as SoftMagicIcon, Shield as HardMagicIcon, Cpu as TechIcon,
  Leaf as RealisticIcon, Ghost as SupernaturalIcon, TrendingUp as RiseIcon,
  TrendingDown as FallIcon, RefreshCw as RedemptionIcon, Skull as TragedyIcon,
  UserPlus as GrowthIcon, Flower2, Timer, FastForward, Play, Camera,
  Square, CheckSquare, AlertCircle, Leaf, Cloud
} from 'lucide-react';
import { useStore, WorkType } from '../store/useStore';
import { useTranslation } from '../contexts/TranslationContext';
import { useNavigate } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  generateWorkInitialContent, 
  generateDetailedCharacters, 
  generateDetailedWorld, 
  generateChapterFullContent, 
  generateCoverPrompt, 
  generateCoverImage,
  generateFieldSuggestion,
  generateDetailedSynopsis,
  suggestWritingStyle,
  suggestGenres,
  expandWorkDescription
} from '../services/ai';
import { ALL_GENRES } from '../data/genres';
import LoadingScreen from '../components/LoadingScreen';
import { canGenerateWork, consumeCreditsForWork } from '../lib/credits';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export default function Create() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const WORK_TYPES: { id: WorkType; label: string }[] = [
    { id: 'BOOK', label: t('create.types.book') },
    { id: 'LIGHT_NOVEL', label: t('create.types.light_novel') },
    { id: 'WEB_NOVEL', label: t('create.types.web_novel') },
    { id: 'FANFICTION', label: t('create.types.fanfiction') },
    { id: 'SHORT_STORY', label: t('create.types.short_story') },
    { id: 'CHRONICLE', label: t('create.types.chronicle') },
    { id: 'FABLE', label: t('create.types.fable') },
    { id: 'POEM', label: t('create.types.poem') },
    { id: 'HAIKU', label: t('create.types.haiku') },
    { id: 'BIOGRAPHY', label: t('create.types.biography') },
    { id: 'AUTOBIOGRAPHY', label: t('create.types.autobiography') },
    { id: 'EPISTOLARY', label: t('create.types.epistolary') },
  ];

  const TYPE_ADAPTATIONS: Record<WorkType, any> = {
    'BOOK': {
      titlePlaceholder: 'O Nome do Vento',
      descPlaceholder: 'Uma jornada épica sobre um jovem músico que se torna o mago mais lendário do mundo...',
      guidance: 'Um livro permite uma exploração profunda de temas e personagens.'
    },
    'LIGHT_NOVEL': {
      titlePlaceholder: 'A Ascensão do Herói do Escudo',
      descPlaceholder: 'Um estudante comum é transportado para um mundo de fantasia como um dos quatro heróis lendários...',
      guidance: 'Light Novels focam em diálogos rápidos e ilustrações marcantes.'
    },
    'WEB_NOVEL': {
      titlePlaceholder: 'Solo Leveling',
      descPlaceholder: 'Em um mundo onde caçadores lutam contra monstros, o caçador mais fraco recebe um sistema único...',
      guidance: 'Web Novels são ideais para publicações frequentes e engajamento direto.'
    },
    'FANFICTION': {
      titlePlaceholder: 'Harry Potter e o Método da Racionalidade',
      descPlaceholder: 'E se Harry Potter tivesse sido criado por um professor de Oxford e soubesse ciência?',
      guidance: 'Explore universos existentes com sua própria visão criativa.'
    },
    'SHORT_STORY': {
      titlePlaceholder: 'O Coração Delator',
      descPlaceholder: 'Um conto curto focado em um único evento ou emoção intensa...',
      guidance: 'Contos exigem precisão e impacto em poucas palavras.'
    },
    'CHRONICLE': {
      titlePlaceholder: 'Crônicas de uma Cidade',
      descPlaceholder: 'Observações cotidianas e reflexões sobre a vida urbana e suas nuances...',
      guidance: 'Crônicas capturam o extraordinário no cotidiano.'
    },
    'FABLE': {
      titlePlaceholder: 'A Tartaruga e a Lebre',
      descPlaceholder: 'Uma história curta com animais antropomorfizados que ensina uma lição moral...',
      guidance: 'Fábulas usam simbolismo para transmitir sabedoria.'
    },
    'POEM': {
      titlePlaceholder: 'O Corvo',
      descPlaceholder: 'Uma expressão lírica de sentimentos, ritmos e imagens poéticas...',
      guidance: 'A poesia é a música das palavras.'
    },
    'HAIKU': {
      titlePlaceholder: 'Silêncio na Montanha',
      descPlaceholder: 'Três versos capturando um momento fugaz da natureza (5-7-5 sílabas)...',
      guidance: 'Haikus buscam a iluminação na simplicidade extrema.'
    },
    'BIOGRAPHY': {
      titlePlaceholder: 'Steve Jobs',
      descPlaceholder: 'A vida e o legado de uma figura histórica ou contemporânea marcante...',
      guidance: 'Biografias exigem pesquisa e fidelidade aos fatos.'
    },
    'AUTOBIOGRAPHY': {
      titlePlaceholder: 'Minha Jornada',
      descPlaceholder: 'Suas próprias memórias, desafios e conquistas narrados por você...',
      guidance: 'Conte sua própria história com sua voz autêntica.'
    },
    'EPISTOLARY': {
      titlePlaceholder: 'Cartas de um Jovem Poeta',
      descPlaceholder: 'Uma narrativa contada através de cartas, diários ou documentos...',
      guidance: 'O formato epistolar cria uma intimidade única com o leitor.'
    }
  };

  const [formData, setFormData] = useState<any>({
    type: 'BOOK',
    language: 'pt',
    title: '',
    description: '',
    synopsis: '',
    subtitle: '',
    genres: [],
    subgenres: [],
    mood: 'cozy',
    theme: '',
    style: 'poetic',
    pov: 'third_limited',
    timeline: 'linear',
    setting: '',
    worldDescription: '',
    worldScope: 'regional',
    system: 'realistic',
    characters: [],
    characterMagnitude: 5,
    conflict: '',
    arc: 'growth',
    chaptersCount: 10,
    pagesCount: 200,
    pacing: 'moderate',
    aesthetic: 'creme',
    coverStyle: 'minimalist',
    worldLore: null,
    coverPrompt: '',
    font: 'font-sans',
    // New fields for dynamic steps
    haikuTheme: '',
    haikuFeeling: '',
    haikuSeason: '',
    poemTheme: '',
    poemStyle: '',
    sender: '',
    recipient: '',
    relationship: '',
    context: '',
    subjectName: '',
    events: '',
    conflicts: '',
    achievements: '',
    moral: ''
  });

  const STEP_TEMPLATES: Record<string, string[]> = {
    'FULL': [
      'type', 'language', 'title', 'description', 'subtitle', 'genres', 'mood', 'theme', 'style', 'pov', 
      'timeline', 'setting', 'worldDescription', 'worldScope', 'system', 'characters', 'conflict', 
      'arc', 'chaptersCount', 'pagesCount', 'pacing', 'aesthetic', 'coverStyle', 'cover', 'review'
    ],
    'MEDIUM': [
      'type', 'language', 'title', 'description', 'genres', 'mood', 'theme', 'style', 'pov', 
      'setting', 'characters', 'conflict', 'chaptersCount', 'aesthetic', 'cover', 'review'
    ],
    'SHORT': [
      'type', 'language', 'title', 'mood', 'aesthetic', 'review'
    ],
    'HAIKU': [
      'type', 'language', 'title', 'haikuEssence', 'aesthetic', 'review'
    ],
    'POEM': [
      'type', 'language', 'title', 'poemEssence', 'aesthetic', 'review'
    ],
    'EPISTOLARY': [
      'type', 'language', 'title', 'sender', 'recipient', 'relationship', 'mood', 'context', 'aesthetic', 'review'
    ],
    'BIOGRAPHY': [
      'type', 'language', 'title', 'subjectName', 'events', 'conflicts', 'achievements', 'timeline', 'aesthetic', 'review'
    ],
    'FABLE': [
      'type', 'language', 'title', 'description', 'moral', 'genres', 'mood', 'theme', 'style', 'pov', 
      'setting', 'characters', 'conflict', 'chaptersCount', 'aesthetic', 'cover', 'review'
    ]
  };

  const TYPE_TO_TEMPLATE: Record<WorkType, string> = {
    'BOOK': 'FULL',
    'LIGHT_NOVEL': 'FULL',
    'WEB_NOVEL': 'FULL',
    'FANFICTION': 'FULL',
    'SHORT_STORY': 'MEDIUM',
    'CHRONICLE': 'MEDIUM',
    'FABLE': 'FABLE',
    'POEM': 'POEM',
    'HAIKU': 'HAIKU',
    'BIOGRAPHY': 'BIOGRAPHY',
    'AUTOBIOGRAPHY': 'BIOGRAPHY',
    'EPISTOLARY': 'EPISTOLARY'
  };

  const STEPS = useMemo(() => {
    const adaptation = TYPE_ADAPTATIONS[formData.type as WorkType] || TYPE_ADAPTATIONS['BOOK'];
    const templateId = TYPE_TO_TEMPLATE[formData.type as WorkType] || 'FULL';
    const stepIds = STEP_TEMPLATES[templateId];

    const ALL_DEFINITIONS: Record<string, any> = {
      'type': { id: 'type', label: t('create.steps.type'), type: 'type_selection', guidance: 'Escolha o formato ideal para sua visão. Cada tipo tem sua própria estrutura e ritmo narrativo.' },
      'language': { 
        id: 'language', 
        label: t('create.steps.language'), 
        type: 'select',
        options: [
          { id: 'pt', label: t('create.languages.pt') },
          { id: 'en', label: t('create.languages.en') },
          { id: 'jp', label: t('create.languages.jp') },
          { id: 'es', label: t('create.languages.es') },
          { id: 'fr', label: t('create.languages.fr') }
        ], 
        guidance: 'A língua é a alma da obra. Eu me adaptarei perfeitamente ao idioma escolhido.' 
      },
      'title': { id: 'title', label: t('create.steps.title'), type: 'text', placeholder: adaptation.titlePlaceholder, guidance: adaptation.guidance },
      'description': { id: 'description', label: t('create.steps.description'), type: 'textarea', placeholder: adaptation.descPlaceholder, guidance: 'Conte-me a essência. Quanto mais detalhes você me der, mais profunda será a minha orquestração.', aiSuggestion: 'expand' },
      'subtitle': { id: 'subtitle', label: t('create.steps.subtitle'), type: 'text', placeholder: t('create.placeholders.subtitle'), guidance: 'Um subtítulo pode adicionar uma camada extra de mistério ou clareza.' },
      'genres': { id: 'genres', label: t('create.steps.genres'), type: 'genre_selection', guidance: 'Os gêneros definem as regras do jogo. Misture-os para criar algo único.', aiSuggestion: 'suggest' },
      'mood': { 
        id: 'mood', 
        label: t('create.steps.mood'), 
        type: 'select',
        options: [
          { id: 'cozy', label: 'Cozy' },
          { id: 'dark', label: 'Dark' },
          { id: 'melancholic', label: 'Melancholic' },
          { id: 'romantic', label: 'Romantic' },
          { id: 'epic', label: 'Epic' },
          { id: 'action', label: 'Action-Packed' },
          { id: 'whimsical', label: 'Whimsical' },
          { id: 'nostalgic', label: 'Nostalgic' }
        ],
        guidance: 'O clima dita a atmosfera sensorial de cada cena.' 
      },
      'theme': { id: 'theme', label: t('create.steps.theme'), type: 'text', placeholder: t('create.placeholders.theme'), guidance: 'Qual é a mensagem central? O que move esta história no fundo?' },
      'style': { 
        id: 'style', 
        label: t('create.steps.style'), 
        type: 'select',
        options: [
          { id: 'poetic', label: t('create.styles.poetic') },
          { id: 'direct', label: t('create.styles.direct') },
          { id: 'descriptive', label: t('create.styles.descriptive') },
          { id: 'minimalist', label: t('create.styles.minimalist') },
          { id: 'humorous', label: t('create.styles.humorous') },
          { id: 'cynical', label: t('create.styles.cynical') }
        ], 
        guidance: 'Sua voz literária. Eu mimetizarei este estilo em cada parágrafo.',
        aiSuggestion: 'suggest'
      },
      'pov': { 
        id: 'pov', 
        label: t('create.steps.pov'), 
        type: 'select',
        options: [
          { id: 'first', label: t('create.povs.first') },
          { id: 'third_limited', label: t('create.povs.third_limited') },
          { id: 'third_omniscient', label: t('create.povs.third_omniscient') },
          { id: 'second', label: t('create.povs.second') }
        ], 
        guidance: 'De onde vemos a história? O ponto de vista muda tudo.' 
      },
      'timeline': { 
        id: 'timeline', 
        label: t('create.steps.timeline'), 
        type: 'select',
        options: [
          { id: 'linear', label: t('create.timelines.linear') },
          { id: 'non_linear', label: t('create.timelines.non_linear') },
          { id: 'past', label: t('create.timelines.past') },
          { id: 'future', label: t('create.timelines.future') },
          { id: 'alternating', label: t('create.timelines.alternating') }
        ], 
        guidance: 'Como o tempo flui? A estrutura temporal é o esqueleto da narrativa.' 
      },
      'setting': { id: 'setting', label: t('create.steps.setting'), type: 'text', placeholder: t('create.placeholders.setting'), guidance: 'Onde e quando? O cenário deve ser um personagem por si só.' },
      'worldDescription': { id: 'worldDescription', label: t('create.steps.world_desc'), type: 'world_lore', guidance: 'Agora, vamos tecer a lore. Detalhes sobre magia, tecnologia ou política são cruciais.' },
      'worldScope': { 
        id: 'worldScope', 
        label: t('create.steps.world_scope'), 
        type: 'select',
        options: [
          { id: 'local', label: t('create.scopes.local') },
          { id: 'regional', label: t('create.scopes.regional') },
          { id: 'global', label: t('create.scopes.global') },
          { id: 'universal', label: t('create.scopes.universal') }
        ], 
        guidance: 'Qual o tamanho deste mundo? Do micro ao macro.' 
      },
      'system': { 
        id: 'system', 
        label: t('create.steps.system'), 
        type: 'select',
        options: [
          { id: 'soft_magic', label: t('create.systems.soft_magic') },
          { id: 'hard_magic', label: t('create.systems.hard_magic') },
          { id: 'advanced_tech', label: t('create.systems.advanced_tech') },
          { id: 'realistic', label: t('create.systems.realistic') },
          { id: 'supernatural', label: t('create.systems.supernatural') }
        ], 
        guidance: 'As leis que regem a realidade. Consistência é a chave da imersão.' 
      },
      'characters': { id: 'characters', label: t('create.steps.characters'), type: 'character_magnitude', guidance: 'Quem são os protagonistas? Eu gerarei almas complexas para povoar sua trama.' },
      'conflict': { id: 'conflict', label: t('create.steps.conflict'), type: 'text', placeholder: t('create.placeholders.conflict'), guidance: 'Sem conflito, não há história. O que impede seus personagens de serem felizes?' },
      'arc': { 
        id: 'arc', 
        label: t('create.steps.arc'), 
        type: 'select',
        options: [
          { id: 'rise', label: t('create.arcs.rise') },
          { id: 'fall', label: t('create.arcs.fall') },
          { id: 'redemption', label: t('create.arcs.redemption') },
          { id: 'tragedy', label: t('create.arcs.tragedy') },
          { id: 'growth', label: t('create.arcs.growth') }
        ], 
        guidance: 'A jornada emocional. Como eles mudarão do início ao fim?' 
      },
      'chaptersCount': { id: 'chaptersCount', label: t('create.steps.chapters_count'), type: 'number', min: 1, max: 100, guidance: 'Quantos capítulos compõem esta jornada?' },
      'pagesCount': { id: 'pagesCount', label: t('create.steps.pages_count'), type: 'number', min: 10, max: 1000, guidance: 'Uma estimativa de volume para guiar a densidade da escrita.' },
      'pacing': { 
        id: 'pacing', 
        label: t('create.steps.pacing'), 
        type: 'select',
        options: [
          { id: 'slow', label: t('create.pacing.slow') },
          { id: 'moderate', label: t('create.pacing.moderate') },
          { id: 'fast', label: t('create.pacing.fast') }
        ], 
        guidance: 'A velocidade da narrativa. Lento para introspecção, rápido para ação.' 
      },
      'aesthetic': { 
        id: 'aesthetic', 
        label: t('create.steps.aesthetic'), 
        type: 'select',
        options: [
          { id: 'creme', label: t('create.aesthetics.creme') },
          { id: 'night', label: t('create.aesthetics.night') },
          { id: 'sakura', label: t('create.aesthetics.sakura') },
          { id: 'sepia', label: t('create.aesthetics.sepia') },
          { id: 'mossa', label: 'Mossa (Verde Musgo)' },
          { id: 'sora', label: 'Sora (Azul Céu)' }
        ], 
        guidance: 'O visual do seu santuário de escrita.' 
      },
      'coverStyle': { 
        id: 'coverStyle', 
        label: t('create.steps.cover_style'), 
        type: 'select',
        options: [
          { id: 'minimalist', label: t('create.cover_styles.minimalist') },
          { id: 'anime', label: t('create.cover_styles.anime') },
          { id: 'lofi', label: t('create.cover_styles.lofi') },
          { id: 'typography', label: t('create.cover_styles.typography') }
        ], 
        guidance: 'O estilo artístico da sua capa.' 
      },
      'cover': { id: 'cover', label: 'Conceito da Capa', type: 'cover_generation', guidance: 'A face da sua obra. Vamos criar uma imagem que capture sua essência.', aiSuggestion: 'suggest' },
      'review': { id: 'review', label: t('create.steps.review'), type: 'review', guidance: 'Tudo pronto. Revise os parâmetros da nossa orquestração antes de começarmos.' },
      
      // New dynamic steps
      'haikuEssence': { id: 'haikuEssence', label: 'Essência do Haiku', type: 'haiku_essence', guidance: 'Haikus capturam a alma da natureza em um instante.' },
      'poemEssence': { id: 'poemEssence', label: 'Essência do Poema', type: 'poem_essence', guidance: 'Dê forma ao seu sentimento através das palavras.' },
      
      'sender': { id: 'sender', label: 'Quem Escreve?', type: 'text', placeholder: 'Nome ou papel do remetente...', guidance: 'A voz por trás da carta.' },
      'recipient': { id: 'recipient', label: 'Para Quem?', type: 'text', placeholder: 'Nome ou papel do destinatário...', guidance: 'Quem receberá estas palavras?' },
      'relationship': { id: 'relationship', label: 'Relação entre eles', type: 'text', placeholder: 'Amantes, Inimigos, Pai e Filho...', guidance: 'O vínculo que define o tom da mensagem.' },
      'context': { id: 'context', label: 'Contexto da Carta', type: 'textarea', placeholder: 'Por que esta carta está sendo escrita agora?', guidance: 'O evento ou sentimento que motivou a correspondência.' },
      
      'subjectName': { id: 'subjectName', label: 'Nome do Biografado', type: 'text', placeholder: 'Quem é o centro desta história?', guidance: 'O nome que será imortalizado nestas páginas.' },
      'events': { id: 'events', label: 'Eventos Importantes', type: 'textarea', placeholder: 'Liste os marcos que definiram esta vida...', guidance: 'Os pontos de virada que moldaram o destino.' },
      'conflicts': { id: 'conflicts', label: 'Conflitos da Vida', type: 'textarea', placeholder: 'Quais foram as maiores lutas enfrentadas?', guidance: 'A superação é o coração de uma grande biografia.' },
      'achievements': { id: 'achievements', label: 'Conquistas', type: 'textarea', placeholder: 'O que foi alcançado? Qual o legado?', guidance: 'As vitórias que justificam a narrativa.' },
      
      'moral': { id: 'moral', label: 'Lição Moral', type: 'text', placeholder: 'A pressa é inimiga da perfeição...', guidance: 'Toda fábula carrega uma semente de sabedoria.' }
    };

    return stepIds.map(id => ALL_DEFINITIONS[id]);
  }, [formData.type, t]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGeneratingSynopsis, setIsGeneratingSynopsis] = useState(false);
  const [isGeneratingField, setIsGeneratingField] = useState<string | null>(null);
  const [genreSearch, setGenreSearch] = useState('');
  const [coverMetadata, setCoverMetadata] = useState<any>(null);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isGeneratingCharacters, setIsGeneratingCharacters] = useState(false);
  const [isGeneratingWorld, setIsGeneratingWorld] = useState(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [outlinePreview, setOutlinePreview] = useState<any>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isEditingChar, setIsEditingChar] = useState<number | null>(null);
  const { user, isLoading, setLoading, isDarkMode } = useStore();
  const navigate = useNavigate();

  const OPTION_ICONS: Record<string, any> = {
    // Work Types
    'BOOK': Book,
    'LIGHT_NOVEL': Scroll,
    'WEB_NOVEL': Globe,
    'FANFICTION': Heart,
    'SHORT_STORY': FileText,
    'CHRONICLE': History,
    'FABLE': Star,
    'POEM': Feather,
    'HAIKU': Wind,
    'BIOGRAPHY': UserCircle,
    'AUTOBIOGRAPHY': User,
    'EPISTOLARY': MessageSquare,

    // Languages
    'pt': Languages,
    'en': Languages,
    'jp': Languages,
    'es': Languages,
    'fr': Languages,

    // Moods
    'cozy': CozyIcon,
    'dark': DarkIcon,
    'melancholic': Frown,
    'romantic': RomanceIcon,
    'epic': EpicIcon,
    'action': ActionIcon,
    'whimsical': WhimsicalIcon,
    'nostalgic': NostalgicIcon,

    // Styles
    'poetic': Feather,
    'direct': Target,
    'descriptive': Eye,
    'minimalist': Layout,
    'humorous': HumorousIcon,
    'cynical': CynicalIcon,

    // POV
    'first': FirstPersonIcon,
    'third_limited': ThirdPersonIcon,
    'third_omniscient': OmniscientIcon,
    'second': SecondPersonIcon,

    // Timeline
    'linear': LinearIcon,
    'non_linear': NonLinearIcon,
    'past': PastIcon,
    'future': FutureIcon,
    'alternating': AlternatingIcon,

    // World Scope
    'local': LocalIcon,
    'regional': RegionalIcon,
    'global': GlobalIcon,
    'universal': UniversalIcon,

    // Systems
    'soft_magic': SoftMagicIcon,
    'hard_magic': HardMagicIcon,
    'advanced_tech': TechIcon,
    'realistic': RealisticIcon,
    'supernatural': SupernaturalIcon,

    // Arcs
    'rise': RiseIcon,
    'fall': FallIcon,
    'redemption': RedemptionIcon,
    'tragedy': TragedyIcon,
    'growth': GrowthIcon,

    // Pacing
    'slow': Timer,
    'moderate': Play,
    'fast': FastForward,

    // Aesthetics
    'creme': Sun,
    'night': Moon,
    'sakura': Flower2,
    'sepia': History,
    'mossa': Leaf,
    'sora': Cloud,

    // Cover Styles
    'anime': Palette,
    'lofi': Camera,
    'typography': Type,
  };

  const handleGenerateSynopsis = async () => {
    if (!formData.title || !formData.description) return;
    setIsGeneratingSynopsis(true);
    try {
      const result = await generateDetailedSynopsis(formData);
      setFormData({ ...formData, synopsis: result });
    } catch (error) {
      console.error("Error generating synopsis:", error);
    } finally {
      setIsGeneratingSynopsis(false);
    }
  };

  const handleGenerateCharacters = async () => {
    setIsGeneratingCharacters(true);
    try {
      const chars = await generateDetailedCharacters(formData.characterMagnitude, formData);
      setFormData({ ...formData, characters: chars });
    } catch (error) {
      console.error("Error generating characters:", error);
    } finally {
      setIsGeneratingCharacters(false);
    }
  };

  const handleGenerateWorld = async () => {
    setIsGeneratingWorld(true);
    try {
      const world = await generateDetailedWorld(formData);
      setFormData({ ...formData, worldLore: world });
    } catch (error) {
      console.error("Error generating world:", error);
    } finally {
      setIsGeneratingWorld(false);
    }
  };

  const handleAddCharacter = () => {
    const newChar = {
      name: 'Novo Personagem',
      age: '',
      appearance: '',
      personality: '',
      backstory: '',
      role: '',
      description: ''
    };
    setFormData({ ...formData, characters: [...formData.characters, newChar] });
    setIsEditingChar(formData.characters.length);
  };

  const handleUpdateCharacter = (index: number, updates: any) => {
    const updated = [...formData.characters];
    updated[index] = { ...updated[index], ...updates };
    setFormData({ ...formData, characters: updated });
  };

  const validateStep = () => {
    const step = STEPS[currentStep];
    const newErrors: Record<string, string> = {};

    if (['title', 'type', 'description', 'sender', 'recipient', 'subjectName'].includes(step.id)) {
      if (!formData[step.id] || formData[step.id].trim() === '') {
        newErrors[step.id] = 'Este campo é obrigatório para prosseguir.';
      }
    }

    if (step.id === 'haikuEssence') {
      if (!formData.haikuTheme || !formData.haikuFeeling) {
        newErrors.haikuEssence = 'Tema e Sentimento são obrigatórios.';
      }
    }

    if (step.id === 'poemEssence') {
      if (!formData.poemTheme || !formData.poemStyle) {
        newErrors.poemEssence = 'Tema e Estilo são obrigatórios.';
      }
    }

    if (step.id === 'genres') {
      if (formData.genres.length === 0) {
        newErrors.genres = 'Selecione pelo menos um gênero.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateField = async (fieldId: string) => {
    setIsGeneratingField(fieldId);
    try {
      let suggestion;
      if (fieldId === 'description') {
        suggestion = await expandWorkDescription(formData);
      } else if (fieldId === 'genres') {
        const { main, subgenres } = await suggestGenres(formData);
        // Map main genre to ID if possible
        const mainGenre = ALL_GENRES.find(g => g.name.toLowerCase() === main.toLowerCase());
        setFormData({ 
          ...formData, 
          genres: mainGenre ? [mainGenre.name] : [main],
          subgenres: subgenres
        });
        setIsGeneratingField(null);
        return;
      } else if (fieldId === 'style') {
        const suggestedStyle = await suggestWritingStyle(formData);
        // Find closest match in options
        const styleStep = STEPS.find(s => s.id === 'style');
        const matchedOption = styleStep?.options?.find(o => 
          o.label.toLowerCase().includes(suggestedStyle.toLowerCase()) ||
          suggestedStyle.toLowerCase().includes(o.id.toLowerCase())
        );
        suggestion = matchedOption ? matchedOption.id : formData.style;
      } else if (fieldId === 'cover') {
        suggestion = await generateCoverPrompt(formData);
        setFormData({ ...formData, coverPrompt: suggestion });
        setIsGeneratingField(null);
        return;
      } else {
        suggestion = await generateFieldSuggestion(fieldId, formData);
      }
      
      setFormData({ ...formData, [fieldId]: suggestion });
      // Clear error if any
      const newErrors = { ...errors };
      delete newErrors[fieldId];
      setErrors(newErrors);
    } catch (error) {
      console.error(`Error generating ${fieldId}:`, error);
    } finally {
      setIsGeneratingField(null);
    }
  };

  const handleDeleteCharacter = (index: number) => {
    setFormData({ ...formData, characters: formData.characters.filter((_: any, i: number) => i !== index) });
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        handleFinish();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGenerateCover = async () => {
    setIsGeneratingCover(true);
    try {
      const imageUrl = await generateCoverImage(formData.coverPrompt || '', formData);
      setFormData({ ...formData, coverUrl: imageUrl });
      setCoverMetadata({ 
        visualDescription: formData.coverPrompt || 'Capa gerada pela IA baseada na obra', 
        keywords: 'cover' 
      });
    } catch (error) {
      console.error("Error generating cover:", error);
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleGenerateOutline = async () => {
    setIsGeneratingOutline(true);
    try {
      const outline = await generateWorkInitialContent(formData);
      setOutlinePreview(outline);
    } catch (error) {
      console.error("Error generating outline preview:", error);
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    setFormData({ ...formData, [STEPS[currentStep].id]: option });
    const newErrors = { ...errors };
    delete newErrors[STEPS[currentStep].id];
    setErrors(newErrors);
    handleNext();
  };

  const handleGenreToggle = (genreName: string) => {
    const current = formData.genres || [];
    const updated = current.includes(genreName) 
      ? current.filter((g: string) => g !== genreName)
      : [...current, genreName];
    setFormData({ ...formData, genres: updated });
    
    if (updated.length > 0) {
      const newErrors = { ...errors };
      delete newErrors.genres;
      setErrors(newErrors);
    }
  };

  const handleSubgenreToggle = (subgenre: string) => {
    const current = formData.subgenres || [];
    const updated = current.includes(subgenre) 
      ? current.filter((s: string) => s !== subgenre)
      : [...current, subgenre];
    setFormData({ ...formData, subgenres: updated });
  };

  const filteredGenres = useMemo(() => {
    if (!genreSearch) return ALL_GENRES;
    return ALL_GENRES.filter(g => 
      g.name.toLowerCase().includes(genreSearch.toLowerCase()) ||
      g.subgenres.some(s => s.toLowerCase().includes(genreSearch.toLowerCase()))
    );
  }, [genreSearch]);

  const handleFinish = async () => {
    if (!user) return;

    if (!validateStep()) return;

    if (!canGenerateWork()) {
      navigate('/upgrade');
      return;
    }

    setLoading(true);
    setGenerationProgress(5);
    setGenerationMessage("Iniciando processo de criação mágica...");
    setGlobalError(null);
    
    try {
      // 1. Generate structure and initial content
      const aiContent = await generateWorkInitialContent(formData, (p, msg) => {
        setGenerationProgress(p);
        setGenerationMessage(msg);
      });
      
      if (!aiContent) throw new Error("Falha ao gerar conteúdo inicial");

      // Prepare work data for insertion, removing large fields that are stored in subcollections
      const { characters: _, ...formDataWithoutChars } = formData;
      
      const workToInsert = {
        title: formData.title,
        subtitle: formData.subtitle,
        type: formData.type,
        language: formData.language,
        genres: formData.genres,
        subgenres: formData.subgenres,
        mood: formData.mood,
        theme: formData.theme,
        style: formData.style,
        pov: formData.pov,
        timeline: formData.timeline,
        setting: formData.setting,
        worldScope: formData.worldScope,
        system: formData.system,
        conflict: formData.conflict,
        arc: formData.arc,
        chaptersCount: formData.chaptersCount,
        pagesCount: formData.pagesCount,
        pacing: formData.pacing,
        aesthetic: formData.aesthetic,
        coverStyle: formData.coverStyle,
        font: formData.font,
        description: formData.description || '',
        // Dynamic fields
        haikuTheme: formData.haikuTheme || null,
        haikuFeeling: formData.haikuFeeling || null,
        haikuSeason: formData.haikuSeason || null,
        poemTheme: formData.poemTheme || null,
        poemStyle: formData.poemStyle || null,
        sender: formData.sender || null,
        recipient: formData.recipient || null,
        relationship: formData.relationship || null,
        context: formData.context || null,
        subjectName: formData.subjectName || null,
        events: formData.events || null,
        conflicts: formData.conflicts || null,
        achievements: formData.achievements || null,
        moral: formData.moral || null,
        userId: user.uid,
        synopsis: formData.synopsis || aiContent.synopsis,
        // structure is kept as a summary, but full content is in chapters subcollection
        structure: aiContent.structure.map((s: any) => ({ title: s.title, description: s.description })),
        world: formData.worldLore?.lore || aiContent.world.lore,
        worldDescription: formData.worldLore?.description || aiContent.world.description,
        // Ensure coverUrl isn't a massive base64 string that breaks Firestore
        coverUrl: formData.coverUrl?.startsWith('data:image') 
          ? `https://picsum.photos/seed/${encodeURIComponent(formData.title)}/1024/1792` 
          : formData.coverUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const worksRef = collection(db, 'works');
      const workDoc = await addDoc(worksRef, workToInsert);
      const workId = workDoc.id;

      // 1.5. Save Characters to subcollection
      const charactersToSave = formData.characters.length > 0 ? formData.characters : aiContent.characters;
      const charactersRef = collection(db, 'works', workId, 'characters');
      for (const char of charactersToSave) {
        await addDoc(charactersRef, {
          ...char,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // 2. Generate Chapters Content
      const chaptersRef = collection(db, 'works', workId, 'chapters');
      const totalChapters = aiContent.structure.length;
      
      for (const [i, chapter] of aiContent.structure.entries()) {
        const stepProgress = 30 + Math.floor(((i + 1) / totalChapters) * 65);
        setGenerationProgress(stepProgress);
        setGenerationMessage(`Escrevendo o Capítulo ${i + 1}: ${chapter.title}... 🌿`);
        
        const fullContent = await generateChapterFullContent(chapter, {
          ...workToInsert,
          synopsis: aiContent.synopsis
        });

        await addDoc(chaptersRef, {
          title: chapter.title,
          content: fullContent,
          order: i,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setGenerationProgress(100);
      setGenerationMessage("Dando os toques finais na sua obra...");

      // Consume credits after successful generation
      await consumeCreditsForWork();

      setTimeout(() => {
        setLoading(false);
        navigate(`/editor/${workId}`);
      }, 1000);
      
    } catch (error: any) {
      console.error("Generation Error:", error);
      setGlobalError(error.message || "Ocorreu um erro inesperado durante a geração.");
      setLoading(false);
    }
  };

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-creme dark:bg-ink flex flex-col items-center justify-center p-6 relative transition-colors duration-500">
      <LoadingScreen isLoading={isLoading} text={generationMessage} progress={generationProgress} />

      <div className="w-full max-w-4xl bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[3rem] shadow-2xl overflow-hidden border border-coffee/5 dark:border-white/5 flex flex-col min-h-[700px]">
        {/* Progress Bar */}
        <div className="h-2 bg-snow dark:bg-white/5 w-full">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-mossa dark:bg-matcha shadow-[0_0_15px_rgba(74,103,65,0.3)] dark:shadow-[0_0_15px_rgba(142,180,134,0.3)]"
          />
        </div>

        <div className="p-8 md:p-16 flex-1 flex flex-col">
          <AnimatePresence>
            {globalError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1">Erro de Geração</p>
                  <p className="text-sm">{globalError}</p>
                </div>
                <button onClick={() => setGlobalError(null)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <header className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-coffee dark:bg-sakura rounded-2xl shadow-lg">
                <Coffee className="w-6 h-6 text-creme dark:text-ink" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-coffee/40 dark:text-creme/40 font-bold block">Gemini Orchestrator</span>
                <span className="text-sm font-serif text-coffee dark:text-creme">{t('common.next')} {currentStep + 1} {t('common.of')} {STEPS.length}</span>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-coffee/5 dark:bg-sakura/5 rounded-2xl border border-coffee/10 dark:border-sakura/10 max-w-md">
              <Sparkles className="w-4 h-4 text-sakura shrink-0" />
              <p className="text-[10px] italic text-coffee/60 dark:text-creme/60 leading-tight">
                {STEPS[currentStep].guidance}
              </p>
            </div>
            <button 
              onClick={() => navigate('/library')}
              aria-label="Cancelar criação e voltar para biblioteca"
              className="p-2 hover:bg-snow dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-ink/40 dark:text-creme/40" />
            </button>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1"
            >
              <h2 className="text-4xl md:text-5xl font-serif text-coffee dark:text-creme mb-10 tracking-tight flex items-center gap-4">
                {step.label}
                {['title', 'type', 'description', 'genres', 'sender', 'recipient', 'subjectName', 'haikuEssence', 'poemEssence'].includes(step.id) && (
                  <span className="text-red-500 text-sm font-sans font-bold uppercase tracking-widest">* Obrigatório</span>
                )}
              </h2>

              {step.type === 'cover_generation' && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold uppercase tracking-widest text-coffee/40 dark:text-creme/40">Prompt Personalizado para a Capa</label>
                      {step.aiSuggestion && (
                        <button
                          onClick={() => handleGenerateField(step.id)}
                          disabled={isGeneratingField === step.id}
                          className="flex items-center gap-2 px-4 py-2 bg-coffee/5 dark:bg-white/5 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-coffee dark:hover:bg-sakura hover:text-creme dark:hover:text-ink transition-all disabled:opacity-50"
                        >
                          {isGeneratingField === step.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          Sugerir com IA
                        </button>
                      )}
                    </div>
                    <textarea
                      value={formData.coverPrompt || ''}
                      onChange={(e) => setFormData({ ...formData, coverPrompt: e.target.value })}
                      placeholder="Descreva como você quer a capa (ex: Um samurai solitário sob a lua cheia, estilo aquarela)..."
                      className="w-full p-8 text-xl bg-snow/30 dark:bg-white/5 border-2 border-snow dark:border-white/5 rounded-[2rem] focus:border-coffee dark:focus:border-sakura outline-none transition-all font-serif text-ink dark:text-creme resize-none"
                      rows={4}
                    />
                  </div>

                  <button
                    onClick={handleGenerateCover}
                    disabled={isGeneratingCover}
                    className="w-full py-6 bg-coffee dark:bg-sakura text-creme dark:text-ink rounded-3xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-ink dark:hover:bg-creme transition-all shadow-xl disabled:opacity-50"
                  >
                    {isGeneratingCover ? <Loader2 className="w-5 h-5 animate-spin" /> : <Palette className="w-5 h-5" />}
                    {formData.coverPrompt || formData.coverUrl ? 'Regerar Capa com IA' : 'Gerar Capa com IA (Baseado na Obra)'}
                  </button>

                  {coverMetadata && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-6"
                    >
                      <div className="relative w-64 aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white dark:border-white/10">
                        <img 
                          src={formData.coverUrl || `https://picsum.photos/seed/${formData.title || 'book'}/600/800`}
                          alt="Capa Gerada"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6">
                          <h3 className="text-white font-serif text-lg leading-tight">{formData.title}</h3>
                          <p className="text-white/60 text-[8px] uppercase tracking-widest mt-1">{formData.subtitle}</p>
                        </div>
                      </div>
                      <p className="text-xs opacity-60 italic text-center max-w-md">"{coverMetadata.visualDescription}"</p>
                    </motion.div>
                  )}
                </div>
              )}

              {step.type === 'world_lore' && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-sm font-bold uppercase tracking-widest text-coffee/40 dark:text-creme/40">Como você imagina este mundo?</label>
                    <textarea
                      value={formData.worldDescription || ''}
                      onChange={(e) => setFormData({ ...formData, worldDescription: e.target.value })}
                      placeholder="Descreva a atmosfera, tecnologia, magia, geografia..."
                      className="w-full p-8 text-xl bg-snow/30 dark:bg-white/5 border-2 border-snow dark:border-white/5 rounded-[2rem] focus:border-coffee dark:focus:border-sakura outline-none transition-all font-serif text-ink dark:text-creme resize-none"
                      rows={4}
                    />
                  </div>

                  <button
                    onClick={handleGenerateWorld}
                    disabled={isGeneratingWorld || !formData.worldDescription}
                    className="w-full py-6 bg-coffee dark:bg-sakura text-creme dark:text-ink rounded-3xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-ink dark:hover:bg-creme transition-all shadow-xl disabled:opacity-50"
                  >
                    {isGeneratingWorld ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                    {formData.worldLore ? 'Regerar Lore do Mundo' : 'Gerar Lore Completa'}
                  </button>

                  {formData.worldLore && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-8 bg-white dark:bg-white/5 rounded-[2.5rem] border border-coffee/10 dark:border-white/10 shadow-inner"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-serif text-coffee dark:text-creme">Lore do Mundo</h3>
                        <Edit3 className="w-5 h-5 opacity-60" />
                      </div>
                      <div className="space-y-6 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                        <div>
                          <h4 className="text-[10px] uppercase tracking-widest font-bold text-sakura mb-2">História e Cultura</h4>
                          <textarea 
                            value={formData.worldLore.lore}
                            onChange={(e) => setFormData({ ...formData, worldLore: { ...formData.worldLore, lore: e.target.value } })}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm leading-relaxed opacity-70 resize-none h-32"
                          />
                        </div>
                        <div>
                          <h4 className="text-[10px] uppercase tracking-widest font-bold text-sakura mb-2">Geografia e Atmosfera</h4>
                          <textarea 
                            value={formData.worldLore.description}
                            onChange={(e) => setFormData({ ...formData, worldLore: { ...formData.worldLore, description: e.target.value } })}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm leading-relaxed opacity-70 resize-none h-32"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {step.type === 'character_magnitude' && (
                <div className="space-y-8">
                  <div className="flex flex-col items-center gap-8">
                    <div className="text-center">
                      <span className="text-sm font-bold uppercase tracking-widest text-coffee/40 dark:text-creme/40 block mb-2">Magnitude do Elenco</span>
                      <span className="text-7xl font-serif text-coffee dark:text-creme">{formData.characterMagnitude}</span>
                      <p className="text-xs opacity-60 mt-2 italic">Escolha entre 0 e 20 personagens principais</p>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={formData.characterMagnitude}
                      onChange={(e) => setFormData({ ...formData, characterMagnitude: parseInt(e.target.value) })}
                      className="w-full h-2 bg-snow dark:bg-white/10 rounded-full appearance-none accent-coffee dark:accent-sakura cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleGenerateCharacters}
                      disabled={isGeneratingCharacters || formData.characterMagnitude === 0}
                      className="flex-1 py-6 bg-coffee dark:bg-sakura text-creme dark:text-ink rounded-3xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-ink dark:hover:bg-creme transition-all shadow-xl disabled:opacity-50"
                    >
                      {isGeneratingCharacters ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                      Gerar Elenco com IA
                    </button>
                    <button
                      onClick={handleAddCharacter}
                      className="px-8 py-6 bg-snow dark:bg-white/5 text-ink dark:text-creme rounded-3xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-coffee dark:hover:bg-sakura hover:text-creme dark:hover:text-ink transition-all shadow-lg"
                    >
                      <Plus className="w-5 h-5" />
                      Manual
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                    {formData.characters.map((char: any, idx: number) => (
                      <motion.div 
                        key={`create-char-${idx}-${char.name}`}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 bg-white dark:bg-white/5 rounded-[2rem] border border-coffee/10 dark:border-white/10 shadow-sm relative group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            {isEditingChar === idx ? (
                              <input 
                                value={char.name}
                                onChange={(e) => handleUpdateCharacter(idx, { name: e.target.value })}
                                onBlur={() => setIsEditingChar(null)}
                                autoFocus
                                className="bg-transparent border-b border-coffee/20 dark:border-white/20 outline-none font-serif text-lg w-full"
                              />
                            ) : (
                              <h4 className="font-serif text-lg text-coffee dark:text-creme flex items-center gap-2">
                                {char.name}
                                <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-60 cursor-pointer" onClick={() => setIsEditingChar(idx)} />
                              </h4>
                            )}
                            <span className="text-[10px] uppercase tracking-widest opacity-60 font-bold">{char.role || 'Papel não definido'}</span>
                          </div>
                          <button onClick={() => handleDeleteCharacter(idx)} className="p-2 text-red-500/40 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          <p className="text-xs opacity-60 line-clamp-2 italic">"{char.description}"</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-0.5 bg-coffee/5 dark:bg-white/5 rounded-full text-[9px] font-bold uppercase tracking-tighter opacity-50">{char.age} anos</span>
                            <span className="px-2 py-0.5 bg-sakura/10 dark:bg-sakura/10 rounded-full text-[9px] font-bold uppercase tracking-tighter text-sakura">{char.personality?.split(',')[0]}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {step.type === 'type_selection' && (
                <div className="space-y-6">
                  {errors.type && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-red-500 bg-red-500/10 p-4 rounded-2xl border border-red-500/20"
                    >
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-bold">{errors.type}</span>
                    </motion.div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {WORK_TYPES.map(type => {
                      const Icon = OPTION_ICONS[type.id] || Book;
                      return (
                        <motion.button
                          key={type.id}
                          whileHover={{ scale: 1.05, y: -5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOptionSelect(type.id)}
                          aria-label={`Selecionar tipo: ${type.label}`}
                          className={`p-6 text-center rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${
                            formData.type === type.id 
                            ? 'border-coffee dark:border-sakura bg-coffee dark:bg-sakura text-creme dark:text-ink shadow-xl' 
                            : errors.type 
                              ? 'border-red-500/50 bg-white dark:bg-white/5 text-ink/70 dark:text-creme/70'
                              : 'border-snow dark:border-white/5 bg-white dark:bg-white/5 hover:border-coffee/30 dark:hover:border-sakura/30 text-ink/70 dark:text-creme/70'
                          }`}
                        >
                          <div className={`p-4 rounded-2xl ${formData.type === type.id ? 'bg-white/20' : 'bg-coffee/5 dark:bg-white/5'}`}>
                            <Icon className="w-8 h-8" />
                          </div>
                          <div>
                            <span className="text-sm font-serif block font-bold">{type.label}</span>
                            <span className="text-[8px] uppercase tracking-widest opacity-50">{type.id}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step.type === 'select' && step.options && (
                <div className="space-y-6">
                  {step.aiSuggestion && (
                    <button
                      onClick={() => handleGenerateField(step.id)}
                      disabled={isGeneratingField === step.id}
                      className="w-full py-4 bg-coffee/5 dark:bg-white/5 border-2 border-dashed border-coffee/20 dark:border-white/20 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-coffee/10 dark:hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                      {isGeneratingField === step.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Sugerir com IA
                    </button>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {step.options.map(option => {
                      const Icon = OPTION_ICONS[option.id] || Sparkles;
                      return (
                        <motion.button
                          key={option.id}
                          whileHover={{ scale: 1.05, y: -5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOptionSelect(option.id)}
                          aria-label={`Selecionar opção: ${option.label}`}
                          className={`p-6 text-center rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${
                            formData[step.id] === option.id 
                            ? 'border-coffee dark:border-sakura bg-coffee dark:bg-sakura text-creme dark:text-ink shadow-xl' 
                            : 'border-snow dark:border-white/5 bg-white dark:bg-white/5 hover:border-coffee/30 dark:hover:border-sakura/30 text-ink/70 dark:text-creme/70'
                          }`}
                        >
                          <div className={`p-4 rounded-2xl ${formData[step.id] === option.id ? 'bg-white/20' : 'bg-coffee/5 dark:bg-white/5'}`}>
                            <Icon className="w-8 h-8" />
                          </div>
                          <span className="text-sm font-serif font-bold">{option.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step.type === 'genre_selection' && (
                <div className="space-y-6">
                  {errors.genres && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-red-500 bg-red-500/10 p-4 rounded-2xl border border-red-500/20"
                    >
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-bold">{errors.genres}</span>
                    </motion.div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/30 dark:text-creme/30" />
                      <input
                        type="text"
                        placeholder="Busque entre 450+ gêneros e subgêneros..."
                        value={genreSearch}
                        onChange={(e) => setGenreSearch(e.target.value)}
                        aria-label="Buscar gêneros"
                        className="w-full pl-12 pr-6 py-4 bg-snow/50 dark:bg-white/5 border-2 border-snow dark:border-white/5 rounded-2xl focus:border-coffee dark:focus:border-sakura outline-none transition-all text-ink dark:text-creme"
                      />
                    </div>
                    {step.aiSuggestion && (
                      <button
                        onClick={() => handleGenerateField(step.id)}
                        disabled={isGeneratingField === step.id}
                        className="p-4 bg-coffee dark:bg-sakura text-creme dark:text-ink rounded-2xl shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                        title="Sugerir com IA"
                      >
                        {isGeneratingField === step.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.genres.map((g: string) => (
                      <span key={g} className="px-3 py-1 bg-coffee dark:bg-sakura text-creme dark:text-ink rounded-full text-xs flex items-center gap-2">
                        {g} <X className="w-3 h-3 cursor-pointer" onClick={() => handleGenreToggle(g)} />
                      </span>
                    ))}
                    {formData.subgenres.map((s: string) => (
                      <span key={s} className="px-3 py-1 bg-sakura dark:bg-creme text-ink dark:text-coffee rounded-full text-xs flex items-center gap-2">
                        {s} <X className="w-3 h-3 cursor-pointer" onClick={() => handleSubgenreToggle(s)} />
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                    {filteredGenres.map(genre => (
                      <div key={genre.id} className="space-y-3">
                        <button
                          onClick={() => handleGenreToggle(genre.name)}
                          aria-label={`Selecionar gênero: ${genre.name}`}
                          className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex justify-between items-center ${
                            formData.genres.includes(genre.name) ? 'border-coffee dark:border-sakura bg-coffee/5 dark:bg-sakura/5' : 'border-snow dark:border-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {formData.genres.includes(genre.name) ? (
                              <CheckSquare className="w-5 h-5 text-coffee dark:text-sakura" />
                            ) : (
                              <Square className="w-5 h-5 text-ink/20 dark:text-creme/20" />
                            )}
                            <span className="font-serif text-lg text-ink dark:text-creme">{genre.name}</span>
                          </div>
                          {formData.genres.includes(genre.name) && <Check className="w-5 h-5 text-coffee dark:text-sakura" />}
                        </button>
                        <div className="flex flex-wrap gap-2 pl-4">
                          {genre.subgenres.map(sub => (
                            <button
                              key={sub}
                              onClick={() => handleSubgenreToggle(sub)}
                              aria-label={`Selecionar subgênero: ${sub}`}
                              className={`px-3 py-1.5 rounded-xl text-xs border transition-all flex items-center gap-2 ${
                                formData.subgenres.includes(sub) 
                                ? 'bg-sakura border-sakura text-ink' 
                                : 'bg-white dark:bg-white/5 border-snow dark:border-white/5 text-ink/50 dark:text-creme/50 hover:border-sakura/50'
                              }`}
                            >
                              {formData.subgenres.includes(sub) ? (
                                <CheckSquare className="w-3 h-3" />
                              ) : (
                                <Square className="w-3 h-3 opacity-60" />
                              )}
                              {sub}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step.type === 'text' && (
                <div className="space-y-6">
                  <div className="relative">
                    <input
                      type="text"
                      value={formData[step.id] || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, [step.id]: e.target.value });
                        if (errors[step.id]) {
                          const newErrors = { ...errors };
                          delete newErrors[step.id];
                          setErrors(newErrors);
                        }
                      }}
                      placeholder={step.placeholder}
                      aria-label={step.label}
                      className={`w-full p-8 text-2xl bg-snow/30 dark:bg-white/5 border-2 rounded-[2rem] focus:border-coffee dark:focus:border-sakura outline-none transition-all font-serif text-ink dark:text-creme ${
                        errors[step.id] ? 'border-red-500' : 'border-snow dark:border-white/5'
                      }`}
                      autoFocus
                    />
                    {step.aiSuggestion && (
                      <button
                        onClick={() => handleGenerateField(step.id)}
                        disabled={isGeneratingField === step.id}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-coffee dark:bg-sakura text-creme dark:text-ink rounded-2xl shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                        title={step.aiSuggestion === 'expand' ? 'Expandir com IA' : 'Sugerir com IA'}
                      >
                        {isGeneratingField === step.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                  {errors[step.id] && (
                    <p className="text-red-500 text-sm font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors[step.id]}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-ink/30 dark:text-creme/30">
                    <Sparkles className="w-4 h-4" />
                    <p className="text-xs uppercase tracking-widest font-bold">A IA usará isso para moldar sua história</p>
                  </div>
                </div>
              )}
              {step.type === 'textarea' && (
                <div className="space-y-6">
                  <div className="relative">
                    <textarea
                      value={formData[step.id] || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, [step.id]: e.target.value });
                        if (errors[step.id]) {
                          const newErrors = { ...errors };
                          delete newErrors[step.id];
                          setErrors(newErrors);
                        }
                      }}
                      placeholder={step.placeholder}
                      aria-label={step.label}
                      rows={6}
                      className={`w-full p-8 text-xl bg-snow/30 dark:bg-white/5 border-2 rounded-[2rem] focus:border-coffee dark:focus:border-sakura outline-none transition-all font-serif text-ink dark:text-creme resize-none ${
                        errors[step.id] ? 'border-red-500' : 'border-snow dark:border-white/5'
                      }`}
                      autoFocus
                    />
                    {step.aiSuggestion && (
                      <button
                        onClick={() => handleGenerateField(step.id)}
                        disabled={isGeneratingField === step.id}
                        className="absolute right-4 bottom-4 p-4 bg-coffee dark:bg-sakura text-creme dark:text-ink rounded-2xl shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                        title={step.aiSuggestion === 'expand' ? 'Expandir com IA' : 'Sugerir com IA'}
                      >
                        {isGeneratingField === step.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                  {errors[step.id] && (
                    <p className="text-red-500 text-sm font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors[step.id]}
                    </p>
                  )}
                  
                  {step.id === 'description' && (
                    <div className="space-y-4">
                      <button
                        onClick={handleGenerateSynopsis}
                        disabled={isGeneratingSynopsis || !formData.title || !formData.description}
                        className="w-full py-4 bg-coffee/10 dark:bg-sakura/10 text-coffee dark:text-sakura rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-coffee dark:hover:bg-sakura hover:text-creme dark:hover:text-ink transition-all disabled:opacity-50"
                      >
                        {isGeneratingSynopsis ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Gerar Sinopse Detalhada com IA
                      </button>
                      
                      {formData.synopsis && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-6 bg-white dark:bg-white/5 rounded-3xl border border-coffee/10 dark:border-white/10"
                        >
                          <h4 className="text-[10px] uppercase tracking-widest font-bold text-sakura mb-2">Sinopse Gerada</h4>
                          <textarea
                            value={formData.synopsis}
                            onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm leading-relaxed opacity-70 resize-none h-32 custom-scrollbar"
                          />
                        </motion.div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-ink/30 dark:text-creme/30">
                    <Sparkles className="w-4 h-4" />
                    <p className="text-xs uppercase tracking-widest font-bold">Seja detalhado para melhores resultados</p>
                  </div>
                </div>
              )}

              {step.type === 'haiku_essence' && (
                <div className="space-y-8">
                  {errors.haikuEssence && (
                    <div className="text-red-500 text-sm font-bold mb-4">{errors.haikuEssence}</div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Tema</label>
                      <input
                        type="text"
                        value={formData.haikuTheme}
                        onChange={(e) => setFormData({ ...formData, haikuTheme: e.target.value })}
                        placeholder="Ex: Natureza"
                        className="w-full p-4 bg-snow/30 dark:bg-white/5 border-2 border-snow dark:border-white/5 rounded-2xl focus:border-coffee dark:focus:border-sakura outline-none transition-all font-serif"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Sentimento</label>
                      <input
                        type="text"
                        value={formData.haikuFeeling}
                        onChange={(e) => setFormData({ ...formData, haikuFeeling: e.target.value })}
                        placeholder="Ex: Paz"
                        className="w-full p-4 bg-snow/30 dark:bg-white/5 border-2 border-snow dark:border-white/5 rounded-2xl focus:border-coffee dark:focus:border-sakura outline-none transition-all font-serif"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Estação (Kigo)</label>
                      <input
                        type="text"
                        value={formData.haikuSeason}
                        onChange={(e) => setFormData({ ...formData, haikuSeason: e.target.value })}
                        placeholder="Ex: Outono"
                        className="w-full p-4 bg-snow/30 dark:bg-white/5 border-2 border-snow dark:border-white/5 rounded-2xl focus:border-coffee dark:focus:border-sakura outline-none transition-all font-serif"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step.type === 'poem_essence' && (
                <div className="space-y-8">
                  {errors.poemEssence && (
                    <div className="text-red-500 text-sm font-bold mb-4">{errors.poemEssence}</div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Tema</label>
                      <input
                        type="text"
                        value={formData.poemTheme}
                        onChange={(e) => setFormData({ ...formData, poemTheme: e.target.value })}
                        placeholder="Ex: Amor e Perda"
                        className="w-full p-4 bg-snow/30 dark:bg-white/5 border-2 border-snow dark:border-white/5 rounded-2xl focus:border-coffee dark:focus:border-sakura outline-none transition-all font-serif"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-40">Estilo</label>
                      <select
                        value={formData.poemStyle}
                        onChange={(e) => setFormData({ ...formData, poemStyle: e.target.value })}
                        className="w-full p-4 bg-snow/30 dark:bg-white/5 border-2 border-snow dark:border-white/5 rounded-2xl focus:border-coffee dark:focus:border-sakura outline-none transition-all font-serif appearance-none"
                      >
                        <option value="">Selecione um estilo...</option>
                        <option value="free_verse">Verso Livre</option>
                        <option value="sonnet">Soneto</option>
                        <option value="lyrical">Lírico</option>
                        <option value="abstract">Abstrato</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step.type === 'number' && (
                <div className="flex flex-col items-center gap-12 pt-10">
                  <div className="relative w-full max-w-md">
                    <input
                      type="range"
                      min={step.min}
                      max={step.max}
                      value={formData[step.id] || step.min}
                      onChange={(e) => setFormData({ ...formData, [step.id]: parseInt(e.target.value) })}
                      aria-label={step.label}
                      className="w-full h-2 bg-snow dark:bg-white/10 rounded-full appearance-none accent-coffee dark:accent-sakura cursor-pointer"
                    />
                  </div>
                  <div className="text-center">
                    <span className="text-8xl font-serif text-coffee dark:text-creme block mb-2">{formData[step.id] || step.min}</span>
                    <span className="text-sm uppercase tracking-[0.3em] text-ink/30 dark:text-creme/30 font-bold">{step.label}</span>
                  </div>
                </div>
              )}

              {step.type === 'review' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar">
                  <div className="md:col-span-1 space-y-4">
                    <div className={`aspect-[3/4] rounded-[2rem] border-2 border-coffee/10 dark:border-white/10 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden ${formData.aesthetic === 'Noite (Escuro)' ? 'bg-ink text-creme' : 'bg-white text-ink'}`}>
                      {formData.coverUrl ? (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0"
                        >
                          <img 
                            src={formData.coverUrl}
                            alt="Capa Gerada"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover opacity-60"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        </motion.div>
                      ) : (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.03] rounded-bl-full" />
                      )}
                      
                      <div className="relative z-10">
                        <span className="text-[8px] uppercase tracking-[0.3em] font-bold opacity-60">{formData.type}</span>
                        <h3 className="text-xl font-serif leading-tight mt-2">{formData.title || 'Título da Obra'}</h3>
                        <p className="text-[10px] opacity-60 mt-2 line-clamp-4">{formData.description || 'Sua história começa aqui...'}</p>
                      </div>

                      <div className="relative z-10 flex flex-col gap-2">
                        {coverMetadata && (
                          <p className="text-[8px] opacity-60 italic line-clamp-2 mb-2">{coverMetadata.visualDescription}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-sakura animate-pulse" />
                          <span className="text-[8px] uppercase tracking-widest opacity-60">Preview da Capa</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateCover}
                      disabled={isGeneratingCover}
                      className="w-full py-3 bg-snow dark:bg-white/5 rounded-2xl text-[10px] uppercase tracking-widest font-bold hover:bg-coffee dark:hover:bg-sakura hover:text-creme dark:hover:text-ink transition-all flex items-center justify-center gap-2"
                    >
                      {isGeneratingCover ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      {formData.coverUrl ? 'Regerar Capa com IA' : 'Gerar Capa com IA (Baseado na Obra)'}
                    </button>
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {STEPS.slice(0, -1).map(s => {
                      let displayValue = formData[s.id];
                      if (s.type === 'select' && s.options) {
                        const option = s.options.find((o: any) => o.id === formData[s.id]);
                        if (option) displayValue = option.label;
                      } else if (s.id === 'type') {
                        const type = WORK_TYPES.find(t => t.id === formData.type);
                        if (type) displayValue = type.label;
                      } else if (s.id === 'haikuEssence') {
                        displayValue = `${formData.haikuTheme} • ${formData.haikuFeeling} • ${formData.haikuSeason}`;
                      } else if (s.id === 'poemEssence') {
                        displayValue = `${formData.poemTheme} (${formData.poemStyle})`;
                      }
                      
                      return (
                        <div key={s.id} className="p-5 bg-snow/30 dark:bg-white/5 rounded-3xl border border-coffee/5 dark:border-white/5">
                          <span className="text-[10px] uppercase tracking-widest text-coffee/40 dark:text-creme/40 font-bold block mb-2">{s.label}</span>
                          <span className="text-sm font-medium text-ink dark:text-creme leading-relaxed">
                            {Array.isArray(displayValue) 
                              ? displayValue.join(', ') 
                              : (displayValue?.toString() || 'Não definido')}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="md:col-span-3 space-y-6 mt-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-serif text-coffee dark:text-creme">Esboço Inicial</h3>
                      <button
                        onClick={handleGenerateOutline}
                        disabled={isGeneratingOutline}
                        className="px-6 py-2 bg-coffee/5 dark:bg-white/5 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-coffee dark:hover:bg-sakura hover:text-creme dark:hover:text-ink transition-all flex items-center gap-2"
                      >
                        {isGeneratingOutline ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {outlinePreview ? 'Regerar Esboço' : 'Gerar Esboço com IA'}
                      </button>
                    </div>

                    {outlinePreview && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                      >
                        <div className="p-6 bg-white dark:bg-white/5 rounded-[2rem] border border-coffee/10 dark:border-white/10">
                          <h4 className="text-[10px] uppercase tracking-widest font-bold text-sakura mb-4">Capítulos Sugeridos</h4>
                          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {outlinePreview.structure.map((chap: any, i: number) => (
                              <div key={i} className="space-y-1">
                                <span className="text-xs font-bold text-coffee dark:text-creme">{chap.title}</span>
                                <p className="text-[10px] opacity-60 line-clamp-2">{chap.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="p-6 bg-white dark:bg-white/5 rounded-[2rem] border border-coffee/10 dark:border-white/10">
                          <h4 className="text-[10px] uppercase tracking-widest font-bold text-sakura mb-4">Elenco Sugerido</h4>
                          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {outlinePreview.characters.map((char: any, i: number) => (
                              <div key={i} className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs font-bold text-coffee dark:text-creme">{char.name}</span>
                                  <p className="text-[10px] opacity-60">{char.role}</p>
                                </div>
                                <span className="text-[9px] opacity-60">{char.age} anos</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <footer className="mt-12 flex justify-between items-center pt-8 border-t border-coffee/5 dark:border-white/5">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              aria-label="Voltar para o passo anterior"
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all ${
                currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-ink/40 dark:text-creme/40 hover:text-ink dark:hover:text-creme hover:bg-snow dark:hover:bg-white/5'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              {t('common.back')}
            </button>

            <div className="flex gap-4">
              {currentStep < STEPS.length - 1 && (
                <button
                  onClick={() => setCurrentStep(STEPS.length - 1)}
                  className="px-6 py-3 rounded-full text-[10px] uppercase tracking-widest font-bold opacity-60 hover:opacity-100 transition-all"
                >
                  Pular para Revisão
                </button>
              )}
              {step.type === 'genre_selection' && (
                <button
                  onClick={handleNext}
                  aria-label="Pular seleção de gêneros"
                  className="px-10 py-4 bg-snow dark:bg-white/5 text-ink/60 dark:text-creme/60 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-coffee dark:hover:bg-sakura hover:text-creme dark:hover:text-ink transition-all"
                >
                  {t('create.skip_genres')}
                </button>
              )}
              
              {step.type === 'review' ? (
                <button
                  onClick={handleFinish}
                  aria-label="Finalizar criação da obra"
                  className="flex items-center gap-3 px-12 py-5 bg-coffee dark:bg-sakura text-creme dark:text-ink rounded-full font-bold uppercase tracking-widest text-sm hover:bg-ink dark:hover:bg-creme transition-all shadow-[0_15px_30px_rgba(92,64,51,0.3)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.5)]"
                >
                  <Sparkles className="w-5 h-5" />
                  {t('common.finish')}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  aria-label="Ir para o próximo passo"
                  className="flex items-center gap-2 px-12 py-5 bg-coffee dark:bg-sakura text-creme dark:text-ink rounded-full font-bold uppercase tracking-widest text-sm hover:bg-ink dark:hover:bg-creme transition-all shadow-[0_15px_30px_rgba(92,64,51,0.3)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.5)]"
                >
                  {t('common.next')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-5 dark:opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-coffee dark:bg-sakura rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-sakura dark:bg-coffee rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
