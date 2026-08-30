import React from 'react';
import { Link } from 'react-router-dom';
import { VoltConnectLogo } from '@/components/common/VoltConnectLogo';
import { Linkedin, ExternalLink, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-navy-950 text-slate-300 pt-16 pb-8 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-800">
          
          {/* Column 1: Brand & Slogan */}
          <div className="col-span-2 space-y-4 pr-4">
            <div className="flex items-center gap-3">
              <VoltConnectLogo variant="footer" />
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Unified electric mobility ecosystem platform connecting EV drivers, charging infrastructure, service partners, field technicians, and platform administration.
            </p>

            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              MSME Phase-2 Competition Blueprint Specification
            </div>
          </div>

          {/* Column 2: Platform Links */}
          <div>
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/explore" className="hover:text-teal-400 transition-colors">
                  VoltMap Discovery
                </Link>
              </li>
              <li>
                <Link to="/trips" className="hover:text-teal-400 transition-colors">
                  Smart Journey Planner
                </Link>
              </li>
              <li>
                <Link to="/garage" className="hover:text-teal-400 transition-colors">
                  My EV Garage
                </Link>
              </li>
              <li>
                <Link to="/ai" className="hover:text-teal-400 transition-colors text-sky-400 font-semibold">
                  VoltAI Copilot
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Ecosystem Services */}
          <div>
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Ecosystem
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/health" className="hover:text-teal-400 transition-colors">
                  VoltHealth Battery SOH
                </Link>
              </li>
              <li>
                <Link to="/care" className="hover:text-teal-400 transition-colors">
                  VoltCare Maintenance
                </Link>
              </li>
              <li>
                <Link to="/homecharge" className="hover:text-teal-400 transition-colors">
                  HomeCharge Setup
                </Link>
              </li>
              <li>
                <Link to="/sos" className="hover:text-teal-400 transition-colors text-rose-400 font-semibold">
                  VoltSOS Emergency Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Enterprise Portals */}
          <div>
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Portals
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/partner/dashboard" className="hover:text-teal-400 transition-colors">
                  CPO Partner Portal
                </Link>
              </li>
              <li>
                <Link to="/technician/dashboard" className="hover:text-teal-400 transition-colors">
                  Technician Workspace
                </Link>
              </li>
              <li>
                <Link to="/onboarding" className="hover:text-teal-400 transition-colors">
                  Profile Setup
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & LinkedIn Developer Credit */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 VoltConnect Ecosystem. All rights reserved.</p>
          
          {/* Explicit Developer Credit Required by Prompt */}
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <span>Made by</span>
            <a
              href="https://www.linkedin.com/in/mohammed-meraj-uddin-0751a6396/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-teal-400 font-bold hover:text-teal-300 transition-colors underline decoration-teal-400/40 underline-offset-4"
            >
              <Linkedin className="w-3.5 h-3.5" />
              Mohammed Meraj Uddin
              <ExternalLink className="w-3 h-3 text-teal-400" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
