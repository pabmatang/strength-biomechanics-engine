import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Compass,
  Plus,
  ShieldCheck,
  Check,
  Activity,
  Layers
} from 'lucide-react';
import {
  CatalogMachineEntry,
  MachineCatalogBrand,
  NormalizedMuscleGroup,
  getAllCatalogMachines,
  searchCatalogMachines
} from '../data/machineCatalog';
import { MachineResistanceClassifierModal } from './MachineResistanceClassifierModal';
import { type MachineResistanceProfile } from '../utils/machinePhysicsEngine';
import { getCurveOverride } from '../utils/superuserCurveStore';
import { MachineThumbnail } from './MachineThumbnail';

interface MachineCatalogPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMachineId?: string;
  onSelectMachine: (machine: CatalogMachineEntry) => void;
  defaultFilterMuscle?: string;
}

const BRAND_FILTERS: (string | 'Todas')[] = [
  'Todas',
  'Estándar',
  'Technogym',
  'Hammer Strength',
  'Titanium Strength',
  'Panatta',
  'Nautilus',
  'Cybex',
  'Matrix',
  'Gym80',
  'Life Fitness',
  'Booty Builder',
  'Eleiko'
];

export const MachineCatalogPickerModal: React.FC<MachineCatalogPickerModalProps> = ({
  isOpen,
  onClose,
  selectedMachineId,
  onSelectMachine,
  defaultFilterMuscle
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('Todas');
  const [showClassifierModal, setShowClassifierModal] = useState(false);

  const filteredMachines = useMemo(() => {
    return searchCatalogMachines(searchQuery, selectedBrand === 'Todas' ? undefined : selectedBrand);
  }, [searchQuery, selectedBrand]);

  if (!isOpen) return null;

  const handleSelect = (machine: CatalogMachineEntry) => {
    onSelectMachine(machine);
    onClose();
  };

  const handleCustomProfileSaved = (profile: MachineResistanceProfile) => {
    // When saved via classifier modal, create a custom entry and select it
    const newEntry: CatalogMachineEntry = {
      id: `custom_${Date.now()}`,
      brand: (profile.machineBrandGuess as MachineCatalogBrand) || 'Genérica',
      modelName: profile.machineModelGuess || 'Máquina Personalizada',
      line: 'Personalizada',
      canonicalExerciseType: 'chest_press_machine',
      muscleGroupLabel: (defaultFilterMuscle as NormalizedMuscleGroup) || 'Pectoral',
      profile
    };
    onSelectMachine(newEntry);
    setShowClassifierModal(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-[max(1.25rem,calc(env(safe-area-inset-top)+1rem))] pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+1rem))] bg-black/85 backdrop-blur-md overflow-y-auto">
        <div className="w-full max-w-xl bg-[#11131f] border border-cyan-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl text-white space-y-4 my-auto max-h-[92vh] flex flex-col">
          
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                <Compass className="w-4 h-4" />
                <span>Catálogo Biomecánico Oficial</span>
              </div>
              <h2 className="text-lg font-black text-white">Seleccionar Máquina Comercial</h2>
              <p className="text-xs text-slate-400">
                Perfiles de resistencia verificados por ingeniería biomecánica (0 IA).
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar máquina (ej. Press, Technogym, Remo, Sentadilla)..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Brand Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {BRAND_FILTERS.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => setSelectedBrand(brand)}
                className={`px-3 py-1 rounded-xl font-semibold text-[11px] whitespace-nowrap transition border ${
                  selectedBrand === brand
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>

          {/* Machine List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[50vh]">
            {filteredMachines.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-xs text-slate-400">No se encontraron máquinas con este criterio.</p>
                <button
                  type="button"
                  onClick={() => setShowClassifierModal(true)}
                  className="px-3 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Clasificar máquina no listada con foto</span>
                </button>
              </div>
            ) : (
              filteredMachines.map((machine: CatalogMachineEntry) => {
                const isSelected = selectedMachineId === machine.id;
                const override = getCurveOverride(machine.id);
                const weights = override?.curveWeights || machine.profile.curveWeights;
                const curveText = `${Math.round(weights.stretch * 100)}% · ${Math.round(weights.mid * 100)}% · ${Math.round(weights.shortened * 100)}%`;
                const labelText = override?.curveLabel || machine.profile.curveLabel || machine.profile.peakZone;

                return (
                  <div
                    key={machine.id}
                    onClick={() => handleSelect(machine)}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-950/50'
                        : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <MachineThumbnail
                        imageUrl={machine.imageUrl}
                        alt={machine.modelName}
                        brand={machine.brand}
                        modelName={machine.modelName}
                        curveWeights={weights}
                        className="w-13 h-13 rounded-xl shrink-0"
                        imageClassName="w-full h-full object-contain p-1"
                      />
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            {machine.brand}
                          </span>
                          {machine.line && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {machine.line}
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {machine.muscleGroupLabel}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate">{machine.modelName}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1 text-cyan-400 font-mono font-bold">
                            <Activity className="w-3 h-3" />
                            {curveText}
                          </span>
                          <span>·</span>
                          <span className="truncate">{labelText}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {isSelected ? (
                        <div className="w-7 h-7 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold text-cyan-400 px-2 py-1 rounded-xl bg-cyan-950/40 border border-cyan-800/40">
                          Seleccionar
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: Clasificar máquina no listada */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">¿Tu gimnasio usa otro modelo?</span>
            <button
              type="button"
              onClick={() => setShowClassifierModal(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>+ Clasificar máquina no listada</span>
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Secondary Classifier Modal */}
      {showClassifierModal && (
        <MachineResistanceClassifierModal
          isOpen={true}
          onClose={() => setShowClassifierModal(false)}
          onSaveProfile={handleCustomProfileSaved}
        />
      )}
    </>
  );
};
