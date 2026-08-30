import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { vehicleCatalogService, CatalogManufacturer, CatalogModel } from '@/services/firebase/vehicleCatalog';
import { operationsService } from '@/services/operationsService';
import { EVCategory } from '@/types';
import {
  Car,
  Search,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Zap,
  Sliders,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertTriangle,
  Building2,
  Battery,
  Activity,
  Globe,
  Filter,
} from 'lucide-react';

export const AdminVehiclesView: React.FC = () => {
  const { user } = useAuth();
  const [manufacturers, setManufacturers] = useState<CatalogManufacturer[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedVerification, setSelectedVerification] = useState<string>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Modals State
  const [showAddManufacturerModal, setShowAddManufacturerModal] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<CatalogManufacturer | null>(null);

  const [showAddModelModal, setShowAddModelModal] = useState(false);
  const [selectedMfgForModel, setSelectedMfgForModel] = useState<CatalogManufacturer | null>(null);
  const [editingModel, setEditingModel] = useState<{ mfg: CatalogManufacturer; model: CatalogModel } | null>(null);

  // Manufacturer Form Fields
  const [mfgName, setMfgName] = useState('');
  const [mfgCountry, setMfgCountry] = useState('India');
  const [mfgCategory, setMfgCategory] = useState<EVCategory>('4-wheeler');
  const [mfgPopular, setMfgPopular] = useState(true);

  // Model Form Fields
  const [modName, setModName] = useState('');
  const [modVariant, setModVariant] = useState('');
  const [modBattery, setModBattery] = useState(45);
  const [modUsable, setModUsable] = useState(43.2);
  const [modRatedRange, setModRatedRange] = useState(465);
  const [modPracticalRange, setModPracticalRange] = useState(315);
  const [modDCPower, setModDCPower] = useState(60);
  const [modACPower, setModACPower] = useState(7.2);
  const [modConnectors, setModConnectors] = useState('CCS2, Type 2');
  const [modEfficiency, setModEfficiency] = useState(130);

  const fetchCatalogData = () => {
    setLoading(true);
    vehicleCatalogService.getManufacturers().then(data => {
      setManufacturers(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  // Multi-Filter Logic across Manufacturers and Models
  const allCatalogRows: { mfg: CatalogManufacturer; model: CatalogModel }[] = [];
  manufacturers.forEach(m => {
    m.models.forEach(mod => {
      allCatalogRows.push({ mfg: m, model: mod });
    });
  });

  const filteredRows = allCatalogRows.filter(({ mfg, model }) => {
    // 1. Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchMfg = mfg.name.toLowerCase().includes(q);
      const matchCountry = mfg.country.toLowerCase().includes(q);
      const matchMod = model.modelName.toLowerCase().includes(q);
      const matchVar = model.variant.toLowerCase().includes(q);
      if (!matchMfg && !matchCountry && !matchMod && !matchVar) return false;
    }

    // 2. Category Filter
    if (selectedCategory !== 'ALL') {
      const catNorm = selectedCategory.replace('_', '-');
      if (mfg.category !== selectedCategory && mfg.category !== catNorm && model.vehicleCategory !== selectedCategory && model.vehicleCategory !== catNorm) {
        return false;
      }
    }

    // 3. Status Filter
    if (selectedStatus !== 'ALL') {
      const isActive = selectedStatus === 'ACTIVE';
      if (mfg.active !== isActive && model.active !== isActive) return false;
    }

    // 4. Verification Filter
    if (selectedVerification !== 'ALL') {
      const verStatus = model.verificationStatus || 'approved';
      if (verStatus !== selectedVerification) return false;
    }

    return true;
  });

  // Pagination Calculation
  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Admin Actions: Manufacturer CRUD
  const handleSaveManufacturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !mfgName.trim()) return;

    const id = editingManufacturer ? editingManufacturer.id : `mfg-${mfgName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const newMfg: CatalogManufacturer = {
      id,
      name: mfgName,
      country: mfgCountry,
      category: mfgCategory,
      popular: mfgPopular,
      active: true,
      models: editingManufacturer ? editingManufacturer.models : [],
    };

    await vehicleCatalogService.saveManufacturer(newMfg);
    operationsService.logAuditEvent(
      user.uid,
      user.email,
      user.role,
      editingManufacturer ? 'ADMIN_EDIT_MANUFACTURER' : 'ADMIN_ADD_MANUFACTURER',
      'vehicle_catalog',
      id,
      { mfgName, mfgCountry, mfgCategory }
    );

    fetchCatalogData();
    setShowAddManufacturerModal(false);
    setEditingManufacturer(null);
    setMfgName('');
  };

  const handleToggleManufacturerActive = async (mfg: CatalogManufacturer, active: boolean) => {
    if (!user) return;
    const updated: CatalogManufacturer = { ...mfg, active };
    await vehicleCatalogService.saveManufacturer(updated);
    operationsService.logAuditEvent(
      user.uid,
      user.email,
      user.role,
      active ? 'ADMIN_ENABLE_MANUFACTURER' : 'ADMIN_DISABLE_MANUFACTURER',
      'vehicle_catalog',
      mfg.id,
      { mfgName: mfg.name, active }
    );
    fetchCatalogData();
  };

  // Admin Actions: Model & Variant CRUD
  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetMfg = editingModel ? editingModel.mfg : selectedMfgForModel;
    if (!targetMfg || !user || !modName.trim()) return;

    const modelId = editingModel ? editingModel.model.id : `mod-${modName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const connectorList = modConnectors.split(',').map(c => c.trim()).filter(Boolean);

    const newModel: CatalogModel = {
      id: modelId,
      manufacturer: targetMfg.name,
      modelName: modName,
      variant: modVariant || 'Standard Spec',
      batteryCapacitykWh: modBattery,
      usableCapacitykWh: modUsable,
      ratedRangeKm: modRatedRange,
      realWorldRangeKm: modPracticalRange,
      dcMaxPowerKW: modDCPower,
      acMaxPowerKW: modACPower,
      connectorTypes: connectorList.length > 0 ? connectorList : ['CCS2', 'Type 2'],
      energyEfficiencyWhPerKm: modEfficiency,
      vehicleCategory: targetMfg.category,
      active: true,
      verificationStatus: 'approved',
    };

    let updatedModels: CatalogModel[];
    if (editingModel) {
      updatedModels = targetMfg.models.map(m => (m.id === modelId ? newModel : m));
    } else {
      updatedModels = [...targetMfg.models, newModel];
    }

    const updatedMfg: CatalogManufacturer = { ...targetMfg, models: updatedModels };
    await vehicleCatalogService.saveManufacturer(updatedMfg);

    operationsService.logAuditEvent(
      user.uid,
      user.email,
      user.role,
      editingModel ? 'ADMIN_EDIT_MODEL' : 'ADMIN_ADD_MODEL',
      'vehicle_catalog',
      modelId,
      { modelName: modName, variant: modVariant, mfgName: targetMfg.name }
    );

    fetchCatalogData();
    setShowAddModelModal(false);
    setSelectedMfgForModel(null);
    setEditingModel(null);
    setModName('');
    setModVariant('');
  };

  const handleVerifyModel = async (mfg: CatalogManufacturer, model: CatalogModel, verify: boolean) => {
    if (!user) return;
    const newStatus = verify ? 'approved' : 'pending';
    const updatedModel: CatalogModel = { ...model, verificationStatus: newStatus };
    const updatedModels = mfg.models.map(m => (m.id === model.id ? updatedModel : m));
    const updatedMfg: CatalogManufacturer = { ...mfg, models: updatedModels };

    await vehicleCatalogService.saveManufacturer(updatedMfg);
    operationsService.logAuditEvent(
      user.uid,
      user.email,
      user.role,
      verify ? 'ADMIN_VERIFY_CATALOG_ENTRY' : 'ADMIN_UNVERIFY_CATALOG_ENTRY',
      'vehicle_catalog',
      model.id,
      { modelName: model.modelName, verificationStatus: newStatus }
    );

    fetchCatalogData();
  };

  return (
    <div className="space-y-6 vc-page-enter">
      
      {/* HEADER BAR & TOP CTAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="vc-badge vc-badge-sky text-[10px] uppercase font-bold">VEHICLE CATALOG ENGINE</span>
            <span className="text-xs text-slate-400 font-semibold">FIRESTORE COLLECTION: "vehicle_catalog"</span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Vehicle Catalog Administration
          </h1>
          <p className="text-xs text-slate-400">
            Manage EV categories, manufacturers, models, technical specifications, and verification statuses.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setEditingManufacturer(null);
              setMfgName('');
              setMfgCountry('India');
              setShowAddManufacturerModal(true);
            }}
            className="vc-btn vc-btn-teal py-2.5 px-4 text-xs font-extrabold flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Manufacturer
          </button>
        </div>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search manufacturer, model name, variant, or country..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
          />
        </div>

        {/* 3 Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          
          <select
            value={selectedCategory}
            onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
          >
            <option value="ALL">Category: All EV Types</option>
            <option value="4-wheeler">4-Wheeler Passenger</option>
            <option value="2-wheeler">2-Wheeler Scooters & Bikes</option>
            <option value="3-wheeler">3-Wheeler Auto & Cargo</option>
            <option value="commercial">Commercial Fleets</option>
            <option value="buses_heavy">Buses & Heavy Transport</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
          >
            <option value="ALL">Status: All</option>
            <option value="ACTIVE">Active in Driver Onboarding</option>
            <option value="DISABLED">Disabled</option>
          </select>

          <select
            value={selectedVerification}
            onChange={e => { setSelectedVerification(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
          >
            <option value="ALL">Verification: All</option>
            <option value="approved">Approved & Verified</option>
            <option value="pending">Pending Review</option>
          </select>

        </div>

      </div>

      {/* 3. CATALOG MANUFACTURERS & MODELS HIGH-DENSITY TABLE */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2 animate-pulse">
            <Car className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
            <div>Loading vehicle catalog from Cloud Firestore...</div>
          </div>
        ) : paginatedRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">
                  <th className="py-3 px-3">Manufacturer</th>
                  <th className="py-3 px-3">Model & Variant</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Battery (Gross/Usable)</th>
                  <th className="py-3 px-3">Practical Range</th>
                  <th className="py-3 px-3">DC Fast Charge</th>
                  <th className="py-3 px-3">Connectors</th>
                  <th className="py-3 px-3">Verification</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {paginatedRows.map(({ mfg, model }) => {
                  const verStatus = model.verificationStatus || 'approved';

                  return (
                    <tr key={`${mfg.id}-${model.id}`} className="hover:bg-slate-800/40 transition-colors">
                      
                      {/* Manufacturer Name & Country */}
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-white flex items-center gap-1.5">
                          {mfg.name}
                          {mfg.popular && <span className="vc-badge vc-badge-teal text-[8px] uppercase">POPULAR</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Globe className="w-3 h-3 text-slate-500" /> {mfg.country}
                        </div>
                      </td>

                      {/* Model & Variant */}
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-sky-400">{model.modelName}</div>
                        <div className="text-[11px] text-slate-300 font-semibold">{model.variant}</div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 uppercase font-extrabold text-slate-300 text-[11px]">{mfg.category}</td>

                      {/* Battery Gross/Usable */}
                      <td className="py-3 px-3 font-bold text-white">
                        {model.batteryCapacitykWh} kWh <span className="text-teal-400 text-[11px]">({model.usableCapacitykWh} kWh usable)</span>
                      </td>

                      {/* Practical Range */}
                      <td className="py-3 px-3 font-bold text-emerald-400">~{model.realWorldRangeKm} km</td>

                      {/* DC Power */}
                      <td className="py-3 px-3 font-bold text-sky-400">{model.dcMaxPowerKW} kW DC</td>

                      {/* Connectors */}
                      <td className="py-3 px-3 text-slate-300 text-[11px]">{model.connectorTypes.join(', ')}</td>

                      {/* Verification */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          verStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {verStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right space-x-1 shrink-0">
                        {verStatus !== 'approved' ? (
                          <button
                            onClick={() => handleVerifyModel(mfg, model, true)}
                            className="px-2 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-[10px]"
                            title="Verify Catalog Entry"
                          >
                            Verify
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerifyModel(mfg, model, false)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-600 text-amber-300 font-bold text-[10px]"
                            title="Unverify Catalog Entry"
                          >
                            Unverify
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setEditingModel({ mfg, model });
                            setModName(model.modelName);
                            setModVariant(model.variant);
                            setModBattery(model.batteryCapacitykWh);
                            setModUsable(model.usableCapacitykWh);
                            setModRatedRange(model.ratedRangeKm);
                            setModPracticalRange(model.realWorldRangeKm);
                            setModDCPower(model.dcMaxPowerKW);
                            setModACPower(model.acMaxPowerKW);
                            setModConnectors(model.connectorTypes.join(', '));
                            setModEfficiency(model.energyEfficiencyWhPerKm);
                            setShowAddModelModal(true);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold text-[10px]"
                          title="Edit Technical Specs"
                        >
                          Edit
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500 space-y-1">
            <Car className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="font-bold text-slate-300">No catalog models match filters</div>
            <p className="text-[11px]">Adjust your search query or reset filter selectors.</p>
          </div>
        )}

        {/* PAGINATION BAR */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
          <div className="text-slate-400">
            Showing Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages}</span> ({filteredRows.length} total models)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 font-bold flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-40 font-bold flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* 4. ADD / EDIT MANUFACTURER MODAL */}
      {(showAddManufacturerModal || editingManufacturer) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-heading font-extrabold text-base text-white">
                {editingManufacturer ? 'Edit Manufacturer' : 'Add New EV Manufacturer'}
              </h3>
              <button onClick={() => { setShowAddManufacturerModal(false); setEditingManufacturer(null); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManufacturer} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Manufacturer Name</label>
                <input
                  type="text"
                  value={mfgName}
                  onChange={e => setMfgName(e.target.value)}
                  placeholder="e.g. BYD, Tesla, Ola Electric, Rivian..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs focus:ring-1 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Country of Origin</label>
                  <input
                    type="text"
                    value={mfgCountry}
                    onChange={e => setMfgCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Default Category</label>
                  <select
                    value={mfgCategory}
                    onChange={e => setMfgCategory(e.target.value as EVCategory)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                  >
                    <option value="4-wheeler">4-Wheeler</option>
                    <option value="2-wheeler">2-Wheeler</option>
                    <option value="3-wheeler">3-Wheeler</option>
                    <option value="commercial">Commercial</option>
                    <option value="buses_heavy">Buses & Heavy</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="mfgPopular"
                  checked={mfgPopular}
                  onChange={e => setMfgPopular(e.target.checked)}
                  className="w-4 h-4 text-sky-500 rounded bg-slate-950 border-slate-800"
                />
                <label htmlFor="mfgPopular" className="text-xs font-semibold text-slate-300">
                  Feature in Popular Brands bar during onboarding
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddManufacturerModal(false); setEditingManufacturer(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-xs hover:bg-sky-400 shadow-md"
                >
                  Save Manufacturer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. ADD / EDIT MODEL & VARIANT MODAL */}
      {(showAddModelModal || editingModel) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-heading font-extrabold text-base text-white">
                {editingModel ? 'Edit Technical Specifications' : `Add Model to ${selectedMfgForModel?.name}`}
              </h3>
              <button onClick={() => { setShowAddModelModal(false); setEditingModel(null); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModel} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Model Name</label>
                  <input
                    type="text"
                    value={modName}
                    onChange={e => setModName(e.target.value)}
                    placeholder="e.g. Seal, Nexon EV, Ioniq 5..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Variant Designation</label>
                  <input
                    type="text"
                    value={modVariant}
                    onChange={e => setModVariant(e.target.value)}
                    placeholder="e.g. Performance AWD, Empowered+ Lux..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Gross Pack (kWh)</label>
                  <input
                    type="number"
                    value={modBattery}
                    onChange={e => setModBattery(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Usable Pack (kWh)</label>
                  <input
                    type="number"
                    value={modUsable}
                    onChange={e => setModUsable(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-teal-400 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Rated Range (km)</label>
                  <input
                    type="number"
                    value={modRatedRange}
                    onChange={e => setModRatedRange(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Practical Est. Range (km)</label>
                  <input
                    type="number"
                    value={modPracticalRange}
                    onChange={e => setModPracticalRange(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-emerald-400 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Max DC Fast Charge (kW)</label>
                  <input
                    type="number"
                    value={modDCPower}
                    onChange={e => setModDCPower(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-sky-400 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Max AC Power (kW)</label>
                  <input
                    type="number"
                    value={modACPower}
                    onChange={e => setModACPower(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Connector Standards (comma separated)</label>
                <input
                  type="text"
                  value={modConnectors}
                  onChange={e => setModConnectors(e.target.value)}
                  placeholder="CCS2, Type 2"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModelModal(false); setEditingModel(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-xs hover:bg-sky-400 shadow-md"
                >
                  Save Model & Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
