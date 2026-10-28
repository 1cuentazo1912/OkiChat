import { Room, Profile } from '../types';

export const ROOMS_CAPACITY = 50;

// Lista de las 10 salas generales
export const STANDARD_ROOMS: Room[] = Array.from({ length: 10 }, (_, index) => {
  const num = index + 1;
  return {
    id: `general-${num}`,
    nombre: `Sala General ${num}`,
    capacidad: ROOMS_CAPACITY,
    userCount: 0,
    description: 'Charla general de la comunidad OKI !',
  };
});

// Salas Especiales (Etapa 4)
export const SPECIAL_ROOMS: Room[] = [
  {
    id: 'recien-llegados',
    nombre: 'Sala Recién Llegados',
    capacidad: ROOMS_CAPACITY,
    userCount: 0,
    isSpecial: 'recien-llegados',
    description: 'Sala moderada para dar la bienvenida a nuevos miembros con reglas y ayuda.',
  },
  {
    id: 'sala-silenciosa',
    nombre: 'Sala Silenciosa (30s)',
    capacidad: ROOMS_CAPACITY,
    userCount: 0,
    isSpecial: 'sala-silenciosa',
    description: 'Sala de reflexión y charla pausada: solo 1 mensaje cada 30 segundos por usuario.',
  },
];

// Todas las salas disponibles
export const ALL_ROOMS: Room[] = [
  SPECIAL_ROOMS[0], // Recién llegados primero
  ...STANDARD_ROOMS,
  SPECIAL_ROOMS[1], // Sala silenciosa
];

export const INITIAL_ROOMS: Room[] = ALL_ROOMS;

export type OccupancyLevel = 'green' | 'yellow' | 'red';

export function getOccupancyLevel(userCount: number): OccupancyLevel {
  if (userCount < 25) return 'green';
  if (userCount <= 44) return 'yellow';
  return 'red';
}

export function getOccupancyBadgeColor(level: OccupancyLevel) {
  switch (level) {
    case 'green':
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-800',
        border: 'border-emerald-400',
        dot: 'bg-emerald-500',
        label: 'Libre',
      };
    case 'yellow':
      return {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        border: 'border-amber-400',
        dot: 'bg-amber-500',
        label: 'Media',
      };
    case 'red':
      return {
        bg: 'bg-rose-100',
        text: 'text-rose-800',
        border: 'border-rose-400',
        dot: 'bg-rose-500',
        label: 'Llena',
      };
  }
}

/**
 * 30 Temas del Día rotativos a las 00:00 (Icebreakers)
 */
export const DAILY_TOPICS: string[] = [
  '¿Qué canción o disco te acompañó hoy?',
  '¿Cuál fue tu primer teléfono móvil o computadora de los 2000?',
  '¿Qué comida o postre te alegra siempre el día?',
  '¿Si pudieras viajar a cualquier año de la década del 2000, cuál elegirías y por qué?',
  '¿Cuál es la película que has visto más de tres veces?',
  '¿Qué videojuego clásico te marcó para siempre?',
  '¿Prefieres salir un fin de semana de fiesta o maratón de series/pelis en casa?',
  '¿Cuál es tu lugar favorito para relajarte y desconectar?',
  '¿Qué moda o recuerdo de los 2000s extrañas más?',
  '¿Cuál ha sido tu viaje o aventura más memorable?',
  '¿Qué talento oculto o habilidad curiosa tienes?',
  '¿Cuál es tu estación del año favorita y qué te gusta hacer en ella?',
  '¿Qué libro o historia recomendarías a cualquiera en este chat?',
  '¿Cuál es el mejor concierto o evento en vivo al que has asistido?',
  '¿Café, té, mate o chocolate caliente para empezar el día?',
  '¿Qué aplicación de internet vintage recuerdas con más cariño (MSN, mIRC, Napster)?',
  '¿Cuál es tu serie animada o de comedia de la infancia?',
  '¿Qué consejo le darías a tu yo de hace 10 años?',
  '¿Cuál es el plato típico de tu ciudad que todos deberían probar?',
  '¿Qué instrumento te gustaría aprender a tocar si tuvieras tiempo infinito?',
  '¿Cuál es tu emoji o emoticono favorito de siempre?',
  '¿Madrugar con el sol o quedarte despierto hasta la madrugada?',
  '¿Qué invento de la tecnología moderna te parece más asombroso?',
  '¿Cuál es la canción que te sabes completa de memoria palabra por palabra?',
  '¿Tienes mascotas o cuál es tu animal preferido?',
  '¿Qué meta o proyecto personal te entusiasma este mes?',
  '¿Cuál fue el primer sitio web que visitaste con internet dial-up?',
  '¿Cuál es tu juego de mesa o de cartas preferido para jugar con amigos?',
  '¿Qué superpoder elegirías tener por 24 horas?',
  '¿Qué te hace reír sin importar qué tan pesado haya sido el día?',
];

export function getDailyTopic(): { topic: string; dayIndex: number } {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diffDays = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  const dayIndex = diffDays % DAILY_TOPICS.length;
  return { topic: DAILY_TOPICS[dayIndex], dayIndex: dayIndex + 1 };
}

/**
 * 30 Emoticonos clásicos de texto retro
 */
export interface EmoticonItem {
  code: string;
  name: string;
  category: string;
}

export const CLASSIC_30_EMOTICONS: EmoticonItem[] = [
  { code: ':-)', name: 'Sonrisa', category: 'Caras' },
  { code: ';-)', name: 'Guiño', category: 'Caras' },
  { code: ':-D', name: 'Risa alegre', category: 'Caras' },
  { code: ':-P', name: 'Sacando lengua', category: 'Caras' },
  { code: ':-O', name: 'Sorprendido', category: 'Caras' },
  { code: 'B-)', name: 'Cool con gafas', category: 'Caras' },
  { code: '<3', name: 'Corazón', category: 'Símbolos' },
  { code: '(Y)', name: 'Pulgar arriba', category: 'Gestos' },
  { code: '(N)', name: 'Pulgar abajo', category: 'Gestos' },
  { code: ':-/', name: 'Duda / Mueca', category: 'Caras' },
  { code: ':-*', name: 'Beso', category: 'Afecto' },
  { code: '>:(', name: 'Enojado', category: 'Emociones' },
  { code: ':\'(', name: 'Llorando', category: 'Emociones' },
  { code: ':-X', name: 'Boca sellada', category: 'Caras' },
  { code: 'O:-)', name: 'Ángel', category: 'Personajes' },
  { code: ':-[', name: 'Avergonzado', category: 'Emociones' },
  { code: '8-)', name: 'Ojos redondos', category: 'Caras' },
  { code: ':-$', name: 'Apenado / Dinero', category: 'Emociones' },
  { code: ':-!', name: 'Confundido', category: 'Caras' },
  { code: ':-#', name: 'Boca con candado', category: 'Caras' },
  { code: ':-@', name: 'Gritando', category: 'Emociones' },
  { code: '(H)', name: 'Super Cool', category: 'Gestos' },
  { code: '(A)', name: 'Angelical', category: 'Personajes' },
  { code: '(L)', name: 'Enamorado', category: 'Afecto' },
  { code: '(U)', name: 'Corazón roto', category: 'Emociones' },
  { code: '(K)', name: 'Pintalabios', category: 'Afecto' },
  { code: '(G)', name: 'Regalo', category: 'Objetos' },
  { code: '(F)', name: 'Rosa roja', category: 'Objetos' },
  { code: '(W)', name: 'Rosa marchita', category: 'Objetos' },
  { code: ':-|', name: 'Serio / Indiferente', category: 'Caras' },
];

export interface ModernEmojiCategory {
  category: string;
  emojis: string[];
}

export const MODERN_EMOJIS_CATEGORIES: ModernEmojiCategory[] = [
  {
    category: 'Caritas & Emociones',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😜', '🤪', '😎', '🥳', '🥺', '😭', '😱', '😡', '🤯', '😴', '😷', '🤖', '👻', '💀'],
  },
  {
    category: 'Gestos & Manos',
    emojis: ['👍', '👎', '👏', '🙌', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '🤙', '👊', '👌', '👋', '💪', '👀', '🧠'],
  },
  {
    category: 'Corazones & Fuego',
    emojis: ['❤️', '💖', '💘', '💔', '🔥', '✨', '⭐', '🌟', '💥', '💯', '✔️', '⚡', '🎵', '🎶', '💬'],
  },
  {
    category: 'Fiesta & Objetos',
    emojis: ['🎉', '🎈', '🎁', '🍕', '🍔', '🍟', '🍦', '☕', '🍺', '🥂', '🚀', '🛸', '🎮', '🕹️', '🏆'],
  },
];

/**
 * Insignias de Usuario:
 * - "Veterano" 🎖️: Más de 30 días registrado
 * - "Madrugador" 🌅: Escribe entre 5 y 9 AM
 * - "Nocturno" 🌙: Escribe entre 22:00 (10 PM) y 3:00 AM
 */
export interface BadgeInfo {
  id: 'veterano' | 'madrugador' | 'nocturno';
  label: string;
  emoji: string;
  bg: string;
  text: string;
  description: string;
}

export function getUserBadges(profile?: Profile, messageTimestamp?: string): BadgeInfo[] {
  const badges: BadgeInfo[] = [];

  // 1. Veterano (> 30 días)
  if (profile?.created_at) {
    const createdTime = new Date(profile.created_at).getTime();
    const daysSince = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);
    if (daysSince >= 30) {
      badges.push({
        id: 'veterano',
        label: 'Veterano',
        emoji: '🎖️',
        bg: 'bg-amber-100',
        text: 'text-amber-900',
        description: 'Miembro veterano con más de 30 días en OKI !',
      });
    }
  }

  // 2. Horario: Madrugador (5 - 9) o Nocturno (22 - 3)
  const targetDate = messageTimestamp ? new Date(messageTimestamp) : new Date();
  const hour = targetDate.getHours();

  if (hour >= 5 && hour < 9) {
    badges.push({
      id: 'madrugador',
      label: 'Madrugador',
      emoji: '🌅',
      bg: 'bg-orange-100',
      text: 'text-orange-900',
      description: 'Activo en las primeras horas del día (5:00 a 9:00 AM)',
    });
  } else if (hour >= 22 || hour < 3) {
    badges.push({
      id: 'nocturno',
      label: 'Nocturno',
      emoji: '🌙',
      bg: 'bg-indigo-100',
      text: 'text-indigo-900',
      description: 'Activo en la noche (22:00 a 3:00 AM)',
    });
  }

  return badges;
}

/**
 * Lista inicial de palabras prohibidas
 */
export const DEFAULT_BANNED_WORDS = [
  'estafa',
  'hack',
  'phishing',
  't.me/',
  'wa.me/',
  'whatsapp',
  'instagram.com',
  'bit.ly',
  'porn',
  'xxx',
  'casino',
  'cripto',
  'telegram',
];

/**
 * Validador de palabras prohibidas
 */
export function checkBannedWords(text: string, customBannedWords: string[] = []): { isBanned: boolean; word?: string } {
  const lower = text.toLowerCase();
  const allBanned = [...DEFAULT_BANNED_WORDS, ...customBannedWords];

  for (const word of allBanned) {
    if (word.trim() && lower.includes(word.toLowerCase().trim())) {
      return { isBanned: true, word };
    }
  }
  return { isBanned: false };
}

/**
 * Cooldown de 24 horas para alias
 */
export function getAliasCooldownRemaining(ultimoCambio?: string): { canChange: boolean; hoursLeft: number; minutesLeft: number } {
  if (!ultimoCambio) {
    return { canChange: true, hoursLeft: 0, minutesLeft: 0 };
  }

  const lastDate = new Date(ultimoCambio).getTime();
  const now = Date.now();
  const diffMs = now - lastDate;
  const cooldownMs = 24 * 60 * 60 * 1000;

  if (diffMs >= cooldownMs) {
    return { canChange: true, hoursLeft: 0, minutesLeft: 0 };
  }

  const remainingMs = cooldownMs - diffMs;
  const hoursLeft = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutesLeft = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  return { canChange: false, hoursLeft, minutesLeft };
}
