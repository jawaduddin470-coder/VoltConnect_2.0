import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { voltCareService } from '@/services/voltCareService';
import { ServiceRequest, ServiceRequestStatus } from '@/types';
import {
  Wrench,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  Send,
  UserCheck,
  AlertTriangle,
  Navigation,
  Check,
  ArrowRight,
  ShieldCheck,
  Activity,
  CheckCircle,
} from 'lucide-react';

export const TechnicianDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'active' | 'history'>('tasks');

  // Real Service Requests State
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedTask, setSelectedTask] = useState<ServiceRequest | null>(null);

  // Field Diagnosis & Resolution State
  const [diagnosisNotes, setDiagnosisNotes] = useState('');
  const [workAction, setWorkAction] = useState<'Inspection' | 'Coolant Flush' | 'Brake Check' | 'Software Update' | 'Connector Repair'>('Inspection');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    voltCareService.getUserServiceRequests(user?.uid).then(data => {
      if (data.length === 0) {
        // Sample assigned field dispatch
        const sample: ServiceRequest = {
          id: 'sr-tech-101',
          userId: 'demo-driver-101',
          vehicleId: 'veh-01',
          category: 'charging_issue',
          description: 'CCS2 connector charging latch failure during DC fast charging session.',
          preferredDate: '2026-08-22',
          preferredLocationType: 'home_service',
          priority: 'HIGH',
          status: 'ASSIGNED',
          assignedTechnicianId: 'tech-ramesh-101',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setRequests([sample]);
        setSelectedTask(sample);
      } else {
        setRequests(data);
        if (!selectedTask && data.length > 0) setSelectedTask(data[0]);
      }
    });
  }, [user]);

  const handleUpdateStatus = async (taskId: string, newStatus: ServiceRequestStatus) => {
    setSubmitting(true);
    await voltCareService.updateServiceRequestStatus(taskId, newStatus);
    setRequests(prev =>
      prev.map(r => (r.id === taskId ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r))
    );
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(prev => (prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : null));
    }
    setSubmitting(false);
  };

  const handleResolveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setSubmitting(true);

    await voltCareService.updateServiceRequestStatus(selectedTask.id, 'COMPLETED');
    setRequests(prev =>
      prev.map(r => (r.id === selectedTask.id ? { ...r, status: 'COMPLETED', updatedAt: new Date().toISOString() } : r))
    );
    setSelectedTask(prev => (prev ? { ...prev, status: 'COMPLETED', updatedAt: new Date().toISOString() } : null));
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      
      {/* 1. MOBILE-FIRST TECHNICIAN HEADER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="vc-badge vc-badge-amber text-[9px] font-bold uppercase">FIELD DISPATCH WORKSPACE</span>
            <span className="text-[10px] text-slate-400">Technician: Ramesh Kumar</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold">Field Service Workload</h1>
          <p className="text-xs text-slate-300">
            Accept dispatches, diagnose issues, record work logs, and update service status in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-700 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>ON-DUTY ACTIVE</span>
        </div>
      </div>

      {/* 2. TECHNICIAN WORKSPACE TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'tasks' ? 'bg-navy-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Assigned Tasks ({requests.filter(r => r.status !== 'COMPLETED').length})
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'active' ? 'bg-navy-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Active Task Workspace
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'history' ? 'bg-navy-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Completed History ({requests.filter(r => r.status === 'COMPLETED').length})
        </button>
      </div>

      {/* 3. ASSIGNED TASKS QUEUE */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dispatched Service Tasks</div>

          {requests.filter(r => r.status !== 'COMPLETED').length === 0 ? (
            <div className="vc-card p-12 text-center space-y-3 bg-white border border-slate-200">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-heading font-extrabold text-base text-navy-900">No Pending Service Dispatches</div>
              <p className="text-xs text-slate-500">All assigned field service tasks have been completed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.filter(r => r.status !== 'COMPLETED').map(req => (
                <div key={req.id} className="vc-card p-5 bg-white border border-slate-200 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="vc-badge vc-badge-amber text-[9px] uppercase font-bold">
                        {req.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">Priority: {req.priority}</span>
                    </div>
                    <span className="vc-badge vc-badge-sky text-[9px] font-bold uppercase">{req.status}</span>
                  </div>

                  <div>
                    <h3 className="font-heading font-extrabold text-sm text-navy-900">{req.description}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Gachibowli EV Hub, Hyderabad
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedTask(req);
                        setActiveTab('active');
                      }}
                      className="vc-btn vc-btn-teal text-xs font-bold py-1.5 px-4 flex items-center gap-1"
                    >
                      Open Task Workspace <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. ACTIVE TASK WORKSPACE */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {!selectedTask ? (
            <div className="vc-card p-12 text-center space-y-3 bg-white border border-slate-200">
              <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-heading font-extrabold text-base text-navy-900">Select a Task</div>
              <p className="text-xs text-slate-500">Please select an assigned task from the workload list to open the workspace.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Task Header */}
              <div className="vc-card p-6 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="vc-badge vc-badge-amber text-[9px] uppercase font-bold">
                    TASK ID: {selectedTask.id}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Assigned Technician: Ramesh Kumar</span>
                </div>
                <h2 className="font-heading font-extrabold text-lg text-navy-900">{selectedTask.description}</h2>
                <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Gachibowli EV Hub, Hyderabad
                </p>
              </div>

              {/* Visual State Machine Workflow Timeline */}
              <div className="vc-card p-6 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Live Dispatch State Workflow
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                  <button
                    onClick={() => handleUpdateStatus(selectedTask.id, 'ASSIGNED')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      selectedTask.status === 'ASSIGNED'
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="block text-[9px] text-slate-400 uppercase">STEP 1</span>
                    <span>ASSIGNED</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedTask.id, 'SCHEDULED')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      selectedTask.status === 'SCHEDULED'
                        ? 'bg-sky-50 border-sky-300 text-sky-900'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="block text-[9px] text-slate-400 uppercase">STEP 2</span>
                    <span>SCHEDULED</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedTask.id, 'IN_PROGRESS')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      selectedTask.status === 'IN_PROGRESS'
                        ? 'bg-teal-50 border-teal-300 text-teal-900'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="block text-[9px] text-slate-400 uppercase">STEP 3</span>
                    <span>IN PROGRESS</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedTask.id, 'COMPLETED')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      selectedTask.status === 'COMPLETED'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="block text-[9px] text-slate-400 uppercase">STEP 4</span>
                    <span>COMPLETED</span>
                  </button>
                </div>
              </div>

              {/* Location Directions Action Card */}
              <div className="vc-card p-5 bg-white border border-slate-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Location</div>
                  <div className="font-heading font-extrabold text-sm text-navy-900 mt-0.5">Gachibowli EV Hub, Hyderabad</div>
                </div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent('Gachibowli EV Hub, Hyderabad')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vc-btn vc-btn-sky text-xs font-bold py-2 px-4 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                >
                  <Navigation className="w-3.5 h-3.5" /> Navigate in Google Maps
                </a>
              </div>

              {/* Work Log & Resolution Submission Form */}
              <div className="vc-card p-6 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-xs">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Field Diagnosis & Action Log</span>
                  <h3 className="font-heading font-extrabold text-base text-navy-900">Record Field Service Work</h3>
                </div>

                <form onSubmit={handleResolveTask} className="space-y-4 text-xs font-bold">
                  <div className="space-y-1">
                    <label className="text-slate-700">Action Performed</label>
                    <select
                      value={workAction}
                      onChange={e => setWorkAction(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-navy-900 bg-slate-50"
                    >
                      <option value="Inspection">Periodic Health & Safety Inspection</option>
                      <option value="Coolant Flush">Battery Thermal Coolant Flush & Refill</option>
                      <option value="Brake Check">Braking Fluid & Regenerative Sensor Check</option>
                      <option value="Software Update">BMS ECU Firmware Calibration Update</option>
                      <option value="Connector Repair">CCS2 Charging Connector Latch Repair</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700">Technician Diagnosis Notes</label>
                    <textarea
                      value={diagnosisNotes}
                      onChange={e => setDiagnosisNotes(e.target.value)}
                      placeholder="Enter observed root cause, diagnostic findings, and hardware checks..."
                      rows={3}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-navy-900 bg-slate-50 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="vc-btn vc-btn-teal py-3 px-6 text-xs font-extrabold flex items-center gap-1.5 shadow-md"
                    >
                      <CheckCircle className="w-4 h-4" /> MARK RESOLVED & UPDATE WORK LOG
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}
        </div>
      )}

      {/* 5. COMPLETED TASK HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Completed Work Logs</div>

          {requests.filter(r => r.status === 'COMPLETED').length === 0 ? (
            <div className="vc-card p-12 text-center space-y-3 bg-white border border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="font-heading font-extrabold text-base text-navy-900">No Completed Service Tasks Yet</div>
              <p className="text-xs text-slate-500">Completed field service tasks will be recorded here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.filter(r => r.status === 'COMPLETED').map(req => (
                <div key={req.id} className="vc-card p-5 bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="vc-badge vc-badge-green text-[9px] uppercase font-bold">COMPLETED</span>
                    <span className="text-[10px] text-slate-400">Completed: {req.updatedAt}</span>
                  </div>
                  <h3 className="font-heading font-extrabold text-sm text-navy-900">{req.description}</h3>
                  <p className="text-xs text-slate-500 font-medium">Gachibowli EV Hub, Hyderabad</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
