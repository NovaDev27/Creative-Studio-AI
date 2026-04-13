export interface Genre {
  id: string;
  name: string;
  category: string;
  subgenres: string[];
}

export const GENRES: Genre[] = [
  {
    id: 'romance',
    name: 'Romance',
    category: 'Romance',
    subgenres: [
      'Romance Contemporâneo', 'Romance Histórico', 'Romance de Época', 'Romance Paranormal',
      'Romance de Fantasia', 'Romance Sci-Fi', 'Romance Policial', 'Romance Psicológico',
      'Romance Erótico', 'Romance New Adult', 'Romance Young Adult', 'Romance Proibido',
      'Inimigos para Amantes', 'Amigos para Amantes', 'Segunda Chance', 'Triângulo Amoroso',
      'Romance de Escritório', 'Romance Rural', 'Romance Urbano', 'Romance de Verão',
      'Romance de Inverno', 'Romance de Natal', 'Romance LGBTQ+', 'Romance Transgênero',
      'Romance Não-Binário', 'Romance Poliamoroso', 'Romance de Viagem no Tempo',
      'Romance de Reencarnação', 'Romance de Alma Gêmea', 'Romance de Destino'
    ]
  },
  {
    id: 'fantasy',
    name: 'Fantasia',
    category: 'Fantasia',
    subgenres: [
      'Alta Fantasia', 'Baixa Fantasia', 'Fantasia Urbana', 'Fantasia Sombria',
      'Fantasia Épica', 'Fantasia Heroica', 'Fantasia de Espada e Feitiçaria',
      'Fantasia Mitológica', 'Fantasia de Conto de Fadas', 'Fantasia Folclórica',
      'Fantasia de Realismo Mágico', 'Fantasia de Steampunk', 'Fantasia de Gaslamp',
      'Fantasia de Grimdark', 'Fantasia de LitRPG', 'Fantasia de Cultivo (Xianxia)',
      'Fantasia de Wuxia', 'Fantasia de Isekai', 'Fantasia de Reencarnação',
      'Fantasia de Portal', 'Fantasia de Escola de Magia', 'Fantasia de Dragões',
      'Fantasia de Vampiros', 'Fantasia de Lobisomens', 'Fantasia de Elfos',
      'Fantasia de Anões', 'Fantasia de Orcs', 'Fantasia de Deuses',
      'Fantasia de Demônios', 'Fantasia de Anjos'
    ]
  },
  {
    id: 'scifi',
    name: 'Ficção Científica',
    category: 'Ficção Científica',
    subgenres: [
      'Hard Sci-Fi', 'Soft Sci-Fi', 'Cyberpunk', 'Post-Cyberpunk', 'Solarpunk',
      'Steampunk', 'Dieselpunk', 'Biopunk', 'Nanopunk', 'Space Opera',
      'Viagem Espacial', 'Primeiro Contato', 'Invasão Alienígena', 'Viagem no Tempo',
      'Realidades Alternativas', 'Distopia', 'Utopia', 'Pós-Apocalíptico',
      'Apocalíptico', 'Inteligência Artificial', 'Robótica', 'Transumanismo',
      'Exploração Planetária', 'Colonização Espacial', 'Guerra Galáctica',
      'Império Galáctico', 'Sci-Fi Militar', 'Sci-Fi Psicológico', 'Sci-Fi Social',
      'Sci-Fi New Wave'
    ]
  },
  {
    id: 'horror',
    name: 'Terror',
    category: 'Terror',
    subgenres: [
      'Terror Psicológico', 'Terror de Sobrevivência', 'Terror Cósmico (Lovecraftiano)',
      'Terror Corporal (Body Horror)', 'Terror de Fantasmas', 'Terror de Possessão',
      'Terror de Slasher', 'Terror de Criaturas', 'Terror de Zumbis', 'Terror de Vampiros',
      'Terror de Lobisomens', 'Terror de Demônios', 'Terror de Culto', 'Terror de Folclore',
      'Terror de Gótico', 'Terror de Mansão Assombrada', 'Terror de Floresta',
      'Terror de Oceano', 'Terror de Espaço', 'Terror de Tecnologia', 'Terror de Found Footage',
      'Terror de Extremismo', 'Terror de Comédia', 'Terror de Suspense', 'Terror de Mistério',
      'Terror de Sobrenatural', 'Terror de Paranormal', 'Terror de Ocultismo',
      'Terror de Ritual', 'Terror de Maldição'
    ]
  },
  {
    id: 'mystery',
    name: 'Mistério',
    category: 'Mistério',
    subgenres: [
      'Mistério de Assassinato', 'Mistério de Quarto Fechado', 'Mistério de Cozy',
      'Mistério de Hardboiled', 'Mistério de Noir', 'Mistério de Neo-Noir',
      'Mistério de Detetive Particular', 'Mistério de Polícia', 'Mistério de Forense',
      'Mistério de Espionagem', 'Mistério de Thriller Policial', 'Mistério de Thriller Jurídico',
      'Mistério de Thriller Médico', 'Mistério de Thriller Tecnológico', 'Mistério de Thriller Psicológico',
      'Mistério de Thriller de Ação', 'Mistério de Suspense', 'Mistério de Conspiração',
      'Mistério de Roubo', 'Mistério de Sequestro', 'Mistério de Desaparecimento',
      'Mistério de Identidade', 'Mistério de Memória', 'Mistério de Passado Sombrio',
      'Mistério de Segredo de Família', 'Mistério de Cidade Pequena', 'Mistério de Grande Cidade',
      'Mistério de Época', 'Mistério de Sobrenatural', 'Mistério de Paranormal'
    ]
  },
  {
    id: 'drama',
    name: 'Drama',
    category: 'Drama',
    subgenres: [
      'Drama Familiar', 'Drama de Relacionamento', 'Drama de Amizade', 'Drama de Amadurecimento',
      'Drama de Tragédia', 'Drama de Melancolia', 'Drama de Superação', 'Drama de Redenção',
      'Drama de Sacrifício', 'Drama de Traição', 'Drama de Perdão', 'Drama de Luto',
      'Drama de Solidão', 'Drama de Identidade', 'Drama de Crise Existencial',
      'Drama de Conflito Social', 'Drama de Pobreza', 'Drama de Riqueza',
      'Drama de Poder', 'Drama de Ambição', 'Drama de Queda', 'Drama de Ascensão',
      'Drama de Guerra', 'Drama de Sobrevivência', 'Drama de Doença', 'Drama de Deficiência',
      'Drama de Saúde Mental', 'Drama de Vício', 'Drama de Obsessão', 'Drama de Paixão'
    ]
  },
  {
    id: 'action',
    name: 'Ação',
    category: 'Ação',
    subgenres: [
      'Ação de Aventura', 'Ação de Artes Marciais', 'Ação de Espionagem', 'Ação de Militar',
      'Ação de Policial', 'Ação de Super-Herói', 'Ação de Sobrevivência', 'Ação de Caça ao Tesouro',
      'Ação de Corrida', 'Ação de Esportes', 'Ação de Guerra', 'Ação de Mercenário',
      'Ação de Vingança', 'Ação de Resgate', 'Ação de Fuga', 'Ação de Invasão',
      'Ação de Tiroteio', 'Ação de Perseguição', 'Ação de Combate', 'Ação de Torneio',
      'Ação de Fantasia', 'Ação de Sci-Fi', 'Ação de Terror', 'Ação de Comédia',
      'Ação de Drama', 'Ação de Thriller', 'Ação de Noir', 'Ação de Western',
      'Ação de Samurai', 'Ação de Ninja'
    ]
  },
  {
    id: 'slice_of_life',
    name: 'Slice of Life',
    category: 'Slice of Life',
    subgenres: [
      'Cotidiano Escolar', 'Cotidiano Universitário', 'Cotidiano de Trabalho',
      'Cotidiano Rural', 'Cotidiano Urbano', 'Cotidiano de Família', 'Cotidiano de Amigos',
      'Cotidiano de Casal', 'Cotidiano de Solteiro', 'Cotidiano de Idoso', 'Cotidiano de Criança',
      'Cotidiano de Animal', 'Cotidiano de Viagem', 'Cotidiano de Hobby', 'Cotidiano de Comida',
      'Cotidiano de Café', 'Cotidiano de Biblioteca', 'Cotidiano de Arte', 'Cotidiano de Música',
      'Cotidiano de Esporte', 'Cotidiano de Natureza', 'Cotidiano de Cidade Pequena',
      'Cotidiano de Grande Metrópole', 'Cotidiano de Nostalgia', 'Cotidiano de Melancolia',
      'Cotidiano de Felicidade', 'Cotidiano de Pequenas Vitórias', 'Cotidiano de Pequenas Perdas',
      'Cotidiano de Mudança', 'Cotidiano de Rotina'
    ]
  },
  {
    id: 'psychological',
    name: 'Psicológico',
    category: 'Psicológico',
    subgenres: [
      'Thriller Psicológico', 'Drama Psicológico', 'Horror Psicológico', 'Mistério Psicológico',
      'Estudo de Personagem', 'Fluxo de Consciência', 'Narrador Não Confiável',
      'Trauma e Recuperação', 'Dualidade da Mente', 'Loucura e Sanidade',
      'Obsessão e Compulsão', 'Medo e Fobia', 'Culpa e Remorso', 'Identidade e Ego',
      'Memória e Esquecimento', 'Sonho e Realidade', 'Alucinação e Delírio',
      'Manipulação e Controle', 'Isolamento e Solidão', 'Alienação Social',
      'Conflito Interno', 'Dilema Moral', 'Crise de Meia Idade', 'Crise de Identidade',
      'Psicologia Criminal', 'Psicologia Infantil', 'Psicologia de Grupo',
      'Psicologia Evolutiva', 'Psicologia Existencial', 'Psicologia Humanista'
    ]
  },
  {
    id: 'historical',
    name: 'Histórico',
    category: 'Histórico',
    subgenres: [
      'Ficção Histórica', 'Romance Histórico', 'Mistério Histórico', 'Thriller Histórico',
      'Épico Histórico', 'Biografia Histórica', 'História Alternativa', 'Ucronia',
      'Antiguidade', 'Idade Média', 'Renascimento', 'Era Vitoriana', 'Era Eduardiana',
      'Guerra Civil', 'Primeira Guerra Mundial', 'Segunda Guerra Mundial', 'Guerra Fria',
      'Revolução Francesa', 'Revolução Industrial', 'Era dos Descobrimentos',
      'Império Romano', 'Grécia Antiga', 'Egito Antigo', 'Japão Feudal', 'China Antiga',
      'Velho Oeste (Western)', 'Pirataria', 'Era do Jazz', 'Anos 60', 'Anos 70'
    ]
  },
  {
    id: 'school',
    name: 'Escolar',
    category: 'Escolar',
    subgenres: [
      'Vida Escolar', 'Romance Escolar', 'Drama Escolar', 'Comédia Escolar',
      'Mistério Escolar', 'Terror Escolar', 'Esportes Escolares', 'Clubes Escolares',
      'Conselho Estudantil', 'Delinquentes Escolares', 'Bullying e Superação',
      'Amizade Escolar', 'Primeiro Amor', 'Exames e Pressão', 'Formatura',
      'Escola de Magia', 'Escola de Artes', 'Escola Militar', 'Internato',
      'Universidade', 'Vida de Dormitório', 'Professor e Aluno', 'Rivais de Classe',
      'Transferência de Aluno', 'Viagem Escolar', 'Festival Escolar', 'Competição Acadêmica',
      'Talento Prodígio', 'Vida de Nerd', 'Vida de Popular'
    ]
  },
  {
    id: 'supernatural',
    name: 'Sobrenatural',
    category: 'Sobrenatural',
    subgenres: [
      'Fantasmas e Espíritos', 'Vampiros', 'Lobisomens', 'Bruxas e Feiticeiros',
      'Demônios e Anjos', 'Deuses e Semideuses', 'Criaturas Mitológicas', 'Criptídeos',
      'Poderes Psíquicos', 'Telepatia e Telecinese', 'Clarividência', 'Projeção Astral',
      'Reencarnação', 'Viagem no Tempo Sobrenatural', 'Mundos Paralelos', 'Dimensões Espirituais',
      'Maldições e Bençãos', 'Rituais e Ocultismo', 'Exorcismo', 'Caça aos Monstros',
      'Investigação Paranormal', 'Romance Sobrenatural', 'Thriller Sobrenatural',
      'Horror Sobrenatural', 'Fantasia Sobrenatural', 'Vida Após a Morte',
      'Guia Espiritual', 'Contrato com Demônio', 'Herança Sobrenatural', 'Transformação'
    ]
  }
];

// This list covers 12 categories with 30 subgenres each = 360 items.
// To reach 450+, we can add more categories or expand subgenres.
// Let's add more categories to reach the goal.

export const ADDITIONAL_GENRES: Genre[] = [
  {
    id: 'western',
    name: 'Western',
    category: 'Western',
    subgenres: [
      'Classic Western', 'Revisionist Western', 'Spaghetti Western', 'Weird West',
      'Space Western', 'Contemporary Western', 'Bounty Hunter', 'Outlaw',
      'Gunfighter', 'Cattle Drive', 'Frontier Life', 'Native American Stories',
      'Gold Rush', 'Railroad Expansion', 'Lawman', 'Revenge Western'
    ]
  },
  {
    id: 'comedy',
    name: 'Comédia',
    category: 'Comédia',
    subgenres: [
      'Comédia Romântica', 'Comédia de Erros', 'Sátira', 'Paródia', 'Humor Negro',
      'Slapstick', 'Comédia de Costumes', 'Comédia de Situação (Sitcom)',
      'Comédia Absurda', 'Comédia de Observação', 'Comédia de Personagem',
      'Comédia de Diálogo', 'Comédia de Ação', 'Comédia de Terror',
      'Comédia de Fantasia', 'Comédia de Sci-Fi'
    ]
  },
  {
    id: 'biography',
    name: 'Biografia',
    category: 'Não-Ficção',
    subgenres: [
      'Autobiografia', 'Memórias', 'Biografia Autorizada', 'Biografia Não Autorizada',
      'Biografia Espiritual', 'Biografia Política', 'Biografia Artística',
      'Biografia Científica', 'Biografia Esportiva', 'Biografia de Negócios',
      'Diário', 'Cartas (Epistolar)', 'Ensaio Pessoal', 'Narrativa de Viagem'
    ]
  }
];

export const ALL_GENRES = [...GENRES, ...ADDITIONAL_GENRES];
