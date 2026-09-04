import {
  AuditLog,
  ChargingStation,
  PartnerApplication,
  ServicePartner,
  ServiceRequest,
  TechnicianProfile,
  DataQualityIssue,
  UserRole,
} from '@/types';

class OperationsService {
  private auditLogs: AuditLog[] = [
    {
      id: 'audit-101',
      actorId: 'admin-01',
      actorEmail: 'admin@voltconnect.io',
      actorRole: 'admin',
      action: 'SYSTEM_BOOT',
      targetCollection: 'system',
      targetId: 'sys-01',
      details: { message: 'Operational Command Center Initialized' },
      timestamp: new Date().toISOString(),
    },
  ];

  private partnerApplications: PartnerApplication[] = [];
  private pendingStations: ChargingStation[] = [];
  private technicians: TechnicianProfile[] = [];

  /**
   * Logs a centralized administrative audit event.
   */
  logAuditEvent(
    actorId: string,
    actorEmail: string,
    actorRole: UserRole,
    action: string,
    targetCollection: string,
    targetId: string,
    details: Record<string, any> = {},
    previousValue?: any,
    newValue?: any
  ): AuditLog {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actorId,
      actorEmail,
      actorRole,
      action,
      targetCollection,
      targetId,
      resourceType: targetCollection,
      resourceId: targetId,
      previousValue,
      newValue,
      details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);

    // Asynchronously save append-only record to Cloud Firestore
    import('./firebase/firestore').then(({ setDocument }) => {
      setDocument('admin_audit_logs', log.id, log).catch(err =>
        console.warn('[OperationsService] Audit log persist warning:', err)
      );
    });

    return log;
  }

  /**
   * Retrieves central audit logs for Admin inspection from Firestore admin_audit_logs.
   */
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const { getCollectionDocs } = await import('./firebase/firestore');
      const docs = await getCollectionDocs<AuditLog>('admin_audit_logs');
      if (docs && docs.length > 0) {
        return docs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
    } catch {
      // Fallback local memory stream
    }
    return this.auditLogs;
  }

  /**
   * Submits a partner station for Admin approval review and persists to Firestore.
   */
  async submitStationForApproval(
    station: Omit<ChargingStation, 'id' | 'verificationStatus' | 'lastUpdated'> & { id?: string }
  ): Promise<ChargingStation> {
    const stationId = station.id || `st-partner-${Date.now()}`;
    const pendingStation: ChargingStation = {
      ...station,
      id: stationId,
      verificationStatus: 'pending',
      lastUpdated: new Date().toISOString(),
    };
    this.pendingStations.unshift(pendingStation);

    try {
      const { setDocument } = await import('./firebase/firestore');
      await setDocument('stations', pendingStation.id, pendingStation);
    } catch (err) {
      console.warn('[OperationsService] Failed to persist pending station to Firestore:', err);
    }

    return pendingStation;
  }

  /**
   * Retrieves stations pending admin verification approval.
   */
  async getPendingStations(): Promise<ChargingStation[]> {
    try {
      const { fetchFirestoreStations } = await import('./firebase/stations');
      const all = await fetchFirestoreStations();
      const pending = all.filter(s => s.verificationStatus === 'pending');
      if (pending.length > 0) return pending;
    } catch (err) {
      console.warn('[OperationsService] Firestore pending stations query error:', err);
    }
    return this.pendingStations.filter(s => s.verificationStatus === 'pending');
  }

  /**
   * Approves or rejects a partner station submission with Firestore persistence and audit trail.
   */
  async reviewStation(
    stationId: string,
    status: 'approved' | 'rejected',
    reviewerId: string,
    reviewerEmail: string,
    rejectionReason?: string
  ): Promise<boolean> {
    const updateData: Partial<ChargingStation> = {
      verificationStatus: status,
      reviewedBy: reviewerId,
      reviewedAt: new Date().toISOString(),
      admin_verified: status === 'approved',
      rejectionReason: status === 'rejected' ? rejectionReason || 'Station does not meet verification guidelines' : undefined,
      lastUpdated: new Date().toISOString(),
    };

    const st = this.pendingStations.find(s => s.id === stationId);
    if (st) {
      Object.assign(st, updateData);
    }

    try {
      const { updateDocumentFields } = await import('./firebase/firestore');
      await updateDocumentFields('stations', stationId, updateData);
    } catch (err) {
      console.warn('[OperationsService] Failed to persist station review to Firestore:', err);
    }

    this.logAuditEvent(
      reviewerId,
      reviewerEmail,
      'admin',
      `STATION_${status.toUpperCase()}`,
      'stations',
      stationId,
      {
        status,
        rejectionReason: updateData.rejectionReason,
        stationName: st?.name,
      }
    );

    return true;
  }

  /**
   * Submits a new partner onboarding application.
   */
  async submitPartnerApplication(appData: Omit<PartnerApplication, 'id' | 'status' | 'submittedAt'>): Promise<PartnerApplication> {
    const app: PartnerApplication = {
      ...appData,
      id: `partner-app-${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    this.partnerApplications.push(app);
    return app;
  }

  /**
   * Retrieves pending partner applications.
   */
  async getPartnerApplications(): Promise<PartnerApplication[]> {
    return this.partnerApplications;
  }

  /**
   * Evaluates data quality issues across stations.
   */
  async runDataQualityAudit(stations: ChargingStation[]): Promise<DataQualityIssue[]> {
    const issues: DataQualityIssue[] = [];

    stations.forEach(s => {
      if (!s.latitude || !s.longitude) {
        issues.push({
          id: `dq-${s.id}-1`,
          targetType: 'station',
          targetId: s.id,
          issueType: 'missing_coordinates',
          severity: 'high',
          description: `Station '${s.name}' lacks valid GPS coordinates.`,
          createdAt: new Date().toISOString(),
        });
      }

      if (s.dataSource === 'simulated') {
        issues.push({
          id: `dq-${s.id}-2`,
          targetType: 'station',
          targetId: s.id,
          issueType: 'stale_status',
          severity: 'low',
          description: `Station '${s.name}' uses simulated data source. Hardware API connection recommended.`,
          createdAt: new Date().toISOString(),
        });
      }
    });

    return issues;
  }
}

export const operationsService = new OperationsService();
