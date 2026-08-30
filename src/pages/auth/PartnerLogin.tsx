import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogoFull } from '@/assets/LogoFull';
import { Building2, ArrowRight, ShieldAlert, Zap } from 'lucide-react';

export const PartnerLogin: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('alex@voltcharge.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAccessDenied(false);

    try {
      await login(email, 'partner');
      navigate('/partner/dashboard');
    } catch (err) {
      setAccessDenied(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      
      {/* Background EV Grid */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <svg width="100%" height="100%">
          <pattern id="partner_login_grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#0EA5E9" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#partner_login_grid)" />
        </svg>
      </div>

      <div className="max-w-md w-full space-y-8 bg-slate-800/90 backdrop-blur-md p-8 sm:p-10 rounded-3xl border border-slate-700 shadow-2xl relative z-10">
        
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <LogoFull height={42} />
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-bold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" /> CPO OPERATOR PORTAL
          </div>

          <h2 className="font-heading text-2xl font-extrabold text-white">PARTNER CONTROL CENTER</h2>
          <p className="text-xs text-slate-400">Charging Network Operations. Authenticate with CPO partner credentials.</p>
        </div>

        {accessDenied && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-rose-400">
              <ShieldAlert className="w-4 h-4" /> Partner Access Required
            </div>
            <p className="text-[11px] text-slate-300">
              Your account credentials or role claims do not grant CPO Partner privileges. Access has been restricted.
            </p>
            <Link to="/dashboard" className="vc-btn vc-btn-secondary-dark py-1.5 px-3 text-[11px] font-bold inline-block mt-1">
              Return to VoltConnect
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Partner Corporate Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 font-medium text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Account Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 font-medium text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full vc-btn vc-btn-teal py-3.5 text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? 'Verifying Partner Credentials...' : 'AUTHENTICATE PARTNER ACCESS'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-700/80">
          VoltConnect 2.0 • Charge Point Operator Network Governance
        </div>

      </div>
    </div>
  );
};
