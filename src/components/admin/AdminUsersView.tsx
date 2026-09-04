import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAllUsers, updateUserStatus, updateUserRole, adminUpdateUserRole } from '@/services/firebase/users';
import { fetchUserServiceRequests } from '@/services/firebase/queues';
import { operationsService } from '@/services/operationsService';
import { UserProfile, UserRole, ServiceRequest } from '@/types';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Zap,
  Car,
  ChevronLeft,
  ChevronRight,
  X,
  UserCheck,
  UserX,
  FileText,
  Navigation,
  Wrench,
  Lock,
  ShieldAlert,
  Info,
  Calendar,
  Activity,
  Award,
} from 'lucide-react';

export const AdminUsersView: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Detail Modal States
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editRoleValue, setEditRoleValue] = useState<UserRole>('driver');
  const [updatingRole, setUpdatingRole] = useState(false);
  const [roleMessage, setRoleMessage] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'profile' | 'ev' | 'trips' | 'service'>('profile');
  const [userServiceRequests, setUserServiceRequests] = useState<ServiceRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Mock User Trips Dataset for Inspection
  const mockUserTrips = [
    { id: 'trip-101', route: 'Hyderabad → Vijayawada (275 km)', vehicle: 'Tata Nexon EV Long Range', energyConsumed: '38.4 kWh', stopsCount: 1, date: '2026-08-18', status: 'COMPLETED' },
    { id: 'trip-102', route: 'Hyderabad → Guntur (290 km)', vehicle: 'Tata Nexon EV Long Range', energyConsumed: '41.2 kWh', stopsCount: 1, date: '2026-08-10', status: 'COMPLETED' },
  ];

  const loadUsersData = async () => {
    setLoading(true);
    const users = await fetchAllUsers();

    // Fallback seed list if Firestore users collection is initially empty
    if (users.length === 0) {
      const seedUsers: UserProfile[] = [
        {
          uid: 'usr-001',
          name: 'Mohammed Meraj Uddin',
          email: 'meraj@voltconnect.io',
          role: 'admin',
          activeVehicleId: 'mod-tata-nexon-ev',
          activeVehicleName: 'Tata Nexon EV Empowered+ Lux 45',
          evCategory: '4-wheeler',
          onboardingComplete: true,
          status: 'ACTIVE',
          createdAt: '2026-04-10T10:00:00Z',
          updatedAt: '2026-08-22T18:00:00Z',
          lastActivity: '10 mins ago',
        },
        {
          uid: 'usr-002',
          name: 'Ananya Sharma',
          email: 'ananya.s@gmail.com',
          role: 'driver',
          activeVehicleId: 'mod-byd-seal',
          activeVehicleName: 'BYD Seal Performance AWD',
          evCategory: '4-wheeler',
          onboardingComplete: true,
          status: 'ACTIVE',
          createdAt: '2026-05-14T11:20:00Z',
          updatedAt: '2026-08-21T14:30:00Z',
          lastActivity: '2 hours ago',
        },
        {
          uid: 'usr-003',
          name: 'Rajesh Kumar',
          email: 'rajesh.k@cpo-zeon.in',
          role: 'partner',
          activeVehicleId: 'mod-mg-zs-ev',
          activeVehicleName: 'MG ZS EV Exclusive Pro',
          evCategory: '4-wheeler',
          onboardingComplete: true,
          status: 'ACTIVE',
          createdAt: '2026-06-01T09:15:00Z',
          updatedAt: '2026-08-20T16:45:00Z',
          lastActivity: '1 day ago',
        },
        {
          uid: 'usr-004',
          name: 'Vikram Singh',
          email: 'vikram.tech@voltcare.in',
          role: 'technician',
          activeVehicleId: 'mod-ola-s1-pro',
          activeVehicleName: 'Ola S1 Pro Gen 2',
          evCategory: '2-wheeler',
          onboardingComplete: true,
          status: 'ACTIVE',
          createdAt: '2026-06-20T08:00:00Z',
          updatedAt: '2026-08-19T12:00:00Z',
          lastActivity: '3 days ago',
        },
      ];
      setUsersList(seedUsers);
    } else {
      setUsersList(users);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsersData();
  }, []);

  // Filter & Search Logic
  const filteredUsers = usersList.filter(u => {
    // 1. Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchUid = u.uid.toLowerCase().includes(q);
      const matchVehicle = (u.activeVehicleName || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchUid && !matchVehicle) return false;
    }

    // 2. Role Filter
    if (selectedRole !== 'ALL' && u.role !== selectedRole) return false;

    // 3. Status Filter
    if (selectedStatus !== 'ALL') {
      const userStatus = u.status || 'ACTIVE';
      if (userStatus !== selectedStatus) return false;
    }

    // 4. EV Category Filter
    if (selectedCategory !== 'ALL') {
      const cat = u.evCategory || '4-wheeler';
      if (cat !== selectedCategory) return false;
    }

    return true;
  });

  // Pagination Calculation
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Toggle Account Active / Suspended Status
  const handleToggleAccountStatus = async (targetUser: UserProfile, suspend: boolean) => {
    if (!currentAdmin) return;
    const newStatus = suspend ? 'SUSPENDED' : 'ACTIVE';

    await updateUserStatus(targetUser.uid, newStatus);
    operationsService.logAuditEvent(
      currentAdmin.uid,
      currentAdmin.email,
      currentAdmin.role,
      suspend ? 'ADMIN_SUSPEND_USER' : 'ADMIN_RESTORE_USER',
      'users',
      targetUser.uid,
      { targetEmail: targetUser.email, newStatus }
    );

    setUsersList(prev => prev.map(u => (u.uid === targetUser.uid ? { ...u, status: newStatus } : u)));
    if (selectedUser?.uid === targetUser.uid) setSelectedUser({ ...selectedUser, status: newStatus });
  };

  // Open User Inspection Modal
  const handleInspectUser = async (targetUser: UserProfile) => {
    setSelectedUser(targetUser);
    setEditRoleValue(targetUser.role);
    setRoleMessage(null);
    setActiveModalTab('profile');
    setLoadingRequests(true);
    try {
      const requests = await fetchUserServiceRequests(targetUser.uid);
      setUserServiceRequests(requests);
    } catch {
      setUserServiceRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!currentAdmin || !selectedUser || selectedUser.role === editRoleValue) return;
    setUpdatingRole(true);
    setRoleMessage(null);
    try {
      await adminUpdateUserRole(
        selectedUser.uid,
        editRoleValue,
        currentAdmin.uid,
        `Role changed from ${selectedUser.role} to ${editRoleValue}`
      );
      const updated = { ...selectedUser, role: editRoleValue };
      setUsersList(prev => prev.map(u => (u.uid === selectedUser.uid ? updated : u)));
      setSelectedUser(updated);
      setRoleMessage(`Role updated to "${editRoleValue}" in Firestore.`);
      setTimeout(() => setRoleMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to update role:', err);
      setRoleMessage(err?.message || 'Failed to update user role.');
    } finally {
      setUpdatingRole(false);
    }
  };

  return (
    <div className="space-y-6 vc-page-enter">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="vc-badge vc-badge-sky text-[10px] uppercase font-bold">USER GOVERNANCE & CLAIMS</span>
            <span className="text-xs text-slate-400 font-semibold">FIRESTORE COLLECTION: "users"</span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-white tracking-tight mt-0.5">
            User Account Management
          </h1>
          <p className="text-xs text-slate-400">
            Inspect driver profiles, EV specifications, trip logs, service requests, and access status.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-xl border border-emerald-500/30 shrink-0">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <span>ZERO SENSITIVE CREDENTIALS DISPLAYED</span>
        </div>
      </div>

      {/* 2. SEARCH & MULTI-FILTER TOOLBAR */}
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
            placeholder="Search driver by name, email, user ID, or vehicle model..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
          />
        </div>

        {/* 3 Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          
          <select
            value={selectedRole}
            onChange={e => { setSelectedRole(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
          >
            <option value="ALL">Account Role: All</option>
            <option value="driver">Driver</option>
            <option value="partner">CPO Partner</option>
            <option value="technician">Service Technician</option>
            <option value="admin">Administrator</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
          >
            <option value="ALL">Account Status: All</option>
            <option value="ACTIVE">Active Account</option>
            <option value="SUSPENDED">Suspended Account</option>
          </select>

          <select
            value={selectedCategory}
            onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
          >
            <option value="ALL">EV Category: All</option>
            <option value="4-wheeler">4-Wheeler Passenger</option>
            <option value="2-wheeler">2-Wheeler Scooters</option>
            <option value="3-wheeler">3-Wheeler Commercial</option>
            <option value="commercial">Commercial Fleets</option>
          </select>

        </div>

      </div>

      {/* 3. USER ACCOUNTS TABLE */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2 animate-pulse">
            <Users className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
            <div>Loading user accounts from Cloud Firestore...</div>
          </div>
        ) : paginatedUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">
                  <th className="py-3 px-3">Driver Name</th>
                  <th className="py-3 px-3">Email Address</th>
                  <th className="py-3 px-3">Account Type</th>
                  <th className="py-3 px-3">EV Category</th>
                  <th className="py-3 px-3">Active EV Model</th>
                  <th className="py-3 px-3">Registered Date</th>
                  <th className="py-3 px-3">Last Activity</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {paginatedUsers.map(u => {
                  const status = u.status || 'ACTIVE';
                  const category = u.evCategory || '4-wheeler';
                  const activeVehicle = u.activeVehicleName || 'Tata Nexon EV Empowered+';

                  return (
                    <tr key={u.uid} className="hover:bg-slate-800/40 transition-colors">
                      
                      {/* Name */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleInspectUser(u)}
                          className="font-extrabold text-white hover:text-sky-400 text-left transition-colors truncate max-w-[160px] block"
                        >
                          {u.name}
                        </button>
                        <div className="text-[10px] text-slate-500 font-mono">{u.uid}</div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-3 text-slate-300 font-medium">{u.email}</td>

                      {/* Account Type */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          u.role === 'admin' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                          u.role === 'partner' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                          u.role === 'technician' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      {/* EV Category */}
                      <td className="py-3 px-3 uppercase font-extrabold text-slate-300 text-[10px]">{category}</td>

                      {/* Active Vehicle */}
                      <td className="py-3 px-3 font-semibold text-sky-400 truncate max-w-[180px]">{activeVehicle}</td>

                      {/* Registration Date */}
                      <td className="py-3 px-3 text-slate-400 text-[11px]">{new Date(u.createdAt).toLocaleDateString()}</td>

                      {/* Last Activity */}
                      <td className="py-3 px-3 text-slate-400 text-[11px]">{u.lastActivity || 'Recent'}</td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right space-x-1 shrink-0">
                        <button
                          onClick={() => handleInspectUser(u)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-[10px]"
                          title="Inspect User Profile & History"
                        >
                          View
                        </button>

                        {status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleToggleAccountStatus(u, true)}
                            className="px-2 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-[10px]"
                            title="Disable Account Access"
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleAccountStatus(u, false)}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                            title="Restore Account Access"
                          >
                            Restore
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500 space-y-1">
            <Users className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="font-bold text-slate-300">No users match criteria</div>
            <p className="text-[11px]">Adjust your search query or reset filter selectors.</p>
          </div>
        )}

        {/* PAGINATION BAR */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
          <div className="text-slate-400">
            Showing Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages}</span> ({filteredUsers.length} total users)
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

      {/* 4. USER INSPECTION MODAL (TABS: Profile | EV Profile | Trip History | Service Requests) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl animate-in fade-in my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="vc-badge vc-badge-sky text-[9px] uppercase font-extrabold">USER GOVERNANCE INSPECTION</span>
                <h3 className="font-heading font-extrabold text-xl text-white mt-1">{selectedUser.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedUser.email} • ID: {selectedUser.uid}</p>
              </div>

              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL TABS */}
            <div className="flex border-b border-slate-800 space-x-2 text-xs font-bold">
              <button
                onClick={() => setActiveModalTab('profile')}
                className={`pb-2.5 px-3 border-b-2 transition-colors ${
                  activeModalTab === 'profile' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                User Profile
              </button>
              <button
                onClick={() => setActiveModalTab('ev')}
                className={`pb-2.5 px-3 border-b-2 transition-colors ${
                  activeModalTab === 'ev' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                EV Profile
              </button>
              <button
                onClick={() => setActiveModalTab('trips')}
                className={`pb-2.5 px-3 border-b-2 transition-colors ${
                  activeModalTab === 'trips' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Trip History ({mockUserTrips.length})
              </button>
              <button
                onClick={() => setActiveModalTab('service')}
                className={`pb-2.5 px-3 border-b-2 transition-colors ${
                  activeModalTab === 'service' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Service Requests ({userServiceRequests.length})
              </button>
            </div>

            {/* TAB 1: USER PROFILE */}
            {activeModalTab === 'profile' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Account Role</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={editRoleValue}
                        onChange={e => setEditRoleValue(e.target.value as UserRole)}
                        className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs"
                      >
                        <option value="driver">Driver</option>
                        <option value="partner">Partner (CPO)</option>
                        <option value="technician">Technician</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                      {editRoleValue !== selectedUser.role && (
                        <button
                          onClick={handleUpdateRole}
                          disabled={updatingRole}
                          className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow disabled:opacity-50"
                        >
                          {updatingRole ? 'Updating...' : 'Save'}
                        </button>
                      )}
                    </div>
                    {roleMessage && (
                      <p className="text-[10px] text-emerald-400 font-semibold">{roleMessage}</p>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Account Access Status</span>
                    <span className="font-bold text-emerald-400 capitalize">{selectedUser.status || 'ACTIVE'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Onboarding Complete</span>
                    <span className="font-bold text-sky-400">{selectedUser.onboardingComplete ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Joined Date</span>
                    <span className="font-bold text-slate-300">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> Credentials Privacy Shield Active
                  </div>
                  <p>Passwords, hashes, and OAuth tokens are strictly isolated within Firebase Authentication servers. No plain text secrets are accessible to client applications.</p>
                </div>
              </div>
            )}

            {/* TAB 2: EV PROFILE */}
            {activeModalTab === 'ev' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-extrabold text-white text-sm">{selectedUser.activeVehicleName || 'Tata Nexon EV Empowered+ Lux 45'}</div>
                  <div className="text-slate-400 text-[11px]">Primary EV Profile registered to account.</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Battery Capacity</span>
                    <span className="font-bold text-white">45.0 kWh Gross</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Usable Capacity</span>
                    <span className="font-bold text-teal-400">43.2 kWh Usable</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Practical Range</span>
                    <span className="font-bold text-emerald-400">315 km Est.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">DC Fast Charge</span>
                    <span className="font-bold text-sky-400">60 kW Max</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Connectors</span>
                    <span className="font-bold text-white">CCS2, Type 2</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Rated Efficiency</span>
                    <span className="font-bold text-slate-300">130 Wh/km</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TRIP HISTORY */}
            {activeModalTab === 'trips' && (
              <div className="space-y-3 text-xs">
                {mockUserTrips.map(t => (
                  <div key={t.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-white">{t.route}</div>
                      <div className="text-[11px] text-slate-400">{t.vehicle} • {t.energyConsumed} consumed • {t.stopsCount} stop</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {t.status}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">{t.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: SERVICE REQUESTS */}
            {activeModalTab === 'service' && (
              <div className="space-y-3 text-xs">
                {loadingRequests ? (
                  <div className="py-6 text-center text-slate-400 animate-pulse">Loading service requests from Firestore...</div>
                ) : userServiceRequests.length > 0 ? (
                  userServiceRequests.map(r => (
                    <div key={r.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-white capitalize">{r.category || 'Maintenance'}</div>
                        <div className="text-[11px] text-slate-400">{r.description || 'Routine EV Maintenance'}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          {r.status}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">{new Date(r.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-500">No active VoltCare service requests for this driver.</div>
                )}
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                {(selectedUser.status || 'ACTIVE') === 'ACTIVE' ? (
                  <button
                    onClick={() => handleToggleAccountStatus(selectedUser, true)}
                    className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs shadow-md"
                  >
                    Disable Account Access
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleAccountStatus(selectedUser, false)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                  >
                    Restore Account Access
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Close Inspection
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
