import React, { useState } from 'react';
import { ShieldAlert, X, Check } from 'lucide-react';
import { submitReport } from '../lib/firebase';
import { Profile } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: Profile;
  targetUser: { id: string; alias: string };
  messageId?: string;
  messageContent?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  targetUser,
  messageId,
  messageContent,
}) => {
  const [motivo, setMotivo] = useState<'spam' | 'acoso' | 'contenido inapropiado' | 'datos personales' | 'otro'>('spam');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitReport({
        reporter_id: currentProfile.id,
        reporter_alias: currentProfile.alias,
        reported_user_id: targetUser.id,
        reported_alias: targetUser.alias,
        message_id: messageId,
        message_content: messageContent,
        motivo,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1800);
    } catch (e) {
      console.error('Error submitting report:', e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-2xs font-sans text-xs">
      <div className="w-full max-w-sm bg-[#d4d0c8] bevel-window shadow-2xl border border-[#808080]">
        {/* Title bar clásico degradado rojo/marino */}
        <div className="bg-gradient-to-r from-[#800000] via-[#a00000] to-[#000080] text-white px-2.5 py-1 flex items-center justify-between font-bold select-none shadow-xs">
          <div className="flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-yellow-300" />
            <span>Reportar Usuario / Mensaje</span>
          </div>
          <button
            onClick={onClose}
            className="w-4 h-4 bg-[#d4d0c8] text-black text-[10px] font-bold flex items-center justify-center bevel-button leading-none hover:bg-red-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 space-y-3 bg-[#ece9d8]">
          {submitted ? (
            <div className="bg-white border border-green-600 p-4 text-center space-y-1 text-green-900 bevel-sunken">
              <Check className="w-6 h-6 text-green-700 mx-auto" />
              <div className="font-bold text-xs">¡Reporte Enviado!</div>
              <p className="text-[11px] text-gray-700">
                Los moderadores de OKI ! revisarán este reporte a la brevedad. Gracias por mantener la comunidad segura.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <span className="text-gray-600 text-[10px]">Usuario a reportar:</span>
                <div className="font-bold text-[#800000] font-sans text-xs">{targetUser.alias}</div>
              </div>

              {messageContent && (
                <div className="bg-white p-2 bevel-sunken text-[10px] text-gray-800">
                  <span className="font-bold text-gray-600 block mb-0.5">Mensaje reportado:</span>
                  <div className="italic break-words">"{messageContent}"</div>
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-800 text-[11px] mb-1">
                  Motivo del reporte:
                </label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value as any)}
                  className="w-full p-1.5 bg-white bevel-sunken text-xs font-sans text-black focus:outline-none"
                >
                  <option value="spam">Spam / Publicidad repetitiva</option>
                  <option value="acoso">Acoso o amenazas</option>
                  <option value="contenido inapropiado">Contenido inapropiado / ofensivo</option>
                  <option value="datos personales">Divulgación de datos personales</option>
                  <option value="otro">Otro motivo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-[#808080]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1 bevel-button font-bold text-xs cursor-pointer hover:bg-white text-black"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1 bevel-button font-bold text-xs cursor-pointer text-[#800000] hover:bg-red-50"
                >
                  {isSubmitting ? 'Enviando...' : 'Confirmar Reporte'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
