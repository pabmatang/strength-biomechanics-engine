import React, { useState, useEffect } from 'react';
import { Dumbbell } from 'lucide-react';

export interface CurveWeights {
  stretch: number;
  mid: number;
  shortened: number;
}

export interface MachineThumbnailProps {
  imageUrl?: string | null;
  alt?: string;
  brand?: string | null;
  modelName?: string | null;
  curveWeights?: CurveWeights | null;
  className?: string;
  imageClassName?: string;
  showCurve?: boolean;
}

interface BrandTheme {
  badge: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  containerBg: string;
  accentStroke: string;
}

function getBrandTheme(brand?: string | null): BrandTheme {
  const b = (brand || '').toLowerCase();
  if (b.includes('techno')) {
    return {
      badge: 'TG',
      badgeBg: 'bg-amber-500/20',
      badgeText: 'text-amber-300',
      badgeBorder: 'border-amber-500/40',
      containerBg: 'from-[#14120f] to-[#0c0d14]',
      accentStroke: '#f59e0b'
    };
  }
  if (b.includes('hammer')) {
    return {
      badge: 'HS',
      badgeBg: 'bg-red-500/20',
      badgeText: 'text-red-300',
      badgeBorder: 'border-red-500/40',
      containerBg: 'from-[#170e10] to-[#0c0d14]',
      accentStroke: '#ef4444'
    };
  }
  if (b.includes('titanium')) {
    return {
      badge: 'TS',
      badgeBg: 'bg-orange-500/20',
      badgeText: 'text-orange-300',
      badgeBorder: 'border-orange-500/40',
      containerBg: 'from-[#17120c] to-[#0c0d14]',
      accentStroke: '#f97316'
    };
  }
  if (b.includes('panatta')) {
    return {
      badge: 'PAN',
      badgeBg: 'bg-cyan-500/20',
      badgeText: 'text-cyan-300',
      badgeBorder: 'border-cyan-500/40',
      containerBg: 'from-[#0b161c] to-[#0c0d14]',
      accentStroke: '#06b6d4'
    };
  }
  if (b.includes('matrix')) {
    return {
      badge: 'MTX',
      badgeBg: 'bg-emerald-500/20',
      badgeText: 'text-emerald-300',
      badgeBorder: 'border-emerald-500/40',
      containerBg: 'from-[#0c1712] to-[#0c0d14]',
      accentStroke: '#10b981'
    };
  }
  if (b.includes('life')) {
    return {
      badge: 'LF',
      badgeBg: 'bg-sky-500/20',
      badgeText: 'text-sky-300',
      badgeBorder: 'border-sky-500/40',
      containerBg: 'from-[#0c151c] to-[#0c0d14]',
      accentStroke: '#0284c7'
    };
  }
  if (b.includes('nautilus')) {
    return {
      badge: 'NAU',
      badgeBg: 'bg-blue-500/20',
      badgeText: 'text-blue-300',
      badgeBorder: 'border-blue-500/40',
      containerBg: 'from-[#0c121c] to-[#0c0d14]',
      accentStroke: '#3b82f6'
    };
  }
  if (b.includes('cybex')) {
    return {
      badge: 'CYB',
      badgeBg: 'bg-purple-500/20',
      badgeText: 'text-purple-300',
      badgeBorder: 'border-purple-500/40',
      containerBg: 'from-[#140e1c] to-[#0c0d14]',
      accentStroke: '#8b5cf6'
    };
  }
  if (b.includes('eleiko')) {
    return {
      badge: 'ELK',
      badgeBg: 'bg-yellow-500/20',
      badgeText: 'text-yellow-300',
      badgeBorder: 'border-yellow-500/40',
      containerBg: 'from-[#17160c] to-[#0c0d14]',
      accentStroke: '#eab308'
    };
  }
  if (b.includes('gym80')) {
    return {
      badge: 'G80',
      badgeBg: 'bg-pink-500/20',
      badgeText: 'text-pink-300',
      badgeBorder: 'border-pink-500/40',
      containerBg: 'from-[#170e16] to-[#0c0d14]',
      accentStroke: '#ec4899'
    };
  }
  if (b.includes('booty')) {
    return {
      badge: 'BB',
      badgeBg: 'bg-fuchsia-500/20',
      badgeText: 'text-fuchsia-300',
      badgeBorder: 'border-fuchsia-500/40',
      containerBg: 'from-[#170e1a] to-[#0c0d14]',
      accentStroke: '#d946ef'
    };
  }
  // Default Estándar / Genérica
  return {
    badge: 'MIA',
    badgeBg: 'bg-teal-500/20',
    badgeText: 'text-teal-300',
    badgeBorder: 'border-teal-500/40',
    containerBg: 'from-[#0b1617] to-[#0c0d14]',
    accentStroke: '#14b8a6'
  };
}

export const MachineThumbnail: React.FC<MachineThumbnailProps> = ({
  imageUrl,
  alt = 'Máquina',
  brand,
  modelName,
  curveWeights,
  className = 'w-14 h-14 rounded-xl',
  imageClassName = 'w-full h-full object-contain p-1',
  showCurve = true
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [imageUrl]);

  const cleanUrl = imageUrl && imageUrl.trim() !== '' && imageUrl !== 'null' ? imageUrl : null;
  const showImage = cleanUrl && !hasError;
  const theme = getBrandTheme(brand);

  // Derive mini curve points (SVG viewBox: 0 0 40 14)
  const weights = curveWeights || { stretch: 0.33, mid: 0.33, shortened: 0.33 };
  // Normal range for weights is ~0.10 to ~0.60
  // Higher weight = higher resistance = lower Y coord (closer to top: y=3 vs y=11)
  const y1 = Math.max(3, Math.min(11, 12 - (weights.stretch / 0.55) * 8));
  const y2 = Math.max(3, Math.min(11, 12 - (weights.mid / 0.55) * 8));
  const y3 = Math.max(3, Math.min(11, 12 - (weights.shortened / 0.55) * 8));

  return (
    <div
      className={`relative overflow-hidden flex-shrink-0 border border-slate-800 flex items-center justify-center select-none ${className}`}
      style={{
        background: 'radial-gradient(circle at 50% 50%, #252c40 0%, #0e111d 80%)'
      }}
      title={modelName || alt}
    >
      {showImage ? (
        <img
          src={cleanUrl}
          alt={alt}
          className={`${imageClassName} transition duration-200 drop-shadow-[0_2px_8px_rgba(255,255,255,0.08)]`}
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col justify-between p-1.5 pointer-events-none">
          {/* Top Brand Tag & Icon */}
          <div className="flex items-center justify-between w-full">
            <span
              className={`text-[8px] font-mono font-black px-1 py-0.2 rounded border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
            >
              {theme.badge}
            </span>
            <Dumbbell className="w-3 h-3 text-slate-500 opacity-80" />
          </div>

          {/* Bottom Mini Resistance Curve */}
          {showCurve && (
            <div className="w-full h-3 mt-auto">
              <svg viewBox="0 0 40 14" className="w-full h-full overflow-visible">
                <path
                  d={`M 6 ${y1} Q 20 ${y2} 34 ${y3}`}
                  fill="none"
                  stroke={theme.accentStroke}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <circle cx="6" cy={y1} r="1.5" fill={theme.accentStroke} />
                <circle cx="20" cy={y2} r="1.5" fill={theme.accentStroke} />
                <circle cx="34" cy={y3} r="1.5" fill={theme.accentStroke} />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
