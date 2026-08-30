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
  const { user, updateProfile, addVehicle } = useAuth();
  const navigate = useNavigate();

  // Onboarding Step State (Persisted in session to prevent accidental resets)
  const [step, setStep] = useState<number>(() => {
    const saved = sessionStorage.getItem('vc_onboarding_step');
    return saved ? parseInt(saved, 10) : 1;
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
  const [startingSOC, setStartingSOC] = useState<number>(85);

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

      // 2. Update Firestore User Profile (Merge semantics)
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
      
      {/* Top Header & Smooth Animated Step Progress Bar */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between">
        <LogoFull height={38} />
        <div className="flex items-center gap-3">
          <div className="w-28 bg-slate-200 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-300/50">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-teal-400 rounded-full transition-all duration-500 ease-out shadow-xs"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
          <span className="text-xs font-extrabold text-navy-900">Step {step} of 5</span>
        </div>
      </div>

      {/* Main Step Container */}
      <div className="max-w-xl mx-auto w-full my-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 transition-all">
          
          {/* STEP 1: Welcome & Preferred Driver Name */}
          {step === 1 && (
            <div key="step-1" className="space-y-6 vc-trans-slide-h">
              <div className="space-y-2">
                <span className="vc-badge vc-badge-teal">WELCOME TO VOLTCONNECT</span>
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-navy-900 leading-tight">
                  Welcome! Let's build your personalized EV workspace.
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tell us what to call you so VoltConnect can tailor charger filtering, battery health tracking, and journey estimation specifically for your vehicle.
                </p>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Preferred Driver Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Enter your name (e.g. Mohammed)"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-300 font-semibold text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none shadow-xs"
                  required
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!userName.trim()}
                className="w-full vc-btn vc-btn-teal py-3.5 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                <span>CONTINUE TO EV CATEGORY</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: EV Category Cards */}
          {step === 2 && (
            <div key="step-2" className="space-y-6 vc-trans-slide-h">
              <div className="space-y-2">
                <span className="vc-badge vc-badge-teal">Form Factor</span>
                <h2 className="font-heading text-2xl font-extrabold text-navy-900">
                  Select your EV Category
                </h2>
                <p className="text-xs text-slate-500">
                  VoltConnect supports multi-EV form factors across all mobility sectors.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {EV_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSelectedManufacturer(null);
                      setSelectedModel(null);
                    }}
                    className={`p-4 rounded-2xl border text-left space-y-2 transition-all ${
                      selectedCategory === cat.id
                        ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {getCategoryIcon(cat.id)}
                      {selectedCategory === cat.id && <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />}
                    </div>
                    <div>
                      <div className="font-heading font-extrabold text-xs text-navy-900">{cat.name}</div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{cat.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(1)} className="vc-btn vc-btn-ghost text-xs">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="vc-btn vc-btn-teal py-3 px-6 text-xs font-bold"
                >
                  Select Manufacturer <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Database-Driven Manufacturers */}
          {step === 3 && (
            <div key="step-3" className="space-y-6 vc-trans-slide-h">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="vc-badge vc-badge-teal">FIRESTORE CATALOG</span>
                  <span className="text-[10px] font-bold text-slate-400">DATABASE-DRIVEN</span>
                </div>
                <h2 className="font-heading text-2xl font-extrabold text-navy-900">
                  Select EV Manufacturer
                </h2>
              </div>

              {/* Search & Popular Filter Controls */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={brandSearch}
                    onChange={e => setBrandSearch(e.target.value)}
                    placeholder="Search manufacturer or country..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-navy-900 bg-slate-50 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPopularFilter(!popularFilter)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
                      popularFilter
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${popularFilter ? 'fill-current' : ''}`} />
                    <span>Popular Brands</span>
                  </button>
                  <span className="text-[11px] font-semibold text-slate-400 ml-auto">
                    {manufacturers.length} Brands Available
                  </span>
                </div>
              </div>

              {/* Catalog Cards */}
              {catalogLoading ? (
                <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto">
                  <div className="h-14 vc-skeleton rounded-xl" />
                  <div className="h-14 vc-skeleton rounded-xl" />
                  <div className="h-14 vc-skeleton rounded-xl" />
                  <div className="h-14 vc-skeleton rounded-xl" />
                </div>
              ) : manufacturers.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <SlidersHorizontal className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="font-heading font-extrabold text-xs text-slate-700">No Manufacturers Found</div>
                  <p className="text-[11px] text-slate-500">Try broadening your search or disabling filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {manufacturers.map(mfg => (
                    <button
                      key={mfg.id}
                      onClick={() => {
                        setSelectedManufacturer(mfg);
                        setSelectedModel(null);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all space-y-1 ${
                        selectedManufacturer?.id === mfg.id
                          ? 'border-teal-500 bg-teal-50 text-teal-900 shadow-xs ring-2 ring-teal-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-extrabold text-xs text-navy-900">{mfg.name}</span>
                        {mfg.popular && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{mfg.country}</span>
                        <span className="ml-auto font-bold text-teal-600">{mfg.models.length} Models</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(2)} className="vc-btn vc-btn-ghost text-xs">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!selectedManufacturer}
                  className="vc-btn vc-btn-teal py-3 px-6 text-xs font-bold disabled:opacity-50"
                >
                  Select Model <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Dynamic Model & Variant */}
          {step === 4 && selectedManufacturer && (
            <div key="step-4" className="space-y-6 vc-trans-slide-h">
              <div className="space-y-2">
                <span className="vc-badge vc-badge-teal">Model & Specifications</span>
                <h2 className="font-heading text-2xl font-extrabold text-navy-900">
                  Select {selectedManufacturer.name} Model & Variant
                </h2>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedManufacturer.models.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m)}
                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                      selectedModel?.id === m.id
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-heading font-extrabold text-xs text-navy-900">{m.modelName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {m.variant} • {m.batteryCapacitykWh} kWh Pack • {m.realWorldRangeKm || m.ratedRangeKm} km Est. Range
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        DC Fast Charging: <strong className="text-slate-700">{m.dcMaxPowerKW} kW</strong> • Connectors: {m.connectorTypes.join(', ')}
                      </div>
                    </div>
                    {selectedModel?.id === m.id && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(3)} className="vc-btn vc-btn-ghost text-xs">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep(5)}
                  disabled={!selectedModel}
                  className="vc-btn vc-btn-teal py-3 px-6 text-xs font-bold disabled:opacity-50"
                >
                  Configure Charge <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: CURRENT BATTERY CHARGE & FINAL CONFIRMATION */}
          {step === 5 && selectedModel && selectedManufacturer && (
            <div key="step-5" className="space-y-6 vc-trans-scale-fade text-center">
              
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
