import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { operationsService } from '@/services/operationsService';
import { getDocument, setDocument } from '@/services/firebase/firestore';
import {
  Settings,
  ShieldCheck,
  Zap,
  MapPin,
  Bell,
  Save,
  CheckCircle2,
  Lock,
  Sliders,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface PlatformSettings {
  minTariff: number;
  maxTariff: number;
  duplicateProximityMeters: number;
  allowPartnerSubmissions: boolean;
  maintenanceMode: boolean;
  supportEmail: string;
  emergencyPhone: string;
  updatedAt?: string;
  updatedBy?: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  minTariff: 1.0,
  maxTariff: 150.0,
  duplicateProximityMeters: 50,
  allowPartnerSubmissions: true,
  maintenanceMode: false,
  supportEmail: 'support@voltconnect.io',
  emergencyPhone: '+91 1800-VOLT-CONNECT',
};

export const AdminSettingsView: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Load from Firestore or local fallback
    getDocument<PlatformSettings>('system_config', 'platform_settings').then(doc => {
      if (doc) {
        setSettings({ ...DEFAULT_SETTINGS, ...doc });
      } else {
        const local = localStorage.getItem('vc_platform_settings');
        if (local) {
          try {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(local) });
          } catch {}
        }
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveSuccess(false);

    const payload: PlatformSettings = {
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: user.email,
    };

    try {
      await setDocument('system_config', 'platform_settings', payload);
      localStorage.setItem('vc_platform_settings', JSON.stringify(payload));

      operationsService.logAuditEvent(
        user.uid,
        user.email,
        user.role,
        'ADMIN_UPDATE_SETTINGS',
        'system_config',
        'platform_settings',
        { ...payload }
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to persist settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 vc-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="vc-badge vc-badge-sky text-[10px] uppercase font-bold">PLATFORM CONFIGURATION</span>
            <span className="text-xs text-slate-400 font-semibold">GOVERNANCE & PARAMETERS</span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Platform Settings & Governance
          </h1>
          <p className="text-xs text-slate-400">
            Configure system verification constraints, duplicate proximity boundaries, and operational contact channels.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved to Firestore</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. Mandatory Verification Policy */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-heading font-extrabold text-sm text-white">Station Verification Policy</h3>
              <p className="text-xs text-slate-400">Zero Pre-Approval Governance Mandate</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Mandatory Explicit Admin Verification</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                    ENFORCED
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Every partner-submitted station is strictly initialized with <code className="text-sky-400">verificationStatus = "pending"</code>. Pre-approval mechanisms are strictly forbidden by platform policy.
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Geospatial & Tariff Constraints */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <MapPin className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-heading font-extrabold text-sm text-white">Geospatial & Tariff Safety Limits</h3>
              <p className="text-xs text-slate-400">Anti-Collision & Commercial Bounds</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Duplicate Location Buffer (Meters)</label>
              <input
                type="number"
                min="10"
                max="500"
                value={settings.duplicateProximityMeters}
                onChange={e => setSettings({ ...settings, duplicateProximityMeters: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:ring-1 focus:ring-sky-500"
              />
              <p className="text-[10px] text-slate-500">Warns partner if a hub exists within this radius.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Minimum Allowed Tariff (₹/kWh)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={settings.minTariff}
                onChange={e => setSettings({ ...settings, minTariff: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:ring-1 focus:ring-sky-500"
              />
              <p className="text-[10px] text-slate-500">Floor price for charging session tariffs.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Maximum Allowed Tariff (₹/kWh)</label>
              <input
                type="number"
                step="1"
                max="300"
                value={settings.maxTariff}
                onChange={e => setSettings({ ...settings, maxTariff: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:ring-1 focus:ring-sky-500"
              />
              <p className="text-[10px] text-slate-500">Prevents erroneous tariff data entry.</p>
            </div>
          </div>
        </div>

        {/* 3. Operational Ingestion & Support */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-heading font-extrabold text-sm text-white">Operations & Ingestion Controls</h3>
              <p className="text-xs text-slate-400">Manage CPO submissions and platform channels</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Platform Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Emergency Highway Helpline</label>
              <input
                type="text"
                value={settings.emergencyPhone}
                onChange={e => setSettings({ ...settings, emergencyPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Allow CPO Partner Station Submissions</div>
              <div className="text-[11px] text-slate-400">When enabled, verified partners can submit charging hubs into the moderation queue.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowPartnerSubmissions}
                onChange={e => setSettings({ ...settings, allowPartnerSubmissions: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500" />
            </label>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-lg transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Persisting...' : 'Save Platform Settings'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
