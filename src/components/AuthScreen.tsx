import React, { useState } from 'react';
import { Dumbbell, ShieldCheck, User, Mail, Lock, Target, ArrowRight, Zap, Server, Database, AlertTriangle } from 'lucide-react';
import { UserProfile, UserDataSnapshot } from '../types/workout';
import { loginUser, registerUser, loginDemoUser } from '../utils/cloudSync';

interface AuthScreenProps {
  onAuthenticated: (user: UserProfile, snapshot?: UserDataSnapshot | null) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<'hypertrophy' | 'fat_loss' | 'strength' | 'recomposition'>('hypertrophy');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim()) {
      setErrorMsg('Introduce tu email o usuario.');
      return;
    }
    if (!password) {
      setErrorMsg('Introduce tu contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginUser(email, password);
      if (result.success && result.user) {
        onAuthenticated(result.user, result.snapshot);
      } else {
        setErrorMsg(result.error || 'Credenciales incorrectas.');
      }
    } catch {
      setErrorMsg('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim()) {
      setErrorMsg('Introduce un email válido.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerUser(name, email, password, goal);
      if (result.success && result.user) {
        onAuthenticated(result.user, result.snapshot);
      } else {
        setErrorMsg(result.error || 'No se pudo crear la cuenta.');
      }
    } catch {
      setErrorMsg('Error al registrar usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = () => {
    const demo = loginDemoUser();
    onAuthenticated(demo);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-100 flex flex-col justify-between p-4 sm:p-6 select-none relative overflow-x-hidden">
      
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Brand Header */}
      <div className="pt-6 sm:pt-10 flex flex-col items-center text-center space-y-2 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/40">
            <Dumbbell className="w-5 h-5" />
          </div>
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
            CHΔNCE
          </span>
        </div>
        <p className="text-xs text-slate-400 font-medium max-w-xs">
          Biomecánica aplicada & registro nutricional
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-sm mx-auto my-6 relative z-10">
        <div className="bg-[#121215] border border-white/[0.08] rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
          {/* Tabs */}
          <div className="flex bg-[#09090b] p-1 rounded-2xl border border-white/[0.06]">
            <button
              type="button"
              onClick={() => { setTab('login'); setErrorMsg(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                tab === 'login'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setErrorMsg(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                tab === 'register'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Correo Electrónico / Usuario
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com o tu usuario"
                    required
                    className="w-full bg-[#18181c] border border-white/[0.08] rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#18181c] border border-white/[0.08] rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/30 active:scale-98 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Verificando credenciales...</span>
                ) : (
                  <>
                    <span>Entrar a mi Cuenta</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/[0.06] text-[11px] text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-300">Autenticación real:</span> las credenciales se validan
                contra PostgreSQL a través de la API Spring Boot (BCrypt + JWT). No hay contraseñas guardadas en el navegador.
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Nombre o Alias de Atleta
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej. Joan / Pablo"
                    className="w-full bg-[#18181c] border border-white/[0.08] rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="w-full bg-[#18181c] border border-white/[0.08] rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Contraseña (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-[#18181c] border border-white/[0.08] rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Objetivo Principal
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'hypertrophy', label: 'Hipertrofia Pura' },
                    { id: 'strength', label: 'Fuerza Máxima' },
                    { id: 'fat_loss', label: 'Definición Grasa' },
                    { id: 'recomposition', label: 'Recomposición' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setGoal(opt.id as any)}
                      className={`p-2 rounded-xl text-left border transition text-[11px] font-semibold ${
                        goal === opt.id
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                          : 'bg-[#18181c] border-white/[0.06] text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/30 active:scale-98 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <span>Registrando...</span>
                ) : (
                  <>
                    <span>Crear Cuenta</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Local guest session */}
          <div className="pt-2 border-t border-white/[0.08] text-center space-y-1">
            <button
              type="button"
              onClick={handleDemo}
              className="text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5 mx-auto"
            >
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Entrar como invitado (sin cuenta)</span>
            </button>
            <p className="text-[10px] text-slate-500">
              Modo local: los datos se guardan solo en este navegador, no en el servidor.
            </p>
          </div>
        </div>
      </div>

      {/* Real backend stack */}
      <div className="pb-4 flex items-center justify-center gap-6 text-[11px] text-slate-500 font-medium relative z-10">
        <div className="flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5 text-blue-400" />
          <span>API Spring Boot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>JWT + BCrypt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span>PostgreSQL + pgvector</span>
        </div>
      </div>

    </div>
  );
};
