import React, { useState, useMemo } from 'react';
import { MASTER_VEHICLE_CATALOG, EV_CATEGORIES } from '@/features/vehicles/VehicleCatalog';
import { VehicleCatalogItem, EVCategory } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { EVSOCSelector } from './EVSOCSelector';
import { Search, Car, Bike, Truck, Battery, Gauge, Zap, CheckCircle2, SlidersHorizontal, Plug } from 'lucide-react';

interface EVVehicleSelectorProps {
  selectedVehicle?: VehicleCatalogItem | null;
  onSelectVehicle: (vehicle: VehicleCatalogItem) => void;
  className?: string;
}

export const EVVehicleSelector: React.FC<EVVehicleSelectorProps> = ({
  selectedVehicle: initialSelected,
  onSelectVehicle,
  className = '',
}) => {
  const { activeVehicle, updateActiveVehicleSOC } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<EVCategory>('4-wheeler');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeSOC = activeVehicle?.currentBatteryPercent || 85;

  // Available brands for current category
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    MASTER_VEHICLE_CATALOG.forEach(v => {
      if (v.category === selectedCategory) {
        brands.add(v.manufacturer);
      }
    });
    return Array.from(brands).sort();
  }, [selectedCategory]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return MASTER_VEHICLE_CATALOG.filter(v => {
      const matchesCategory = v.category === selectedCategory;
      const matchesBrand = selectedBrand === 'ALL' || v.manufacturer === selectedBrand;
      const matchesQuery =
        !searchQuery ||
        v.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.variant || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesBrand && matchesQuery;
    });
  }, [selectedCategory, selectedBrand, searchQuery]);

  return (
    <div className={`vc-card bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6 ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-heading text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Car className="w-5 h-5 text-sky-500" /> Select Your Electric Vehicle (EV)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configures energy physics, range calculations & station connector compatibility
          </p>
        </div>
        {activeVehicle && (
          <span className="vc-badge vc-badge-sky text-[10px] uppercase font-bold font-mono">
            ACTIVE SELECTION
          </span>
        )}
      </div>

      {/* Step 1: Category Selector Pills */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" /> 1. EV Category
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {EV_CATEGORIES.slice(0, 5).map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedBrand('ALL');
                }}
                className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="truncate">
                  <div className="font-extrabold">{cat.name.split(' (')[0]}</div>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Search & Brand Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">2. Search Vehicle Model</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search Nexon, ZS, BMW iX, Ola S1..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Filter by Brand / Manufacturer</label>
          <select
            value={selectedBrand}
            onChange={e => setSelectedBrand(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Brands ({availableBrands.length})</option>
            {availableBrands.map(b => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Step 3: Model Grid List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Available Models ({filteredVehicles.length})</span>
          <span className="text-slate-400 font-normal">Click to select vehicle</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
          {filteredVehicles.map(veh => {
            const isSelected = activeVehicle?.model === veh.model || initialSelected?.id === veh.id;
            return (
              <button
                key={veh.id}
                type="button"
                onClick={() => onSelectVehicle(veh)}
                className={`p-4 rounded-2xl border text-left transition-all space-y-2 ${
                  isSelected
                    ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-500/20 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600 font-mono">
                      {veh.manufacturer}
                    </span>
                    <h4 className="font-heading font-extrabold text-sm text-slate-900 leading-tight">
                      {veh.model}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">{veh.variant}</p>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0" />}
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-slate-600 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Battery className="w-3.5 h-3.5 text-teal-500" /> {veh.batteryCapacitykWh} kWh
                  </span>
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-sky-500" /> {veh.estimatedRangeKm} km
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Zap className="w-3.5 h-3.5 text-amber-500" /> {veh.dcMaxPowerKW > 0 ? `${veh.dcMaxPowerKW}kW DC` : `${veh.acMaxPowerKW}kW AC`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 4: Interactive Starting Battery SOC Selector */}
      {activeVehicle && (
        <EVSOCSelector
          currentSOC={activeSOC}
          nominalRangeKm={activeVehicle.estimatedRangeKm}
          vehicleModelName={`${activeVehicle.manufacturer} ${activeVehicle.model}`}
          onChangeSOC={newSOC => updateActiveVehicleSOC(newSOC)}
        />
      )}

    </div>
  );
};
