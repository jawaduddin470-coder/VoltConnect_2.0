import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { operationsService } from '@/services/operationsService';
import { chargingDataService } from '@/services/chargingDataService';
import { PartnerLocationPickerMap } from './PartnerLocationPickerMap';
import { ChargingStation } from '@/types';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Zap,
  MapPin,
  Clock,
  DollarSign,
  AlertCircle,
  Building2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface PartnerAddStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStationCreated: (newStation: ChargingStation) => void;
}

export const PartnerAddStationModal: React.FC<PartnerAddStationModalProps> = ({
  isOpen,
  onClose,
  onStationCreated,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form Fields State
  const [name, setName] = useState('');
  const [operatorName, setOperatorName] = useState(user?.name || 'VoltPartner');
  const [description, setDescription] = useState('High-Power Public Fast Charging Hub');

  // Step 2: Location
  const [city, setCity] = useState('Hyderabad');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(17.4385);
  const [lng, setLng] = useState(78.3842);

  // Step 3: Hardware
  const [connectorType, setConnectorType] = useState<'CCS2' | 'Type2' | 'GB/T' | 'CHAdeMO'>('CCS2');
  const [powerKW, setPowerKW] = useState(60);
  const [portsCount, setPortsCount] = useState(2);

  // Step 4: Tariffs & Operations
  const [pricePerKWh, setPricePerKWh] = useState(18);
  const [operatingHours, setOperatingHours] = useState('24/7 Open');
  const [is24x7, setIs24x7] = useState(true);
  const [amenities, setAmenities] = useState<string[]>(['Restroom', 'WiFi', 'EV Lounge']);

  // Error & Progress State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Step Validation Logic
  const handleNextStep = () => {
    setValidationError(null);

    if (step === 1) {
      if (!name.trim() || name.trim().length < 3) {
        setValidationError('Station Name must be at least 3 characters long.');
        return;
      }
      if (!operatorName.trim()) {
        setValidationError('Please specify your CPO or Operator Brand name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!address.trim() || address.trim().length < 5) {
        setValidationError('Please provide a complete street address (minimum 5 characters).');
        return;
      }
      if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
        setValidationError('Please select a valid GPS location on the map.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (isNaN(powerKW) || powerKW < 3.3 || powerKW > 400) {
        setValidationError('Charger output power must be between 3.3 kW and 400 kW.');
        return;
      }
      if (portsCount < 1 || portsCount > 20) {
        setValidationError('Number of charging bays must be between 1 and 20.');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (isNaN(pricePerKWh) || pricePerKWh < 1 || pricePerKWh > 150) {
        setValidationError('Tariff rate must be between ₹1 and ₹150 per kWh.');
        return;
      }
      setStep(5);
    }
  };

  const handlePrevStep = () => {
    setValidationError(null);
    if (step > 1) setStep((step - 1) as any);
  };

  const toggleAmenity = (item: string) => {
    setAmenities(prev =>
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setValidationError(null);

    try {
      // Build chargers array based on portsCount
      const chargers = Array.from({ length: portsCount }).map((_, idx) => ({
        id: `chg-${Date.now()}-${idx + 1}`,
        stationId: '',
        connectorType,
        powerKW: Number(powerKW),
        pricingPerKWh: Number(pricePerKWh),
        hasVerifiedPricing: true,
        pricingDisplay: `₹${pricePerKWh} / kWh`,
        status: 'Available' as const,
        lastUpdated: new Date().toISOString(),
      }));

      const newStation = await operationsService.submitStationForApproval({
        partnerId: user.uid,
        name: name.trim(),
        operatorName: operatorName.trim(),
        description: description.trim(),
        address: address.trim(),
        city: city.trim() || 'Hyderabad',
        latitude: Number(lat),
        longitude: Number(lng),
        operatingHours: is24x7 ? '24/7 Open' : operatingHours.trim(),
        is24x7,
        amenities,
        voltScore: 90,
        status: 'active',
        verificationStatus: 'pending',
        dataSource: 'partner',
        pricingModel: 'per_kwh',
        chargers,
        createdBy: user.uid,
      });

      chargingDataService.clearCache();
      onStationCreated(newStation);
      onClose();
    } catch (err: any) {
      console.error('Submission failed:', err);
      setValidationError(err.message || 'Failed to submit station for approval. Please check network connectivity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-white">Register Charging Hub</h3>
              <p className="text-xs text-slate-400">Step {step} of 5 • Verification Submission</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Step Progress Breadcrumb */}
        <div className="flex items-center justify-between gap-1.5">
          {[
            { num: 1, label: 'Info' },
            { num: 2, label: 'Location' },
            { num: 3, label: 'Hardware' },
            { num: 4, label: 'Tariff' },
            { num: 5, label: 'Review' },
          ].map(s => {
            const isDone = s.num < step;
            const isCurrent = s.num === step;
            return (
              <div
                key={s.num}
                className={`flex-1 py-1.5 px-2 rounded-xl text-center text-[10px] font-bold border transition-all ${
                  isDone
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : isCurrent
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-extrabold shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                {s.num}. {s.label}
              </div>
            );
          })}
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* STEP 1: BASIC INFORMATION */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Station Hub Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Jio-bp Pulse Fast Hub - Madhapur"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Operator / CPO Brand *</label>
              <input
                type="text"
                value={operatorName}
                onChange={e => setOperatorName(e.target.value)}
                placeholder="e.g. Tata Power / Zeon / ChargeZone / Jio-bp"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Hub Description & Public Access Info</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe entry gates, parking level, or landmark instructions for drivers..."
                className="w-full h-20 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>
        )}

        {/* STEP 2: LOCATION & GPS MAP */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">City *</label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Vijayawada">Vijayawada</option>
                  <option value="Vizag">Vizag</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Street Address *</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. Ground Level, Inorbit Mall, Hitech City"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* Interactive Leaflet Picker Map */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 flex items-center justify-between">
                <span>Pin Exact GPS Coordinates on Map *</span>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  {lat.toFixed(4)}, {lng.toFixed(4)}
                </span>
              </label>
              <PartnerLocationPickerMap
                initialLat={lat}
                initialLng={lng}
                onLocationSelect={({ lat: newLat, lng: newLng, addressSuggestion, citySuggestion }) => {
                  setLat(newLat);
                  setLng(newLng);
                  if (addressSuggestion && !address) setAddress(addressSuggestion);
                  if (citySuggestion) setCity(citySuggestion);
                }}
              />
            </div>
          </div>
        )}

        {/* STEP 3: HARDWARE & CHARGERS */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Primary Connector Protocol *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['CCS2', 'Type2', 'GB/T', 'CHAdeMO'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setConnectorType(type)}
                    className={`py-3 px-2 rounded-xl text-center font-bold border transition-all ${
                      connectorType === type
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Max DC Output (kW) *</label>
                <input
                  type="number"
                  value={powerKW}
                  onChange={e => setPowerKW(Number(e.target.value))}
                  min={3.3}
                  max={360}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold text-sky-400"
                />
                <p className="text-[10px] text-slate-500">Standard DC Fast: 50kW-120kW • Ultra: 150kW-350kW</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Number of Installed Ports/Guns *</label>
                <input
                  type="number"
                  value={portsCount}
                  onChange={e => setPortsCount(Number(e.target.value))}
                  min={1}
                  max={20}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                />
                <p className="text-[10px] text-slate-500">Number of vehicle charging bays supported concurrently</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: TARIFFS & AMENITIES */}
        {step === 4 && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Customer Charging Tariff (₹ / kWh) *</label>
              <input
                type="number"
                value={pricePerKWh}
                onChange={e => setPricePerKWh(Number(e.target.value))}
                min={1}
                max={100}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold text-emerald-400"
              />
              <p className="text-[10px] text-slate-500">Displayed directly to drivers on VoltMap & dynamic trip calculations</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-300">Operating Hours</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={is24x7}
                    onChange={e => setIs24x7(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-slate-300 font-semibold text-[11px]">24/7 Continuous Access</span>
                </label>
              </div>
              {!is24x7 && (
                <input
                  type="text"
                  value={operatingHours}
                  onChange={e => setOperatingHours(e.target.value)}
                  placeholder="e.g. 06:00 AM - 11:00 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Site Amenities</label>
              <div className="flex flex-wrap gap-2">
                {['Restroom', 'WiFi', 'EV Lounge', 'Cafe / Dining', 'Security Guard', 'Covered Parking', 'Wheelchair Access'].map(item => {
                  const selected = amenities.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleAmenity(item)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all ${
                        selected
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '} {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & VERIFICATION SUBMISSION */}
        {step === 5 && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-sm">{name}</span>
                <span className="text-emerald-400 font-extrabold">₹{pricePerKWh}/kWh</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Location</span>
                  <span>{address}, {city}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Operator Brand</span>
                  <span>{operatorName}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Hardware Configuration</span>
                  <span>{portsCount} Ports • {powerKW} kW ({connectorType})</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Schedule</span>
                  <span>{is24x7 ? '24/7 Open' : operatingHours}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] leading-relaxed space-y-1">
              <div className="font-bold text-sky-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Admin Audit & Verification Policy
              </div>
              <p>
                Submitting this hub queues it into the Admin Verification Command Center. Once the GPS coordinates and electrical standards are validated, the station will go live publicly across VoltMap.
              </p>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Submitting to Admin...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  Submit Station for Approval
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
