import { Message, Profile } from '../types';
import { generarAliasAleatorio, generarColorTextoAleatorio } from './aliasGenerator';

const DEMO_USER_KEY = 'oki_chat_demo_user';
const DEMO_MESSAGES_KEY = 'oki_chat_demo_messages';

export function getOrCreateDemoProfile(email?: string): Profile {
  const existing = localStorage.getItem(DEMO_USER_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch {
      // ignore
    }
  }

  const newProfile: Profile = {
    id: 'demo-' + Math.random().toString(36).substring(2, 9),
    alias: generarAliasAleatorio(),
    color_texto: generarColorTextoAleatorio(),
    created_at: new Date().toISOString(),
  };

  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(newProfile));
  return newProfile;
}

export function clearDemoProfile() {
  localStorage.removeItem(DEMO_USER_KEY);
}

export function getInitialDemoMessages(): Message[] {
  const stored = localStorage.getItem(DEMO_MESSAGES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  const welcomeTime = new Date(Date.now() - 1000 * 60 * 5).toISOString();
  const msgTime = new Date(Date.now() - 1000 * 60 * 2).toISOString();

  const initial: Message[] = [
    {
      id: 'sys-welcome',
      room_id: 'general-1',
      user_id: 'system',
      alias: 'Sistema',
      contenido: '*** ¡Bienvenido a OKI ! - Sala General 1. Conversación libre, respeto y buena onda. ***',
      created_at: welcomeTime,
      is_system: true,
    },
    {
      id: 'demo-1',
      room_id: 'general-1',
      user_id: 'demo-user-1',
      alias: 'Tigre_Nocturno',
      contenido: '¡Hola a todos! ¿Alguien de Buenos Aires, CDMX o Madrid por aquí en OKI !?',
      created_at: msgTime,
      is_system: false,
    },
  ];

  localStorage.setItem(DEMO_MESSAGES_KEY, JSON.stringify(initial));
  return initial;
}

export function saveDemoMessage(msg: Message) {
  try {
    const current = getInitialDemoMessages();
    const updated = [...current, msg].slice(-150);
    localStorage.setItem(DEMO_MESSAGES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving demo message', e);
  }
}
