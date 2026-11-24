import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Barcode, Search, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { FoodItem } from '../types/workout';
import { fetchProductByBarcode } from '../utils/openFoodFacts';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductDetected: (item: FoodItem) => void;
}

// Popular sample Spanish supermarket barcodes for instant testing
const POPULAR_SPANISH_BARCODES = [
  { label: 'Queso Batido 0% Hacendado', code: '8480000156488' },
  { label: 'Copos de Avena Hacendado', code: '8480000092304' },
  { label: 'Pechuga Pavo 92% Hacendado', code: '8480000500748' },
  { label: 'Yogur +Proteínas Fresa Hacendado', code: '8480000140227' },
  { label: 'Claras de Huevo Pasteurizadas', code: '8480000122247' },
];

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onProductDetected
}) => {
  const [manualCode, setManualCode] = useState('');
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFoundError, setNotFoundError] = useState<string | null>(null);
  const [detectedProduct, setDetectedProduct] = useState<FoodItem | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setDetectedProduct(null);
      setNotFoundError(null);
      setManualCode('');
      setIsLoading(false);
    }
  }, [isOpen]);

  // When isScanningCamera is toggled, ensure video element receives the stream
  useEffect(() => {
    if (isScanningCamera && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('muted', 'true');
      video.muted = true;
      video.play().catch(err => {
        console.warn('[Camera Scanner] Autoplay error:', err);
      });
    }
  }, [isScanningCamera]);

  const startCamera = async () => {
    setCameraError(null);
    setNotFoundError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La cámara no está disponible en este dispositivo o requiere conexión segura (HTTPS).');
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = stream;
      setIsScanningCamera(true);

      // Start BarcodeDetector loop if supported by browser (e.g. Chrome on Android / Edge)
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code']
          });

          scanIntervalRef.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const code = barcodes[0].rawValue;
                  if (code) {
                    stopCamera();
                    handleLookupBarcode(code);
                  }
                }
              } catch {}
            }
          }, 300);
        } catch {}
      }
    } catch (err: any) {
      console.warn('[Camera Scanner] Error:', err);
      setCameraError(err.message || 'No se pudo acceder a la cámara. Introduce el código manualmente.');
      setIsScanningCamera(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanningCamera(false);
  };

  const handleLookupBarcode = async (barcode: string) => {
    const clean = barcode.trim();
    if (!clean) return;

    setIsLoading(true);
    setNotFoundError(null);
    setDetectedProduct(null);

    const product = await fetchProductByBarcode(clean);
    setIsLoading(false);

    if (product) {
      setDetectedProduct(product);
    } else {
      setNotFoundError(`No se encontró ningún producto con el código de barras "${clean}" en la base de datos de OpenFoodFacts España.`);
    }
  };

  const handleConfirmAdd = () => {
    if (detectedProduct) {
      onProductDetected(detectedProduct);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#12141e] border border-blue-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl text-white space-y-4 max-h-[90vh] flex flex-col overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Escanear Código de Barras</h3>
              <p className="text-[11px] text-slate-400">OpenFoodFacts España (Mercadona, Carrefour, Lidl)</p>
            </div>
          </div>

          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Stream Area or Launch Button */}
        <div className="space-y-3">
          {isScanningCamera ? (
            <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-black border border-blue-500/50 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Target Scan Reticle Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-56 h-32 border-2 border-dashed border-cyan-400 rounded-xl relative animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)]" />
                </div>
                <span className="text-[10px] text-cyan-300 font-bold mt-2.5 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full border border-cyan-500/30">
                  Apunta la cámara al código de barras
                </span>
              </div>

              {/* Stop camera button */}
              <button
                type="button"
                onClick={stopCamera}
                className="absolute top-3 right-3 px-3 py-1 bg-black/80 hover:bg-black text-rose-400 rounded-lg text-xs font-bold border border-rose-500/40 backdrop-blur-md"
              >
                Cerrar Cámara
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={startCamera}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-98 transition"
              >
                <Camera className="w-4 h-4" />
                <span>Abrir Cámara en Vivo para Escanear</span>
              </button>
            </div>
          )}

          {cameraError && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>

        {/* Manual Barcode Input */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-300 block">
            O introduce el número de código de barras (EAN-13):
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                pattern="[0-9]*"
                placeholder="Ej. 8480000156488..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLookupBarcode(manualCode); }}
                className="w-full bg-[#181a28] border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-bold tracking-wider focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => handleLookupBarcode(manualCode)}
              disabled={isLoading || !manualCode.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Buscar</span>
            </button>
          </div>
        </div>

        {/* Quick Test Barcodes (Mercadona & Spanish Supermarkets) */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-slate-500">
            Prueba rápida con productos de supermercado español:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_SPANISH_BARCODES.map(sample => (
              <button
                key={sample.code}
                type="button"
                onClick={() => {
                  setManualCode(sample.code);
                  handleLookupBarcode(sample.code);
                }}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition flex items-center gap-1"
              >
                <span>{sample.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Not Found Error */}
        {notFoundError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{notFoundError}</span>
          </div>
        )}

        {/* Detected Product Card */}
        {detectedProduct && (
          <div className="p-4 rounded-2xl bg-gradient-to-b from-[#191c2e] to-[#121422] border border-emerald-500/40 shadow-xl space-y-3 animate-fadeIn">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {detectedProduct.image_url ? (
                  <img
                    src={detectedProduct.image_url}
                    alt={detectedProduct.name}
                    className="w-12 h-12 object-contain bg-slate-900 rounded-lg p-1 border border-slate-700 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xs">
                    OFF
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {detectedProduct.brand || 'Supermercado'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {detectedProduct.barcode}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{detectedProduct.name}</h4>
                  <p className="text-[11px] text-slate-400">Porción base: {detectedProduct.serving_description}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-base font-black text-emerald-400">{detectedProduct.calories_kcal}</span>
                <span className="text-[10px] text-slate-400 block">kcal / 100g</span>
              </div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Proteínas</div>
                <div className="font-bold text-emerald-400">{detectedProduct.protein_grams}g</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Carbos</div>
                <div className="font-bold text-amber-400">{detectedProduct.carbs_grams}g</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Grasas</div>
                <div className="font-bold text-rose-400">{detectedProduct.fat_grams}g</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[10px] text-slate-400">Fibra</div>
                <div className="font-bold text-cyan-400">{detectedProduct.fiber_grams || 0}g</div>
              </div>
            </div>

            {/* Confirm CTA */}
            <button
              type="button"
              onClick={handleConfirmAdd}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Añadir a mi Registro de Dieta</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
