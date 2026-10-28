import React, { useState } from 'react';
import { CheckSquare, Square, Sparkles, HelpCircle, ShieldCheck, Flame, Zap } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';
import { User } from 'firebase/auth';

interface AuthCardProps {
  onLoginSuccess: (user: User) => void;
  onLoginDemo: () => void;
  onOpenInfo: () => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  onLoginSuccess,
  onLoginDemo,
  onOpenInfo,
}) => {
  const [isAdultChecked, setIsAdultChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleGoogleLogin = async () => {
    if (!isAdultChecked) {
      setStatusMessage({
        type: 'error',
        text: 'Debes marcar la casilla obligatoria confirmando que eres mayor de 18 años y aceptas las reglas.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const user = await loginWithGoogle();
      onLoginSuccess(user);
    } catch (err: unknown) {
      console.error(err);
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Error al autenticar con Google';
      setStatusMessage({
        type: 'error',
        text: `No se pudo iniciar sesión con Google: ${msg}. Puedes usar la opción de prueba rápida abajo.`,
      });
    }
  };

  const handleDemoLogin = () => {
    if (!isAdultChecked) {
      setStatusMessage({
        type: 'error',
        text: 'Debes marcar la casilla obligatoria confirmando que eres mayor de 18 años y aceptas las reglas.',
      });
      return;
    }
    onLoginDemo();
  };

  return (
    <div className="w-full max-w-md bg-[#d4d0c8] bevel-window shadow-2xl overflow-hidden font-sans text-xs border border-[#808080]">
      {/* Title bar clásico degradado azul marino Windows 98 / 2000 */}
      <div className="bg-gradient-to-r from-[#000080] via-[#1084d0] to-[#5b146f] text-white px-2.5 py-1 flex items-center justify-between font-bold select-none shadow-xs">
        <div className="flex items-center space-x-2">
          <div className="px-1.5 py-0.2 bg-[#5b146f] text-yellow-300 font-serif font-black text-[11px] leading-tight flex items-center justify-center rounded-xs border border-yellow-200">
            OKI !
          </div>
          <span className="tracking-wide text-xs">Acceso a Salas de Chat Yahoo!</span>
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
            className="w-4 h-4 bg-[#d4d0c8] text-black text-[10px] font-bold flex items-center justify-center bevel-button leading-none hover:bg-red-200"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Header Clásico Yahoo! Chat púrpura y amarillo */}
      <div className="bg-[#5b146f] text-white p-4 text-center border-b border-[#400040]">
        <div className="flex flex-col items-center">
          {/* Logo OKI ! estilo Yahoo! Chat */}
          <div className="inline-flex items-center gap-2 px-5 py-1.5 bg-yellow-400 text-[#5b146f] font-serif font-black text-2xl tracking-wide rounded-xs shadow-md border-2 border-yellow-200 mb-1.5">
            <span>OKI !</span>
            <span className="text-red-700 text-lg font-sans">Chat</span>
          </div>
          <p className="text-yellow-200 text-xs font-semibold tracking-wide">
            Salas de Chat Públicas • Estilo Clásico Años 2000
          </p>
          <p className="text-purple-200 text-[10px] mt-0.5 font-mono">
            Conexión en tiempo real con Firebase Firestore
          </p>
        </div>
      </div>

      {/* Cuerpo principal del formulario */}
      <div className="p-4 space-y-3 bg-[#ece9d8]">
        {/* Banner informativo de alias automático */}
        <div className="bg-white border border-[#808080] p-2.5 bevel-sunken text-gray-900">
          <div className="flex items-center gap-1.5 font-bold text-[#000080] mb-1">
            <Sparkles className="w-4 h-4 text-amber-600 fill-amber-400" />
            <span>Alias automático único (Sin contraseña)</span>
          </div>
          <p className="text-[11px] leading-relaxed text-gray-700">
            Al entrar por primera vez, el sistema te asignará aleatoriamente un alias retro (ej: <span className="font-bold text-[#000080]">Luna_Azul</span>, <span className="font-bold text-[#800000]">Tigre_Nocturno</span> o <span className="font-bold text-[#006000]">Marea87</span>).
            Tu correo permanece 100% privado y no se muestra a los demás usuarios.
          </p>
        </div>

        {/* Casilla obligatoria mayor de 18 años */}
        <div
          onClick={() => setIsAdultChecked(!isAdultChecked)}
          className={`p-2.5 bevel-sunken cursor-pointer transition-all flex items-start gap-2.5 ${
            isAdultChecked ? 'bg-green-50 border-green-600' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {isAdultChecked ? (
              <CheckSquare className="w-4 h-4 text-green-700 fill-green-100" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <label className="text-[11px] font-semibold text-gray-900 cursor-pointer select-none leading-snug">
            Confirmo que soy mayor de 18 años y acepto las reglas de convivencia en la sala.
            <span className="text-red-700 font-bold ml-1">* Obligatorio</span>
          </label>
        </div>

        {/* Mensaje de estado */}
        {statusMessage && (
          <div
            className={`p-2 bevel-sunken text-[11px] leading-tight ${
              statusMessage.type === 'success'
                ? 'bg-green-100 text-green-900 border border-green-600'
                : statusMessage.type === 'error'
                ? 'bg-red-100 text-red-900 border border-red-600'
                : 'bg-yellow-100 text-yellow-900 border border-yellow-600'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Botones de acción */}
        <div className="pt-1 space-y-2">
          {/* Inicio de sesión con Google (Firebase Auth) */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-2.5 bevel-button font-bold text-xs text-[#000080] bg-[#d4d0c8] flex items-center justify-center gap-2 hover:bg-white cursor-pointer active:translate-y-0.5 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? 'Conectando...' : 'Iniciar Sesión con Google (Firebase Auth)'}</span>
          </button>

          {/* Separador */}
          <div className="relative flex py-0.5 items-center">
            <div className="flex-grow border-t border-[#808080]"></div>
            <span className="flex-shrink mx-2 text-[10px] text-gray-600 font-mono">o prueba sin cuenta</span>
            <div className="flex-grow border-t border-[#808080]"></div>
          </div>

          {/* Opción de prueba rápida demo */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2 bevel-button font-bold text-xs text-red-800 bg-[#d4d0c8] flex items-center justify-center gap-1.5 hover:bg-yellow-50 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Entrar en Modo Prueba Rápida (Instantáneo)</span>
          </button>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#808080] flex items-center justify-between text-[10px] text-gray-700">
          <div className="flex items-center gap-1 font-semibold text-green-800">
            <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
            <span>Firebase Firestore Activo</span>
          </div>
          <button
            type="button"
            onClick={onOpenInfo}
            className="text-[#000080] underline font-semibold hover:text-black flex items-center gap-0.5 cursor-pointer"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Detalles de OKI !</span>
          </button>
        </div>
      </div>
    </div>
  );
};
