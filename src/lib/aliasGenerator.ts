// Lista de al menos 40 nombres (masculinos y femeninos)
export const NOMBRES_BASE = [
  'Luna', 'Tigre', 'Marea', 'Sol', 'Lobo',
  'Aguila', 'Fenix', 'Cielo', 'Rayo', 'Sombra',
  'Dragon', 'Estrella', 'Cometa', 'Valkiria', 'Titan',
  'Pantera', 'Halcon', 'Sirena', 'Orquidea', 'Brisa',
  'Jaguar', 'Centella', 'Aurora', 'Zafiro', 'Rubi',
  'Diamante', 'Selva', 'Oceano', 'Cascada', 'Glaciar',
  'Relampago', 'Galaxia', 'Espartano', 'Centauro', 'Pegaso',
  'Ninfa', 'Vikingo', 'Samurai', 'Aguacero', 'Vulcano',
  'Nebulosa', 'Quimera', 'Tornado', 'Cimitarra', 'Horizonte',
  'Eclipse', 'Trueno', 'Esfinge', 'Condor', 'Albatros'
];

// Lista de al menos 40 adjetivos
export const ADJETIVOS_BASE = [
  'Azul', 'Nocturno', 'Plateado', 'Dorado', 'Feroz',
  'Valiente', 'Misterioso', 'Silencioso', 'Astral', 'Eterno',
  'Cosmico', 'Rebelde', 'Inmortal', 'Veloz', 'Salvaje',
  'Radiante', 'Invencible', 'Errante', 'Gélido', 'Flamante',
  'Sereno', 'Magico', 'Luminoso', 'Sombrio', 'Furtivo',
  'Poderoso', 'Brillante', 'Antiguo', 'Agil', 'Supremo',
  'Noble', 'Intrepido', 'Furtiva', 'Galactico', 'Clandestino',
  'Pacifico', 'Alba', 'Solitario', 'Sabio', 'Tenaz',
  'Vigilante', 'Audaz', 'Glacial', 'Bravo', 'Fugaz',
  'Centelleante', 'Vigoroso', 'Ferviente', 'Profundo', 'Impetuoso'
];

// Paleta de colores clásicos de texto estilo Yahoo Chat (visibles en fondo claro)
export const COLORES_TEXTO_CHAT = [
  '#000080', // Navy blue clásico
  '#800000', // Maroon / Vino
  '#006400', // Verde oscuro bosque
  '#4B0082', // Indigo
  '#8B008B', // Dark Magenta
  '#8A2BE2', // Blue Violet
  '#008080', // Teal
  '#A0522D', // Sienna
  '#2E8B57', // Sea Green
  '#C71585', // Medium Violet Red
  '#191970', // Midnight Blue
  '#B8860B', // Dark Goldenrod
  '#8B4513', // Saddle Brown
  '#483D8B', // Dark Slate Blue
  '#008B8B', // Dark Cyan
  '#9932CC'  // Dark Orchid
];

/**
 * Genera un alias único aleatorio combinando nombre y adjetivo o número,
 * por ejemplo: "Luna_Azul", "Tigre_Nocturno", "Marea87".
 */
export function generarAliasAleatorio(): string {
  const nombre = NOMBRES_BASE[Math.floor(Math.random() * NOMBRES_BASE.length)];
  const usarNumero = Math.random() < 0.25; // 25% de probabilidad de tener terminación numérica (ej: Marea87)

  if (usarNumero) {
    const anio = Math.floor(Math.random() * 50) + 70; // 70 a 99 o año 00-24
    const sufijo = anio > 99 ? String(anio - 100).padStart(2, '0') : String(anio);
    return `${nombre}${sufijo}`;
  } else {
    const adjetivo = ADJETIVOS_BASE[Math.floor(Math.random() * ADJETIVOS_BASE.length)];
    return `${nombre}_${adjetivo}`;
  }
}

/**
 * Selecciona un color de texto aleatorio para el usuario
 */
export function generarColorTextoAleatorio(): string {
  return COLORES_TEXTO_CHAT[Math.floor(Math.random() * COLORES_TEXTO_CHAT.length)];
}
