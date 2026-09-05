import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminOverviewView } from '@/components/admin/AdminOverviewView';
import { AdminStationsView } from '@/components/admin/AdminStationsView';
import { AdminVehiclesView } from '@/components/admin/AdminVehiclesView';
import { AdminUsersView } from '@/components/admin/AdminUsersView';
import { AdminPartnersView } from '@/components/admin/AdminPartnersView';
import { AdminOperationsView } from '@/components/admin/AdminOperationsView';
import { AdminAuditLogsView } from '@/components/admin/AdminAuditLogsView';
import { operationsService } from '@/services/operationsService';
import { chargingDataService } from '@/services/chargingDataService';
import { AuditLog, ChargingStation, PartnerApplication, DataQualityIssue, StationReport, UserRole } from '@/types';
import L from 'leaflet';
import {
  ShieldCheck,
  Users,
  Building2,
  Wrench,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Search,
  Zap,
  Flag,
  Check,
  MapPin,
  Edit2,
  Lock,
  X,
  Map as MapIcon,
  SlidersHorizontal,
  ChevronRight,
  Filter,
  BarChart3,
  Car,
} from 'lucide-react';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED';
  vehiclesCount: number;
  createdAt: string;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'stations' | 'partners' | 'operations' | 'audit'>('overview');

  // Real Operational Data State
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [pendingStations, setPendingStations] = useState<ChargingStation[]>([]);
  const [partnerApps, setPartnerApps] = useState<PartnerApplication[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dqIssues, setDqIssues] = useState<DataQualityIssue[]>([]);
  const [userReports, setUserReports] = useState<StationReport[]>([]);

  // Managed Users State
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([
    { id: 'usr-1', name: 'VoltConnect Admin', email: 'admin2.0@voltconnect.io', role: 'admin', status: 'ACTIVE', vehiclesCount: 1, createdAt: '2026-08-01' },
    { id: 'usr-2', name: 'Alex Rivera', email: 'alex@voltcharge.com', role: 'partner', status: 'ACTIVE', vehiclesCount: 0, createdAt: '2026-08-05' },
    { id: 'usr-3', name: 'Ramesh Kumar', email: 'ramesh@voltcare.in', role: 'technician', status: 'ACTIVE', vehiclesCount: 0, createdAt: '2026-08-10' },
    { id: 'usr-4', name: 'Priya Sharma', email: 'priya@gmail.com', role: 'driver', status: 'ACTIVE', vehiclesCount: 2, createdAt: '2026-08-12' },
  ]);
  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('driver');

  useEffect(() => {
    chargingDataService.getStations().then(data => {
      setStations(data);
      operationsService.runDataQualityAudit(data).then(setDqIssues);
    });

    chargingDataService.getAllReports().then(setUserReports);
    operationsService.getPendingStations().then(setPendingStations);
    operationsService.getPartnerApplications().then(setPartnerApps);
    operationsService.getAuditLogs().then(setAuditLogs);
  }, []);

  const handleReviewStation = async (stationId: string, status: 'approved' | 'rejected') => {
    if (!user) return;
    await operationsService.reviewStation(stationId, status, user.uid, user.email);
    setPendingStations(prev => prev.filter(s => s.id !== stationId));
    operationsService.getAuditLogs().then(setAuditLogs);
  };

  const handleSaveUserRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !user) return;

    setManagedUsers(prev =>
      prev.map(u => (u.id === editingUser.id ? { ...u, role: newRole } : u))
    );

    operationsService.getAuditLogs().then(logs => {
      const newLog: AuditLog = {
        id: `audit-${Date.now()}`,
        action: 'ROLE_CHANGED',
        actorId: user.uid,
        actorEmail: user.email,
        actorRole: user.role,
        targetId: editingUser.id,
        targetCollection: 'users',
        details: { targetEmail: editingUser.email, newRole },
        timestamp: new Date().toISOString(),
      };
      setAuditLogs(prev => [newLog, ...prev]);
    });

    setEditingUser(null);
  };

  const filteredUsers = managedUsers.filter(
    u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <AdminShell>
      <div className="space-y-8 vc-page-enter">
        
        {/* 1. OPERATIONAL OVERVIEW HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="vc-badge vc-badge-sky text-[10px] uppercase font-bold">SYSTEM OVERVIEW</span>
              <span className="text-xs text-slate-400 font-medium">REAL-TIME PLATFORM DATA</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Operational Command Overview
            </h1>
            <p className="text-xs text-slate-400">
              Monitoring global charging stations, partner applications, user roles, and security audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview' ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'users' ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Users ({managedUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('stations')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'stations' ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Pending ({pendingStations.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'audit' ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Audit Stream
            </button>
          </div>
        </div>

        {/* 2. MAIN TAB CONTENT PANELS */}
        {(activeTab === 'overview' && !location.pathname.includes('/stations') && !location.pathname.includes('/vehicles') && !location.pathname.includes('/users') && !location.pathname.includes('/partners') && !location.pathname.includes('/operations') && !location.pathname.includes('/audit')) && (
          <AdminOverviewView />
        )}

        {(activeTab === 'stations' || location.pathname.includes('/stations')) && (
          <AdminStationsView />
        )}

        {location.pathname.includes('/vehicles') && (
          <AdminVehiclesView />
        )}

        {(activeTab === 'users' || location.pathname.includes('/users')) && (
          <AdminUsersView />
        )}

        {(activeTab === 'partners' || location.pathname.includes('/partners')) && (
          <AdminPartnersView />
        )}

        {(activeTab === 'operations' || location.pathname.includes('/operations')) && (
          <AdminOperationsView />
        )}

        {(activeTab === 'audit' || location.pathname.includes('/audit')) && (
          <AdminAuditLogsView />
        )}

        {/* Edit Role Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-heading font-extrabold text-base text-white">Update User Role</h3>
                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="text-slate-400">Updating privileges for:</div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="font-bold text-white">{editingUser.name}</div>
                  <div className="text-slate-400 text-[11px]">{editingUser.email}</div>
                </div>
              </div>

              <form onSubmit={handleSaveUserRole} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Select Operational Role Claim</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="driver">Driver (Default)</option>
                    <option value="partner">Partner (CPO Operator)</option>
                    <option value="technician">Technician (Field Agent)</option>
                    <option value="admin">Administrator (Super Admin)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-xs hover:bg-sky-400 shadow-md"
                  >
                    Save Role Claim
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminShell>
  );
};
