import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { operationsService } from '@/services/operationsService';
import { getCollectionDocs, setDocument, updateDocumentFields } from '@/services/firebase/firestore';
import { adminCreatePartnerAccount } from '@/services/firebase/users';
import { ServicePartner, PartnerApplication, TechnicianProfile } from '@/types';
import {
  Building2,
  Search,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Zap,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  RotateCcw,
  Wrench,
  UserCheck,
  Globe,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

interface ManagedPartner {
  id: string;
  name: string;
  partnerType: 'cpo' | 'service_partner';
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  stationsCount?: number;
  techniciansCount?: number;
  verificationStatus: 'approved' | 'pending' | 'rejected';
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

interface ManagedTechnician {
  id: string;
  partnerId: string;
  partnerName: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  assignedRegion: string;
  activeJobs: number;
  status: 'AVAILABLE' | 'ON_CALL' | 'INACTIVE';
}

export const AdminPartnersView: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [partners, setPartners] = useState<ManagedPartner[]>([]);
  const [technicians, setTechnicians] = useState<ManagedTechnician[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedVerification, setSelectedVerification] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Active Tab: 'partners' | 'technicians'
  const [activeSubTab, setActiveSubTab] = useState<'partners' | 'technicians'>('partners');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Modal State
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerType, setPartnerType] = useState<'cpo' | 'service_partner'>('cpo');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [password, setPassword] = useState('Partner@123');
  const [partnerSubmitting, setPartnerSubmitting] = useState(false);
  const [partnerError, setPartnerError] = useState<string | null>(null);
  const [partnerSuccess, setPartnerSuccess] = useState<string | null>(null);

  const loadPartnerData = async () => {
    setLoading(true);

    try {
      const docs = await getCollectionDocs<ManagedPartner>('voltconnect_partners');
      if (docs && docs.length > 0) {
        setPartners(docs);
      } else {
        // Fallback Seed List for CPOs and Service Partners
        const seedPartners: ManagedPartner[] = [
          {
            id: 'cpo-tata-power',
            name: 'Tata Power EV Charging Network',
            partnerType: 'cpo',
            contactPerson: 'Rajesh Sharma',
            email: 'evsupport@tatapower.com',
            phone: '+91 1800 209 5161',
            city: 'Pan-India',
            stationsCount: 42,
            verificationStatus: 'approved',
            status: 'ACTIVE',
            createdAt: '2026-03-01T10:00:00Z',
          },
          {
            id: 'cpo-zeon-charge',
            name: 'Zeon Charge Network',
            partnerType: 'cpo',
            contactPerson: 'Karthik Raja',
            email: 'support@zeoncharge.com',
            phone: '+91 98765 43210',
            city: 'Bengaluru',
            stationsCount: 18,
            verificationStatus: 'approved',
            status: 'ACTIVE',
            createdAt: '2026-04-12T11:00:00Z',
          },
          {
            id: 'cpo-statiq',
            name: 'Statiq EV Infra',
            partnerType: 'cpo',
            contactPerson: 'Akshit Bansal',
            email: 'ops@statiq.in',
            phone: '+91 88000 11223',
            city: 'Hyderabad',
            stationsCount: 14,
            verificationStatus: 'approved',
            status: 'ACTIVE',
            createdAt: '2026-05-02T14:00:00Z',
          },
          {
            id: 'sp-voltcare-hyd',
            name: 'VoltCare Certified Hub Hyderabad',
            partnerType: 'service_partner',
            contactPerson: 'Srinivas Rao',
            email: 'hyd-service@voltcare.in',
            phone: '+91 94400 55667',
            city: 'Hyderabad',
            techniciansCount: 6,
            verificationStatus: 'approved',
            status: 'ACTIVE',
            createdAt: '2026-05-20T09:00:00Z',
          },
          {
            id: 'sp-gomechanic-ev',
            name: 'GoMechanic EV Care Hub',
            partnerType: 'service_partner',
            contactPerson: 'Amitabh Verma',
            email: 'ev.service@gomechanic.in',
            phone: '+91 99999 88888',
            city: 'Vijayawada',
            techniciansCount: 4,
            verificationStatus: 'pending',
            status: 'ACTIVE',
            createdAt: '2026-07-01T15:30:00Z',
          },
        ];
        setPartners(seedPartners);
      }
    } catch {
      setPartners([]);
    }

    // Seed Technicians List
    const seedTechnicians: ManagedTechnician[] = [
      {
        id: 'tech-001',
        partnerId: 'sp-voltcare-hyd',
        partnerName: 'VoltCare Certified Hub Hyderabad',
        name: 'Vikram Singh',
        email: 'vikram.tech@voltcare.in',
        phone: '+91 98888 77771',
        specialization: 'High-Voltage Battery & BMS Specialist',
        assignedRegion: 'Hyderabad Central',
        activeJobs: 1,
        status: 'ON_CALL',
      },
      {
        id: 'tech-002',
        partnerId: 'sp-voltcare-hyd',
        partnerName: 'VoltCare Certified Hub Hyderabad',
        name: 'Praveen Reddy',
        email: 'praveen.r@voltcare.in',
        phone: '+91 98888 77772',
        specialization: 'DC Fast Charger & Inverter Diagnostics',
        assignedRegion: 'Cyberabad / Gachibowli',
        activeJobs: 0,
        status: 'AVAILABLE',
      },
      {
        id: 'tech-003',
        partnerId: 'sp-gomechanic-ev',
        partnerName: 'GoMechanic EV Care Hub',
        name: 'Suresh Kumar',
        email: 'suresh.k@gomechanic.in',
        phone: '+91 97777 66663',
        specialization: 'Thermal Management & Motor Controller',
        assignedRegion: 'Vijayawada Highway Sector',
        activeJobs: 0,
        status: 'AVAILABLE',
      },
    ];
    setTechnicians(seedTechnicians);
    setLoading(false);
  };

  useEffect(() => {
    loadPartnerData();
  }, []);

  // Filter & Search Logic
  const filteredPartners = partners.filter(p => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchPerson = p.contactPerson.toLowerCase().includes(q);
      const matchCity = p.city.toLowerCase().includes(q);
      if (!matchName && !matchPerson && !matchCity) return false;
    }

    if (selectedType !== 'ALL' && p.partnerType !== selectedType) return false;
    if (selectedVerification !== 'ALL' && p.verificationStatus !== selectedVerification) return false;
    if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false;

    return true;
  });

  const totalPages = Math.ceil(filteredPartners.length / PAGE_SIZE) || 1;
  const paginatedPartners = filteredPartners.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Actions
  const handleVerifyPartner = async (partner: ManagedPartner, verify: boolean) => {
    if (!currentAdmin) return;
    const newVerification = verify ? 'approved' : 'pending';
    const updated: ManagedPartner = { ...partner, verificationStatus: newVerification };

    await setDocument('voltconnect_partners', partner.id, updated);
    operationsService.logAuditEvent(
      currentAdmin.uid,
      currentAdmin.email,
      currentAdmin.role,
      verify ? 'ADMIN_VERIFY_PARTNER' : 'ADMIN_UNVERIFY_PARTNER',
      'voltconnect_partners',
      partner.id,
      { partnerName: partner.name, newVerification }
    );

    setPartners(prev => prev.map(p => (p.id === partner.id ? updated : p)));
  };

  const handleTogglePartnerStatus = async (partner: ManagedPartner, disable: boolean) => {
    if (!currentAdmin) return;
    const newStatus = disable ? 'SUSPENDED' : 'ACTIVE';
    const updated: ManagedPartner = { ...partner, status: newStatus };

    await setDocument('voltconnect_partners', partner.id, updated);
    operationsService.logAuditEvent(
      currentAdmin.uid,
      currentAdmin.email,
      currentAdmin.role,
      disable ? 'ADMIN_SUSPEND_PARTNER' : 'ADMIN_RESTORE_PARTNER',
      'voltconnect_partners',
      partner.id,
      { partnerName: partner.name, newStatus }
    );

    setPartners(prev => prev.map(p => (p.id === partner.id ? updated : p)));
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin || !partnerName.trim() || !email.trim() || !password.trim()) return;

    setPartnerSubmitting(true);
    setPartnerError(null);
    setPartnerSuccess(null);

    try {
      // 1. Provision real Firebase Auth credentials & profile
      const newProfile = await adminCreatePartnerAccount({
        email: email.trim(),
        password: password.trim(),
        name: contactPerson.trim() || partnerName.trim(),
        companyName: partnerName.trim(),
        phone: phone.trim(),
        createdByAdminUid: currentAdmin.uid,
      });

      // 2. Also register in local state / table
      const newPartner: ManagedPartner = {
        id: newProfile.uid,
        name: partnerName.trim(),
        partnerType,
        contactPerson: contactPerson.trim() || partnerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: city.trim() || 'Pan-India',
        stationsCount: 0,
        verificationStatus: 'approved',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      setPartners(prev => [newPartner, ...prev]);
      setPartnerSuccess(`Partner account created successfully! Login: ${email.trim()}`);
      setTimeout(() => {
        setShowAddPartnerModal(false);
        setPartnerName('');
        setEmail('');
        setPassword('Partner@123');
        setContactPerson('');
        setPhone('');
        setPartnerSuccess(null);
        setPartnerError(null);
      }, 1200);
    } catch (err: any) {
      console.error('Failed to create partner account:', err);
      setPartnerError(err?.message || 'Failed to create partner account.');
    } finally {
      setPartnerSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 vc-page-enter">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="vc-badge vc-badge-sky text-[10px] uppercase font-bold">ECOSYSTEM GOVERNANCE</span>
            <span className="text-xs text-slate-400 font-semibold">FIRESTORE COLLECTION: "voltconnect_partners"</span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Partner & Technician Governance
          </h1>
          <p className="text-xs text-slate-400">
            Manage CPO charging operators, certified service partners, technicians, and verification workflows.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddPartnerModal(true)}
            className="vc-btn vc-btn-teal py-2.5 px-4 text-xs font-extrabold flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Partner Hub
          </button>
        </div>
      </div>

      {/* SUB-TABS: PARTNERS vs TECHNICIANS */}
      <div className="flex border-b border-slate-800 space-x-4 text-xs font-extrabold">
        <button
          onClick={() => setActiveSubTab('partners')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === 'partners' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" /> CPO & Service Partners ({partners.length})
        </button>

        <button
          onClick={() => setActiveSubTab('technicians')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === 'technicians' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Wrench className="w-4 h-4" /> Certified Technicians ({technicians.length})
        </button>
      </div>

      {activeSubTab === 'partners' ? (
        <>
          {/* SEARCH & FILTERS */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search partner name, contact person, or city..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <select
                value={selectedType}
                onChange={e => { setSelectedType(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
              >
                <option value="ALL">Partner Type: All</option>
                <option value="cpo">CPO Charging Operator</option>
                <option value="service_partner">Service Partner Hub</option>
              </select>

              <select
                value={selectedVerification}
                onChange={e => { setSelectedVerification(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
              >
                <option value="ALL">Verification: All</option>
                <option value="approved">Approved & Verified</option>
                <option value="pending">Pending Verification</option>
              </select>

              <select
                value={selectedStatus}
                onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold focus:outline-none"
              >
                <option value="ALL">Status: All</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          {/* PARTNERS TABLE */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2 animate-pulse">
                <Building2 className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
                <div>Loading partners from Cloud Firestore...</div>
              </div>
            ) : paginatedPartners.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">
                      <th className="py-3 px-3">Partner Organization</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Contact Person</th>
                      <th className="py-3 px-3">Email & Phone</th>
                      <th className="py-3 px-3">City Region</th>
                      <th className="py-3 px-3">Verification</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {paginatedPartners.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-white">{p.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{p.id}</div>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            p.partnerType === 'cpo' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          }`}>
                            {p.partnerType === 'cpo' ? 'CPO OPERATOR' : 'SERVICE HUB'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-slate-300 font-semibold">{p.contactPerson}</td>

                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          <div>{p.email}</div>
                          <div className="text-[10px] font-mono text-slate-500">{p.phone}</div>
                        </td>

                        <td className="py-3 px-3 font-semibold text-slate-300">{p.city}</td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            p.verificationStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {p.verificationStatus}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            p.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {p.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right space-x-1 shrink-0">
                          {p.verificationStatus !== 'approved' ? (
                            <button
                              onClick={() => handleVerifyPartner(p, true)}
                              className="px-2 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-[10px]"
                              title="Approve Partner Verification"
                            >
                              Approve
                            </button>
                          ) : (
                            <button
                              onClick={() => handleVerifyPartner(p, false)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-600 text-amber-300 font-bold text-[10px]"
                              title="Unverify Partner"
                            >
                              Unverify
                            </button>
                          )}

                          {p.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleTogglePartnerStatus(p, true)}
                              className="px-2 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-[10px]"
                              title="Suspend Partner Access"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTogglePartnerStatus(p, false)}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                              title="Restore Partner Access"
                            >
                              Restore
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 space-y-1">
                <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="font-bold text-slate-300">No partners match criteria</div>
                <p className="text-[11px]">Adjust your search query or reset filters.</p>
              </div>
            )}

            {/* PAGINATION BAR */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
              <div className="text-slate-400">
                Showing Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages}</span> ({filteredPartners.length} total partners)
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
        </>
      ) : (
        /* TECHNICIANS TABLE */
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-extrabold tracking-wider">
                  <th className="py-3 px-3">Technician Name</th>
                  <th className="py-3 px-3">Service Partner Hub</th>
                  <th className="py-3 px-3">Technical Specialization</th>
                  <th className="py-3 px-3">Assigned Region</th>
                  <th className="py-3 px-3">Active Jobs</th>
                  <th className="py-3 px-3">Duty Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {technicians.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-white">{t.name}</div>
                      <div className="text-[10px] text-slate-400">{t.email} • {t.phone}</div>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-300">{t.partnerName}</td>

                    <td className="py-3 px-3 font-semibold text-sky-400">{t.specialization}</td>

                    <td className="py-3 px-3 text-slate-300 font-semibold">{t.assignedRegion}</td>

                    <td className="py-3 px-3 font-bold text-white">{t.activeJobs} Tickets</td>

                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        t.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD PARTNER MODAL */}
      {showAddPartnerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-heading font-extrabold text-base text-white">Register Partner Hub</h3>
              <button onClick={() => setShowAddPartnerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePartner} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Partner Organization Name</label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={e => setPartnerName(e.target.value)}
                  placeholder="e.g. Jio-bp Pulse, GoMechanic EV Hub..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Partner Category</label>
                  <select
                    value={partnerType}
                    onChange={e => setPartnerType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                  >
                    <option value="cpo">CPO Charging Operator</option>
                    <option value="service_partner">Service Partner Hub</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Primary City Region</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Contact Person Name</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Contact Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="partner@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Initial Login Password</label>
                <input
                  type="text"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white text-xs"
                  required
                  minLength={6}
                />
                <p className="text-[10px] text-slate-400">
                  This sets the partner's initial credentials for login at /partner/dashboard.
                </p>
              </div>

              {partnerError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                  {partnerError}
                </div>
              )}

              {partnerSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  {partnerSuccess}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPartnerModal(false)}
                  disabled={partnerSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={partnerSubmitting}
                  className="px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-xs hover:bg-sky-400 shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {partnerSubmitting ? 'Provisioning Account...' : 'Register Partner & Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
