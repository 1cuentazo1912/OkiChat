import React, { useState } from 'react';
import { Database, Key, CheckCircle, AlertCircle, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import { getStoredSupabaseConfig, saveStoredSupabaseConfig, clearStoredSupabaseConfig, resetSupabaseClient } from '../lib/supabaseClient';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
  onOpenSqlGuide: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
  onOpenSqlGuide,
}) => {
  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [key, setKey] = useState(currentConfig.key);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!url.trim() || !key.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor ingresa tanto la URL de Supabase como la clave Anon Key.',
      });
      return;
    }

    if (!url.startsWith('https://')) {
      setStatusMessage({
        type: 'error',
        text: 'La URL de Supabase debe comenzar con https://',
      });
      return;
    }

    saveStoredSupabaseConfig(url, key);
    resetSupabaseClient();
    setStatusMessage({
      type: 'success',
      text: '¡Configuración guardada! Reiniciando cliente de Supabase...',
    });

    setTimeout(() => {
      onConfigSaved();
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    clearStoredSupabaseConfig();
    resetSupabaseClient();
    setUrl('');
    setKey('');
    setStatusMessage({
      type: 'info',
      text: 'Credenciales eliminadas. La app volverá al Modo Local / Demo.',
    });
    setTimeout(() => {
      onConfigSaved();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#d4d0c8] bevel-window shadow-2xl flex flex-col font-sans text-xs">
        {/* Title bar */}
        <div className="bg-gradient-to-r from-[#000080] via-[#1084d0] to-[#000080] text-white px-2 py-1 flex items-center justify-between font-bold">
          <div className="flex items-center space-x-1.5">
            <Database className="w-4 h-4 text-yellow-300" />
            <span>Configuración de Conexión a Supabase</span>
          </div>
          <button
            onClick={onClose}
            className="w-4 h-4 bg-[#d4d0c8] text-black text-[10px] font-bold flex items-center justify-center bevel-button hover:bg-red-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3 bg-[#ece9d8]">
          <div className="bg-white p-2.5 bevel-sunken text-gray-700 space-y-1">
            <p className="font-bold text-[#000080] flex items-center gap-1">
              <span>Conecta tu propio proyecto de Supabase</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              Encuentra estos datos en tu panel de Supabase: <span className="font-semibold text-gray-900">Project Settings → API</span>.
              Si aún no has creado las tablas en Supabase, revisa la Guía SQL.
            </p>
            <button
              type="button"
              onClick={onOpenSqlGuide}
              className="text-blue-800 underline font-semibold hover:text-blue-900 text-[11px] flex items-center gap-1 mt-1"
            >
              <span>Ver y copiar Script SQL para Supabase</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-2">
            <div>
              <label className="block font-bold text-gray-800 mb-0.5">
                Project URL (VITE_SUPABASE_URL):
              </label>
              <input
                type="text"
                placeholder="https://xyzabcdefghijklmnop.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-1.5 bg-white bevel-sunken font-mono text-[11px] text-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-0.5">
                API Key (anon / public):
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full p-1.5 bg-white bevel-sunken font-mono text-[11px] text-gray-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Status message */}
          {statusMessage && (
            <div
              className={`p-2 rounded text-[11px] flex items-center gap-1.5 ${
                statusMessage.type === 'success'
                  ? 'bg-green-100 text-green-900 border border-green-300'
                  : statusMessage.type === 'error'
                  ? 'bg-red-100 text-red-900 border border-red-300'
                  : 'bg-blue-100 text-blue-900 border border-blue-300'
              }`}
            >
              {statusMessage.type === 'success' && <CheckCircle className="w-4 h-4 text-green-700 shrink-0" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />}
              {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-700 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Help notice */}
          <div className="text-[10px] text-gray-600 bg-gray-100 p-2 bevel-sunken">
            <span className="font-bold">Nota de seguridad:</span> Las claves se almacenan localmente en tu navegador. Para producción permanente, también puedes definirlas en tu archivo <code>.env</code> como <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>.
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#d4d0c8] p-2 border-t border-[#808080] flex justify-between items-center">
          <button
            onClick={handleClear}
            className="px-2.5 py-1 bevel-button text-red-800 font-bold text-xs flex items-center gap-1 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar Credenciales</span>
          </button>

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1 bevel-button font-bold text-xs"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bevel-button font-bold text-xs text-[#000080] bg-blue-50 hover:bg-white"
            >
              Guardar y Conectar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
