import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, User } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocFromServer,
  addDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Message, Profile, RoomUser, PrivateMessage, Report, Block, BannedWord, EmojiReaction } from '../types';
import { generarAliasAleatorio, generarColorTextoAleatorio } from './aliasGenerator';
import { INITIAL_ROOMS, getAliasCooldownRemaining } from './roomsData';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// CRITICAL: Must pass firestoreDatabaseId according to Firebase integration guidelines
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const ADMIN_EMAIL = 'leopoldox5284@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Probar conexión a Firestore en el arranque
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or starting up.');
    }
    return false;
  }
}

/**
 * Iniciar sesión con Google (Popup rápido sin contraseña)
 */
export async function loginWithGoogle(): Promise<User> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  } catch (error) {
    console.error('Error signing in with Google popup:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * Obtener o crear perfil persistente en Firestore `profiles/{userId}`
 * Asigna automáticamente un alias único, color de texto y rol (admin si es leopoldox5284@gmail.com).
 */
export async function getOrCreateFirebaseProfile(user: User): Promise<Profile> {
  const profileRef = doc(db, 'profiles', user.uid);
  const path = `profiles/${user.uid}`;
  const isDefaultAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  try {
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      const data = snap.data() as Profile;
      // Si el email es el admin configurado, asegurar rol admin
      if (isDefaultAdmin && data.role !== 'admin') {
        await updateDoc(profileRef, { role: 'admin' });
        return { ...data, role: 'admin' };
      }
      return data;
    }

    const nuevoAlias = generarAliasAleatorio();
    const nuevoColor = generarColorTextoAleatorio();

    const newProfile: Profile = {
      id: user.uid,
      alias: nuevoAlias,
      color_texto: nuevoColor,
      role: isDefaultAdmin ? 'admin' : 'user',
      created_at: new Date().toISOString(),
      ultimo_cambio_alias: new Date().toISOString(),
      email: user.email || undefined,
    };

    await setDoc(profileRef, newProfile);
    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Cambiar alias con restricción estricta de 24 horas
 */
export async function changeFirebaseAlias(
  userId: string,
  currentProfile: Profile
): Promise<{ success: boolean; profile?: Profile; error?: string }> {
  const cooldown = getAliasCooldownRemaining(currentProfile.ultimo_cambio_alias);
  if (!cooldown.canChange) {
    return {
      success: false,
      error: `Debes esperar ${cooldown.hoursLeft}h ${cooldown.minutesLeft}m para pedir otro alias (límite de 24h).`,
    };
  }

  const profileRef = doc(db, 'profiles', userId);
  const path = `profiles/${userId}`;
  const nuevoAlias = generarAliasAleatorio();
  const nowIso = new Date().toISOString();

  try {
    await updateDoc(profileRef, {
      alias: nuevoAlias,
      ultimo_cambio_alias: nowIso,
    });

    const updated: Profile = {
      ...currentProfile,
      alias: nuevoAlias,
      ultimo_cambio_alias: nowIso,
    };
    return { success: true, profile: updated };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Actualizar el color de texto del usuario en Firestore
 */
export async function updateFirebaseProfileColor(userId: string, newColor: string): Promise<void> {
  const profileRef = doc(db, 'profiles', userId);
  const path = `profiles/${userId}`;
  try {
    await updateDoc(profileRef, { color_texto: newColor });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Enviar mensaje a la sala en Firestore `messages`
 * Soporta comando /me para acciones de usuario y chequeo de sanciones
 */
export async function sendFirebaseMessage(
  roomId: string,
  userId: string,
  alias: string,
  contenido: string,
  colorTexto: string,
  profile?: Profile
): Promise<{ success: boolean; error?: string }> {
  // Verificar si está silenciado o baneado
  if (profile?.baneado) {
    return { success: false, error: 'Tu cuenta ha sido baneada por un administrador.' };
  }

  if (profile?.silenciado_hasta) {
    const muteUntil = new Date(profile.silenciado_hasta).getTime();
    if (Date.now() < muteUntil) {
      const remainingMinutes = Math.ceil((muteUntil - Date.now()) / (1000 * 60));
      return {
        success: false,
        error: `Estás silenciado temporalmente. Podrás escribir en ${remainingMinutes} minuto(s).`,
      };
    }
  }

  const messagesCol = collection(db, 'messages');
  const path = 'messages';

  const isAction = contenido.startsWith('/me ');
  const cleanContent = isAction ? contenido.substring(4).trim() : contenido.trim();

  try {
    await addDoc(messagesCol, {
      room_id: roomId,
      user_id: userId,
      alias,
      contenido: cleanContent,
      color_texto: colorTexto,
      is_action: isAction,
      created_at: new Date().toISOString(),
      reactions: {},
    });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Suscribirse a los mensajes en tiempo real de la sala usando Firestore `onSnapshot`
 */
export function subscribeToFirebaseMessages(
  roomId: string,
  onUpdate: (messages: Message[]) => void,
  onError?: (err: Error) => void
): () => void {
  const messagesCol = collection(db, 'messages');
  const q = query(
    messagesCol,
    where('room_id', '==', roomId),
    orderBy('created_at', 'asc'),
    limit(150)
  );
  const path = `messages?room_id=${roomId}`;

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        msgs.push({
          id: docSnap.id,
          room_id: d.room_id,
          user_id: d.user_id,
          alias: d.alias,
          contenido: d.contenido,
          color_texto: d.color_texto,
          created_at: d.created_at,
          is_system: d.is_system || false,
          is_action: d.is_action || false,
          is_bot: d.is_bot || false,
          reactions: d.reactions || {},
        });
      });
      onUpdate(msgs);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

/**
 * Reaccionar con emoji a un mensaje
 */
export async function toggleFirebaseMessageReaction(
  messageId: string,
  emoji: EmojiReaction,
  userId: string
): Promise<void> {
  const msgRef = doc(db, 'messages', messageId);
  const path = `messages/${messageId}`;

  try {
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const currentReactions: Record<string, string[]> = data.reactions || {};
    const usersForEmoji = currentReactions[emoji] || [];

    let updatedUsers: string[];
    if (usersForEmoji.includes(userId)) {
      // Quitar reacción
      updatedUsers = usersForEmoji.filter((id) => id !== userId);
    } else {
      // Agregar reacción
      updatedUsers = [...usersForEmoji, userId];
    }

    const updatedReactions = {
      ...currentReactions,
      [emoji]: updatedUsers,
    };

    await updateDoc(msgRef, { reactions: updatedReactions });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Eliminar mensaje (Función de moderación admin)
 */
export async function deleteFirebaseMessage(messageId: string): Promise<void> {
  const msgRef = doc(db, 'messages', messageId);
  const path = `messages/${messageId}`;
  try {
    await deleteDoc(msgRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * MENSAJES PRIVADOS: Enviar mensaje privado
 */
export async function sendPrivateMessage(
  fromUser: string,
  fromAlias: string,
  toUser: string,
  toAlias: string,
  contenido: string,
  colorTexto: string
): Promise<void> {
  const pmCol = collection(db, 'private_messages');
  const path = 'private_messages';

  try {
    await addDoc(pmCol, {
      from_user: fromUser,
      from_alias: fromAlias,
      to_user: toUser,
      to_alias: toAlias,
      contenido: contenido.trim(),
      color_texto: colorTexto,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * MENSAJES PRIVADOS: Suscribirse a la conversación entre dos usuarios
 */
export function subscribeToPrivateConversation(
  user1: string,
  user2: string,
  onUpdate: (messages: PrivateMessage[]) => void
): () => void {
  const pmCol = collection(db, 'private_messages');
  const path = 'private_messages';

  // Consultar mensajes donde participan ambos usuarios
  const q = query(
    pmCol,
    orderBy('created_at', 'asc'),
    limit(100)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const msgs: PrivateMessage[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (
          (d.from_user === user1 && d.to_user === user2) ||
          (d.from_user === user2 && d.to_user === user1)
        ) {
          msgs.push({
            id: docSnap.id,
            from_user: d.from_user,
            from_alias: d.from_alias,
            to_user: d.to_user,
            to_alias: d.to_alias,
            contenido: d.contenido,
            color_texto: d.color_texto,
            created_at: d.created_at,
          });
        }
      });
      onUpdate(msgs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

/**
 * MENSAJES PRIVADOS: Escuchar notificaciones de mensajes entrantes dirigidos al usuario actual
 */
export function subscribeToIncomingPrivateMessages(
  currentUserId: string,
  onNewMessage: (msg: PrivateMessage) => void
): () => void {
  const pmCol = collection(db, 'private_messages');
  const q = query(pmCol, where('to_user', '==', currentUserId), limit(50));
  const path = `private_messages?to_user=${currentUserId}`;
  let initialLoaded = false;

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (!initialLoaded) {
        initialLoaded = true;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const d = change.doc.data();
          onNewMessage({
            id: change.doc.id,
            from_user: d.from_user,
            from_alias: d.from_alias,
            to_user: d.to_user,
            to_alias: d.to_alias,
            contenido: d.contenido,
            color_texto: d.color_texto,
            created_at: d.created_at,
          });
        }
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

/**
 * BLOQUEOS: Bloquear a un usuario
 */
export async function blockUser(userId: string, blockedUserId: string, blockedAlias: string): Promise<void> {
  const blockRef = doc(db, 'blocks', `${userId}_${blockedUserId}`);
  const path = `blocks/${userId}_${blockedUserId}`;
  try {
    await setDoc(blockRef, {
      user_id: userId,
      blocked_user_id: blockedUserId,
      blocked_alias: blockedAlias,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * BLOQUEOS: Desbloquear usuario
 */
export async function unblockUser(userId: string, blockedUserId: string): Promise<void> {
  const blockRef = doc(db, 'blocks', `${userId}_${blockedUserId}`);
  const path = `blocks/${userId}_${blockedUserId}`;
  try {
    await deleteDoc(blockRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * BLOQUEOS: Suscribirse a la lista de bloqueados por el usuario
 */
export function subscribeToUserBlocks(
  userId: string,
  onUpdate: (blockedUserIds: Set<string>) => void
): () => void {
  const blocksCol = collection(db, 'blocks');
  const q = query(blocksCol, where('user_id', '==', userId));
  const path = `blocks?user_id=${userId}`;

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const set = new Set<string>();
      snapshot.forEach((d) => {
        set.add(d.data().blocked_user_id);
      });
      onUpdate(set);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

/**
 * REPORTES: Enviar un reporte
 */
export async function submitReport(report: Omit<Report, 'id' | 'created_at' | 'estado'>): Promise<void> {
  const reportsCol = collection(db, 'reports');
  const path = 'reports';
  try {
    await addDoc(reportsCol, {
      ...report,
      estado: 'pendiente',
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * REPORTES: Suscribirse a reportes (Solo admins)
 */
export function subscribeToReports(onUpdate: (reports: Report[]) => void): () => void {
  const reportsCol = collection(db, 'reports');
  const q = query(reportsCol, orderBy('created_at', 'desc'), limit(50));
  const path = 'reports';

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const reps: Report[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        reps.push({
          id: d.id,
          reporter_id: data.reporter_id,
          reporter_alias: data.reporter_alias,
          reported_user_id: data.reported_user_id,
          reported_alias: data.reported_alias,
          message_id: data.message_id,
          message_content: data.message_content,
          motivo: data.motivo,
          estado: data.estado,
          created_at: data.created_at,
        });
      });
      onUpdate(reps);
    },
    (error) => {
      console.warn('Reports listen error (likely non-admin):', error);
    }
  );

  return unsubscribe;
}

/**
 * REPORTES: Marcar reporte como revisado
 */
export async function updateReportStatus(reportId: string, status: 'pendiente' | 'revisado'): Promise<void> {
  const reportRef = doc(db, 'reports', reportId);
  const path = `reports/${reportId}`;
  try {
    await updateDoc(reportRef, { estado: status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * MODERACIÓN ADMIN: Silenciar usuario por horas
 */
export async function muteUser(targetUserId: string, hours: number | 'permanente'): Promise<void> {
  const profileRef = doc(db, 'profiles', targetUserId);
  const path = `profiles/${targetUserId}`;
  const silenciadoHasta =
    hours === 'permanente'
      ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  try {
    await updateDoc(profileRef, { silenciado_hasta: silenciadoHasta });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function unmuteUser(targetUserId: string): Promise<void> {
  const profileRef = doc(db, 'profiles', targetUserId);
  const path = `profiles/${targetUserId}`;
  try {
    await updateDoc(profileRef, { silenciado_hasta: null });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * MODERACIÓN ADMIN: Banear o desbanear usuario
 */
export async function banUser(targetUserId: string, banned: boolean = true): Promise<void> {
  const profileRef = doc(db, 'profiles', targetUserId);
  const path = `profiles/${targetUserId}`;
  try {
    await updateDoc(profileRef, { baneado: banned });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * PALABRAS PROHIBIDAS: Suscripción y gestión
 */
export function subscribeToBannedWords(onUpdate: (words: BannedWord[]) => void): () => void {
  const bwCol = collection(db, 'banned_words');
  const path = 'banned_words';

  const unsubscribe = onSnapshot(
    bwCol,
    (snapshot) => {
      const words: BannedWord[] = [];
      snapshot.forEach((d) => {
        words.push({
          id: d.id,
          word: d.data().word,
          added_by: d.data().added_by,
          created_at: d.data().created_at,
        });
      });
      onUpdate(words);
    },
    (error) => {
      console.warn('Banned words fetch error:', error);
    }
  );

  return unsubscribe;
}

export async function addBannedWord(word: string, addedBy: string): Promise<void> {
  const bwCol = collection(db, 'banned_words');
  const path = 'banned_words';
  try {
    await addDoc(bwCol, {
      word: word.toLowerCase().trim(),
      added_by: addedBy,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteBannedWord(wordId: string): Promise<void> {
  const bwRef = doc(db, 'banned_words', wordId);
  const path = `banned_words/${wordId}`;
  try {
    await deleteDoc(bwRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * PRESENCIA
 */
export async function trackFirebasePresence(
  roomId: string,
  userId: string,
  alias: string,
  colorTexto: string
): Promise<() => void> {
  const presenceRef = doc(db, 'rooms', roomId, 'presence', userId);

  try {
    await setDoc(presenceRef, {
      user_id: userId,
      alias,
      color_texto: colorTexto,
      last_seen: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Presence track error:', error);
  }

  return () => {
    deleteDoc(presenceRef).catch(() => {});
  };
}

export function subscribeToFirebasePresence(
  roomId: string,
  onUsersUpdate: (users: RoomUser[]) => void
): () => void {
  const presenceCol = collection(db, 'rooms', roomId, 'presence');
  const path = `rooms/${roomId}/presence`;

  const unsubscribe = onSnapshot(
    presenceCol,
    (snapshot) => {
      const users: RoomUser[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        users.push({
          id: d.user_id || docSnap.id,
          alias: d.alias,
          color_texto: d.color_texto,
        });
      });
      onUsersUpdate(users);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

export function subscribeToAllRoomsOccupancy(
  onCountsUpdate: (counts: Record<string, number>) => void
): () => void {
  const unsubs: Array<() => void> = [];
  const currentCounts: Record<string, number> = {};

  INITIAL_ROOMS.forEach((r) => {
    currentCounts[r.id] = 0;
    const presenceCol = collection(db, 'rooms', r.id, 'presence');
    const unsub = onSnapshot(
      presenceCol,
      (snap) => {
        currentCounts[r.id] = snap.size;
        onCountsUpdate({ ...currentCounts });
      },
      (err) => {
        console.warn(`Error tracking presence for room ${r.id}:`, err);
      }
    );
    unsubs.push(unsub);
  });

  return () => {
    unsubs.forEach((u) => u());
  };
}
