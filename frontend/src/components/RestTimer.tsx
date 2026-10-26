import React, { useEffect, useState } from 'react';
import { Timer, Plus, Minus, X, Volume2, Maximize2, Minimize2 } from 'lucide-react';
import { playRestTimerDoneSound } from '../utils/audio';

interface RestTimerProps {
  initialSeconds: number;
  isOpen: boolean;
  onClose: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  initialSeconds,
  isOpen,
  onClose
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isMinimized, setIsMinimized] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSecondsRemaining(initialSeconds);
    setTotalSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isOpen || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          playRestTimerDoneSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, secondsRemaining]);

  if (!isOpen) return null;

  const addTime = (secs: number) => {
    setSecondsRemaining(prev => Math.max(0, prev + secs));
    setTotalSeconds(prev => Math.max(prev, secondsRemaining + secs));
  };

  const progress = totalSeconds > 0 ? (secondsRemaining / totalSeconds) * 100 : 0;
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-50 flex items-center gap-3 bg-blue-600/90 backdrop-blur-md text-white px-4 py-2.5 rounded-full shadow-2xl border border-blue-400/30 animate-pulse">
        <Timer className="w-5 h-5" />
        <span className="font-mono font-bold text-lg">{timeFormatted}</span>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1 hover:bg-white/20 rounded-full transition"
          title="Expand"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-full transition"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md bg-[#12141e]/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-4 shadow-2xl text-white">
      {/* Progress bar line */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full mb-3 overflow-hidden">
        <div
          className="bg-blue-500 h-full transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Timer className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <span>Descanso</span>
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="font-mono text-3xl font-extrabold tracking-tight text-blue-400">
              {timeFormatted}
            </div>
          </div>
        </div>

        {/* Adjust buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => addTime(-15)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold rounded-lg text-slate-300 border border-slate-700 transition"
          >
            -15s
          </button>
          <button
            onClick={() => addTime(30)}
            className="px-2.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 active:scale-95 text-xs font-semibold rounded-lg border border-blue-500/30 transition flex items-center gap-0.5"
          >
            <Plus className="w-3 h-3" /> 30s
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Minimizar"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
            title="Saltar descanso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
