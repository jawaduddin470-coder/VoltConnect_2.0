import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogoFull } from '@/assets/LogoFull';
import { ShieldCheck, Lock, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { login, role } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin2.0@voltconnect.io');
  const [password, setPassword] = useState('VoltAdmin2026!');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<{
    title: string;
    description: string;
    type: 'CREDENTIALS' | 'NOT_FOUND' | 'UNAUTHORIZED' | 'MISSING_PROFILE' | 'SUSPENDED' | 'NETWORK';
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      await login(email, password, 'admin');
      navigate('/admin/dashboard');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('does not have \'admin\' access privileges') || msg.includes('privileges')) {
        setAuthError({
          type: 'UNAUTHORIZED',
          title: 'Unauthorized Account Role',
          description: 'Authenticated successfully, but this account is not authorized for the Admin Portal.',
        });
      } else if (msg.includes('No registered admin profile found') || msg.includes('profile found')) {
        setAuthError({
          type: 'MISSING_PROFILE',
          title: 'Admin Profile Missing',
          description: 'Authenticated account does not have an administrative profile registered in Firestore.',
        });
      } else if (msg.includes('No registered account') || msg.includes('user-not-found') || msg.includes('No account found')) {
        setAuthError({
          type: 'NOT_FOUND',
          title: 'Account Not Found',
          description: 'No administrator account found with this email. Please verify the email address.',
        });
      } else if (msg.includes('suspended')) {
        setAuthError({
          type: 'SUSPENDED',
          title: 'Account Suspended',
          description: 'This administrator account has been deactivated by platform governance.',
        });
      } else if (msg.includes('network') || msg.includes('Network') || msg.includes('offline') || msg.includes('restrictions') || msg.includes('blocked')) {
        setAuthError({
          type: 'NETWORK',
          title: 'Connection / Service Error',
          description: 'Unable to reach authentication services. Please check network connectivity or Firebase configuration.',
        });
      } else {
        setAuthError({
          type: 'CREDENTIALS',
          title: 'Invalid Credentials',
          description: 'Invalid administrator email or password. Please verify credentials and try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center py-12 px-4 relative overflow-hidden">
      
      {/* Background EV Grid */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <svg width="100%" height="100%">
          <pattern id="admin_login_grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#0EA5E9" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#admin_login_grid)" />
        </svg>
      </div>

      <div className="max-w-md w-full space-y-8 bg-slate-800/90 backdrop-blur-md p-8 sm:p-10 rounded-3xl border border-slate-700 shadow-2xl relative z-10">
        
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <LogoFull height={42} />
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" /> RESTRICTED OPERATIONAL ENTRY
          </div>

          <h2 className="font-heading text-2xl font-extrabold text-white">ADMIN COMMAND CENTER</h2>
          <p className="text-xs text-slate-400">Authorized Personnel Only. Authenticate with platform admin credentials.</p>
        </div>

        {authError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-rose-400">
              <ShieldAlert className="w-4 h-4 shrink-0" /> {authError.title}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {authError.description}
            </p>
            {authError.type === 'UNAUTHORIZED' && (
              <Link to="/dashboard" className="vc-btn vc-btn-secondary-dark py-1.5 px-3 text-[11px] font-bold inline-block mt-1">
                Return to VoltConnect Driver Dashboard
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Admin Email Identity</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 font-medium text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Master Password</label>
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
            {loading ? 'Verifying Admin Claims...' : 'AUTHENTICATE ADMIN ACCESS'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-700/80">
          VoltConnect 2.0 • Security & Audit Governance Enabled
        </div>

      </div>
    </div>
  );
};
