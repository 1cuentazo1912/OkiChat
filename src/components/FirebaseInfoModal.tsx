import React from 'react';
import { Flame, ShieldCheck, Sparkles, CheckCircle2, Zap } from 'lucide-react';

interface FirebaseInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseInfoModal: React.FC<FirebaseInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-2xs font-sans text-xs">
      <div className="w-full max-w-lg bg-[#d4d0c8] bevel-window shadow-2xl flex flex-col border border-[#808080]">
        {/* Title bar clásico degradado azul marino Yahoo / Windows */}
        <div className="bg-gradient-to-r from-[#000080] via-[#1084d0] to-[#5b146f] text-white px-2.5 py-1 flex items-center justify-between font-bold select-none shadow-xs">
          <div className="flex items-center space-x-2">
            <div className="px-1 py-0.2 bg-[#5b146f] text-yellow-300 font-serif font-black text-[10px] rounded-xs border border-yellow-200">
              OKI !
            </div>
            <span>OKI ! • Información de Salas y Firebase</span>
          </div>
          <button
            onClick={onClose}
            className="w-4 h-4 bg-[#d4d0c8] text-black text-[10px] font-bold flex items-center justify-center bevel-button leading-none hover:bg-red-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 bg-[#ece9d8]">
          <div className="bg-white p-3 bevel-sunken space-y-1.5 border border-[#808080]">
            <div className="flex items-center gap-2 text-[#000080] font-bold text-sm">
              <Zap className="w-4 h-4 text-amber-600 fill-amber-400" />
              <span>OKI ! (Salas de Chat Clásicas Yahoo!) + Firebase Firestore</span>
            </div>
            <p className="text-gray-800 leading-relaxed text-[11px]">
              <strong>OKI !</strong> rescata la auténtica experiencia del chat clásico de los años 2000 estilo Yahoo! Chat y Windows 98/2000, con ventanas grisáceas beveled, degradados azul marino, sonidos originales de mensajes y el legendario <strong>Timbre / Zumbido de MSN Messenger</strong>.
              Funciona con <strong>Google Cloud Firebase Firestore</strong> para almacenamiento persistente y sincronización en tiempo real.
            </p>
          </div>

          {/* Security Rules Summary */}
          <div className="bg-white p-3 bevel-sunken space-y-1.5 border border-[#808080]">
            <div className="flex items-center gap-1.5 text-green-900 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-green-700" />
              <span>Reglas de Seguridad Firestore (RLS) Activas</span>
            </div>
            <ul className="space-y-1 text-gray-800 text-[11px]">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-700 shrink-0 mt-0.5" />
                <span><strong>Perfiles (/profiles/{'{userId}'}):</strong> Cada usuario solo puede escribir o actualizar su propio perfil y color de texto.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-700 shrink-0 mt-0.5" />
                <span><strong>Mensajes (/messages):</strong> Los miembros pueden leer los mensajes de la sala y enviar mensajes con su propio UID verificado.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-700 shrink-0 mt-0.5" />
                <span><strong>Presencia (/rooms/{'{roomId}'}/presence):</strong> Sincronización en vivo de los usuarios conectados en las 10 salas.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-700 shrink-0 mt-0.5" />
                <span><strong>Mensajes Privados (/private_messages):</strong> Solo el remitente y destinatario pueden leer las conversaciones privadas.</span>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-300 p-2.5 text-[11px] text-yellow-900 leading-tight">
            <strong>Privacidad y seguridad:</strong> Tu correo electrónico nunca se muestra a los demás usuarios. El sistema asigna un alias aleatorio único (ej: <em>Luna_Azul</em>, <em>Tigre_Nocturno</em>, <em>Marea87</em>) asociado a tu cuenta.
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#d4d0c8] p-2.5 border-t border-[#808080] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1 bevel-button font-bold text-xs cursor-pointer hover:bg-white text-black"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
