import { ServiceRequest, ServicePartner, ServiceQuote, ServiceRequestStatus } from '@/types';
import { createServiceRequestDoc, fetchUserServiceRequests, updateServiceRequestStatusDoc } from './firebase/queues';

class VoltCareService {
  private serviceRequests: ServiceRequest[] = [];
  private verifiedPartners: ServicePartner[] = []; // Intentionally empty by default for honest empty state

  /**
   * Submits a new driver service request and stores it in Cloud Firestore.
   */
  async createServiceRequest(
    requestData: Omit<ServiceRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<ServiceRequest> {
    const newReq: ServiceRequest = {
      ...requestData,
      id: `req-${Date.now()}`,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to Firestore service_requests collection
    try {
      await createServiceRequestDoc(newReq);
    } catch (e) {
      console.warn('Firestore service request save warning, using local state:', e);
    }

    this.serviceRequests.unshift(newReq);
    return newReq;
  }

  /**
   * Retrieves all service requests created by a specific user from Firestore.
   */
  async getUserServiceRequests(userId?: string): Promise<ServiceRequest[]> {
    try {
      const firestoreRequests = await fetchUserServiceRequests(userId);
      if (firestoreRequests && firestoreRequests.length > 0) {
        this.serviceRequests = firestoreRequests;
        return firestoreRequests;
      }
    } catch (e) {
      console.warn('Firestore service requests fetch warning, using local state:', e);
    }

    if (!userId) return this.serviceRequests;
    return this.serviceRequests.filter(r => r.userId === userId);
  }

  /**
   * Updates status of a service request in Firestore & memory.
   */
  async updateServiceRequestStatus(requestId: string, newStatus: ServiceRequestStatus): Promise<boolean> {
    try {
      await updateServiceRequestStatusDoc(requestId, newStatus);
    } catch (e) {
      console.warn('Firestore service request status update warning:', e);
    }

    const req = this.serviceRequests.find(r => r.id === requestId);
    if (req) {
      req.status = newStatus;
      req.updatedAt = new Date().toISOString();
      if (newStatus === 'COMPLETED') {
        req.completedAt = new Date().toISOString();
      }
      return true;
    }
    return false;
  }

  /**
   * Cancels an active service request in Firestore if allowed by state machine.
   */
  async cancelServiceRequest(requestId: string): Promise<boolean> {
    const req = this.serviceRequests.find(r => r.id === requestId);
    if (req && (req.status === 'SUBMITTED' || req.status === 'UNDER_REVIEW' || req.status === 'MATCHING')) {
      req.status = 'CANCELLED';
      req.updatedAt = new Date().toISOString();

      try {
        await updateServiceRequestStatusDoc(requestId, 'CANCELLED');
      } catch (e) {
        console.warn('Firestore cancel service request warning:', e);
      }
      return true;
    }
    return false;
  }

  /**
   * Discovers verified service partners or returns empty list for honest UI empty state.
   */
  async getVerifiedPartners(): Promise<ServicePartner[]> {
    return this.verifiedPartners;
  }
}

export const voltCareService = new VoltCareService();
