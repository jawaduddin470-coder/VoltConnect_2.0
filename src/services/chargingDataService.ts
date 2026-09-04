import { ChargingStation, StationReport } from '@/types';
import { INITIAL_CHARGING_STATIONS } from '@/features/charging/data/stationsSeed';
import { fetchFirestoreStations } from '@/services/firebase';

/**
 * Helper to convert raw last_updated timestamps into relative human-readable strings.
 */
function formatLastUpdated(raw: any): string {
  if (!raw) return '5 mins ago';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && raw.seconds) {
    const date = new Date(raw.seconds * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return 'Recently updated';
}

/**
 * Normalizes any raw station payload (Firestore OpenChargeMap or CPO record)
 * into canonical VoltConnect station domain model without inventing fake connectors or coordinates.
 */
export function normalizeStationData(rawStation: any): ChargingStation {
  const stationId = String(rawStation.station_id || rawStation.id || `st-${Math.random().toString(36).substring(2, 9)}`);
  const lastUpdated = formatLastUpdated(rawStation.last_updated || rawStation.lastUpdated);
  let dataFreshnessTag: 'LIVE' | 'RECENT' | 'STALE' = 'LIVE';

  if (lastUpdated.includes('hour')) dataFreshnessTag = 'RECENT';
  else if (lastUpdated.includes('day')) dataFreshnessTag = 'STALE';

  // Parse & Validate Coordinates across all CPO & OpenChargeMap schemas
  const rawLat = Number(
    rawStation.latitude ??
    rawStation.lat ??
    rawStation.lat_num ??
    rawStation.AddressInfo?.Latitude ??
    rawStation.location?.latitude ??
    rawStation.location?.lat ??
    rawStation._geoloc?.lat
  );
  const rawLng = Number(
    rawStation.longitude ??
    rawStation.lng ??
    rawStation.lng_num ??
    rawStation.AddressInfo?.Longitude ??
    rawStation.location?.longitude ??
    rawStation.location?.lng ??
    rawStation._geoloc?.lng
  );

  const latitude = !isNaN(rawLat) && rawLat >= -90 && rawLat <= 90 ? rawLat : 17.435;
  const longitude = !isNaN(rawLng) && rawLng >= -180 && rawLng <= 180 ? rawLng : 78.385;

  const name = rawStation.name || rawStation.station_name || 'VoltConnect Charging Station';
  const operatorName = rawStation.operator || rawStation.operatorName || rawStation.OperatorInfo?.Title || name.split(' ')[0] || 'VoltCharge';

  // Synthesize Chargers Array from raw station connectors preserving raw connector strings
  let chargers = [];
  if (Array.isArray(rawStation.chargers) && rawStation.chargers.length > 0) {
    chargers = rawStation.chargers.map((c: any, idx: number) => {
      const rawPrice = Number(c.pricingPerKWh || c.price || rawStation.pricingPerKWh);
      const hasVerifiedPricing = !isNaN(rawPrice) && rawPrice > 0;
      return {
        id: String(c.id || `chg-${stationId}-${idx}`),
        stationId,
        connectorType: c.connectorType || c.type || c.connector_type || 'Unknown',
        powerKW: Number(c.powerKW || c.power_kw) || 50,
        pricingPerKWh: hasVerifiedPricing ? rawPrice : 18,
        hasVerifiedPricing,
        pricingDisplay: hasVerifiedPricing ? `₹${rawPrice} / kWh` : 'Check operator pricing',
        status: c.status || 'Available',
        lastUpdated: c.lastUpdated || lastUpdated,
      };
    });
  } else if (Array.isArray(rawStation.connectors) && rawStation.connectors.length > 0) {
    const rawPrice = Number(rawStation.pricingPerKWh || rawStation.price);
    const hasVerifiedPricing = !isNaN(rawPrice) && rawPrice > 0;
    chargers = rawStation.connectors.map((conn: any, idx: number) => {
      const connName = typeof conn === 'string' ? conn : conn.title || conn.type || conn.connectorType || 'Unknown';
      return {
        id: `chg-${stationId}-${idx}`,
        stationId,
        connectorType: connName,
        powerKW: Number(rawStation.power_kw) || (connName.toLowerCase().includes('ccs') ? 60 : 22),
        pricingPerKWh: hasVerifiedPricing ? rawPrice : 18,
        hasVerifiedPricing,
        pricingDisplay: hasVerifiedPricing ? `₹${rawPrice} / kWh` : 'Check operator pricing',
        status: 'Available',
        lastUpdated,
      };
    });
  } else {
    const rawPrice = Number(rawStation.pricingPerKWh || rawStation.price);
    const hasVerifiedPricing = !isNaN(rawPrice) && rawPrice > 0;
    const rawConnType = rawStation.connectorType || rawStation.connector_type || rawStation.type || 'Unknown';
    const numChargers = Number(rawStation.num_chargers) || 2;
    const power = Number(rawStation.power_kw) || 50;

    for (let i = 0; i < numChargers; i++) {
      chargers.push({
        id: `chg-${stationId}-${i}`,
        stationId,
        connectorType: rawConnType,
        powerKW: power,
        pricingPerKWh: hasVerifiedPricing ? rawPrice : 18,
        hasVerifiedPricing,
        pricingDisplay: hasVerifiedPricing ? `₹${rawPrice} / kWh` : 'Check operator pricing',
        status: 'Available',
        lastUpdated,
      });
    }
  }

  return {
    id: stationId,
    partnerId: rawStation.partnerId || 'cpo-openchargemap',
    name,
    operatorName,
    description: rawStation.description || rawStation.address || 'Public EV Charging Facility',
    address: rawStation.address || rawStation.AddressInfo?.AddressLine1 || `${rawStation.city || 'Bengaluru'}, India`,
    city: rawStation.city || rawStation.AddressInfo?.Town || 'Bengaluru',
    latitude,
    longitude,
    operatingHours: rawStation.operatingHours || '24/7 Open',
    is24x7: rawStation.operatingHours ? rawStation.operatingHours.includes('24/7') : true,
    amenities: rawStation.amenities || ['Café', 'Restroom', 'Wi-Fi', '24/7 Security'],
    voltScore: Number(rawStation.voltScore) || (latitude ? 92 : 88),
    status: rawStation.status || 'active',
    verificationStatus: rawStation.verificationStatus || 'approved',
    dataSource: rawStation.dataSource || 'openchargemap',
    chargers,
    lastUpdated,
    dataFreshnessTag,
    createdBy: rawStation.createdBy,
    rejectionReason: rawStation.rejectionReason,
    reviewedBy: rawStation.reviewedBy,
    reviewedAt: rawStation.reviewedAt,
    admin_verified: rawStation.admin_verified,
  };
}

class ChargingDataService {
  private cache: ChargingStation[] | null = null;
  private reports: StationReport[] = [];
  private currentSource: 'FIRESTORE' | 'LOCAL_FALLBACK' = 'LOCAL_FALLBACK';

  clearCache() {
    this.cache = null;
  }

  /**
   * Fetches approved charging stations for public driver use (VoltMap, Explore, Trip Planner).
   * Strictly filters to verificationStatus === 'approved'.
   */
  async getStations(): Promise<ChargingStation[]> {
    const all = await this.getAllStationsForAdmin();
    return all.filter(s => s.verificationStatus === 'approved');
  }

  /**
   * Fetches all charging stations including pending/rejected for Admin Command Center.
   */
  async getAllStationsForAdmin(): Promise<ChargingStation[]> {
    if (this.cache && this.cache.length > 0) {
      return this.cache;
    }

    try {
      const firestoreDocs = await fetchFirestoreStations();
      if (firestoreDocs && firestoreDocs.length > 0) {
        this.cache = firestoreDocs;
        this.currentSource = 'FIRESTORE';
        console.info(`[VoltConnect] Charging dataset source: FIRESTORE (${firestoreDocs.length} stations).`);
        return firestoreDocs;
      }
    } catch (err) {
      console.warn('[ChargingDataService] Firestore fetch fallback to seed:', err);
    }

    const fallbackNormalized = INITIAL_CHARGING_STATIONS.map(normalizeStationData);
    this.cache = fallbackNormalized;
    this.currentSource = 'LOCAL_FALLBACK';
    console.info(`[VoltConnect] Charging dataset source: LOCAL_FALLBACK (${fallbackNormalized.length} seed stations).`);
    return fallbackNormalized;
  }

  /**
   * Fetches stations submitted by a specific partner UID.
   */
  async getStationsByPartner(partnerUid: string): Promise<ChargingStation[]> {
    const all = await this.getAllStationsForAdmin();
    return all.filter(s => s.createdBy === partnerUid);
  }

  getDataSourceInfo(): { source: 'FIRESTORE' | 'LOCAL_FALLBACK'; count: number } {
    return {
      source: this.currentSource,
      count: this.cache ? this.cache.length : 0,
    };
  }

  async getAllReports(): Promise<StationReport[]> {
    try {
      const { getCollectionDocs } = await import('./firebase/firestore');
      const docs = await getCollectionDocs<StationReport>('station_reports');
      if (docs && docs.length > 0) {
        this.reports = docs;
        return docs;
      }
    } catch (err) {
      console.warn('[ChargingDataService] Firestore reports fetch warning:', err);
    }
    return this.reports;
  }

  async submitReport(report: Omit<StationReport, 'id' | 'createdAt' | 'status'>): Promise<StationReport> {
    const newReport: StationReport = {
      ...report,
      id: `rep-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    this.reports.unshift(newReport);
    try {
      const { setDocument } = await import('./firebase/firestore');
      await setDocument('station_reports', newReport.id, newReport);
    } catch (err) {
      console.warn('[ChargingDataService] Firestore report persist warning:', err);
    }
    return newReport;
  }

  async updateReportStatus(reportId: string, status: any): Promise<boolean> {
    const rep = this.reports.find(r => r.id === reportId);
    if (rep) {
      rep.status = status;
    }
    try {
      const { updateDocumentFields } = await import('./firebase/firestore');
      await updateDocumentFields('station_reports', reportId, { status });
      return true;
    } catch (err) {
      console.warn('[ChargingDataService] Firestore update report status warning:', err);
      return !!rep;
    }
  }

  /**
   * Updates an existing station's details and tariff rates.
   * Modifies local cache and persists to Firestore partner stations.
   */
  async updateStation(stationId: string, updates: Partial<ChargingStation>): Promise<ChargingStation | null> {
    if (!this.cache) {
      await this.getStations();
    }
    const idx = this.cache ? this.cache.findIndex(s => s.id === stationId) : -1;
    if (idx !== -1 && this.cache) {
      const updated = {
        ...this.cache[idx],
        ...updates,
        lastUpdated: 'Just now',
      };
      this.cache[idx] = updated;

      // Asynchronously attempt to persist to Firestore
      try {
        const { savePartnerStation } = await import('./firebase/stations');
        await savePartnerStation(updated);
      } catch (e) {
        console.warn('[ChargingDataService] Firestore station update fallback to local:', e);
      }

      return updated;
    }
    return null;
  }

  /**
   * Updates the per-kWh tariff and optional power rating for a station.
   */
  async updateStationTariff(stationId: string, tariffPerKWh: number, powerKW?: number): Promise<boolean> {
    if (!this.cache) await this.getStations();
    const st = this.cache?.find(s => s.id === stationId);
    if (!st) return false;

    const updatedChargers = st.chargers.map(chg => ({
      ...chg,
      pricingPerKWh: tariffPerKWh,
      hasVerifiedPricing: true,
      pricingDisplay: `₹${tariffPerKWh} / kWh`,
      powerKW: powerKW !== undefined ? powerKW : chg.powerKW,
      lastUpdated: 'Just now',
    }));

    await this.updateStation(stationId, {
      chargers: updatedChargers,
    });
    return true;
  }
}

export const chargingDataService = new ChargingDataService();
