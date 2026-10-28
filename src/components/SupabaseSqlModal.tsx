import React, { useState } from 'react';
import { Copy, Check, X, ShieldAlert, Sparkles, Terminal } from 'lucide-react';
import { SUPABASE_SQL_SCRIPT, SUPABASE_STEPS } from '../lib/supabaseSetupSql';

interface SupabaseSqlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSqlModal: React.FC<SupabaseSqlModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-[#d4d0c8] bevel-window shadow-2xl max-h-[92vh] flex flex-col font-sans text-xs">
        {/* Title bar */}
        <div className="bg-gradient-to-r from-[#000080] via-[#1084d0] to-[#000080] text-white px-2 py-1 flex items-center justify-between font-bold">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-yellow-300" />
            <span>Guía Paso a Paso: Configuración de Supabase (SQL, RLS y Realtime)</span>
          </div>
          <button
            onClick={onClose}
            className="w-4 h-4 bg-[#d4d0c8] text-black text-[10px] font-bold flex items-center justify-center bevel-button hover:bg-red-200"
          >
            ✕
          </button>
        </div>

        {/* Modal body */}
        <div className="p-3 overflow-y-auto space-y-4 flex-1 bg-[#ece9d8]">
          {/* Header intro */}
          <div className="bg-blue-50 border border-blue-400 p-2 rounded text-[#002244] leading-relaxed">
            <h3 className="font-bold text-sm text-[#000080] mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#e06d00]" />
              Instrucciones para la Base de Datos de Supabase (Etapa 1)
            </h3>
            <p>
              Para que tu chat funcione al 100% con autenticación Magic Link, almacenamiento persistente
              y mensajes instantáneos en tiempo real entre múltiples navegadores, sigue estos 5 pasos y ejecuta el script SQL.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {SUPABASE_STEPS.map((s) => (
              <div key={s.step} className="bg-white p-2.5 bevel-sunken">
                <div className="flex items-start space-x-2">
                  <div className="bg-[#000080] text-white font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px]">
                    {s.step}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-xs">{s.title}</h4>
                    <p className="text-gray-600 text-[11px] mb-1.5">{s.description}</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-gray-700 text-[11px]">
                      {s.substeps.map((sub, idx) => (
                        <li key={idx}>{sub}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SQL Script block */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#000080]">Script SQL Completo (Copiar y Pegar en Supabase):</span>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 bevel-button text-[11px] font-bold flex items-center space-x-1.5 text-blue-900 hover:bg-white"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-700" />
                    <span className="text-green-800">¡Copiado con éxito!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Script SQL</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="p-3 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[11px] bevel-deep-sunken overflow-x-auto max-h-56 select-text whitespace-pre">
                {SUPABASE_SQL_SCRIPT}
              </pre>
            </div>
          </div>

          {/* RLS Safety note */}
          <div className="flex items-start space-x-2 bg-amber-50 border border-amber-300 p-2 text-amber-900 text-[11px]">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Seguridad Row Level Security (RLS) activada:</span>
              <p className="mt-0.5">
                Cualquier usuario autenticado puede leer todos los mensajes de la sala. Sin embargo, Supabase prohíbe
                que un usuario inserte mensajes con el <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">user_id</code> de otra persona.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#d4d0c8] p-2 border-t border-[#808080] flex justify-end space-x-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bevel-button font-bold text-xs flex items-center space-x-1 text-[#000080]"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? '¡Copiado!' : 'Copiar Todo el SQL'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bevel-button font-bold text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
