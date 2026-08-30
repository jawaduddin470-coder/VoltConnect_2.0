import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogoFull } from '@/assets/LogoFull';
import { EV_CATEGORIES } from '@/features/vehicles/VehicleCatalog';
import { vehicleCatalogService, CatalogManufacturer, CatalogModel } from '@/services/firebase';
import { EVCategory } from '@/types';
import { EVSOCSelector } from '@/components/common/EVSOCSelector';
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
  Search,
  Star,
  Globe,
  SlidersHorizontal,
  ShieldCheck,
  Battery,
  Gauge,
  Plug,
  Sparkles,
  Award,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { user, activeVehicle, updateProfile, addVehicle } = useAuth();
  const navigate = useNavigate();

  // Onboarding Step State (Persisted in session to prevent accidental resets)
  const [step, setStep] = useState<number>(() => {
    const saved = sessionStorage.getItem('vc_onboarding_step');
    if (saved) return parseInt(saved, 10);
    // Intelligent step determination for partial profiles:
    if (user?.name && (!user?.vehicleBrand || !user?.vehicleModel)) {
      return 2; // Jump to brand selection if name is already pre-filled
    }
    return 1;
  });

  const [userName, setUserName] = useState<string>(() => {
    const saved = sessionStorage.getItem('vc_onboarding_name');
    if (saved) return saved;
    return user?.name || '';
  });

  const [selectedCategory, setSelectedCategory] = useState<EVCategory>('4-wheeler');
  const [brandSearch, setBrandSearch] = useState('');
  const [popularFilter, setPopularFilter] = useState(false);

  // Dynamic Catalog State
  const [manufacturers, setManufacturers] = useState<CatalogManufacturer[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [selectedManufacturer, setSelectedManufacturer] = useState<CatalogManufacturer | null>(null);
  const [selectedModel, setSelectedModel] = useState<CatalogModel | null>(null);
  const [startingSOC, setStartingSOC] = useState<number>(() => {
    return activeVehicle?.currentBatteryPercent ?? 85;
  });

  // Save Progress Error State
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync step and userName to session storage draft
  useEffect(() => {
    sessionStorage.setItem('vc_onboarding_step', step.toString());
  }, [step]);

  useEffect(() => {
    if (userName) {
      sessionStorage.setItem('vc_onboarding_name', userName);
    }
  }, [userName]);

  // Pre-fill user name from Google displayName if available and not yet set
  useEffect(() => {
    if (!userName && user?.name) {
      setUserName(user.name);
    }
  }, [user]);

  // Load Manufacturers dynamically from Vehicle Catalog Service
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
      case '4-wheeler': return <Car className="w-8 h-8 text-sky-500" />;
      case '2-wheeler': return <Bike className="w-8 h-8 text-teal-500" />;
      case '3-wheeler': return <Truck className="w-8 h-8 text-amber-500" />;
      case 'commercial': return <Package className="w-8 h-8 text-indigo-500" />;
      case 'heavy': return <Bus className="w-8 h-8 text-emerald-500" />;
      case 'light': return <Zap className="w-8 h-8 text-yellow-500" />;
    }
  };

  // Final Complete & Save Handler (Executed ONLY at Step 5)
  const handleFinish = async () => {
    if (!selectedModel || !selectedManufacturer) return;

    const finalName = userName.trim() || user?.name || 'EV Driver';
    setSaving(true);
    setSaveError(null);

    try {
      // 1. Add Vehicle to User Vehicles with authoritative starting SOC
      addVehicle({
        category: selectedModel.vehicleCategory as EVCategory,
        manufacturer: selectedManufacturer.name,
        model: selectedModel.modelName,
        variant: selectedModel.variant,
        batteryCapacitykWh: selectedModel.batteryCapacitykWh,
        usableCapacitykWh: selectedModel.usableCapacitykWh,
        estimatedRangeKm: selectedModel.realWorldRangeKm || selectedModel.ratedRangeKm,
        currentBatteryPercent: startingSOC,
        estimatedHealthSOH: 100,
        connectorTypes: selectedModel.connectorTypes,
        acMaxPowerKW: selectedModel.acMaxPowerKW,
        dcMaxPowerKW: selectedModel.dcMaxPowerKW,
        isDefault: true,
        dataSource: 'VERIFIED',
      });

      // 2. Update Firestore User Profile with explicit onboarding completion
      updateProfile({
        name: finalName,
        onboardingComplete: true,
        profileComplete: true,
        vehicleBrand: selectedManufacturer.name,
        vehicleModel: selectedModel.modelName,
        vehicleVariant: selectedModel.variant,
      });

      // Clear session draft
      sessionStorage.removeItem('vc_onboarding_step');
      sessionStorage.removeItem('vc_onboarding_name');

      navigate('/dashboard');
    } catch (err: any) {
      console.error('[Onboarding] Error saving profile:', err);
      setSaveError('Unable to save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isVerifiedCatalog = selectedModel?.statusMetadata?.toLowerCase().includes('verified') || selectedManufacturer?.active;

  return (
    <div className="min-h-screen bg-slate-50 ev-pattern-bg flex flex-col justify-between py-8 px-4">
      
      {/* Header Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
        <LogoFull height={38} />
        <div className="flex items-center gap-2">
          <span className="vc-badge vc-badge-sky text-xs font-mono font-bold">STEP {step} OF 5</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-2xl mx-auto w-full my-auto py-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-8">
          
          {/* STEP 1: USER NAME & WELCOME */}
          {step === 1 && (
            <div className="space-y-6 text-center animate-in fade-in">
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto shadow-inner">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
                  Welcome to VoltConnect 2.0
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Let's personalize your EV mobility experience. How should we address you across your journey?
                </p>
              </div>

              <div className="space-y-2 text-left max-w-md mx-auto">
                <label className="text-xs font-extrabold uppercase text-slate-700 font-mono tracking-wider">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="e.g. Meraj Uddin"
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none text-sm font-semibold transition-all"
                  autoFocus
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={!userName.trim()}
                  className="vc-btn vc-btn-sky py-3.5 px-8 text-xs font-extrabold shadow-md hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  NEXT: VEHICLE CATEGORY <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CATEGORY SELECTION */}
          {step === 2 && (
            <div className="space-y-6 text-center animate-in fade-in">
              <div className="space-y-1">
                <span className="vc-badge vc-badge-sky text-[10px]">STEP 2 OF 5 • VEHICLE CATEGORY</span>
                <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-navy-900">
                  Select Your EV Category
                </h2>
                <p className="text-xs text-slate-500">
                  Choose your primary electric vehicle platform for route optimization and charger matching.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {EV_CATEGORIES.map(cat => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id as EVCategory)}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-400/20 shadow-md scale-[1.02]'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        {getCategoryIcon(cat.id as EVCategory)}
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-sky-500" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{cat.name}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{cat.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={() => setStep(1)} className="vc-btn vc-btn-ghost text-xs">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="vc-btn vc-btn-sky py-3.5 px-8 text-xs font-extrabold shadow-md hover:scale-[1.02] transition-all flex items-center gap-2"
                >
                  NEXT: MANUFACTURER <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: MANUFACTURER SELECTION */}
          {step === 3 && (
            <div className="space-y-6 text-center animate-in fade-in">
              <div className="space-y-1">
                <span className="vc-badge vc-badge-sky text-[10px]">STEP 3 OF 5 • MANUFACTURER BRAND</span>
                <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-navy-900">
                  Choose Your EV Brand
                </h2>
                <p className="text-xs text-slate-500">
                  Select your vehicle manufacturer from our verified Indian & global EV database.
                </p>
              </div>

              {/* Brand Search Bar */}
              <div className="relative max-w-md mx-auto">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={brandSearch}
                  onChange={e => setBrandSearch(e.target.value)}
                  placeholder="Search brand (e.g. Tata, Mahindra, MG, BMW, Hyundai)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:border-sky-500 outline-none"
                />
              </div>

              {/* Manufacturers Grid */}
              {catalogLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-sky-500" />
                  <span className="text-xs font-mono">Loading EV Manufacturers...</span>
                </div>
              ) : manufacturers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No EV brands found matching "{brandSearch}".
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
                  {manufacturers.map(m => {
                    const isSelected = selectedManufacturer?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedManufacturer(m)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-400/20 shadow-md scale-[1.02]'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-extrabold text-slate-900">{m.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{m.country}</div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button onClick={() => setStep(2)} className="vc-btn vc-btn-ghost text-xs">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!selectedManufacturer}
                  className="vc-btn vc-btn-sky py-3.5 px-8 text-xs font-extrabold shadow-md hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  NEXT: VEHICLE MODEL <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: MODEL SELECTION */}
          {step === 4 && selectedManufacturer && (
            <div className="space-y-6 text-center animate-in fade-in">
              <div className="space-y-1">
                <span className="vc-badge vc-badge-sky text-[10px]">STEP 4 OF 5 • VEHICLE MODEL</span>
                <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-navy-900">
                  Select {selectedManufacturer.name} Model
                </h2>
                <p className="text-xs text-slate-500">
                  Pick your exact EV model & variant to enable battery telemetry calculations.
                </p>
              </div>

              {/* Models List */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {selectedManufacturer.models.map(m => {
                  const isSelected = selectedModel?.id === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedModel(m)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-400/20 shadow-md scale-[1.01]'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <span>{m.modelName}</span>
                          <span className="text-xs font-medium text-slate-500">({m.variant})</span>
                        </div>
                        <div className="text-xs font-mono text-slate-500 flex items-center gap-3">
                          <span>{m.batteryCapacitykWh} kWh Battery</span>
                          <span>•</span>
                          <span className="text-sky-600 font-bold">{m.realWorldRangeKm || m.ratedRangeKm} km Range</span>
                          <span>•</span>
                          <span>{m.dcMaxPowerKW} kW DC Fast</span>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={() => setStep(3)} className="vc-btn vc-btn-ghost text-xs">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep(5)}
                  disabled={!selectedModel}
                  className="vc-btn vc-btn-sky py-3.5 px-8 text-xs font-extrabold shadow-md hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  NEXT: STARTING BATTERY CHARGE <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: STARTING BATTERY SOC SELECTION & FINISH */}
          {step === 5 && selectedManufacturer && selectedModel && (
            <div className="space-y-6 text-center animate-in fade-in">
              {saveError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3 text-left">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="vc-badge vc-badge-teal text-[10px]">STEP 5 OF 5 • VEHICLE SETUP</span>
                  {isVerifiedCatalog && (
                    <span className="vc-badge vc-badge-green text-[10px] flex items-center gap-1">
                      <Award className="w-3 h-3 text-emerald-600" /> VERIFIED SPECIFICATION
                    </span>
                  )}
                </div>

                <h2 className="font-heading text-2xl font-extrabold text-navy-900 uppercase tracking-tight pt-1">
                  {selectedManufacturer.name} {selectedModel.modelName}
                </h2>
                <p className="text-xs text-slate-500">
                  Variant: <strong className="text-slate-800">{selectedModel.variant}</strong> • Driver: <strong className="text-slate-800">{userName}</strong>
                </p>
              </div>

              {/* Premium Interactive Starting Battery SOC Component */}
              <EVSOCSelector
                currentSOC={startingSOC}
                nominalRangeKm={selectedModel.realWorldRangeKm || selectedModel.ratedRangeKm}
                vehicleModelName={`${selectedManufacturer.name} ${selectedModel.modelName}`}
                onChangeSOC={soc => setStartingSOC(soc)}
              />

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(4)} className="vc-btn vc-btn-ghost text-xs" disabled={saving}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="vc-btn vc-btn-teal py-4 px-8 text-xs font-extrabold shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> SAVING PROFILE...
                    </>
                  ) : (
                    <>
                      SAVE PROFILE & ENTER WORKSPACE <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Footer Branding */}
      <div className="max-w-xl mx-auto w-full text-center text-[11px] text-slate-400 font-medium">
        VoltConnect 2.0 • Intelligent EV Mobility Ecosystem
      </div>

    </div>
  );
};
