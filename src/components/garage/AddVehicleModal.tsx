import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EV_CATEGORIES } from '@/features/vehicles/VehicleCatalog';
import { vehicleCatalogService, CatalogManufacturer, CatalogModel } from '@/services/firebase';
import { EVCategory } from '@/types';
import {
  Car,
  Bike,
  Truck,
  Package,
  Bus,
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Search,
  Star,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';

interface AddVehicleModalProps {
  onClose: () => void;
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({ onClose }) => {
  const { addVehicle } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<EVCategory>('4-wheeler');
  const [brandSearch, setBrandSearch] = useState('');
  const [popularFilter, setPopularFilter] = useState(false);

  // Dynamic Catalog State
  const [manufacturers, setManufacturers] = useState<CatalogManufacturer[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [selectedManufacturer, setSelectedManufacturer] = useState<CatalogManufacturer | null>(null);
  const [selectedModel, setSelectedModel] = useState<CatalogModel | null>(null);
  const [nickname, setNickname] = useState('');
  const [initialSOC, setInitialSOC] = useState(85);
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setCatalogLoading(true);

    vehicleCatalogService
      .queryManufacturers({
        category: selectedCategory,
        popularOnly: popularFilter,
        search: brandSearch,
        sortBy: 'name',
      })
      .then(data => {
        if (isMounted) {
          setManufacturers(data);
          setCatalogLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, popularFilter, brandSearch]);

  const getCategoryIcon = (catId: EVCategory) => {
    switch (catId) {
      case '4-wheeler': return <Car className="w-6 h-6 text-sky-500" />;
      case '2-wheeler': return <Bike className="w-6 h-6 text-teal-500" />;
      case '3-wheeler': return <Truck className="w-6 h-6 text-amber-500" />;
      case 'commercial': return <Package className="w-6 h-6 text-indigo-500" />;
      case 'heavy': return <Bus className="w-6 h-6 text-emerald-500" />;
      case 'light': return <Zap className="w-6 h-6 text-yellow-500" />;
    }
  };

  const handleAdd = () => {
    if (!selectedModel || !selectedManufacturer) return;

    addVehicle({
      category: selectedModel.vehicleCategory as EVCategory,
      manufacturer: selectedManufacturer.name,
      model: selectedModel.modelName,
      variant: selectedModel.variant,
      nickname: nickname.trim() || undefined,
      batteryCapacitykWh: selectedModel.batteryCapacitykWh,
      usableCapacitykWh: selectedModel.usableCapacitykWh,
      estimatedRangeKm: selectedModel.realWorldRangeKm || selectedModel.ratedRangeKm,
      currentBatteryPercent: Number(initialSOC),
      estimatedHealthSOH: 100,
      connectorTypes: selectedModel.connectorTypes,
      acMaxPowerKW: selectedModel.acMaxPowerKW,
      dcMaxPowerKW: selectedModel.dcMaxPowerKW,
      isDefault: isPrimary,
      dataSource: 'VERIFIED',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm vc-modal-backdrop">
      <div className="vc-card w-full max-w-xl p-6 sm:p-8 space-y-6 shadow-2xl relative border-slate-200 vc-modal-content">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600">
              DATABASE VEHICLE CATALOG
            </div>
            <h2 className="font-heading text-xl font-extrabold text-navy-900">Add EV to Garage</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: Category Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-700">Step 1: Select EV Form Factor</div>
            <div className="grid grid-cols-2 gap-3">
              {EV_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedManufacturer(null);
                    setSelectedModel(null);
                  }}
                  className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    selectedCategory === cat.id
                      ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {getCategoryIcon(cat.id)}
                  <div>
                    <div className="font-heading font-extrabold text-xs text-navy-900">{cat.name}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="vc-btn vc-btn-teal py-3 px-6 text-xs font-extrabold"
              >
                Next: Select Manufacturer <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Dynamic Database-Driven Manufacturer Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Step 2: Select EV Manufacturer</span>
              <span className="text-[11px] font-semibold text-slate-400">
                {manufacturers.length} Found
              </span>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={brandSearch}
                  onChange={e => setBrandSearch(e.target.value)}
                  placeholder="Search brand or country..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPopularFilter(!popularFilter)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 border ${
                    popularFilter
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <Star className={`w-3 h-3 ${popularFilter ? 'fill-current' : ''}`} />
                  <span>Popular Only</span>
                </button>
              </div>
            </div>

            {catalogLoading ? (
              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto">
                <div className="h-12 vc-skeleton rounded-xl" />
                <div className="h-12 vc-skeleton rounded-xl" />
                <div className="h-12 vc-skeleton rounded-xl" />
                <div className="h-12 vc-skeleton rounded-xl" />
              </div>
            ) : manufacturers.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                No manufacturers match search.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {manufacturers.map(mfg => (
                  <button
                    key={mfg.id}
                    onClick={() => {
                      setSelectedManufacturer(mfg);
                      setSelectedModel(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedManufacturer?.id === mfg.id
                        ? 'border-teal-500 bg-teal-50 text-teal-900 shadow-xs font-extrabold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800 font-bold'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span>{mfg.name}</span>
                      {mfg.popular && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-normal">
                      <Globe className="w-3 h-3" />
                      <span>{mfg.country}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)} className="vc-btn vc-btn-ghost text-xs">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedManufacturer}
                className="vc-btn vc-btn-teal py-2.5 px-5 text-xs font-bold"
              >
                Next: Select Model <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Model & Variant Selection */}
        {step === 3 && selectedManufacturer && (
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-700">
              Step 3: Select {selectedManufacturer.name} Model
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {selectedManufacturer.models.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m)}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    selectedModel?.id === m.id
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-heading font-extrabold text-xs text-navy-900">{m.modelName}</div>
                    <div className="text-[11px] text-slate-500">
                      {m.variant} • {m.batteryCapacitykWh} kWh • {m.realWorldRangeKm || m.ratedRangeKm} km
                    </div>
                  </div>
                  {selectedModel?.id === m.id && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(2)} className="vc-btn vc-btn-ghost text-xs">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!selectedModel}
                className="vc-btn vc-btn-teal py-2.5 px-5 text-xs font-bold"
              >
                Next: Vehicle Details <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Personalization & Save */}
        {step === 4 && selectedModel && selectedManufacturer && (
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-700">Step 4: Vehicle Personalization</div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Vehicle Nickname (Optional)</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="e.g. Blue Thunder"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-navy-900"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-700">
                  <span>Current Battery State of Charge (SOC %)</span>
                  <span className="text-teal-600">{initialSOC}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={initialSOC}
                  onChange={e => setInitialSOC(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={e => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-xs font-bold text-slate-700">Set as Primary Active Vehicle</span>
              </label>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button onClick={() => setStep(3)} className="vc-btn vc-btn-ghost text-xs">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleAdd}
                className="vc-btn vc-btn-teal py-3 px-6 text-xs font-extrabold shadow-md"
              >
                ADD TO GARAGE <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
