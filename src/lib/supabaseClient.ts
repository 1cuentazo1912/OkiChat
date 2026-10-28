import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { generarAliasAleatorio, generarColorTextoAleatorio } from './aliasGenerator';
import { Message, Profile, RoomUser } from '../types';

const STORAGE_KEY_URL = 'yahoo_chat_supabase_url';
const STORAGE_KEY_KEY = 'yahoo_chat_supabase_anon_key';

export function getStoredSupabaseConfig() {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) || '' : '';

  const url = (localUrl || envUrl).trim();
  const key = (localKey || envKey).trim();

  const isConfigured = Boolean(
    url &&
    key &&
    !url.includes('tu-proyecto') &&
    url.startsWith('https://') &&
    key.length > 20
  );

  return { url, key, isConfigured };
}

export function saveStoredSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, key.trim());
  }
}

export function clearStoredSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, key, isConfigured } = getStoredSupabaseConfig();
  if (!isConfigured) return null;

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (e) {
      console.error('Error creating Supabase client:', e);
      return null;
    }
  }
  return supabaseInstance;
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}

/**
 * Inicia sesión con Enlace Mágico (Magic Link OTP)
 */
export async function sendMagicLink(email: string): Promise<{ error: Error | null; message?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: new Error('Supabase no está configurado. Por favor ingresa tus credenciales en el botón "Configurar Supabase".') };
  }

  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) {
    return { error };
  }

  return { error: null, message: '¡Enlace mágico enviado! Revisa tu correo electrónico.' };
}

/**
 * Obtiene o crea el perfil en la tabla `profiles` de Supabase
 * Si es la primera vez que entra, asigna un alias aleatorio único y color de texto.
 */
export async function getOrCreateProfile(user: User): Promise<Profile> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase no disponible');
  }

  // 1. Verificar si ya existe perfil para este id
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (existingProfile && !fetchError) {
    return existingProfile as Profile;
  }

  // 2. Si no existe, generar nuevo alias único y color
  let intentos = 0;
  let nuevoAlias = generarAliasAleatorio();
  const nuevoColor = generarColorTextoAleatorio();

  while (intentos < 5) {
    const { data: duplicate } = await supabase
      .from('profiles')
      .select('id')
      .eq('alias', nuevoAlias)
      .maybeSingle();

    if (!duplicate) break;
    nuevoAlias = generarAliasAleatorio();
    intentos++;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert([
      {
        id: user.id,
        alias: nuevoAlias,
        color_texto: nuevoColor,
      },
    ])
    .select()
    .single();

  if (insertError) {
    console.error('Error inserting profile:', insertError);
    // Si falló por RLS o ya existía
    return {
      id: user.id,
      alias: nuevoAlias,
      color_texto: nuevoColor,
    };
  }

  return inserted as Profile;
}

/**
 * Carga los mensajes de la sala desde Supabase
 */
export async function fetchRoomMessages(roomId: string = 'general-1'): Promise<Message[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error fetching messages from Supabase:', error);
    return [];
  }

  return (data || []) as Message[];
}

/**
 * Inserta un mensaje en Supabase
 */
export async function insertRoomMessage(
  roomId: string,
  userId: string,
  alias: string,
  contenido: string
): Promise<{ data: Message | null; error: Error | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: new Error('Supabase no configurado') };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        room_id: roomId,
        user_id: userId,
        alias,
        contenido,
      },
    ])
    .select()
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data: data as Message, error: null };
}

/**
 * Actualiza el color de texto del usuario
 */
export async function updateUserColor(userId: string, color: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase
    .from('profiles')
    .update({ color_texto: color })
    .eq('id', userId);

  return !error;
}
