import React, { useState } from 'react';
import { X, Settings as SettingsIcon, Sliders, Volume2, Activity, Heart, Shield, Check, Cloud, LogOut, User, RefreshCw, Dumbbell, Bell, Send } from 'lucide-react';
import { AppSettings, UserProfile } from '../types/workout';
import { 
  getNotificationSettings, 
  saveNotificationSettings, 
  getNotificationPermission, 
  requestNotificationPermission, 
  sendLocalNotification,
  NotificationSettings 
} from '../utils/notificationService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onForceSync?: () => void;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  currentUser,
  onLogout,
  onForceSync,
  syncStatus = 'synced'
}) => {
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() => getNotificationSettings());
  const [permissionStatus, setPermissionStatus] = useState<string>(() => getNotificationPermission());
  const [testSentFeedback, setTestSentFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleNotifications = async () => {
    const nextEnabled = !notifSettings.enabled;
    const updated = { ...notifSettings, enabled: nextEnabled };
    setNotifSettings(updated);
    saveNotificationSettings(updated);

    if (nextEnabled && permissionStatus !== 'granted') {
      const p = await requestNotificationPermission();
      setPermissionStatus(p);
    }
  };

  const handleTimeChange = (time: string) => {
    const updated = { ...notifSettings, reminderTime: time };
    setNotifSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleSendTestNotification = async () => {
    let perm = permissionStatus;
    if (perm !== 'granted') {
      perm = await requestNotificationPermission();
      setPermissionStatus(perm);
    }

    if (perm === 'granted') {
      const success = sendLocalNotification('CHΔNCE • Recordatorio de Prueba', {
        body: '¡Todo listo! Recibirás este aviso diariamente para registrar tus comidas y tu entreno.',
        tag: 'test-notification'
      });
      if (success) {
        setTestSentFeedback('¡Notificación enviada con éxito a tu pantalla!');
      } else {
        setTestSentFeedback('Aviso enviado (o minimizado por el sistema).');
      }
    } else {
      setTestSentFeedback('Por favor concede permisos en el navegador para recibir avisos.');
    }

    setTimeout(() => setTestSentFeedback(null), 4000);
  };

  const toggleRpe = () => {
    onUpdateSettings({ ...settings, show_rpe: !settings.show_rpe });
  };

  const toggleSound = () => {
    onUpdateSettings({ ...settings, sound_enabled: !settings.sound_enabled });
  };

  const toggleHealthSync = () => {
    onUpdateSettings({ ...settings, sync_health_apps: !settings.sync_health_apps });
  };

  const toggleWeightUnit = (unit: 'kg' | 'lbs') => {
    onUpdateSettings({ ...settings, weight_unit: unit });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-md bg-[#12141e] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl text-white space-y-5 max-h-full overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Ajustes & Cuenta</h2>
              <p className="text-xs text-slate-400">CHΔNCE · Sincronización en la Nube</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account Card */}
        {currentUser && (
          <div className="p-4 bg-gradient-to-r from-blue-950/40 to-indigo-950/40 rounded-2xl border border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center font-bold text-blue-300">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 uppercase tracking-wider font-mono">
                      {currentUser.goal === 'fat_loss' ? 'Definición' : currentUser.goal === 'strength' ? 'Fuerza' : 'Hipertrofia'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">{currentUser.email}</div>
                </div>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Cerrar Sesión"
                  className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition flex items-center gap-1 text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              )}
            </div>

            {/* Cloud Sync Status */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Cloud className={`w-4 h-4 ${syncStatus === 'syncing' ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
                <span>
                  {syncStatus === 'syncing' ? 'Guardando en la nube...' : 'Sincronizado con todos tus dispositivos'}
                </span>
              </div>
              {onForceSync && (
                <button
                  type="button"
                  onClick={onForceSync}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>Sincronizar</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Settings List */}
        <div className="space-y-4 text-sm">
          
          {/* "Mi Gimnasio" Equipment Profile */}
          <div className="p-3.5 bg-[#181a28] rounded-2xl border border-blue-500/30 space-y-2.5">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-cyan-400" />
                <span>Perfil de "Mi Gimnasio" (Filtro Automático)</span>
              </div>
              <p className="text-xs text-slate-400">
                Selecciona las marcas de máquinas disponibles en tu gimnasio habitual para filtrar tu catálogo automáticamente:
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['Technogym', 'Hammer Strength', 'Life Fitness', 'Matrix', 'Panatta', 'Eleiko'].map((brand) => {
                const isSelected = (settings.gym_brands || ['Technogym', 'Hammer Strength']).includes(brand);
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => {
                      const current = settings.gym_brands || ['Technogym', 'Hammer Strength'];
                      const next = isSelected ? current.filter(b => b !== brand) : [...current, brand];
                      onUpdateSettings({ ...settings, gym_brands: next });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/40'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{brand}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Reminder Notifications */}
          <div className="p-3.5 bg-[#181a28] rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 pr-2">
                <div className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span>Recordatorio Diario de Registro</span>
                </div>
                <p className="text-xs text-slate-400">
                  Aviso diario para apuntar tus comidas y entrenamiento.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                  notifSettings.enabled ? 'bg-cyan-600 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md transform" />
              </button>
            </div>

            {notifSettings.enabled && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-semibold">Hora de la notificación:</span>
                  <input
                    type="time"
                    value={notifSettings.reminderTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="bg-[#12141e] border border-slate-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg focus:outline-none focus:border-cyan-500 tabular-nums"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Permiso: <strong className={permissionStatus === 'granted' ? 'text-emerald-400' : 'text-amber-400'}>
                      {permissionStatus === 'granted' ? 'Activado' : permissionStatus === 'denied' ? 'Bloqueado' : 'Pendiente'}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleSendTestNotification}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold transition flex items-center gap-1 border border-cyan-500/30"
                  >
                    <Send className="w-3 h-3" />
                    <span>Probar aviso</span>
                  </button>
                </div>

                {testSentFeedback && (
                  <div className="text-[11px] text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                    {testSentFeedback}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Toggle RPE Column */}
          <div className="flex items-center justify-between p-3.5 bg-[#181a28] rounded-2xl border border-slate-800">
            <div className="space-y-0.5 pr-2">
              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Columna de RPE en Series</span>
              </div>
              <p className="text-xs text-slate-400">
                Muestra un campo para registrar la escala de esfuerzo percibido (RPE 6 - 10) en cada serie.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleRpe}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                settings.show_rpe ? 'bg-blue-600 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md transform" />
            </button>
          </div>

          {/* Toggle Health Apps Sync */}
          <div className="flex items-center justify-between p-3.5 bg-[#181a28] rounded-2xl border border-slate-800">
            <div className="space-y-0.5 pr-2">
              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Sincronizar Pasos & Salud</span>
              </div>
              <p className="text-xs text-slate-400">
                Conectar con Google Health Connect, Apple Health o podómetro del dispositivo.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleHealthSync}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                settings.sync_health_apps ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md transform" />
            </button>
          </div>

          {/* Toggle Sound Effects */}
          <div className="flex items-center justify-between p-3.5 bg-[#181a28] rounded-2xl border border-slate-800">
            <div className="space-y-0.5 pr-2">
              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>Sonido al Completar Serie</span>
              </div>
              <p className="text-xs text-slate-400">
                Reproduce un tono agradable de confirmación al marcar el check verde.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleSound}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                settings.sound_enabled ? 'bg-blue-600 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md transform" />
            </button>
          </div>

          {/* Weight Unit Selector */}
          <div className="flex items-center justify-between p-3.5 bg-[#181a28] rounded-2xl border border-slate-800">
            <div>
              <div className="font-bold text-slate-100">Unidad de Peso</div>
              <p className="text-xs text-slate-400">Kilogramos (kg) o Libras (lbs)</p>
            </div>
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => toggleWeightUnit('kg')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  settings.weight_unit === 'kg' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                KG
              </button>
              <button
                type="button"
                onClick={() => toggleWeightUnit('lbs')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  settings.weight_unit === 'lbs' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                LBS
              </button>
            </div>
          </div>

        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>Listo</span>
        </button>

      </div>
    </div>
  );
};
