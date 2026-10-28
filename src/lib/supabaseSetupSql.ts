export const SUPABASE_SQL_SCRIPT = `-- ============================================================
-- GUÍA SQL PARA CHAT RETRO ESTILO YAHOO (SUPABASE)
-- Copia y pega todo este código en el "SQL Editor" de tu proyecto Supabase:
-- https://app.supabase.com/project/_/sql
-- ============================================================

-- 1. Crear tabla de perfiles (profiles)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  alias text unique not null,
  color_texto text not null default '#000080',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habilitar RLS en profiles
alter table public.profiles enable row level security;

-- Políticas de seguridad para profiles:
-- Cualquiera autenticado puede leer todos los perfiles (para ver alias y colores en el chat)
drop policy if exists "Perfiles visibles para usuarios autenticados" on public.profiles;
create policy "Perfiles visibles para usuarios autenticados"
  on public.profiles for select
  to authenticated
  using (true);

-- Solo el dueño puede insertar su propio perfil
drop policy if exists "Usuarios pueden insertar su propio perfil" on public.profiles;
create policy "Usuarios pueden insertar su propio perfil"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Solo el dueño puede actualizar su propio perfil
drop policy if exists "Usuarios pueden actualizar su propio perfil" on public.profiles;
create policy "Usuarios pueden actualizar su propio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- 3. Crear tabla de mensajes (messages)
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  room_id text not null default 'general-1',
  user_id uuid references auth.users on delete cascade not null,
  alias text not null,
  contenido text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Habilitar RLS en messages
alter table public.messages enable row level security;

-- Políticas RLS para messages:
-- Cualquier usuario autenticado puede leer mensajes
drop policy if exists "Usuarios autenticados pueden leer mensajes" on public.messages;
create policy "Usuarios autenticados pueden leer mensajes"
  on public.messages for select
  to authenticated
  using (true);

-- Solo puede insertar mensajes con su propio user_id
drop policy if exists "Usuarios solo pueden insertar mensajes con su user_id" on public.messages;
create policy "Usuarios solo pueden insertar mensajes con su user_id"
  on public.messages for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 5. Habilitar Supabase Realtime para la tabla messages y profiles
-- (Para recibir mensajes al instante entre múltiples navegadores)
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.profiles;
`;

export interface StepInstruction {
  step: number;
  title: string;
  description: string;
  substeps: string[];
}

export const SUPABASE_STEPS: StepInstruction[] = [
  {
    step: 1,
    title: 'Crear tu proyecto en Supabase',
    description: 'Ingresa a Supabase para iniciar tu proyecto gratuito.',
    substeps: [
      'Ve a https://supabase.com e inicia sesión o regístrate.',
      'Haz clic en "New Project", dale un nombre (ej: "yahoo-chat") y una contraseña para la base de datos.',
      'Espera 1-2 minutos a que el proyecto termine de aprovisionarse.'
    ]
  },
  {
    step: 2,
    title: 'Ejecutar el Script SQL (Tablas, RLS y Realtime)',
    description: 'Crea las tablas profiles y messages con sus políticas de seguridad y Realtime.',
    substeps: [
      'En el menú izquierdo de Supabase, haz clic en "SQL Editor".',
      'Haz clic en "New Query".',
      'Copia el script SQL que encuentras en este panel y pégalo.',
      'Haz clic en el botón "Run" (verde). Debe mostrar "Success: No rows returned".'
    ]
  },
  {
    step: 3,
    title: 'Verificar activación de Realtime',
    description: 'Asegúrate de que Realtime esté escuchando la tabla messages.',
    substeps: [
      'En el menú lateral ve a "Database" -> "Replication".',
      'En "supabase_realtime", verifica que "messages" y "profiles" estén en la lista de tablas seleccionadas (el script SQL ya lo hace automáticamente).'
    ]
  },
  {
    step: 4,
    title: 'Habilitar Email Auth & Enlace Mágico (Magic Link)',
    description: 'Supabase tiene Magic Link activado por defecto para Email.',
    substeps: [
      'En el menú lateral ve a "Authentication" -> "Providers" -> "Email".',
      'Asegúrate de que esté habilitado ("Enable Email provider").',
      'En "Authentication" -> "URL Configuration", en "Site URL" coloca la URL de tu aplicación (por ejemplo la URL de AI Studio o http://localhost:3000).'
    ]
  },
  {
    step: 5,
    title: 'Conectar las credenciales a la aplicación',
    description: 'Copia tu URL del proyecto y tu Anon Key.',
    substeps: [
      'En Supabase ve a "Project Settings" (ícono de engranaje) -> "API".',
      'Copia la "Project URL" (ej: https://xyz.supabase.co).',
      'Copia la clave "anon / public" (empieza por eyJ...).',
      'Pégalas en el botón "Configurar Supabase" dentro de este chat, o en tu archivo .env local.'
    ]
  }
];
