import React, { useEffect } from 'react';
import { X, ZoomIn, Dumbbell, Sparkles } from 'lucide-react';
import { formatMuscleName } from '../utils/muscleLabels';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  brand?: string;
  muscleGroup?: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  brand,
  muscleGroup
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full max-h-[92vh] bg-[#0c0e17] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center justify-between text-white space-y-4 overflow-hidden"
      >
        {/* Top bar */}
        <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                {brand || 'Oficial'}
              </span>
              {muscleGroup && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                  {formatMuscleName(muscleGroup)}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-black text-white">{title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Enlarged High-Resolution Image Container with Luxury Radial Dark Spotlight */}
        <div className="w-full flex-1 min-h-[300px] max-h-[65vh] flex items-center justify-center bg-gradient-to-b from-[#141824] via-[#0d101a] to-[#07080e] rounded-2xl border border-slate-800/80 p-4 relative group overflow-hidden">
          {/* Radial Spotlight glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18)_0%,transparent_70%)] pointer-events-none" />

          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="max-h-full max-w-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] transition duration-300 group-hover:scale-105 relative z-10"
            />
          ) : (
            <div className="text-center text-slate-600 space-y-2 relative z-10">
              <Dumbbell className="w-12 h-12 mx-auto" />
              <p className="text-xs">Imagen no disponible</p>
            </div>
          )}
          
          <div className="absolute bottom-3 right-3 text-[11px] text-slate-400 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 pointer-events-none flex items-center gap-1 z-20">
            <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
            <span>Resolución original de fábrica</span>
          </div>
        </div>

        {/* Footer info (Mobile-native, no desktop ESC) */}
        <div className="w-full flex items-center justify-between text-xs text-slate-400 pt-1">
          <span className="text-[11px] text-slate-400">Toca en cualquier lugar para cerrar</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition text-xs"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
