import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Users,
  Smile,
  Palette,
  BellRing,
  ArrowLeft,
  X,
  ShieldAlert,
  MessageSquare,
  UserX,
  Lightbulb,
  Sparkles,
  Bot,
  AlertTriangle,
  Clock,
  Zap,
} from 'lucide-react';
import { Message, Profile, RoomUser, EmojiReaction, REACTION_EMOJIS, Room } from '../types';
import { COLORES_TEXTO_CHAT } from '../lib/aliasGenerator';
import {
  CLASSIC_30_EMOTICONS,
  MODERN_EMOJIS_CATEGORIES,
  getDailyTopic,
  getUserBadges,
  checkBannedWords,
} from '../lib/roomsData';
import { playMsnNudgeSound } from '../lib/audio';

interface ChatRoomViewProps {
  room: Room;
  currentProfile: Profile;
  messages: Message[];
  roomUsers: RoomUser[];
  blockedUserIds: Set<string>;
  customBannedWords: string[];
  onSendMessage: (content: string) => Promise<boolean>;
  onUpdateColor: (color: string) => Promise<void>;
  onLeaveRoom: () => void;
  onOpenPrivateChat: (user: { id: string; alias: string; color_texto: string }) => void;
  onBlockUser: (userId: string, alias: string) => void;
  onReportMessage: (msg: Message) => void;
  onReportUser: (userId: string, alias: string) => void;
  onToggleReaction: (messageId: string, emoji: EmojiReaction) => void;
  onTriggerNudge?: () => void;
  isSending?: boolean;
}

export const ChatRoomView: React.FC<ChatRoomViewProps> = ({
  room,
  currentProfile,
  messages,
  roomUsers,
  blockedUserIds,
  customBannedWords,
  onSendMessage,
  onUpdateColor,
  onLeaveRoom,
  onOpenPrivateChat,
  onBlockUser,
  onReportMessage,
  onReportUser,
  onToggleReaction,
  onTriggerNudge,
  isSending = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEmoticons, setShowEmoticons] = useState(false);
  const [emoticonTab, setEmoticonTab] = useState<'modern' | 'classic'>('modern');
  const [showMobileUsers, setShowMobileUsers] = useState(false);
  const [activeUserMenu, setActiveUserMenu] = useState<{ id: string; alias: string; color_texto: string; x: number; y: number } | null>(null);

  // Anti-Spam (2s global, 30s en sala silenciosa)
  const isSilentRoom = room.isSpecial === 'sala-silenciosa';
  const cooldownDuration = isSilentRoom ? 30 : 2;
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dailyTopic = getDailyTopic();

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    if (cooldownRemaining > 0) {
      setWarningMessage(`Espera ${cooldownRemaining}s para volver a enviar en ${room.nombre}.`);
      setTimeout(() => setWarningMessage(null), 3000);
      return;
    }

    const bannedCheck = checkBannedWords(inputText, customBannedWords);
    if (bannedCheck.isBanned) {
      setWarningMessage(`Tu mensaje contiene términos no permitidos ("${bannedCheck.word}") y no fue enviado.`);
      setTimeout(() => setWarningMessage(null), 4000);
      return;
    }

    const text = inputText;
    setInputText('');
    setCooldownRemaining(cooldownDuration);

    await onSendMessage(text);
  };

  const insertEmoji = (emoji: string) => {
    setInputText((prev) => `${prev}${emoji}`);
    setShowEmoticons(false);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  const visibleMessages = messages.filter((m) => !blockedUserIds.has(m.user_id));

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#d4d0c8]">
      {/* Aviso Permanente de Seguridad estilo clásico Yahoo */}
      <div className="bg-[#fff9e6] border-b border-[#d4c090] px-3 py-1 text-[10px] text-[#553300] flex items-center justify-between font-sans">
        <div className="flex items-center space-x-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-[#cc6600] shrink-0" />
          <span>
            <strong>Aviso de seguridad:</strong> No compartas datos personales (teléfono, dirección, redes). Nadie del equipo te los pedirá.
          </span>
        </div>
        <span className="text-gray-500 hidden md:inline font-mono text-[9px]">Comunidad Segura</span>
      </div>

      {/* Header de la Sala Clásico Yahoo! */}
      <div className="bg-[#ece9d8] border-b border-[#808080] px-2.5 py-1 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          {/* Botón Salir */}
          <button
            onClick={onLeaveRoom}
            className="px-2 py-0.5 bevel-button text-[11px] font-bold text-gray-800 flex items-center space-x-1 hover:bg-[#e4e0d8] cursor-pointer"
            title="Volver a la lista de salas"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gray-700" />
            <span>Salir de Sala</span>
          </button>

          <span className="font-bold text-[#000080] ml-1">Sala:</span>
          <span className="font-serif font-black text-sm text-[#5b146f] tracking-tight flex items-center gap-1">
            <span>{room.nombre}</span>
            {isSilentRoom && (
              <span className="text-[9px] bg-indigo-100 text-indigo-900 px-1 py-0.2 rounded font-sans font-bold border border-indigo-300">
                Pausada (30s)
              </span>
            )}
          </span>
        </div>

        {/* User Alias, Color & Mobile Users Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMobileUsers(!showMobileUsers)}
            className="sm:hidden px-2 py-0.5 bevel-button text-[11px] font-bold text-[#000080] flex items-center space-x-1 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Usuarios ({roomUsers.length})</span>
          </button>

          <div className="bg-white bevel-sunken px-2.5 py-0.5 flex items-center space-x-1.5 shadow-xs">
            <span className="text-gray-600 text-[10px]">Tú:</span>
            <span
              className="font-bold text-xs"
              style={{ color: currentProfile.color_texto }}
            >
              {currentProfile.alias}
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Cambiar color de texto"
              className="px-2 py-0.5 bevel-button text-[10px] flex items-center space-x-1 font-semibold text-gray-800 cursor-pointer"
            >
              <Palette className="w-3 h-3 text-[#000080]" />
              <span
                className="w-2.5 h-2.5 border border-black inline-block ml-0.5"
                style={{ backgroundColor: currentProfile.color_texto }}
              />
            </button>

            {showColorPicker && (
              <div className="absolute right-0 top-full mt-1 bg-[#d4d0c8] bevel-window p-2 z-30 shadow-xl w-48">
                <div className="text-[10px] font-bold text-gray-800 mb-1.5">
                  Elige tu color de texto:
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {COLORES_TEXTO_CHAT.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        onUpdateColor(c);
                        setShowColorPicker(false);
                      }}
                      className="w-8 h-6 border-2 border-white hover:scale-110 transition-transform bevel-button cursor-pointer"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tema del Día (Icebreaker Banner) */}
      <div className="bg-[#f0f4f8] border-b border-[#b0c0d0] px-3 py-1 flex items-center justify-between text-[11px] text-[#002244]">
        <div className="flex items-center space-x-2">
          <span className="px-1.5 py-0.2 bg-[#000080] text-yellow-300 rounded-xs text-[9px] font-bold uppercase flex items-center gap-1 font-mono">
            <Lightbulb className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300" />
            Tema del Día
          </span>
          <span className="font-semibold text-gray-800 italic">
            "{dailyTopic.topic}"
          </span>
        </div>
        <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">
          Rotativo 00:00 UTC
        </span>
      </div>

      {/* Banner fijado Sala "Recién Llegados" */}
      {room.isSpecial === 'recien-llegados' && (
        <div className="bg-[#eef8ee] border-b border-[#a8d8a8] px-3 py-2 text-[11px] text-[#004400] flex items-start space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-tight">
            <strong>¡Bienvenido a la Sala de Recién Llegados!</strong>
            <p className="text-[10px] text-gray-700 mt-0.5">
              1. Respeta a todos los miembros. • 2. Usa <code className="bg-white px-1 py-0.2 border font-mono">/me [acción]</code> para acciones. • 3. Clic en cualquier usuario para mensaje privado.
            </p>
          </div>
        </div>
      )}

      {/* Main Chat Area (Messages & Users Panel) */}
      <div className="flex-1 flex flex-row min-h-0 p-2 gap-2 overflow-hidden relative">
        {/* Messages Container (Fondo blanco clásico de Yahoo con borde hundido profundo) */}
        <div className="flex-1 flex flex-col min-w-0 bg-white bevel-deep-sunken overflow-hidden">
          <div className="flex-1 p-2.5 overflow-y-auto space-y-1.5 select-text font-sans text-xs">
            {visibleMessages.length === 0 ? (
              <div className="text-gray-400 italic text-center py-12">
                No hay mensajes aún en {room.nombre}. ¡Escribe el primero o prueba /me saluda!
              </div>
            ) : (
              visibleMessages.map((msg) => {
                // System message
                if (msg.is_system) {
                  return (
                    <div
                      key={msg.id}
                      className="text-gray-600 italic text-[11px] py-0.5 px-1 bg-yellow-50/70 rounded-xs font-mono border-b border-dotted border-gray-300"
                    >
                      <span className="text-gray-400 mr-2">[{formatTime(msg.created_at)}]</span>
                      <span>{msg.contenido}</span>
                    </div>
                  );
                }

                // Bot Anfitrión message
                if (msg.is_bot) {
                  return (
                    <div
                      key={msg.id}
                      className="p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded text-gray-800 my-1"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#000080] mb-0.5">
                        <Bot className="w-3.5 h-3.5 text-blue-700" />
                        <span>[Anfitrión OKI !]</span>
                        <span className="text-[9px] text-gray-400 font-mono">[{formatTime(msg.created_at)}]</span>
                      </div>
                      <div className="text-[11px] font-medium pl-5">{msg.contenido}</div>
                    </div>
                  );
                }

                // Acción retro comando /me (mIRC / Yahoo style)
                if (msg.is_action) {
                  return (
                    <div
                      key={msg.id}
                      className="leading-snug py-0.5 px-1 flex items-baseline gap-x-1.5 text-[#6b21a8] italic font-semibold hover:bg-purple-50/60 rounded group"
                    >
                      <span className="text-gray-400 text-[10px] font-mono not-italic shrink-0">
                        [{formatTime(msg.created_at)}]
                      </span>
                      <span className="text-purple-700 font-bold">*</span>
                      <span
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveUserMenu({
                            id: msg.user_id,
                            alias: msg.alias,
                            color_texto: msg.color_texto || '#6b21a8',
                            x: rect.left,
                            y: rect.bottom,
                          });
                        }}
                        className="text-purple-900 font-bold cursor-pointer hover:underline"
                      >
                        {msg.alias}
                      </span>
                      <span className="text-purple-900">{msg.contenido}</span>
                    </div>
                  );
                }

                // Mensaje normal de usuario
                const isCurrentUser = msg.user_id === currentProfile.id || msg.alias === currentProfile.alias;
                const userColor = isCurrentUser ? currentProfile.color_texto : msg.color_texto || '#000080';
                const badges = getUserBadges(undefined, msg.created_at);

                return (
                  <div
                    key={msg.id}
                    className="leading-snug py-0.5 hover:bg-blue-50/50 rounded px-1 flex flex-wrap items-baseline gap-x-1.5 group relative"
                  >
                    <span className="text-gray-400 text-[10px] font-mono shrink-0">
                      [{formatTime(msg.created_at)}]
                    </span>

                    {/* Insignias */}
                    {badges.map((b) => (
                      <span
                        key={b.id}
                        className={`px-1 py-0.2 rounded text-[9px] font-bold ${b.bg} ${b.text} flex items-center gap-0.5`}
                        title={b.description}
                      >
                        <span>{b.emoji}</span>
                        <span className="hidden sm:inline">{b.label}</span>
                      </span>
                    ))}

                    {/* Alias */}
                    <span
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setActiveUserMenu({
                          id: msg.user_id,
                          alias: msg.alias,
                          color_texto: userColor,
                          x: rect.left,
                          y: rect.bottom,
                        });
                      }}
                      className="font-bold cursor-pointer hover:underline shrink-0"
                      style={{ color: userColor }}
                      title="Clic para opciones (mensaje privado, bloquear, reportar)"
                    >
                      &lt;{msg.alias}&gt;:
                    </span>

                    <span
                      className="text-gray-900 break-words font-medium flex-1 text-xs"
                      style={{ color: userColor }}
                    >
                      {msg.contenido}
                    </span>

                    {/* Reacciones en hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 pl-2">
                      {REACTION_EMOJIS.map((emoji) => {
                        const reacts = msg.reactions?.[emoji] || [];
                        const hasReacted = reacts.includes(currentProfile.id);
                        return (
                          <button
                            key={emoji}
                            onClick={() => onToggleReaction(msg.id, emoji)}
                            className={`text-[12px] p-0.5 hover:scale-125 transition-transform cursor-pointer rounded ${
                              hasReacted ? 'bg-blue-100 ring-1 ring-blue-400' : ''
                            }`}
                            title={`Reaccionar con ${emoji}`}
                          >
                            {emoji}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => onReportMessage(msg)}
                        className="text-gray-400 hover:text-amber-700 p-0.5"
                        title="Reportar este mensaje"
                      >
                        <ShieldAlert className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Conteo de reacciones debajo */}
                    {msg.reactions && Object.keys(msg.reactions).some((k) => (msg.reactions![k] || []).length > 0) && (
                      <div className="w-full flex flex-wrap gap-1 mt-0.5 pl-12">
                        {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                          if (!userIds || userIds.length === 0) return null;
                          const hasMyReaction = userIds.includes(currentProfile.id);
                          return (
                            <button
                              key={emoji}
                              onClick={() => onToggleReaction(msg.id, emoji as EmojiReaction)}
                              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold border flex items-center space-x-1 transition-colors cursor-pointer ${
                                hasMyReaction
                                  ? 'bg-blue-100 border-blue-400 text-blue-900'
                                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span className="font-mono text-[9px]">{userIds.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* User Sidebar clásico de Yahoo Chat */}
        <div
          className={`${
            showMobileUsers
              ? 'absolute inset-y-2 right-2 z-20 w-64 shadow-2xl flex'
              : 'hidden sm:flex'
          } w-48 sm:w-56 shrink-0 flex-col bg-[#ece9d8] bevel-sunken p-1.5`}
        >
          <div className="bg-[#000080] text-white px-2 py-0.5 font-bold text-[11px] flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-1">
              <Users className="w-3.5 h-3.5" />
              <span>En la sala ({roomUsers.length})</span>
            </div>
            {showMobileUsers ? (
              <button
                onClick={() => setShowMobileUsers(false)}
                className="w-4 h-4 bg-white/20 rounded flex items-center justify-center hover:bg-red-500 cursor-pointer text-white"
              >
                ✕
              </button>
            ) : (
              <span className="text-[10px] text-yellow-300 font-serif">Yahoo!</span>
            )}
          </div>

          {/* Users List */}
          <div className="flex-1 bg-white bevel-deep-sunken overflow-y-auto p-1 space-y-1">
            {roomUsers.map((u) => {
              const isMe = u.id === currentProfile.id || u.alias === currentProfile.alias;
              const isBlocked = blockedUserIds.has(u.id);

              return (
                <div
                  key={u.id || u.alias}
                  onClick={(e) => {
                    if (isMe) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    setActiveUserMenu({
                      id: u.id,
                      alias: u.alias,
                      color_texto: u.color_texto,
                      x: rect.left - 150,
                      y: rect.top,
                    });
                  }}
                  className={`px-1.5 py-0.5 flex items-center space-x-1.5 text-[11px] rounded transition-colors cursor-pointer ${
                    isMe
                      ? 'bg-blue-100/70 font-bold'
                      : isBlocked
                      ? 'bg-red-50 text-gray-400 line-through'
                      : 'hover:bg-gray-100'
                  }`}
                  title={isMe ? 'Tú' : 'Clic para mensaje privado, ignorar o reportar'}
                >
                  <span
                    className={`w-2 h-2 rounded-full inline-block shrink-0 ${
                      isBlocked ? 'bg-gray-400' : 'bg-green-600'
                    }`}
                  />
                  <span
                    className="truncate flex-1 font-semibold"
                    style={{ color: isBlocked ? '#999' : u.color_texto || '#000080' }}
                  >
                    {u.alias}
                  </span>
                  {isMe && (
                    <span className="text-[9px] text-gray-600 bg-gray-200 px-1 rounded">
                      Tú
                    </span>
                  )}
                  {isBlocked && (
                    <span className="text-[9px] text-red-700 bg-red-100 px-1 rounded font-bold">
                      Ignorado
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Panel de Zumbido MSN y Acciones */}
          <div className="pt-1.5 space-y-1 text-[10px]">
            {onTriggerNudge && (
              <button
                onClick={onTriggerNudge}
                className="w-full py-1 bevel-button font-bold flex items-center justify-center gap-1.5 text-[#800000] hover:bg-red-50 cursor-pointer active:translate-y-0.5 shadow-xs"
                title="Enviar un Zumbido / Timbre sonoro de MSN Messenger que hace temblar la ventana"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-pulse" />
                <span>Timbre / Zumbido MSN</span>
              </button>
            )}
            <div className="text-gray-500 text-[10px] text-center pt-0.5 font-mono">
              Yahoo! Chat • {room.nombre}
            </div>
          </div>
        </div>
      </div>

      {/* Pop-up Menú de Usuario */}
      {activeUserMenu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          onClick={() => setActiveUserMenu(null)}
        >
          <div
            className="bg-[#d4d0c8] bevel-window p-2 shadow-2xl w-56 text-xs space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[#808080] pb-1 mb-1 font-bold text-[#000080] flex items-center justify-between">
              <span>{activeUserMenu.alias}</span>
              <button onClick={() => setActiveUserMenu(null)} className="text-gray-600 hover:text-black">✕</button>
            </div>

            <button
              onClick={() => {
                onOpenPrivateChat(activeUserMenu);
                setActiveUserMenu(null);
              }}
              className="w-full px-2 py-1 text-left bevel-button hover:bg-white font-bold text-[#000080] flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Enviar Mensaje Privado</span>
            </button>

            <button
              onClick={() => {
                onBlockUser(activeUserMenu.id, activeUserMenu.alias);
                setActiveUserMenu(null);
              }}
              className="w-full px-2 py-1 text-left bevel-button hover:bg-red-50 font-semibold text-red-800 flex items-center gap-2 cursor-pointer"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>{blockedUserIds.has(activeUserMenu.id) ? 'Desbloquear Usuario' : 'Ignorar / Bloquear'}</span>
            </button>

            <button
              onClick={() => {
                onReportUser(activeUserMenu.id, activeUserMenu.alias);
                setActiveUserMenu(null);
              }}
              className="w-full px-2 py-1 text-left bevel-button hover:bg-amber-50 font-semibold text-amber-900 flex items-center gap-2 cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Reportar Usuario</span>
            </button>
          </div>
        </div>
      )}

      {/* Alerta de Spam / Cooldown o Palabras Prohibidas */}
      {warningMessage && (
        <div className="bg-red-100 border-t border-red-300 px-3 py-1.5 text-red-900 text-xs flex items-center justify-between font-semibold animate-pulse">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-700" />
            <span>{warningMessage}</span>
          </div>
          <button onClick={() => setWarningMessage(null)} className="text-red-700 font-bold">✕</button>
        </div>
      )}

      {/* Barra Inferior de Entrada Clásica Yahoo Chat */}
      <div className="p-2 bg-[#ece9d8] border-t border-[#808080]">
        <div className="flex items-center justify-between mb-1 text-[11px]">
          <div className="flex items-center space-x-1.5 relative">
            {/* Botón de Emoticonos (Modernos + Clásicos) */}
            <button
              type="button"
              onClick={() => setShowEmoticons(!showEmoticons)}
              className="px-2 py-0.5 bevel-button flex items-center space-x-1 font-semibold text-gray-800 cursor-pointer"
            >
              <Smile className="w-3.5 h-3.5 text-yellow-600" />
              <span>Emoticonos</span>
            </button>

            {/* Popover enriquecido con Emoticones Modernos + Clásicos */}
            {showEmoticons && (
              <div className="absolute left-0 bottom-full mb-1 bg-[#d4d0c8] bevel-window p-2 z-30 shadow-2xl w-72 max-h-72 flex flex-col">
                <div className="flex items-center justify-between mb-1.5 border-b border-[#808080] pb-1">
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setEmoticonTab('modern')}
                      className={`px-2 py-0.5 text-[10px] font-bold bevel-button cursor-pointer ${
                        emoticonTab === 'modern' ? 'bg-white text-[#000080]' : 'text-gray-700'
                      }`}
                    >
                      Modernos 😎
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmoticonTab('classic')}
                      className={`px-2 py-0.5 text-[10px] font-bold bevel-button cursor-pointer ${
                        emoticonTab === 'classic' ? 'bg-white text-[#000080]' : 'text-gray-700'
                      }`}
                    >
                      Clásicos :-)
                    </button>
                  </div>
                  <button
                    onClick={() => setShowEmoticons(false)}
                    className="text-gray-600 hover:text-red-700 font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>

                {emoticonTab === 'modern' ? (
                  <div className="overflow-y-auto space-y-2 p-1 max-h-56">
                    {MODERN_EMOJIS_CATEGORIES.map((cat) => (
                      <div key={cat.category}>
                        <div className="text-[9px] font-bold text-gray-700 mb-0.5 uppercase tracking-wider font-mono">
                          {cat.category}
                        </div>
                        <div className="grid grid-cols-7 gap-1 bg-white p-1 bevel-sunken">
                          {cat.emojis.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => insertEmoji(emoji)}
                              className="text-base p-0.5 hover:scale-130 transition-transform cursor-pointer rounded hover:bg-blue-100 flex items-center justify-center"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-56 p-1 grid grid-cols-2 gap-1 bg-white bevel-sunken">
                    {CLASSIC_30_EMOTICONS.map((e) => (
                      <button
                        key={e.code}
                        type="button"
                        onClick={() => insertEmoji(` ${e.code} `)}
                        className="px-1.5 py-0.5 bevel-button text-left font-mono text-[10px] hover:bg-blue-50 flex items-center justify-between cursor-pointer"
                        title={e.name}
                      >
                        <span className="font-bold text-[#000080]">{e.code}</span>
                        <span className="text-[9px] text-gray-500 font-sans truncate ml-1">{e.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setInputText((prev) => (prev ? `${prev} /me ` : '/me '))}
              className="px-2 py-0.5 bevel-button text-[10px] font-mono font-semibold text-purple-800 hover:bg-purple-50 cursor-pointer"
              title="Insertar comando /me para describir una acción"
            >
              /me acción
            </button>
          </div>

          <div className="flex items-center space-x-2 text-[10px]">
            {cooldownRemaining > 0 ? (
              <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                Espera {cooldownRemaining}s
              </span>
            ) : (
              <span className="text-gray-500 font-mono hidden sm:inline">
                {isSilentRoom ? 'Modo Silencioso (1 msg/30s)' : 'Presiona Enter para enviar'}
              </span>
            )}
          </div>
        </div>

        {/* Input y Botón Enviar con relieve clásico */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              cooldownRemaining > 0
                ? `Espera ${cooldownRemaining}s para volver a enviar...`
                : `Escribe en ${room.nombre}...`
            }
            disabled={cooldownRemaining > 0}
            maxLength={350}
            className={`flex-1 p-2 bg-white bevel-deep-sunken text-xs font-sans text-gray-900 focus:outline-none placeholder:text-gray-400 ${
              cooldownRemaining > 0 ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''
            }`}
            style={{ color: currentProfile.color_texto }}
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending || cooldownRemaining > 0}
            className="px-6 py-2 bevel-button font-bold text-xs text-[#000080] hover:bg-white active:translate-y-0.5 disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5 inline mr-1" />
            <span>{cooldownRemaining > 0 ? `${cooldownRemaining}s` : 'Enviar'}</span>
          </button>
        </form>
      </div>

      {/* Retro Status Bar */}
      <div className="bg-[#d4d0c8] border-t border-[#808080] px-3 py-0.5 flex items-center justify-between text-[10px] text-gray-700 select-none">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-600 animate-pulse" />
          <span>Conectado a {room.nombre} • OKI ! (Firebase Realtime)</span>
        </div>
        <div className="flex items-center space-x-3 font-mono text-[10px]">
          <span>{visibleMessages.length} mensajes</span>
          <span>Online: {roomUsers.length}</span>
        </div>
      </div>
    </div>
  );
};
