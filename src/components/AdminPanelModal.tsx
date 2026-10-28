import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, AlertTriangle, Trash2, Ban, VolumeX, CheckCircle, Plus, Eye, RefreshCw, X } from 'lucide-react';
import { Profile, Report, BannedWord, Room } from '../types';
import {
  subscribeToReports,
  updateReportStatus,
  muteUser,
  unmuteUser,
  banUser,
  subscribeToBannedWords,
  addBannedWord,
  deleteBannedWord,
  deleteFirebaseMessage,
} from '../lib/firebase';
import { ALL_ROOMS } from '../lib/roomsData';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: Profile;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose, currentProfile }) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'banned_words' | 'moderation'>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [bannedWords, setBannedWords] = useState<BannedWord[]>([]);
  const [newBannedWord, setNewBannedWord] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Moderación directa
  const [modUserId, setModUserId] = useState('');
  const [modHours, setModHours] = useState<number | 'permanente'>(1);

  useEffect(() => {
    if (!isOpen) return;

    const unsubReports = subscribeToReports(setReports);
    const unsubWords = subscribeToBannedWords(setBannedWords);

    return () => {
      unsubReports();
      unsubWords();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleResolveReport = async (reportId: string) => {
    await updateReportStatus(reportId, 'revisado');
    showSuccess('Reporte marcado como revisado');
  };

  const handleMute = async (userId: string, hours: number | 'permanente', alias?: string) => {
    await muteUser(userId, hours);
    showSuccess(`Usuario ${alias || userId} silenciado por ${hours === 'permanente' ? 'tiempo indefinido' : `${hours} hora(s)`}`);
  };

  const handleBan = async (userId: string, alias?: string) => {
    if (confirm(`¿Estás seguro de banear permanentemente a ${alias || userId}?`)) {
      await banUser(userId, true);
      showSuccess(`Usuario ${alias || userId} baneado permanentemente`);
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannedWord.trim()) return;
    await addBannedWord(newBannedWord.trim(), currentProfile.alias);
    setNewBannedWord('');
    showSuccess('Palabra prohibida agregada');
  };

  const handleDeleteWord = async (id: string) => {
    await deleteBannedWord(id);
    showSuccess('Palabra eliminada de la lista');
  };

  const pendingReports = reports.filter((r) => r.estado === 'pendiente');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-2xs font-sans text-xs">
      <div className="w-full max-w-4xl bg-[#d4d0c8] bevel-window shadow-2xl flex flex-col h-[560px] border border-[#808080]">
        {/* Title bar clásico degradado rojo/marino */}
        <div className="bg-gradient-to-r from-[#800000] via-[#a00000] to-[#000080] text-white px-2.5 py-1 flex items-center justify-between font-bold select-none shadow-xs">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-yellow-300" />
            <span>Panel de Administración y Moderación • OKI ! (Rol: {currentProfile.role?.toUpperCase()})</span>
          </div>
          <button
            onClick={onClose}
            className="w-4 h-4 bg-[#d4d0c8] text-black text-[10px] font-bold flex items-center justify-center bevel-button leading-none hover:bg-red-200"
          >
            ✕
          </button>
        </div>

        {/* Success toast */}
        {actionSuccess && (
          <div className="bg-green-700 text-white px-3 py-1 text-center font-bold text-xs">
            {actionSuccess}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-[#ece9d8] border-b border-[#808080] px-3 pt-2 flex space-x-2">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1 font-bold text-xs border-t-2 border-x cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-white border-[#808080] text-[#800000] -mb-px'
                : 'bg-[#d4d0c8] border-transparent text-gray-700 hover:bg-[#e4e0d8]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Reportes Pendientes ({pendingReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('banned_words')}
            className={`px-3 py-1.5 font-bold text-xs rounded-t-xs border-t border-x cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'banned_words'
                ? 'bg-white border-[#cbd5e1] text-cyan-800 -mb-px'
                : 'bg-slate-200 border-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Filtro de Palabras Prohibidas ({bannedWords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-3 py-1.5 font-bold text-xs rounded-t-xs border-t border-x cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'moderation'
                ? 'bg-white border-[#cbd5e1] text-amber-800 -mb-px'
                : 'bg-slate-200 border-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Acciones de Sanción / Limpieza</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 bg-white p-3.5 overflow-y-auto">
          {activeTab === 'reports' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">
                  Reportes de Usuarios y Mensajes
                </h3>
                <span className="text-slate-500 text-[11px]">
                  Total: {reports.length} reportes registrados
                </span>
              </div>

              {reports.length === 0 ? (
                <div className="text-slate-400 italic text-center py-12">
                  No hay reportes registrados por el momento.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {reports.map((rep) => (
                    <div
                      key={rep.id}
                      className={`p-3 rounded border text-xs ${
                        rep.estado === 'pendiente'
                          ? 'bg-rose-50/50 border-rose-300'
                          : 'bg-slate-50 border-slate-200 opacity-70'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.2 font-bold rounded text-[9px] uppercase ${
                              rep.estado === 'pendiente'
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-400 text-white'
                            }`}
                          >
                            {rep.estado}
                          </span>
                          <span className="font-bold text-slate-800">
                            Motivo: <span className="text-rose-700 underline">{rep.motivo}</span>
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rep.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 text-[11px]">
                        <div>
                          <span className="text-slate-500">Denunciante:</span>{' '}
                          <span className="font-semibold text-slate-800 font-mono">{rep.reporter_alias}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Usuario reportado:</span>{' '}
                          <span className="font-bold text-rose-800 font-mono">{rep.reported_alias}</span>
                          <span className="text-[9px] text-slate-400 ml-1">({rep.reported_user_id})</span>
                        </div>
                      </div>

                      {rep.message_content && (
                        <div className="p-2 bg-white rounded border border-slate-200 my-1 text-[11px] text-slate-800 italic">
                          "{rep.message_content}"
                        </div>
                      )}

                      {/* Botones de acción admin */}
                      <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-slate-200/80">
                        {rep.message_id && (
                          <button
                            onClick={() => deleteFirebaseMessage(rep.message_id!)}
                            className="px-2 py-1 bg-red-100 text-red-800 rounded font-semibold text-[10px] hover:bg-red-200 cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Borrar Mensaje</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleMute(rep.reported_user_id, 1, rep.reported_alias)}
                          className="px-2 py-1 bg-amber-100 text-amber-800 rounded font-semibold text-[10px] hover:bg-amber-200 cursor-pointer"
                        >
                          Silenciar 1h
                        </button>
                        <button
                          onClick={() => handleMute(rep.reported_user_id, 24, rep.reported_alias)}
                          className="px-2 py-1 bg-amber-200 text-amber-900 rounded font-semibold text-[10px] hover:bg-amber-300 cursor-pointer"
                        >
                          Silenciar 24h
                        </button>
                        <button
                          onClick={() => handleBan(rep.reported_user_id, rep.reported_alias)}
                          className="px-2 py-1 bg-rose-600 text-white rounded font-bold text-[10px] hover:bg-rose-700 cursor-pointer flex items-center gap-1"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Banear</span>
                        </button>
                        {rep.estado === 'pendiente' && (
                          <button
                            onClick={() => handleResolveReport(rep.id)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold text-[10px] hover:bg-emerald-700 cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Marcar Revisado</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'banned_words' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">
                  Lista Editable de Palabras Prohibidas
                </h3>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Cualquier mensaje público o privado que contenga alguna de estas palabras será bloqueado automáticamente antes de enviarse y el usuario recibirá un aviso.
                </p>
              </div>

              {/* Formulario para agregar palabra */}
              <form onSubmit={handleAddWord} className="flex gap-2">
                <input
                  type="text"
                  value={newBannedWord}
                  onChange={(e) => setNewBannedWord(e.target.value)}
                  placeholder="Escribe una palabra o término prohibido..."
                  className="flex-1 p-2 bg-white bevel-deep-sunken text-xs font-mono rounded border border-slate-300"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#0284c7] to-[#06b6d4] text-white bevel-button font-bold text-xs flex items-center gap-1 cursor-pointer rounded shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Palabra</span>
                </button>
              </form>

              {/* Lista actual de palabras */}
              <div className="border border-slate-300 rounded p-3 bg-slate-50">
                <div className="font-bold text-slate-700 text-xs mb-2">
                  Palabras prohibidas activas:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {bannedWords.map((w) => (
                    <span
                      key={w.id}
                      className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono flex items-center gap-1.5 shadow-2xs"
                    >
                      <span className="text-rose-800 font-bold">{w.word}</span>
                      <button
                        onClick={() => handleDeleteWord(w.id)}
                        className="text-slate-400 hover:text-rose-600 font-bold"
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {bannedWords.length === 0 && (
                    <div className="text-slate-400 italic text-[11px]">
                      No hay palabras personalizadas agregadas aún. (Se usan las palabras de seguridad por defecto).
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">
                  Acciones Rápidas de Moderación
                </h3>
                <p className="text-slate-600 text-[11px]">
                  Aplica sanciones manuales ingresando el ID del usuario.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-300 rounded space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">
                    User ID de Firebase:
                  </label>
                  <input
                    type="text"
                    value={modUserId}
                    onChange={(e) => setModUserId(e.target.value)}
                    placeholder="Ejemplo: abc123def456..."
                    className="w-full p-2 bg-white bevel-deep-sunken font-mono text-xs rounded border border-slate-300"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleMute(modUserId, 1)}
                    disabled={!modUserId.trim()}
                    className="px-3 py-1.5 bg-amber-600 text-white font-bold text-xs rounded hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                  >
                    Silenciar 1 Hora
                  </button>
                  <button
                    onClick={() => handleMute(modUserId, 24)}
                    disabled={!modUserId.trim()}
                    className="px-3 py-1.5 bg-amber-700 text-white font-bold text-xs rounded hover:bg-amber-800 disabled:opacity-50 cursor-pointer"
                  >
                    Silenciar 24 Horas
                  </button>
                  <button
                    onClick={() => handleMute(modUserId, 'permanente')}
                    disabled={!modUserId.trim()}
                    className="px-3 py-1.5 bg-rose-600 text-white font-bold text-xs rounded hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                  >
                    Silenciar Permanente
                  </button>
                  <button
                    onClick={() => unmuteUser(modUserId).then(() => showSuccess('Silencio removido'))}
                    disabled={!modUserId.trim()}
                    className="px-3 py-1.5 bg-slate-600 text-white font-bold text-xs rounded hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
                  >
                    Quitar Silencio
                  </button>
                  <button
                    onClick={() => handleBan(modUserId)}
                    disabled={!modUserId.trim()}
                    className="px-3 py-1.5 bg-red-800 text-white font-bold text-xs rounded hover:bg-red-900 disabled:opacity-50 cursor-pointer"
                  >
                    Banear Cuenta
                  </button>
                </div>
              </div>

              {/* Información de Tareas Automáticas (pg_cron / TTL) */}
              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded text-cyan-950 text-[11px] space-y-1">
                <span className="font-bold flex items-center gap-1 text-cyan-900">
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-700" />
                  Limpieza Automática a las 24 Horas
                </span>
                <p>
                  En Supabase se configura mediante la extensión <code>pg_cron</code> para purgar registros con más de 24 horas.
                  En Firebase Firestore, los mensajes se consultan filtrando los más recientes y se programan mediante políticas de Time-To-Live (TTL).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f1f5f9] p-2.5 border-t border-[#cbd5e1] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 bevel-button font-bold text-xs cursor-pointer rounded"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
};
