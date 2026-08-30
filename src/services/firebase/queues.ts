import { StationReport, ServiceRequest } from '@/types';
import { getCollectionDocs, setDocument, updateDocumentFields, listenToCollection } from './firestore';
import { where } from 'firebase/firestore';

const REPORTS_COLLECTION = 'station_reports';
const SERVICE_REQUESTS_COLLECTION = 'service_requests';

/**
 * Station Issue Reports Queue Operations
 */
export async function fetchStationReports(stationId?: string): Promise<StationReport[]> {
  const constraints = stationId ? [where('stationId', '==', stationId)] : [];
  return getCollectionDocs<StationReport>(REPORTS_COLLECTION, constraints);
}

export async function submitStationReportDoc(report: StationReport): Promise<boolean> {
  return setDocument(REPORTS_COLLECTION, report.id, report);
}

export async function updateReportStatusDoc(reportId: string, status: StationReport['status']): Promise<boolean> {
  return updateDocumentFields(REPORTS_COLLECTION, reportId, { status, updatedAt: new Date().toISOString() });
}

/**
 * Service Requests Dispatch Queue Operations
 */
export async function fetchUserServiceRequests(userId?: string): Promise<ServiceRequest[]> {
  const constraints = userId ? [where('userId', '==', userId)] : [];
  return getCollectionDocs<ServiceRequest>(SERVICE_REQUESTS_COLLECTION, constraints);
}

export async function createServiceRequestDoc(req: ServiceRequest): Promise<boolean> {
  return setDocument(SERVICE_REQUESTS_COLLECTION, req.id, req);
}

export async function updateServiceRequestStatusDoc(requestId: string, status: ServiceRequest['status']): Promise<boolean> {
  return updateDocumentFields(SERVICE_REQUESTS_COLLECTION, requestId, {
    status,
    updatedAt: new Date().toISOString(),
    ...(status === 'COMPLETED' ? { completedAt: new Date().toISOString() } : {}),
  });
}
