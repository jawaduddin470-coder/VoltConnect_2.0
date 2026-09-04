import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogoFull } from '@/assets/LogoFull';
import { Wrench, ArrowRight, ShieldAlert } from 'lucide-react';

export const TechnicianLogin: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('ramesh@voltcare.in');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAccessDenied(false);

    try {
      await login(email, password, 'technician');
      navigate('/technician/dashboard');
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
          <pattern id="tech_login_grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#10B981" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#tech_login_grid)" />
        </svg>
      </div>

      <div className="max-w-md w-full space-y-8 bg-slate-800/90 backdrop-blur-md p-8 sm:p-10 rounded-3xl border border-slate-700 shadow-2xl relative z-10">
        
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <LogoFull height={42} />
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
            <Wrench className="w-3.5 h-3.5" /> FIELD DISPATCH WORKSPACE
          </div>

          <h2 className="font-heading text-2xl font-extrabold text-white">TECHNICIAN WORKSPACE</h2>
          <p className="text-xs text-slate-400">Field Mobility Operations. Authenticate with technician credentials.</p>
        </div>

        {accessDenied && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-rose-400">
              <ShieldAlert className="w-4 h-4" /> Field Technician Access Required
            </div>
            <p className="text-[11px] text-slate-300">
              Your account credentials or role claims do not grant Field Technician privileges. Access has been restricted.
            </p>
            <Link to="/dashboard" className="vc-btn vc-btn-secondary-dark py-1.5 px-3 text-[11px] font-bold inline-block mt-1">
              Return to VoltConnect
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Technician Email Identity</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 font-medium text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Service Passcode</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 font-medium text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full vc-btn vc-btn-teal py-3.5 text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? 'Verifying Technician Credentials...' : 'AUTHENTICATE TECHNICIAN ACCESS'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-700/80">
          VoltConnect 2.0 • VoltCare Mobility Field Dispatch Engine
        </div>

      </div>
    </div>
  );
};
