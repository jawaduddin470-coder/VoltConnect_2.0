/* ==========================================================================
   VOLTCONNECT 2.0 — GLOBAL TYPESCRIPT DEFINITIONS
   ========================================================================== */

export type UserRole = 'driver' | 'partner' | 'technician' | 'admin' | 'super_admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  activeVehicleId?: string;
  onboardingComplete: boolean;
  profileComplete?: boolean;
  phone?: string;
  avatarUrl?: string;
  photoURL?: string;
  provider?: string;
  lastLoginAt?: string;
  vehicleId?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleVariant?: string;
  createdAt: string;
  updatedAt: string;
  status?: 'ACTIVE' | 'SUSPENDED';
  lastActivity?: string;
  evCategory?: string;
  activeVehicleName?: string;
}

export type EVCategory =
  | '4-wheeler'
  | '2-wheeler'
  | '3-wheeler'
  | 'commercial'
  | 'heavy'
  | 'light';

export type DataSourceTag = 'VERIFIED' | 'ESTIMATED' | 'USER_PROVIDED' | 'DEMO DATA';
export type DataConfidenceTag = 'MEASURED_TELEMETRY' | 'MODELLED_ESTIMATE' | 'MANUFACTURER_SPEC' | 'INSUFFICIENT_DATA' | 'UNAVAILABLE';

export interface VehicleCatalogItem {
  id: string;
  category: EVCategory;
  manufacturer: string;
  model: string;
  variant?: string;
  batteryCapacitykWh: number;
  usableCapacitykWh: number;
  estimatedRangeKm: number;
  connectorTypes: string[];
  acMaxPowerKW: number;
  dcMaxPowerKW: number;
  supportedChargingModes: string[];
  typicalEfficiencyWhPerKm: number;
  motorPowerKW?: number;
  payloadKg?: number;
  seatingCapacity?: number;
  dataSource: DataSourceTag;
  active: boolean;
}

export interface UserVehicle {
  id: string;
  userId: string;
  catalogId?: string;
  category: EVCategory;
  manufacturer: string;
  model: string;
  variant?: string;
  nickname?: string;
  batteryCapacitykWh: number;
  usableCapacitykWh: number;
  estimatedRangeKm: number;
  currentBatteryPercent: number;
  estimatedHealthSOH: number;
  connectorTypes: string[];
  acMaxPowerKW: number;
  dcMaxPowerKW: number;
  isDefault: boolean;
  registrationNumber?: string;
  preferredChargingSpeed?: 'standard' | 'fast';
  dailyDistanceKm?: number;
  typicalEfficiencyWhPerKm?: number;
  dataSource: DataSourceTag;
  createdAt: string;
  updatedAt?: string;
}

export type ConnectorType =
  | 'CCS2'
  | 'Type2'
  | 'CHAdeMO'
  | 'GB/T'
  | '15A Plug'
  | 'Ather Fast'
  | 'Ola Hypercharger';

export type ChargerStatus = 'Available' | 'Charging' | 'Occupied' | 'Fault' | 'Maintenance' | 'Offline';

export interface Charger {
  id: string;
  stationId: string;
  connectorType: ConnectorType;
  powerKW: number;
  pricingPerKWh: number;
  hasVerifiedPricing?: boolean;
  pricingDisplay?: string;
  status: ChargerStatus;
  lastUpdated: string;
}

export type StationStatus = 'active' | 'maintenance' | 'offline';
export type VerificationStatus = 'approved' | 'pending' | 'rejected' | 'under_review';
export type PricingModel = 'per_kwh' | 'per_session' | 'time_based';
export type ReachabilityStatus = 'WITHIN_RANGE' | 'NEAR_RANGE_LIMIT' | 'OUTSIDE_RANGE';

export interface ChargingStation {
  id: string;
  partnerId?: string;
  name: string;
  operatorName?: string;
  description: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  operatingHours: string;
  is24x7?: boolean;
  amenities: string[];
  voltScore: number;
  status: StationStatus;
  verificationStatus: VerificationStatus;
  dataSource: 'partner' | 'openchargemap' | 'simulated';
  pricingModel?: PricingModel;
  chargers: Charger[];
  contactPhone?: string;
  distanceKm?: number;
  reachabilityStatus?: ReachabilityStatus;
  estimatedArrivalSOC?: number;
  lastUpdated: string;
  dataFreshnessTag?: 'LIVE' | 'RECENT' | 'STALE';
  createdBy?: string;
  updatedBy?: string;
  admin_verified?: boolean;
  admin_modified_at?: string;
  admin_modified_by?: string;
  source_updated_at?: string;
}

export interface StationReport {
  id: string;
  userId: string;
  stationId: string;
  reportType: 'charger_unavailable' | 'station_closed' | 'wrong_location' | 'pricing_mismatch' | 'broken_hardware';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

export interface PartnerApplication {
  id: string;
  userId: string;
  companyName: string;
  partnerType: 'cpo' | 'service' | 'home_charging' | 'fleet';
  contactEmail: string;
  contactPhone: string;
  city: string;
  status: VerificationStatus;
  submittedAt: string;
  reviewedBy?: string;
  notes?: string;
}

export interface DataQualityIssue {
  id: string;
  targetType: 'station' | 'partner' | 'vehicle';
  targetId: string;
  issueType: 'missing_coordinates' | 'stale_status' | 'incomplete_spec' | 'unverified_partner';
  severity: 'low' | 'medium' | 'high';
  description: string;
  createdAt: string;
}

export interface BatteryHealthRecord {
  id: string;
  vehicleId: string;
  recordedAt: string;
  measuredSOH?: number;
  estimatedSOH: number;
  usableCapacitykWh: number;
  cycleCount?: number;
  temperatureC?: number;
  confidenceTag: DataConfidenceTag;
  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  userId: string;
  vehicleId: string;
  serviceDate: string;
  serviceType: 'periodic_inspection' | 'brake_service' | 'battery_coolant' | 'tire_rotation' | 'general_repair';
  odometerKm: number;
  serviceProvider: string;
  costINR: number;
  notes?: string;
  createdAt: string;
}

export type AppErrorCode =
  | 'AUTH_ERROR'
  | 'PERMISSION_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'AI_ERROR'
  | 'EXTERNAL_API_ERROR'
  | 'UNKNOWN_ERROR';

export interface AppError {
  code: AppErrorCode;
  message: string;
  userMessage: string;
  refCode: string;
  timestamp: string;
}

export interface RateLimitConfig {
  key: string;
  maxRequests: number;
  windowMs: number;
}

export interface SecurityTestResult {
  testName: string;
  passed: boolean;
  details: string;
}

export type VoltAIIntent =
  | 'FIND_CHARGER'
  | 'FIND_CHEAPEST'
  | 'PLAN_TRIP'
  | 'CHECK_RANGE'
  | 'CHECK_BATTERY'
  | 'CHECK_HEALTH'
  | 'CHECK_MAINTENANCE'
  | 'FIND_SERVICE'
  | 'GENERAL_EV_QUESTION'
  | 'UNKNOWN';

export interface VoltAIContext {
  userProfile: UserProfile | null;
  activeVehicle: UserVehicle | null;
  currentSOC: number;
  usableCapacitykWh: number;
  estimatedRangeKm: number;
  storedMaintenanceCount: number;
  storedServiceRequestsCount: number;
}

export interface VoltAIAction {
  type: 'OPEN_VOLTMAP' | 'OPEN_TRIP_PLANNER' | 'OPEN_VOLTHEALTH' | 'CREATE_SERVICE_REQUEST' | 'CALIBRATE_SOC';
  label: string;
  payload?: any;
  requiresConfirmation?: boolean;
}

export interface VoltAIResponse {
  id: string;
  intent: VoltAIIntent;
  replyText: string;
  confidenceTag: DataConfidenceTag;
  suggestedAction?: VoltAIAction;
  dataCard?: {
    type: 'insight' | 'recommendation' | 'data_unavailable' | 'security_restriction';
    title: string;
    metrics?: { label: string; value: string }[];
  };
}

export interface VoltInsightEvent {
  id: string;
  userId: string;
  vehicleId: string;
  eventType: 'TRIP_COMPLETED' | 'CHARGING_COMPLETED' | 'VEHICLE_ADDED' | 'SERVICE_REQUEST_CREATED' | 'HEALTH_REPORT_CREATED';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface VoltInsightMetric {
  key: string;
  title: string;
  value: string | number;
  unit?: string;
  category: 'EFFICIENCY' | 'CHARGING' | 'COST' | 'BATTERY' | 'MAINTENANCE';
  confidenceTag: DataConfidenceTag;
}

export interface VoltInsightRecommendation {
  id: string;
  category: 'EFFICIENCY' | 'CHARGING' | 'COST' | 'BATTERY' | 'MAINTENANCE';
  title: string;
  description: string;
  severity: 'INFO' | 'RECOMMENDATION' | 'WARNING' | 'IMPORTANT';
  actionUrl?: string;
  confidenceTag: DataConfidenceTag;
}

export interface EVProfileSummary {
  vehicleId: string;
  totalTripsCount: number;
  totalDistanceKm: number;
  averageWhPerKm: number;
  totalChargingSessions: number;
  totalExpenditureINR: number;
  estimatedSOH: number;
  voltScore: number;
}

export interface ServiceReminder {
  id: string;
  vehicleId: string;
  title: string;
  dueOdometerKm?: number;
  dueDate?: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface HealthAlert {
  id: string;
  vehicleId: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'battery' | 'charging' | 'maintenance';
  createdAt: string;
}

export type ServiceRequestStatus =
  | 'Requested'
  | 'Confirmed'
  | 'Assigned'
  | 'Technician Assigned'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'MATCHING'
  | 'ASSIGNED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type ServicePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'low' | 'medium' | 'high' | 'urgent';

export type ServiceCategory =
  | 'battery_issue'
  | 'charging_issue'
  | 'range_issue'
  | 'braking'
  | 'tyres'
  | 'electrical'
  | 'warning_light'
  | 'software'
  | 'inspection'
  | 'battery_diagnostics'
  | 'charger_installation'
  | 'general_maintenance'
  | 'other';

export interface ServiceQuote {
  id: string;
  requestId: string;
  partnerId: string;
  laborCostINR: number;
  partsCostINR: number;
  taxINR: number;
  totalCostINR: number;
  validUntil: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
}

export interface ServiceRequest {
  id: string;
  userId: string;
  vehicleId: string;
  category: ServiceCategory;
  description: string;
  attachmentUrls?: string[];
  preferredLocationType: 'home_service' | 'workshop_visit';
  preferredDate?: string;
  preferredTime?: string;
  priority: ServicePriority;
  status: ServiceRequestStatus;
  assignedTechnicianId?: string;
  assignedPartnerId?: string;
  quote?: ServiceQuote;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ServicePartner {
  id: string;
  name: string;
  city: string;
  address: string;
  verificationStatus: VerificationStatus;
  contactPhone: string;
  supportedCategories: EVCategory[];
  rating?: number;
  totalCompletedServices?: number;
}

export interface TechnicianProfile {
  id: string;
  userId: string;
  partnerId: string;
  name: string;
  phone: string;
  specializations: ServiceCategory[];
  verificationStatus: VerificationStatus;
  isAvailable: boolean;
}

export interface TripPlan {
  id: string;
  userId: string;
  origin: string;
  originCoords: [number, number];
  destination: string;
  destinationCoords: [number, number];
  vehicleId: string;
  distanceKm: number;
  estimatedTimeMins: number;
  estimatedEnergyKWh: number;
  startBatteryPercent: number;
  targetBatteryPercent: number;
  expectedArrivalBatteryPercent: number;
  chargingStops: ChargingStop[];
  totalChargingTimeMins: number;
  totalCostINR: number;
  createdAt: string;
}

export interface ChargingStop {
  station: ChargingStation;
  charger: Charger;
  arrivalBatteryPercent: number;
  targetBatteryPercent: number;
  chargingTimeMins: number;
  costINR: number;
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'Created' | 'Assigned' | 'Travelling' | 'Inspection' | 'Repair' | 'Resolved';

export interface MaintenanceTicket {
  id: string;
  stationId: string;
  stationName: string;
  chargerId?: string;
  reportedBy: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  issueDescription: string;
  priority: TicketPriority;
  status: TicketStatus;
  notes: string[];
  evidencePhotoUrls: string[];
  createdAt: string;
  resolvedAt?: string;
}

export interface PartnerProfile {
  id: string;
  userId: string;
  companyName: string;
  partnerType: 'cpo' | 'service' | 'home_charging' | 'fleet';
  verificationStatus: VerificationStatus;
  contactEmail: string;
  contactPhone: string;
  totalStations: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetCollection: string;
  targetId: string;
  resourceType?: string;
  resourceId?: string;
  previousValue?: any;
  newValue?: any;
  details: Record<string, any>;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  createdAt: string;
}
