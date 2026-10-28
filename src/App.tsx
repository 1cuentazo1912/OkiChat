/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Message, Profile, RoomUser, EmojiReaction, PrivateMessage } from './types';
import { RetroWindowHeader } from './components/RetroWindowHeader';
import { AuthCard } from './components/AuthCard';
import { RoomsLobbyView } from './components/RoomsLobbyView';
import { ChatRoomView } from './components/ChatRoomView';
import { FirebaseInfoModal } from './components/FirebaseInfoModal';
import { PrivateMessageModal } from './components/PrivateMessageModal';
import { ReportModal } from './components/ReportModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import {
  auth,
  getOrCreateFirebaseProfile,
  changeFirebaseAlias,
  updateFirebaseProfileColor,
  sendFirebaseMessage,
  subscribeToFirebaseMessages,
  trackFirebasePresence,
  subscribeToFirebasePresence,
  subscribeToAllRoomsOccupancy,
  logoutUser,
  testFirestoreConnection,
  toggleFirebaseMessageReaction,
  blockUser,
  unblockUser,
  subscribeToUserBlocks,
  subscribeToBannedWords,
  subscribeToIncomingPrivateMessages,
} from './lib/firebase';
import {
  getOrCreateDemoProfile,
  clearDemoProfile,
  getInitialDemoMessages,
  saveDemoMessage,
} from './lib/demoStore';
import {
  playReceiveSound,
  playSentSound,
  playEnterRoomSound,
  playMsnNudgeSound,
  isSoundMuted,
  setSoundMuted,
} from './lib/audio';
import { ALL_ROOMS, getAliasCooldownRemaining, getDailyTopic } from './lib/roomsData';
import { generarAliasAleatorio } from './lib/aliasGenerator';
import confetti from 'canvas-confetti';
import { MessageSquare } from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomCounts, setRoomCounts] = useState<Record<string, number>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
  const [muted, setMuted] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isChangingAlias, setIsChangingAlias] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isNudging, setIsNudging] = useState<boolean>(false);

  // Modales
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  // Mensajes Privados
  const [activePrivateChatUser, setActivePrivateChatUser] = useState<{ id: string; alias: string; color_texto: string } | null>(null);
  const [incomingPmToast, setIncomingPmToast] = useState<PrivateMessage | null>(null);

  // Reportes y Bloqueos
  const [reportModalData, setReportModalData] = useState<{
    isOpen: boolean;
    targetUser: { id: string; alias: string };
    messageId?: string;
    messageContent?: string;
  } | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());

  // Palabras prohibidas dinámicas
  const [customBannedWords, setCustomBannedWords] = useState<string[]>([]);

  // Estado Firebase Live
  const [isFirebaseLive, setIsFirebaseLive] = useState<boolean>(true);

  // Subscripciones
  const messagesUnsubRef = useRef<(() => void) | null>(null);
  const presenceUnsubRef = useRef<(() => void) | null>(null);
  const presenceCleanupRef = useRef<(() => void) | null>(null);
  const prevUsersCountRef = useRef<number>(0);
  const knownUsersRef = useRef<Set<string>>(new Set());
  const botGreetedRoomsRef = useRef<Set<string>>(new Set());

  // BroadcastChannel para pruebas locales entre pestañas
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    setMuted(isSoundMuted());
    testFirestoreConnection().then((connected) => {
      setIsFirebaseLive(connected);
    });
  }, []);

  // Escuchar estado de autenticación de Firebase
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await handleFirebaseUser(firebaseUser);
      } else {
        const storedDemo = localStorage.getItem('oki_chat_demo_user');
        if (storedDemo && isDemoMode) {
          try {
            setProfile(JSON.parse(storedDemo));
          } catch {
            // ignore
          }
        }
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [isDemoMode]);

  const handleFirebaseUser = async (user: User) => {
    try {
      const userProfile = await getOrCreateFirebaseProfile(user);
      setProfile(userProfile);
      setIsDemoMode(false);
      setIsFirebaseLive(true);
      // Usuario nuevo entra primero a "recien-llegados"
      if (!selectedRoomId) {
        setSelectedRoomId('recien-llegados');
      }
    } catch (e) {
      console.error('Error getting or creating Firebase profile:', e);
    }
  };

  // Suscripción a lista de bloqueados y palabras prohibidas
  useEffect(() => {
    if (!profile) return;

    if (!isDemoMode && isFirebaseLive) {
      const unsubBlocks = subscribeToUserBlocks(profile.id, (blockedSet) => {
        setBlockedUserIds(blockedSet);
      });

      const unsubWords = subscribeToBannedWords((wordsList) => {
        setCustomBannedWords(wordsList.map((w) => w.word));
      });

      const unsubIncomingPm = subscribeToIncomingPrivateMessages(profile.id, (newPm) => {
        if (!activePrivateChatUser || activePrivateChatUser.id !== newPm.from_user) {
          playReceiveSound();
          setIncomingPmToast(newPm);
          setTimeout(() => setIncomingPmToast(null), 8000);
        }
      });

      return () => {
        unsubBlocks();
        unsubWords();
        unsubIncomingPm();
      };
    }
  }, [profile, isDemoMode, isFirebaseLive, activePrivateChatUser]);

  // Suscripción a conteos de ocupación de las salas en tiempo real
  useEffect(() => {
    if (!profile) return;

    if (!isDemoMode && isFirebaseLive) {
      const unsub = subscribeToAllRoomsOccupancy((counts) => {
        setRoomCounts(counts);
      });
      return () => {
        unsub();
      };
    } else {
      const demoCounts: Record<string, number> = {
        'recien-llegados': 18,
        'general-1': 14,
        'general-2': 32,
        'general-3': 48,
        'general-4': 8,
        'general-5': 50,
        'general-6': 19,
        'general-7': 27,
        'general-8': 4,
        'general-9': 41,
        'general-10': 11,
        'sala-silenciosa': 6,
      };
      setRoomCounts(demoCounts);
    }
  }, [profile, isDemoMode, isFirebaseLive]);

  // Manejo de entrada a una sala específica
  useEffect(() => {
    if (!profile || !selectedRoomId) {
      cleanupRoomSubscriptions();
      return;
    }

    if (!isDemoMode && isFirebaseLive) {
      initFirebaseRoom(selectedRoomId);
    } else {
      initDemoRoom(selectedRoomId);
    }

    return () => {
      cleanupRoomSubscriptions();
    };
  }, [profile, selectedRoomId, isDemoMode, isFirebaseLive]);

  const cleanupRoomSubscriptions = () => {
    if (messagesUnsubRef.current) {
      messagesUnsubRef.current();
      messagesUnsubRef.current = null;
    }
    if (presenceUnsubRef.current) {
      presenceUnsubRef.current();
      presenceUnsubRef.current = null;
    }
    if (presenceCleanupRef.current) {
      presenceCleanupRef.current();
      presenceCleanupRef.current = null;
    }
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.close();
      broadcastChannelRef.current = null;
    }
  };

  const triggerWindowNudge = () => {
    setIsNudging(true);
    setTimeout(() => setIsNudging(false), 600);
  };

  /**
   * Conexión a la Sala con Firebase Firestore Realtime y Presencia
   */
  const initFirebaseRoom = async (roomId: string) => {
    if (!profile) return;

    playEnterRoomSound();
    addSystemMessage(`${profile.alias} entró a la sala`);

    // Bot Anfitrión da la bienvenida y comparte el tema del día en la primera entrada
    if (!botGreetedRoomsRef.current.has(roomId)) {
      botGreetedRoomsRef.current.add(roomId);
      const topic = getDailyTopic();
      setTimeout(() => {
        addBotMessage(
          `¡Hola ${profile.alias}! 🌟 Te damos la bienvenida a ${
            ALL_ROOMS.find((r) => r.id === roomId)?.nombre || 'OKI !'
          }. El tema del día es: "${topic.topic}". Recuerda que puedes usar /me para acciones y hacer clic en cualquier usuario para abrir un mensaje privado.`
        );
      }, 1400);
    }

    // 1. Suscribirse a mensajes de la sala
    const unsubMessages = subscribeToFirebaseMessages(
      roomId,
      (firestoreMsgs) => {
        setMessages((prev) => {
          if (firestoreMsgs.length > prev.length && prev.length > 0) {
            const lastMsg = firestoreMsgs[firestoreMsgs.length - 1];
            if (lastMsg.contenido && lastMsg.contenido.includes('Zumbido / Timbre MSN')) {
              playMsnNudgeSound();
              triggerWindowNudge();
            } else if (lastMsg.user_id === profile.id || lastMsg.alias === profile.alias) {
              playSentSound();
            } else if (!blockedUserIds.has(lastMsg.user_id)) {
              playReceiveSound();
            }
          }
          return firestoreMsgs;
        });
      },
      (err) => {
        console.error('Firestore messages error:', err);
      }
    );
    messagesUnsubRef.current = unsubMessages;

    // 2. Registrar presencia en la sala
    const cleanupPresence = await trackFirebasePresence(
      roomId,
      profile.id,
      profile.alias,
      profile.color_texto
    );
    presenceCleanupRef.current = cleanupPresence;

    // 3. Suscribirse a presencia en la sala
    const unsubPresence = subscribeToFirebasePresence(roomId, (users) => {
      const list = [...users];
      if (!list.some((u) => u.alias === profile.alias)) {
        list.unshift({
          id: profile.id,
          alias: profile.alias,
          color_texto: profile.color_texto,
          role: profile.role,
        });
      }

      // Notificación de entrada
      users.forEach((u) => {
        if (!knownUsersRef.current.has(u.alias) && u.alias !== profile.alias) {
          knownUsersRef.current.add(u.alias);
          if (prevUsersCountRef.current > 0 && !blockedUserIds.has(u.id)) {
            addSystemMessage(`${u.alias} entró a la sala`);
            playEnterRoomSound();
          }
        }
      });
      prevUsersCountRef.current = users.length;
      setRoomUsers(list);
    });
    presenceUnsubRef.current = unsubPresence;
  };

  /**
   * Inicializar sala en modo local/demo
   */
  const initDemoRoom = (roomId: string) => {
    if (!profile) return;

    const initialMsgs = getInitialDemoMessages();
    setMessages(initialMsgs);
    playEnterRoomSound();
    addSystemMessage(`${profile.alias} entró a la sala`);

    setRoomUsers([
      { id: profile.id, alias: profile.alias, color_texto: profile.color_texto, isSelf: true },
      { id: 'bot-1', alias: 'Tigre_Nocturno', color_texto: '#e11d48', isSelf: false },
      { id: 'bot-2', alias: 'Marea87', color_texto: '#059669', isSelf: false },
      { id: 'bot-3', alias: 'Aguila_Veloz', color_texto: '#7c3aed', isSelf: false },
    ]);

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(`oki_chat_${roomId}`);
      broadcastChannelRef.current = bc;

      bc.onmessage = (event) => {
        const data = event.data;
        if (data.type === 'new_message') {
          const newMsg: Message = data.message;
          if (!blockedUserIds.has(newMsg.user_id)) {
            setMessages((prev) => [...prev, newMsg]);
            saveDemoMessage(newMsg);
            playReceiveSound();
          }
        } else if (data.type === 'user_joined') {
          setRoomUsers((prev) => {
            if (prev.some((u) => u.alias === data.user.alias)) return prev;
            return [...prev, data.user];
          });
          addSystemMessage(`${data.user.alias} entró a la sala`);
          playEnterRoomSound();
        } else if (data.type === 'msn_nudge' || data.type === 'buzz') {
          playMsnNudgeSound();
          triggerWindowNudge();
        }
      };

      bc.postMessage({
        type: 'user_joined',
        user: { id: profile.id, alias: profile.alias, color_texto: profile.color_texto },
      });
    }
  };

  const addSystemMessage = (text: string) => {
    if (!selectedRoomId) return;
    const sysMsg: Message = {
      id: 'sys-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      room_id: selectedRoomId,
      user_id: 'system',
      alias: 'Sistema',
      contenido: `*** ${text} ***`,
      created_at: new Date().toISOString(),
      is_system: true,
    };
    setMessages((prev) => [...prev, sysMsg]);
  };

  const addBotMessage = (text: string) => {
    if (!selectedRoomId) return;
    const botMsg: Message = {
      id: 'bot-' + Date.now(),
      room_id: selectedRoomId,
      user_id: 'bot-anfitrion',
      alias: 'Anfitrión OKI !',
      contenido: text,
      color_texto: '#0284c7',
      created_at: new Date().toISOString(),
      is_bot: true,
    };
    setMessages((prev) => [...prev, botMsg]);
  };

  // Enviar mensaje o comando /me
  const handleSendMessage = async (contenido: string): Promise<boolean> => {
    if (!profile || !selectedRoomId || !contenido.trim()) return false;
    setIsSending(true);

    try {
      if (!isDemoMode && isFirebaseLive) {
        const res = await sendFirebaseMessage(
          selectedRoomId,
          profile.id,
          profile.alias,
          contenido.trim(),
          profile.color_texto,
          profile
        );
        setIsSending(false);

        if (!res.success && res.error) {
          alert(res.error);
          return false;
        }

        playSentSound();
        return true;
      } else {
        const isAction = contenido.startsWith('/me ');
        const cleanText = isAction ? contenido.substring(4).trim() : contenido.trim();

        const newMsg: Message = {
          id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          room_id: selectedRoomId,
          user_id: profile.id,
          alias: profile.alias,
          contenido: cleanText,
          color_texto: profile.color_texto,
          is_action: isAction,
          created_at: new Date().toISOString(),
          reactions: {},
        };

        setMessages((prev) => [...prev, newMsg]);
        saveDemoMessage(newMsg);
        playSentSound();

        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: 'new_message',
            message: newMsg,
          });
        }

        setIsSending(false);
        return true;
      }
    } catch (e) {
      console.error('Error sending message:', e);
      setIsSending(false);
      return false;
    }
  };

  // Reacciones a mensajes
  const handleToggleReaction = async (messageId: string, emoji: EmojiReaction) => {
    if (!profile) return;

    if (!isDemoMode && isFirebaseLive) {
      await toggleFirebaseMessageReaction(messageId, emoji, profile.id);
    } else {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const current = m.reactions?.[emoji] || [];
          const updated = current.includes(profile.id)
            ? current.filter((id) => id !== profile.id)
            : [...current, profile.id];
          return {
            ...m,
            reactions: {
              ...(m.reactions || {}),
              [emoji]: updated,
            },
          };
        })
      );
    }
  };

  // Pedir nuevo alias (con control estricto de 24 horas)
  const handleRequestNewAlias = async (): Promise<void> => {
    if (!profile) return;
    setIsChangingAlias(true);

    if (!isDemoMode && isFirebaseLive) {
      const res = await changeFirebaseAlias(profile.id, profile);
      setIsChangingAlias(false);

      if (res.success && res.profile) {
        setProfile(res.profile);
        confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
        playReceiveSound();
      } else if (res.error) {
        alert(res.error);
      }
    } else {
      const cooldown = getAliasCooldownRemaining(profile.ultimo_cambio_alias);
      if (!cooldown.canChange) {
        setIsChangingAlias(false);
        alert(`Debes esperar ${cooldown.hoursLeft}h ${cooldown.minutesLeft}m para pedir otro alias.`);
        return;
      }

      const nuevoAlias = generarAliasAleatorio();
      const updated: Profile = {
        ...profile,
        alias: nuevoAlias,
        ultimo_cambio_alias: new Date().toISOString(),
      };
      setProfile(updated);
      localStorage.setItem('oki_chat_demo_user', JSON.stringify(updated));
      setIsChangingAlias(false);

      confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
      playReceiveSound();
    }
  };

  // Bloquear / Ignorar Usuario
  const handleBlockUser = async (targetId: string, targetAlias: string) => {
    if (!profile) return;
    const isAlreadyBlocked = blockedUserIds.has(targetId);

    if (isAlreadyBlocked) {
      await unblockUser(profile.id, targetId);
      setBlockedUserIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
      alert(`Has desbloqueado a ${targetAlias}.`);
    } else {
      await blockUser(profile.id, targetId, targetAlias);
      setBlockedUserIds((prev) => new Set(prev).add(targetId));
      alert(`Has bloqueado a ${targetAlias}. Sus mensajes públicos y privados ya no se mostrarán.`);
    }
  };

  // Reportar
  const handleOpenReportUser = (userId: string, alias: string) => {
    setReportModalData({
      isOpen: true,
      targetUser: { id: userId, alias },
    });
  };

  const handleOpenReportMessage = (msg: Message) => {
    setReportModalData({
      isOpen: true,
      targetUser: { id: msg.user_id, alias: msg.alias },
      messageId: msg.id,
      messageContent: msg.contenido,
    });
  };

  // Actualizar color de texto retro del usuario
  const handleUpdateColor = async (color: string) => {
    if (!profile) return;
    const updated = { ...profile, color_texto: color };
    setProfile(updated);

    if (!isDemoMode && isFirebaseLive) {
      try {
        await updateFirebaseProfileColor(profile.id, color);
        if (selectedRoomId) {
          await trackFirebasePresence(selectedRoomId, profile.id, profile.alias, color);
        }
      } catch (err) {
        console.error('Error updating profile color in Firebase:', err);
      }
    } else {
      localStorage.setItem('oki_chat_demo_user', JSON.stringify(updated));
    }
  };

  const handleTriggerNudge = async () => {
    if (!profile) return;
    playMsnNudgeSound();
    triggerWindowNudge();
    confetti({ particleCount: 30, spread: 70, origin: { y: 0.8 } });

    if (selectedRoomId) {
      await handleSendMessage('*** acaba de enviar un Zumbido / Timbre MSN ***');
    }

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'msn_nudge',
        from_alias: profile.alias,
      });
    }
  };

  const handleToggleSound = () => {
    const nextState = !muted;
    setMuted(nextState);
    setSoundMuted(nextState);
  };

  const handleLoginDemo = () => {
    const demoProf = getOrCreateDemoProfile();
    // Default admin in demo if testing admin panel
    demoProf.role = 'admin';
    setProfile(demoProf);
    setIsDemoMode(true);
    setSelectedRoomId('recien-llegados');
  };

  const handleLogout = async () => {
    await logoutUser();
    clearDemoProfile();
    cleanupRoomSubscriptions();
    setProfile(null);
    setSelectedRoomId(null);
    setMessages([]);
    setRoomUsers([]);
    setIsDemoMode(false);
  };

  const activeRoomObj = ALL_ROOMS.find((r) => r.id === selectedRoomId);

  return (
    <div className="min-h-screen bg-[#008080] p-2 sm:p-4 flex flex-col items-center justify-center font-sans">
      {/* Toast flotante de Mensaje Privado Entrante */}
      {incomingPmToast && (
        <div
          onClick={() => {
            setActivePrivateChatUser({
              id: incomingPmToast.from_user,
              alias: incomingPmToast.from_alias,
              color_texto: incomingPmToast.color_texto || '#000080',
            });
            setIncomingPmToast(null);
          }}
          className="fixed top-4 right-4 z-50 bg-[#d4d0c8] bevel-window p-2.5 border border-[#808080] shadow-2xl flex items-center gap-3 cursor-pointer hover:bg-white transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-[#000080] text-yellow-300 flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs text-black">
              Mensaje Privado de <span className="text-[#000080] font-sans">{incomingPmToast.from_alias}</span>
            </div>
            <div className="text-[11px] text-gray-700 truncate max-w-[200px]">
              "{incomingPmToast.contenido}"
            </div>
          </div>
        </div>
      )}

      {/* Ventana de Chat Yahoo! Chat 2000s - OKI ! */}
      <div
        className={`w-full max-w-5xl h-[92vh] max-h-[850px] bg-[#d4d0c8] bevel-window shadow-2xl flex flex-col overflow-hidden border border-[#808080] ${
          isNudging ? 'animate-msn-nudge' : ''
        }`}
      >
        {/* Cabecera y Menú OKI ! */}
        <RetroWindowHeader
          title={selectedRoomId && activeRoomObj ? `OKI ! - ${activeRoomObj.nombre}` : 'OKI ! - Salas de Chat Públicas'}
          isSoundMuted={muted}
          onToggleSound={handleToggleSound}
          onOpenInfo={() => setIsInfoModalOpen(true)}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          onLogout={profile ? handleLogout : undefined}
          isLoggedIn={Boolean(profile)}
          isFirebaseConnected={isFirebaseLive && !isDemoMode}
          isAdmin={profile?.role === 'admin'}
        />

        {/* Contenido Principal */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#d4d0c8]">
          {!profile ? (
            /* Vista de Inicio de Sesión */
            <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto bg-[#008080]/30">
              <AuthCard
                onLoginSuccess={handleFirebaseUser}
                onLoginDemo={handleLoginDemo}
                onOpenInfo={() => setIsInfoModalOpen(true)}
              />
            </div>
          ) : !selectedRoomId ? (
            /* Pantalla de Lista de las Salas (Lobby) */
            <RoomsLobbyView
              currentProfile={profile}
              roomCounts={roomCounts}
              onSelectRoom={(roomId) => setSelectedRoomId(roomId)}
              onRequestNewAlias={handleRequestNewAlias}
              onUpdateColor={handleUpdateColor}
              onOpenAdminPanel={() => setIsAdminModalOpen(true)}
              isChangingAlias={isChangingAlias}
            />
          ) : (
            /* Vista de Sala de Chat Seleccionada */
            <ChatRoomView
              room={activeRoomObj || ALL_ROOMS[0]}
              currentProfile={profile}
              messages={messages}
              roomUsers={roomUsers}
              blockedUserIds={blockedUserIds}
              customBannedWords={customBannedWords}
              onSendMessage={handleSendMessage}
              onUpdateColor={handleUpdateColor}
              onLeaveRoom={() => setSelectedRoomId(null)}
              onOpenPrivateChat={(target) => setActivePrivateChatUser(target)}
              onBlockUser={handleBlockUser}
              onReportMessage={handleOpenReportMessage}
              onReportUser={handleOpenReportUser}
              onToggleReaction={handleToggleReaction}
              onTriggerNudge={handleTriggerNudge}
              isSending={isSending}
            />
          )}
        </div>
      </div>

      {/* Modal Informativo de Firebase & Reglas */}
      <FirebaseInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />

      {/* Modal de Mensaje Privado (PM) */}
      {activePrivateChatUser && profile && (
        <PrivateMessageModal
          currentProfile={profile}
          targetUser={activePrivateChatUser}
          onClose={() => setActivePrivateChatUser(null)}
          onBlockUser={(targetId, targetAlias) => handleBlockUser(targetId, targetAlias)}
          onReportUser={(targetId, targetAlias) => handleOpenReportUser(targetId, targetAlias)}
          isBlocked={blockedUserIds.has(activePrivateChatUser.id)}
        />
      )}

      {/* Modal de Reporte */}
      {reportModalData && profile && (
        <ReportModal
          isOpen={reportModalData.isOpen}
          onClose={() => setReportModalData(null)}
          currentProfile={profile}
          targetUser={reportModalData.targetUser}
          messageId={reportModalData.messageId}
          messageContent={reportModalData.messageContent}
        />
      )}

      {/* Panel de Administración / Moderación */}
      {isAdminModalOpen && profile && profile.role === 'admin' && (
        <AdminPanelModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          currentProfile={profile}
        />
      )}
    </div>
  );
}
