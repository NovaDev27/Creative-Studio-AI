import { GoogleGenAI, Type } from "@google/genai";

// AI Service using Google Gemini
const MODELS = {
  TEXT: "gemini-3-flash-preview",
  IMAGE: "gemini-2.5-flash-image",
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

interface AIResponse {
  synopsis: string;
  structure: { title: string; description: string }[];
  characters: { 
    name: string; 
    age: string;
    appearance: string;
    personality: string;
    backstory: string;
    role: string;
    description: string;
  }[];
  world: {
    lore: string;
    description: string;
  };
}

// Simple in-memory cache for AI responses
const aiCache = new Map<string, { response: string, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export const callAI = async (prompt: string, model: string = MODELS.TEXT, schema?: any): Promise<string> => {
  const cacheKey = `${prompt}_${JSON.stringify(schema)}`;
  const cached = aiCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.response;
  }

  try {
    const systemInstruction = "Você é o Oráculo do KŌHĪRA (コヒーラ), um assistente literário de elite especializado em narrativas imersivas. Sua voz é calma, inspiradora e profundamente enraizada na estética lo-fi cozy e na cultura japonesa. Sua missão é ajudar escritores a manifestar obras-primas com profundidade, elegância e precisão, mantendo sempre um tom acolhedor e poético.";

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: schema ? "application/json" : "text/plain",
        responseSchema: schema,
        temperature: 0.7,
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error("O Oráculo permaneceu em silêncio. (Resposta vazia do Gemini)");
    }
    
    console.log(`[AI] Provider used: Gemini (${model})`);

    // Cache the response
    aiCache.set(cacheKey, { response: text, timestamp: Date.now() });
    
    return text;
  } catch (error: any) {
    console.error("AI Service Error:", error);
    throw new Error(error.message || "Falha na conexão com o serviço de inteligência artificial.");
  }
};

export const generateWorkInitialContent = async (workData: any, onProgress?: (p: number, msg: string) => void): Promise<AIResponse | null> => {
  onProgress?.(5, "Analisando premissa da obra...");
  
  const prompt = `
    Você é o Oráculo do KŌHĪRA. Sua missão é manifestar a estrutura de uma nova obra-prima, tecendo fios de criatividade e profundidade.
    Com base na essência fornecida, gere uma estrutura coesa, inspiradora e rica em detalhes.
    
    DADOS DA OBRA:
    Título: ${workData.title}
    Subtítulo: ${workData.subtitle}
    Descrição: ${workData.description}
    Tipo: ${workData.type}
    Gêneros: ${workData.genres.join(', ')}
    Mood: ${workData.mood}
    Tema: ${workData.theme}
    Estilo: ${workData.style}
    POV: ${workData.pov}
    Ambientação: ${workData.setting}
    Mundo: ${workData.worldDescription}
    Conflito: ${workData.conflict}
    Arco: ${workData.arc}
    Capítulos: ${workData.chaptersCount}

    DETALHES ESPECÍFICOS DO TIPO:
    ${workData.type === 'HAIKU' ? `Tema do Haiku: ${workData.haikuTheme}, Sentimento: ${workData.haikuFeeling}, Estação: ${workData.haikuSeason}` : ''}
    ${workData.type === 'POEM' ? `Tema do Poema: ${workData.poemTheme}, Estilo: ${workData.poemStyle}` : ''}
    ${workData.type === 'EPISTOLARY' ? `Remetente: ${workData.sender}, Destinatário: ${workData.recipient}, Relação: ${workData.relationship}, Contexto: ${workData.context}` : ''}
    ${['BIOGRAPHY', 'AUTOBIOGRAPHY'].includes(workData.type) ? `Sujeito: ${workData.subjectName}, Eventos: ${workData.events}, Conflitos: ${workData.conflicts}, Conquistas: ${workData.achievements}` : ''}
    ${workData.type === 'FABLE' ? `Moral da História: ${workData.moral}` : ''}

    REQUISITOS:
    - A sinopse deve ser profissional e cativante.
    - A estrutura deve conter exatamente ${workData.chaptersCount} capítulos com títulos e descrições narrativas que formem um arco completo.
    - Os personagens devem ter motivações claras e profundidade psicológica.
    - A lore do mundo deve ser rica e integrada aos temas da obra.
    - Retorne a resposta estritamente no formato JSON conforme o esquema fornecido.
  `;

  const schema = {
    type: "object",
    properties: {
      synopsis: { type: "string" },
      structure: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" }
          },
          required: ["title", "description"]
        }
      },
      characters: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "string" },
            appearance: { type: "string" },
            personality: { type: "string" },
            backstory: { type: "string" },
            role: { type: "string" },
            description: { type: "string" }
          },
          required: ["name", "age", "appearance", "personality", "backstory", "role", "description"]
        }
      },
      world: {
        type: "object",
        properties: {
          lore: { type: "string" },
          description: { type: "string" }
        },
        required: ["lore", "description"]
      }
    },
    required: ["synopsis", "structure", "characters", "world"]
  };

  try {
    const responseText = await callAI(prompt, MODELS.TEXT, schema);
    const data = JSON.parse(responseText);
    onProgress?.(30, "Estrutura da obra definida com sucesso.");
    return data;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};

export const generateChapterFullContent = async (chapter: any, workContext: any): Promise<string> => {
  const prompt = `
    Você é um autor premiado. Escreva o conteúdo COMPLETO, imersivo e literário do capítulo "${chapter.title}" para a obra "${workContext.title}".
    
    CONTEXTO DA OBRA:
    Sinopse: ${workContext.synopsis}
    Gênero: ${workContext.genres?.join(', ')}
    Estilo: ${workContext.style}
    POV: ${workContext.pov}
    Mundo: ${workContext.worldDescription}
    
    DESCRIÇÃO DO CAPÍTULO:
    ${chapter.description}
    
    REQUISITOS:
    - Escreva de forma profissional, com descrições sensoriais ricas e diálogos autênticos.
    - O capítulo deve ter profundidade emocional e avançar a trama de forma significativa.
    - Mínimo de 1500 palavras para garantir densidade.
    - Retorne APENAS o texto do capítulo em formato HTML (use <p>, <h2>, <em>, <strong>, etc.).
    - Não inclua notas do autor ou introduções.
  `;

  return await callAI(prompt, MODELS.TEXT);
};

export const generateDetailedCharacters = async (count: number, workContext: any): Promise<any[]> => {
  const prompt = `
    Gere ${count} personagens principais extremamente detalhados para a obra "${workContext.title}".
    Contexto: ${workContext.synopsis || workContext.description}
    Gêneros: ${workContext.genres?.join(', ')}
    Retorne a resposta estritamente no formato JSON conforme o esquema fornecido.
  `;

  const schema = {
    type: "object",
    properties: {
      characters: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "string" },
            appearance: { type: "string" },
            personality: { type: "string" },
            backstory: { type: "string" },
            role: { type: "string" },
            description: { type: "string" }
          },
          required: ["name", "age", "appearance", "personality", "backstory", "role", "description"]
        }
      }
    },
    required: ["characters"]
  };

  try {
    const responseText = await callAI(prompt, MODELS.TEXT, schema);
    const data = JSON.parse(responseText);
    return data.characters || [];
  } catch (error) {
    console.error("Character Generation Error:", error);
    throw error;
  }
};

export const generateDetailedWorld = async (workContext: any): Promise<any> => {
  const prompt = `
    Como o Oráculo, revele a lore completa, mitológica e política do mundo para a obra "${workContext.title}".
    Deixe que os detalhes pintem uma paisagem vívida e imersiva.
  `;

  const schema = {
    type: "object",
    properties: {
      lore: { type: "string" },
      description: { type: "string" }
    },
    required: ["lore", "description"]
  };

  try {
    const responseText = await callAI(prompt, MODELS.TEXT, schema);
    return JSON.parse(responseText);
  } catch (error) {
    console.error("World Generation Error:", error);
    throw error;
  }
};


export const generateDetailedSynopsis = async (workContext: any): Promise<string> => {
  const prompt = `
    Gere uma sinopse literária detalhada, profissional e cativante para a obra "${workContext.title}".
    
    DADOS DA OBRA:
    Título: ${workContext.title}
    Descrição Base: ${workContext.description}
    Gêneros: ${workContext.genres?.join(', ')}
    Mood: ${workContext.mood}
    Tema: ${workContext.theme}
    
    REQUISITOS:
    - A sinopse deve ter entre 300 e 500 palavras.
    - Use uma linguagem evocativa e profissional.
    - Destaque o conflito central e a atmosfera.
    - Retorne APENAS o texto da sinopse.
  `;

  return await callAI(prompt, MODELS.TEXT);
};

export const assistantActions = {
  rewriteChapter: async (text: string, context?: any) => {
    const prompt = `
      Você é um assistente literário de elite. Refine o CAPÍTULO INTEIRO abaixo, mantendo totalmente a ideia original.
      Corrija gramática, melhore a fluidez e a clareza sem alterar eventos, personagens ou o significado da história.
      
      CONTEÚDO DO CAPÍTULO:
      "${text}"
      
      CONTEXTO DA OBRA:
      Título: ${context?.title}
      Sinopse: ${context?.synopsis}
      
      REQUISITOS:
      - NÃO altere eventos principais, NÃO mude personagens, NÃO crie novas informações fora do contexto.
      - Apenas melhore o que já existe.
      - Retorne APENAS o texto refinado em formato HTML (use <p>, <h2>, <em>, <strong>, etc.).
      - Não adicione comentários ou introduções.
    `;
    return await callAI(prompt);
  },
  expand: async (text: string, context?: any) => {
    const prompt = `
      Como o Oráculo, sua tarefa é o "Florescer Narrativo". Enriqueça a essência abaixo com descrições sutis e sensoriais.
      Sinta a atmosfera e melhore a ambientação com elegância, sem alterar o destino dos personagens ou a estrutura dos eventos.
      
      ESSÊNCIA PARA FLORESCER: "${text}"
      
      CONTEXTO DA OBRA:
      Título: ${context?.title}
      Sinopse: ${context?.synopsis?.slice(0, 500)}
      
      REQUISITOS:
      - NÃO altere eventos principais, NÃO mude personagens, NÃO crie novas informações fora do contexto.
      - Apenas melhore o que já existe.
      - Retorne apenas o texto expandido.
    `;
    return await callAI(prompt);
  },
  rewrite: async (text: string, context?: any) => {
    const prompt = `
      Como o Oráculo, sua tarefa é o "Polir Trecho". Reescreva este fragmento para que ressoe com maior impacto emocional e clareza, como o som de um sino ao entardecer.
      
      FRAGMENTO PARA POLIR: "${text}"
      
      CONTEXTO DA OBRA:
      Título: ${context?.title}
      Sinopse: ${context?.synopsis?.slice(0, 500)}
      
      REQUISITOS:
      - NÃO altere eventos principais, NÃO mude personagens, NÃO crie novas informações fora do contexto.
      - Apenas melhore o que já existe.
      - Retorne apenas o texto polido.
    `;
    return await callAI(prompt);
  },
  dialogue: async (text: string, context?: any) => {
    const prompt = `
      Como o Oráculo, sua tarefa é "Dar Voz". Melhore os diálogos no texto sagrado abaixo.
      Torne as falas mais naturais, expressivas e fiéis à alma de cada personagem.
      
      TEXTO COM DIÁLOGOS: "${text}"
      
      CONTEXTO DA OBRA:
      Título: ${context?.title}
      Sinopse: ${context?.synopsis?.slice(0, 500)}
      
      REQUISITOS:
      - NÃO altere eventos principais, NÃO mude personagens, NÃO crie novas informações fora do contexto.
      - Apenas melhore o que já existe.
      - Retorne apenas o texto com os diálogos aprimorados.
    `;
    return await callAI(prompt);
  },
  emotion: async (text: string, emotion: string, context?: any) => {
    const prompt = `
      Você é um assistente literário. Intensifique a emoção "${emotion}" no texto de forma sutil (Infundir Sentimento).
      Não exagere nem altere o contexto original.
      
      TEXTO PARA AJUSTAR: "${text}"
      
      CONTEXTO DA OBRA:
      Título: ${context?.title}
      Sinopse: ${context?.synopsis?.slice(0, 500)}
      
      REQUISITOS:
      - NÃO altere eventos principais, NÃO mude personagens, NÃO crie novas informações fora do contexto.
      - Apenas melhore o que já existe.
      - Retorne apenas o texto com a emoção ajustada.
    `;
    return await callAI(prompt);
  },
  continueWriting: async (text: string, context?: any) => {
    const prompt = `
      Você é um assistente literário. Continue a história (Seguir o Fio) respeitando o contexto, tom e acontecimentos já definidos.
      
      TRECHO ATUAL: "${text}"
      
      CONTEXTO DA OBRA:
      Título: ${context?.title}
      Sinopse: ${context?.synopsis?.slice(0, 500)}
      
      CONTEÚDO RECENTE (últimos 1000 caracteres):
      ${context?.recentContent?.slice(-1000)}
      
      REQUISITOS:
      - NÃO altere eventos principais, NÃO mude personagens, NÃO crie novas informações fora do contexto.
      - Escreva pelo menos 2-3 parágrafos novos que sigam logicamente o texto anterior.
      - Retorne apenas o novo texto gerado.
    `;
    return await callAI(prompt);
  },
  synopsis: async (text: string, context?: any) => {
    const prompt = `Gere uma sinopse literária detalhada com base no conteúdo: "${text}"\nContexto: ${JSON.stringify(context)}`;
    return await callAI(prompt);
  },
  worldLore: async (text: string, context?: any) => {
    return await generateDetailedWorld({ ...context, worldDescription: text });
  },
  characterProfile: async (charData: { name: string, description: string }, context?: any) => {
    const prompt = `
      Gere um perfil literário profundo e detalhado para o personagem "${charData.name}".
      Base: ${charData.description}
      Contexto da Obra: ${context?.title} - ${context?.synopsis?.slice(0, 500)}
      
      REQUISITOS:
      - Retorne a resposta estritamente no formato JSON conforme o esquema fornecido.
    `;

    const schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "string" },
        appearance: { type: "string" },
        personality: { type: "string" },
        backstory: { type: "string" },
        role: { type: "string" },
        description: { type: "string" }
      },
      required: ["name", "age", "appearance", "personality", "backstory", "role", "description"]
    };

    const responseText = await callAI(prompt, MODELS.TEXT, schema);
    return JSON.parse(responseText);
  },
  generateImagePrompt: async (workData: any) => {
    const prompt = `
      Você é o cérebro do KŌHĪRA. Sua tarefa é interpretar a solicitação de capa do usuário e criar um prompt otimizado para o gerador visual.
      
      DADOS DA OBRA:
      Título: ${workData.title}
      Descrição: ${workData.description}
      Sinopse: ${workData.synopsis || workData.description}
      Tema: ${workData.theme}
      Estilo Visual: ${workData.coverStyle || 'Cinematic'}
      Gêneros: ${workData.genres?.join(', ')}
      
      INSTRUÇÕES:
      1. Analise os elementos-chave, estilo, humor, cores e cenário.
      2. Expanda e refine a descrição em um prompt em INGLÊS extremamente detalhado e descritivo.
      3. Use termos que maximizem a qualidade (ex: "high resolution", "intricate details", "digital painting", "masterpiece").
      4. O prompt deve ser focado em uma capa de livro (book cover).
      5. Retorne APENAS o prompt otimizado em inglês, sem comentários ou aspas.
    `;
    return await callAI(prompt);
  }
};

export const generateCoverImage = async (userDescription: string, workContext: any): Promise<string> => {
  const optimizationPrompt = `
    Você é o cérebro do KŌHĪRA. Sua tarefa é criar um prompt em INGLÊS extremamente detalhado e descritivo para uma capa de livro.
    
    SOLICITAÇÃO DO USUÁRIO: "${userDescription}"
    CONTEXTO DA OBRA:
    Título: ${workContext.title}
    Descrição: ${workContext.description}
    Gênero: ${workContext.genres?.join(', ')}
    Tema: ${workContext.theme}
    Estilo Visual: ${workContext.coverStyle}
    
    Retorne APENAS o prompt otimizado em inglês.
  `;

  try {
    const optimizedPrompt = await callAI(optimizationPrompt, MODELS.TEXT);
    
    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: `Book cover for "${workContext.title}". ${optimizedPrompt}`,
    });

    let imageUrl = "";
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          imageUrl = `data:image/png;base64,${base64EncodeString}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      // Fallback to Unsplash if image generation fails or returns no image
      const keyword = encodeURIComponent(workContext.title.split(' ').slice(0, 3).join(' '));
      return `https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=1024&h=1792&q=80&sig=${keyword}`;
    }

    return imageUrl;
  } catch (error) {
    console.error("Cover Generation Error:", error);
    // Fallback to placeholder if real generation fails
    return `https://picsum.photos/seed/${encodeURIComponent(workContext.title)}/1024/1792`;
  }
};

export const generateCoverPrompt = assistantActions.generateImagePrompt;

export const generateFieldSuggestion = async (fieldName: string, workContext: any): Promise<string> => {
  const prompt = `
    Como assistente literário do KŌHĪRA, sugira um valor criativo e inspirador para o campo "${fieldName}" da obra "${workContext.title}".
    
    CONTEXTO ATUAL:
    Título: ${workContext.title}
    Descrição: ${workContext.description}
    Tipo: ${workContext.type}
    Gêneros: ${workContext.genres?.join(', ')}
    
    REQUISITOS:
    - Retorne APENAS a sugestão, sem comentários ou introduções.
    - A sugestão deve ser curta e impactante (máximo 10 palavras).
    - Se o campo for "Mood", "Style", "POV", "Timeline", "Conflict" ou "Arc", escolha algo que combine com o contexto.
  `;
  return await callAI(prompt);
};

export const suggestWritingStyle = async (workContext: any): Promise<string> => {
  const prompt = `
    Com base na descrição da obra "${workContext.title}", sugira o estilo de escrita mais adequado (ex: Poético, Direto, Descritivo, Minimalista, Humorístico, Cínico).
    
    DESCRIÇÃO: ${workContext.description}
    TIPO: ${workContext.type}
    
    Retorne APENAS o nome do estilo sugerido que corresponda a uma das opções válidas.
  `;
  return await callAI(prompt);
};

export const suggestGenres = async (workContext: any): Promise<{ main: string, subgenres: string[] }> => {
  const prompt = `
    Com base na descrição e no mood da obra "${workContext.title}", sugira o gênero principal e até 3 subgêneros.
    
    DESCRIÇÃO: ${workContext.description}
    MOOD: ${workContext.mood}
    
    Retorne a resposta estritamente no formato JSON:
    {
      "main": "Nome do Gênero Principal",
      "subgenres": ["Subgênero 1", "Subgênero 2", "Subgênero 3"]
    }
  `;
  
  const schema = {
    type: "object",
    properties: {
      main: { type: "string" },
      subgenres: { 
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["main", "subgenres"]
  };

  const responseText = await callAI(prompt, MODELS.TEXT, schema);
  return JSON.parse(responseText);
};

export const expandWorkDescription = async (workContext: any): Promise<string> => {
  const prompt = `
    Expanda a descrição inicial da obra "${workContext.title}" para torná-la mais detalhada, focando na atmosfera e no conflito principal.
    
    DESCRIÇÃO ATUAL: ${workContext.description}
    TIPO: ${workContext.type}
    MOOD: ${workContext.mood}
    
    REQUISITOS:
    - Mantenha a essência original.
    - Adicione detalhes sensoriais e emocionais.
    - Destaque o que está em jogo (conflito).
    - Retorne APENAS a descrição expandida (máximo 200 palavras).
  `;
  return await callAI(prompt);
};
