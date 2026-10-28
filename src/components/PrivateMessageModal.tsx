import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, X, ShieldAlert, UserX, MessageSquare, Zap } from 'lucide-react';
import { PrivateMessage, Profile } from '../types';
import { sendPrivateMessage, subscribeToPrivateConversation } from '../lib/firebase';
import { playReceiveSound, playSentSound, playMsnNudgeSound } from '../lib/audio';
import { CLASSIC_30_EMOTICONS, MODERN_EMOJIS_CATEGORIES } from '../lib/roomsData';

interface PrivateMessageModalProps {
  currentProfile: Profile;
  targetUser: { id: string; alias: string; color_texto: string };
  onClose: () => void;
  onBlockUser: (targetId: string, targetAlias: string) => void;
  onReportUser: (targetId: string, targetAlias: string) => void;
  isBlocked?: boolean;
}

export const PrivateMessageModal: React.FC<PrivateMessageModalProps> = ({
  currentProfile,
  targetUser,
  onClose,
  onBlockUser,
  onReportUser,
  isBlocked = false,
}) => {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmoticons, setShowEmoticons] = useState(false);
  const [emoticonTab, setEmoticonTab] = useState<'modern' | 'classic'>('modern');
  const [isSending, setIsSending] = useState(false);
  const [isNudging, setIsNudging] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const triggerModalNudge = () => {
    setIsNudging(true);
    setTimeout(() => setIsNudging(false), 600);
  };

  useEffect(() => {
    const unsub = subscribeToPrivateConversation(currentProfile.id, targetUser.id, (msgs) => {
      setMessages(msgs);
      if (msgs.length > prevCountRef.current && prevCountRef.current > 0) {
        const last = msgs[msgs.length - 1];
        if (last.from_user !== currentProfile.id) {
          if (last.contenido && last.contenido.includes('Zumbido / Timbre MSN')) {
            playMsnNudgeSound();
            triggerModalNudge();
          } else {
            playReceiveSound();
          }
        }
      }
      prevCountRef.current = msgs.length;
    });

    return () => {
      unsub();
    };
  }, [currentProfile.id, targetUser.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending || isBlocked) return;

    const text = inputText;
    setInputText('');
    setIsSending(true);

    try {
      await sendPrivateMessage(
        currentProfile.id,
        currentProfile.alias,
        targetUser.id,
        targetUser.alias,
        text,
        currentProfile.color_texto
      );
      playSentSound();
    } catch (e) {
      console.error('Error sending private message:', e);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendNudge = async () => {
    if (isSending || isBlocked) return;
    playMsnNudgeSound();
    triggerModalNudge();

    try {
      await sendPrivateMessage(
        currentProfile.id,
        currentProfile.alias,
        targetUser.id,
        targetUser.alias,
        '*** te ha enviado un Zumbido / Timbre MSN ***',
        currentProfile.color_texto
      );
    } catch (e) {
      console.error('Error sending private nudge:', e);
    }
  };

  const insertEmoticon = (item: string) => {
    setInputText((prev) => `${prev}${item}`);
    setShowEmoticons(false);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4 backdrop-blur-2xs font-sans text-xs">
      {/* Ventana estilo Yahoo! Messenger / Chat clásico */}
      <div
        className={`w-full max-w-lg bg-[#d4d0c8] bevel-window shadow-2xl flex flex-col h-[500px] border border-[#808080] ${
          isNudging ? 'animate-msn-nudge' : ''
        }`}
      >
        {/* Title bar clásico degradado azul marino Yahoo / Windows 2000 */}
        <div className="bg-gradient-to-r from-[#000080] via-[#1084d0] to-[#5b146f] text-white px-2.5 py-1 flex items-center justify-between font-bold select-none shadow-xs">
          <div className="flex items-center space-x-2">
            <div className="px-1 py-0.2 bg-[#5b146f] text-yellow-300 font-serif font-black text-[10px] leading-tight flex items-center justify-center rounded-xs border border-yellow-200">
              OKI !
            </div>
            <MessageSquare className="w-3.5 h-3.5 text-yellow-300" />
            <span className="truncate">Mensaje Privado - {targetUser.alias}</span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              title="Minimizar"
              className="w-4 h-4 bg-[#d4d0c8] text-black text-[10px] font-bold flex items-center justify-center bevel-button leading-none"
            >
              _
            </button>
            <button
              title="Cerrar"
              onClick={onClose}
              className="w-4 h-4 bg-[#d4d0c8] text-black text-[10px] font-bold flex items-center justify-center bevel-button leading-none hover:bg-red-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* User bar / Info de contacto estilo Yahoo Messenger */}
        <div className="bg-[#ece9d8] border-b border-[#808080] px-3 py-1.5 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block border border-green-800" />
            <span className="text-gray-700 font-semibold">Conversando con:</span>
            <span
              className="font-bold text-xs font-sans"
              style={{ color: targetUser.color_texto || '#000080' }}
            >
              {targetUser.alias}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[10px]">
            <button
              onClick={() => onReportUser(targetUser.id, targetUser.alias)}
              className="px-1.5 py-0.5 bevel-button text-amber-900 font-semibold flex items-center gap-1 hover:bg-amber-50 cursor-pointer"
              title="Reportar comportamiento indebido"
            >
              <ShieldAlert className="w-3 h-3 text-amber-700" />
              <span>Reportar</span>
            </button>
            <button
              onClick={() => onBlockUser(targetUser.id, targetUser.alias)}
              className="px-1.5 py-0.5 bevel-button text-red-900 font-semibold flex items-center gap-1 hover:bg-red-50 cursor-pointer"
              title="Ignorar usuario: sus mensajes públicos y privados dejarán de mostrarse"
            >
              <UserX className="w-3 h-3 text-red-700" />
              <span>{isBlocked ? 'Desbloquear' : 'Ignorar'}</span>
            </button>
          </div>
        </div>

        {/* Security Warning Banner */}
        <div className="bg-yellow-100 border-b border-yellow-300 px-2 py-0.5 text-[10px] text-yellow-900 flex items-center justify-between">
          <span>⚠️ <strong>Aviso de seguridad:</strong> No compartas contraseñas, teléfonos ni dirección personal.</span>
        </div>

        {/* Conversation Area (Sunken white retro pane) */}
        <div className="flex-1 bg-white p-3 overflow-y-auto space-y-1.5 bevel-sunken m-2">
          {messages.length === 0 ? (
            <div className="text-gray-400 italic text-center py-12 text-xs">
              Has iniciado un chat privado con <strong>{targetUser.alias}</strong>.<br />
              Solo ustedes dos pueden leer estos mensajes en tiempo real.
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.from_user === currentProfile.id;
              const isNudgeMsg = m.contenido?.includes('Zumbido / Timbre MSN');

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  {isNudgeMsg ? (
                    <div className="w-full my-1 p-1 bg-amber-50 border border-amber-300 text-amber-900 font-bold text-center rounded-xs text-[11px] animate-pulse">
                      ⚡ {isMe ? 'Has enviado un Zumbido / Timbre MSN' : `${m.from_alias} te ha enviado un Zumbido / Timbre MSN`} ⚡
                    </div>
                  ) : (
                    <div
                      className={`max-w-[85%] p-2 text-xs rounded-xs border ${
                        isMe
                          ? 'bg-[#eef3fb] border-[#b0c4de] text-gray-900'
                          : 'bg-[#fafafa] border-[#d4d0c8] text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-0.5 text-[10px] text-gray-500">
                        <span
                          className="font-bold"
                          style={{ color: isMe ? currentProfile.color_texto : targetUser.color_texto }}
                        >
                          {isMe ? 'Tú' : m.from_alias}
                        </span>
                        <span className="font-mono text-[9px]">{formatTime(m.created_at)}</span>
                      </div>
                      <div className="break-words font-sans">{m.contenido}</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {/* Barra de Entrada y Acciones Retro */}
        <div className="p-2 bg-[#d4d0c8] border-t border-[#808080]">
          {isBlocked ? (
            <div className="text-red-800 text-xs font-semibold text-center py-2 bg-red-100 border border-red-300">
              Has ignorado a este usuario. Desbloquéalo para reanudar la conversación.
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-1.5">
              {/* Barra de herramientas (Emoticonos modernos/clásicos + Timbre MSN) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 relative">
                  {/* Botón de Emoticonos */}
                  <button
                    type="button"
                    onClick={() => setShowEmoticons(!showEmoticons)}
                    className="px-2 py-0.5 bevel-button text-[11px] flex items-center gap-1 font-semibold text-gray-800 cursor-pointer hover:bg-white"
                  >
                    <Smile className="w-3.5 h-3.5 text-amber-600" />
                    <span>Emoticonos</span>
                  </button>

                  {/* Botón de Timbre MSN / Zumbido */}
                  <button
                    type="button"
                    onClick={handleSendNudge}
                    className="px-2 py-0.5 bevel-button text-[11px] flex items-center gap-1 font-bold text-[#800000] hover:bg-red-50 cursor-pointer"
                    title="Enviar un Zumbido sonoro de MSN Messenger que hace temblar la ventana"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-pulse" />
                    <span>Timbre MSN</span>
                  </button>

                  {/* Selector Flotante de Emoticonos (Modernos + Clásicos) */}
                  {showEmoticons && (
                    <div className="absolute left-0 bottom-full mb-1 bg-[#d4d0c8] bevel-window p-2 z-30 shadow-2xl w-64 border border-[#808080]">
                      {/* Pestañas de Selector */}
                      <div className="flex border-b border-[#808080] mb-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setEmoticonTab('modern')}
                          className={`flex-1 py-0.5 font-bold cursor-pointer text-center ${
                            emoticonTab === 'modern'
                              ? 'bg-white text-[#000080] border-t-2 border-l border-r border-[#808080]'
                              : 'bg-[#d4d0c8] text-gray-600 hover:text-black'
                          }`}
                        >
                          Modernos 🎨
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmoticonTab('classic')}
                          className={`flex-1 py-0.5 font-bold cursor-pointer text-center ${
                            emoticonTab === 'classic'
                              ? 'bg-white text-[#000080] border-t-2 border-l border-r border-[#808080]'
                              : 'bg-[#d4d0c8] text-gray-600 hover:text-black'
                          }`}
                        >
                          Clásicos 2000s :-)
                        </button>
                      </div>

                      {emoticonTab === 'modern' ? (
                        <div className="max-h-44 overflow-y-auto space-y-2 bg-white p-1 bevel-sunken">
                          {MODERN_EMOJIS_CATEGORIES.map((cat) => (
                            <div key={cat.category}>
                              <div className="text-[9px] font-bold text-gray-500 mb-0.5 uppercase tracking-wider">
                                {cat.category}
                              </div>
                              <div className="grid grid-cols-6 gap-1">
                                {cat.emojis.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => insertEmoticon(emoji)}
                                    className="text-base p-1 hover:bg-blue-100 rounded text-center cursor-pointer transition-transform hover:scale-125"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="max-h-44 overflow-y-auto bg-white p-1 bevel-sunken grid grid-cols-2 gap-1">
                          {CLASSIC_30_EMOTICONS.map((e) => (
                            <button
                              key={e.code}
                              type="button"
                              onClick={() => insertEmoticon(` ${e.code} `)}
                              className="px-1.5 py-0.5 bevel-button text-left font-mono text-[10px] hover:bg-yellow-50 flex items-center justify-between cursor-pointer"
                            >
                              <span className="font-bold text-[#000080]">{e.code}</span>
                              <span className="text-[9px] text-gray-500 truncate ml-1">{e.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-gray-600">Enter para enviar</span>
              </div>

              {/* Input y botón enviar */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Escribe a ${targetUser.alias}...`}
                  maxLength={300}
                  className="flex-1 px-2 py-1.5 bg-white bevel-sunken text-xs font-sans text-black focus:outline-none placeholder:text-gray-400"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="px-3 py-1.5 bevel-button font-bold text-xs text-[#000080] flex items-center gap-1 cursor-pointer disabled:opacity-50 hover:bg-white"
                >
                  <Send className="w-3 h-3" />
                  <span>Enviar</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
