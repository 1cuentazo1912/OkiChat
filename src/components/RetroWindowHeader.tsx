import React from 'react';
import { Volume2, VolumeX, Flame, Sparkles, HelpCircle, LogOut, Shield } from 'lucide-react';

interface RetroWindowHeaderProps {
  title?: string;
  isSoundMuted?: boolean;
  onToggleSound?: () => void;
  onOpenInfo?: () => void;
  onOpenAdmin?: () => void;
  onLogout?: () => void;
  isLoggedIn?: boolean;
  isFirebaseConnected?: boolean;
  isAdmin?: boolean;
}

export const RetroWindowHeader: React.FC<RetroWindowHeaderProps> = ({
  title = 'OKI ! - Sala General 1',
  isSoundMuted = false,
  onToggleSound,
  onOpenInfo,
  onOpenAdmin,
  onLogout,
  isLoggedIn = false,
  isFirebaseConnected = true,
  isAdmin = false,
}) => {
  return (
    <div className="w-full">
      {/* Title Bar - Clásico degradado azul marino Windows / Yahoo Chat 2000 */}
      <div className="bg-gradient-to-r from-[#000080] via-[#1084d0] to-[#000080] text-white px-2.5 py-1 flex items-center justify-between font-bold text-xs select-none shadow-sm">
        <div className="flex items-center space-x-2">
          {/* Logo Badge estilo retro Yahoo! / OKI ! */}
          <div className="px-1.5 py-0.2 bg-[#5b146f] text-yellow-300 font-serif font-black text-[11px] leading-tight flex items-center justify-center rounded-xs border border-yellow-200 shadow-xs">
            OKI !
          </div>
          <span className="tracking-wide drop-shadow-[1px_1px_1px_rgba(0,0,0,0.8)] font-sans font-bold text-[12px]">
            {title}
          </span>
          {isFirebaseConnected ? (
            <span className="bg-emerald-800 text-white text-[9px] px-1.5 py-0.2 rounded border border-emerald-300 font-mono flex items-center gap-1 shadow-xs">
              <Flame className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300" />
              <span>Firebase Live</span>
            </span>
          ) : (
            <span className="bg-amber-700 text-white text-[9px] px-1.5 py-0.2 rounded border border-amber-300 font-mono">
              ○ Local
            </span>
          )}
        </div>

        {/* Window controls clásicos de Windows 98 / 2000 */}
        <div className="flex items-center space-x-1">
          {onToggleSound && (
            <button
              onClick={onToggleSound}
              title={isSoundMuted ? 'Activar sonido' : 'Silenciar sonido'}
              className="w-5 h-4 bg-[#d4d0c8] text-black text-[10px] flex items-center justify-center bevel-button hover:bg-[#e4e0d8] cursor-pointer"
            >
              {isSoundMuted ? <VolumeX className="w-3 h-3 text-red-700" /> : <Volume2 className="w-3 h-3 text-blue-900" />}
            </button>
          )}

          <button
            title="Minimizar"
            className="w-4 h-4 bg-[#d4d0c8] text-black text-[10px] font-bold flex items-center justify-center bevel-button leading-none"
          >
            _
          </button>
          <button
            title="Maximizar"
            className="w-4 h-4 bg-[#d4d0c8] text-black text-[10px] font-bold flex items-center justify-center bevel-button leading-none"
          >
            □
          </button>
          <button
            title="Cerrar"
            onClick={onLogout}
            className="w-4 h-4 bg-[#d4d0c8] text-black text-[10px] font-bold flex items-center justify-center bevel-button leading-none hover:bg-red-200"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Barra de Menús clásica de Yahoo / Windows */}
      <div className="bg-[#ece9d8] border-b border-[#808080] px-2 py-0.5 flex flex-wrap items-center justify-between text-[11px] text-[#222]">
        <div className="flex items-center space-x-3">
          <span className="hover:bg-[#000080] hover:text-white px-1 py-0.5 cursor-pointer rounded-xs">
            <u>A</u>rchivo
          </span>
          <span className="hover:bg-[#000080] hover:text-white px-1 py-0.5 cursor-pointer rounded-xs">
            <u>E</u>dición
          </span>
          <span className="hover:bg-[#000080] hover:text-white px-1 py-0.5 cursor-pointer rounded-xs">
            <u>S</u>alas
          </span>
          {onOpenInfo && (
            <button
              onClick={onOpenInfo}
              className="flex items-center space-x-1 hover:bg-[#000080] hover:text-white px-1 py-0.5 cursor-pointer rounded-xs text-[#000080] font-semibold"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span><u>A</u>cerca de OKI !</span>
            </button>
          )}

          {isAdmin && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center space-x-1 bg-red-700 hover:bg-red-800 text-white px-2 py-0.5 cursor-pointer rounded-xs font-bold transition-colors shadow-2xs"
            >
              <Shield className="w-3 h-3" />
              <span>Panel <u>M</u>oderación</span>
            </button>
          )}
        </div>

        {isLoggedIn && onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center space-x-1 text-red-800 hover:bg-red-700 hover:text-white px-1.5 py-0.5 rounded font-semibold cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-3 h-3" />
            <span>Salir del Chat</span>
          </button>
        )}
      </div>
    </div>
  );
};
