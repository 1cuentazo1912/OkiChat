import React, { useState } from 'react';
import { Users, Sparkles, RefreshCw, AlertCircle, ArrowRight, Palette, Shield } from 'lucide-react';
import { Room, Profile } from '../types';
import { ALL_ROOMS, getOccupancyLevel, getOccupancyBadgeColor, getAliasCooldownRemaining } from '../lib/roomsData';
import { COLORES_TEXTO_CHAT } from '../lib/aliasGenerator';

interface RoomsLobbyViewProps {
  currentProfile: Profile;
  roomCounts: Record<string, number>;
  onSelectRoom: (roomId: string) => void;
  onRequestNewAlias: () => Promise<void>;
  onUpdateColor: (color: string) => Promise<void>;
  onOpenAdminPanel?: () => void;
  isChangingAlias?: boolean;
}

export const RoomsLobbyView: React.FC<RoomsLobbyViewProps> = ({
  currentProfile,
  roomCounts,
  onSelectRoom,
  onRequestNewAlias,
  onUpdateColor,
  onOpenAdminPanel,
  isChangingAlias = false,
}) => {
  const [showFullRoomAlert, setShowFullRoomAlert] = useState<{ roomName: string; suggestedRoomId: string } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState<string | null>(null);

  const cooldown = getAliasCooldownRemaining(currentProfile.ultimo_cambio_alias);
  const isAdmin = currentProfile.role === 'admin';

  const handleRoomClick = (room: Room) => {
    const count = roomCounts[room.id] || 0;
    if (count >= room.capacidad) {
      const available = ALL_ROOMS.find((r) => (roomCounts[r.id] || 0) < r.capacidad && r.id !== room.id);
      setShowFullRoomAlert({
        roomName: room.nombre,
        suggestedRoomId: available ? available.id : 'general-1',
      });
      return;
    }
    onSelectRoom(room.id);
  };

  const handleAliasChangeClick = async () => {
    if (!cooldown.canChange) {
      setCooldownMessage(`Debes esperar ${cooldown.hoursLeft}h ${cooldown.minutesLeft}m para pedir otro alias (máximo 1 vez cada 24 horas).`);
      setTimeout(() => setCooldownMessage(null), 4000);
      return;
    }
    setCooldownMessage(null);
    await onRequestNewAlias();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#d4d0c8] p-3 sm:p-4 overflow-y-auto font-sans">
      {/* Header perfil de usuario clásico Yahoo */}
      <div className="bg-[#ece9d8] bevel-sunken p-3 mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-[#5b146f] text-yellow-300 flex items-center justify-center font-serif font-black text-sm border border-yellow-200">
            {currentProfile.alias.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-[11px]">Tu Alias en OKI !:</span>
              <span
                className="font-bold text-sm font-sans"
                style={{ color: currentProfile.color_texto }}
              >
                {currentProfile.alias}
              </span>
              {isAdmin && (
                <span className="px-1.5 py-0.2 bg-red-700 text-white font-bold text-[9px] rounded-xs font-mono flex items-center gap-0.5">
                  <Shield className="w-2.5 h-2.5" />
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-gray-500 text-[10px]">
              Selecciona una sala para entrar. Capacidad máxima: 50 usuarios por sala.
            </p>
          </div>
        </div>

        {/* Acciones de Perfil */}
        <div className="flex items-center space-x-2">
          {isAdmin && onOpenAdminPanel && (
            <button
              onClick={onOpenAdminPanel}
              className="px-2.5 py-1 bg-red-800 text-white font-bold text-[11px] bevel-button hover:bg-red-900 flex items-center gap-1 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Panel Admin</span>
            </button>
          )}

          {/* Selector de color */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="px-2 py-1 bevel-button text-[11px] flex items-center space-x-1 font-semibold text-gray-800 cursor-pointer"
              title="Cambiar color de texto"
            >
              <Palette className="w-3.5 h-3.5 text-[#000080]" />
              <span>Color</span>
              <span
                className="w-3 h-3 border border-black inline-block ml-0.5"
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

          {/* Botón Pedir Alias Nuevo */}
          <button
            onClick={handleAliasChangeClick}
            disabled={isChangingAlias}
            className={`px-3 py-1 bevel-button font-bold text-[11px] flex items-center space-x-1.5 cursor-pointer ${
              cooldown.canChange
                ? 'text-[#000080] hover:bg-white'
                : 'text-gray-400 cursor-not-allowed opacity-75'
            }`}
            title={cooldown.canChange ? 'Pedir alias nuevo (1 vez cada 24h)' : `Espera ${cooldown.hoursLeft}h ${cooldown.minutesLeft}m`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChangingAlias ? 'animate-spin' : ''}`} />
            <span>Pedir alias nuevo</span>
          </button>
        </div>
      </div>

      {/* Alerta de cooldown alias */}
      {cooldownMessage && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-300 text-yellow-900 text-[11px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-700 shrink-0" />
          <span>{cooldownMessage}</span>
        </div>
      )}

      {/* Modal Alerta de Sala Llena */}
      {showFullRoomAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#d4d0c8] bevel-window p-3 space-y-3 shadow-2xl">
            <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-red-700" />
              <span>{showFullRoomAlert.roomName} está llena (50/50)</span>
            </div>
            <p className="text-gray-800 text-xs leading-tight">
              La sala seleccionada ha alcanzado su límite de 50 usuarios. Te sugerimos entrar a otra sala disponible:
            </p>
            <div className="bg-white p-2 bevel-sunken flex items-center justify-between">
              <span className="font-bold text-[#000080] text-xs">
                {ALL_ROOMS.find((r) => r.id === showFullRoomAlert.suggestedRoomId)?.nombre || 'Sala General'}
              </span>
              <button
                onClick={() => {
                  const target = showFullRoomAlert.suggestedRoomId;
                  setShowFullRoomAlert(null);
                  onSelectRoom(target);
                }}
                className="px-2.5 py-1 bevel-button font-bold text-xs text-[#000080] flex items-center gap-1 cursor-pointer"
              >
                <span>Entrar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setShowFullRoomAlert(null)}
                className="px-3 py-1 bevel-button font-semibold text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Título de Salas e Indicadores */}
      <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
        <div>
          <h2 className="text-xs font-bold text-[#000080] flex items-center gap-1.5">
            <span className="px-1.5 py-0.2 bg-[#5b146f] text-yellow-300 font-serif font-black text-[10px]">
              OKI !
            </span>
            <span>Salas Públicas en Vivo ({ALL_ROOMS.length} Salas)</span>
          </h2>
        </div>

        {/* Leyenda de Ocupación */}
        <div className="flex items-center space-x-2 text-[10px] bg-white bevel-sunken px-2 py-0.5">
          <span className="text-gray-600">Ocupación:</span>
          <span className="flex items-center gap-1 text-green-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-green-600" />
            &lt; 25 Libre
          </span>
          <span className="flex items-center gap-1 text-amber-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            25-44 Media
          </span>
          <span className="flex items-center gap-1 text-red-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            45+ Llena
          </span>
        </div>
      </div>

      {/* Grid de Salas estilo clásico Yahoo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ALL_ROOMS.map((room) => {
          const count = roomCounts[room.id] || 0;
          const level = getOccupancyLevel(count);
          const badge = getOccupancyBadgeColor(level);
          const isFull = count >= room.capacidad;

          const isRecienLlegados = room.isSpecial === 'recien-llegados';
          const isSilenciosa = room.isSpecial === 'sala-silenciosa';

          return (
            <div
              key={room.id}
              onClick={() => handleRoomClick(room)}
              className={`p-2.5 bg-[#ece9d8] bevel-raised hover:bg-white transition-colors cursor-pointer flex items-center justify-between ${
                isFull ? 'bg-red-50' : ''
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#000080] text-xs">
                    {room.nombre}
                  </span>
                  {isRecienLlegados && (
                    <span className="text-[9px] bg-green-700 text-white font-bold px-1 rounded-xs">
                      NUEVOS ⭐
                    </span>
                  )}
                  {isSilenciosa && (
                    <span className="text-[9px] bg-indigo-700 text-white font-bold px-1 rounded-xs">
                      PAUSADA 30s
                    </span>
                  )}
                  {isFull && (
                    <span className="text-[9px] bg-red-700 text-white font-bold px-1 rounded-xs">
                      LLENA
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-600">
                  {room.description || 'Capacidad 50 usuarios'}
                </div>
              </div>

              {/* Indicador de ocupación */}
              <div className="flex items-center space-x-2">
                <div
                  className={`px-2 py-0.5 border text-[10px] font-bold flex items-center space-x-1 ${badge.bg} ${badge.text} ${badge.border}`}
                >
                  <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                  <span className="font-mono">{count} / {room.capacidad}</span>
                </div>

                <button
                  type="button"
                  className="px-2.5 py-1 bevel-button font-bold text-[11px] text-[#000080] flex items-center gap-1 hover:bg-white cursor-pointer"
                >
                  <span>Entrar</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
