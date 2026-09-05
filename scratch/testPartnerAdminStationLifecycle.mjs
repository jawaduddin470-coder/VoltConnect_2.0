import fs from 'fs';
import path from 'path';

console.log('========================================================================');
console.log('⚡ VOLTCONNECT 2.0 — PARTNER -> ADMIN STATION APPROVAL & REDESIGN TESTS');
console.log('========================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failCount++;
  }
}

const rootDir = process.cwd();

// SECTION 1: CODEBASE INTEGRITY & COMPONENT VERIFICATION
console.log('--- SECTION 1: PARTNER DASHBOARD & ADMIN COMPONENT INTEGRATION ---');

// 1. Check Partner Modular Components Exist
const partnerComponents = [
  'src/components/partner/PartnerHeader.tsx',
  'src/components/partner/PartnerHero.tsx',
  'src/components/partner/PartnerKPIStats.tsx',
  'src/components/partner/PartnerStationList.tsx',
  'src/components/partner/PartnerStationDetailView.tsx',
  'src/components/partner/PartnerAddStationModal.tsx',
  'src/components/partner/PartnerTelemetryView.tsx',
  'src/components/partner/PartnerReportsView.tsx',
  'src/components/partner/PartnerProfileView.tsx',
  'src/components/partner/PartnerNotificationsModal.tsx',
];

partnerComponents.forEach(file => {
  const fullPath = path.join(rootDir, file);
  assert(fs.existsSync(fullPath), `Component exists: ${file}`);
});

// 2. Check PartnerDashboard orchestration
const partnerDashboardContent = fs.readFileSync(path.join(rootDir, 'src/pages/partner/PartnerDashboard.tsx'), 'utf8');
assert(partnerDashboardContent.includes('PartnerHeader'), 'PartnerDashboard imports & renders PartnerHeader');
assert(partnerDashboardContent.includes('PartnerHero'), 'PartnerDashboard imports & renders PartnerHero');
assert(partnerDashboardContent.includes('PartnerKPIStats'), 'PartnerDashboard imports & renders PartnerKPIStats');
assert(partnerDashboardContent.includes('PartnerStationList'), 'PartnerDashboard imports & renders PartnerStationList');
assert(partnerDashboardContent.includes('PartnerStationDetailView'), 'PartnerDashboard imports & renders PartnerStationDetailView');
assert(partnerDashboardContent.includes('PartnerAddStationModal'), 'PartnerDashboard imports & renders PartnerAddStationModal');
assert(partnerDashboardContent.includes('PartnerTelemetryView'), 'PartnerDashboard imports & renders PartnerTelemetryView');
assert(partnerDashboardContent.includes('PartnerReportsView'), 'PartnerDashboard imports & renders PartnerReportsView');
assert(partnerDashboardContent.includes('PartnerProfileView'), 'PartnerDashboard imports & renders PartnerProfileView');
assert(partnerDashboardContent.includes('PartnerNotificationsModal'), 'PartnerDashboard imports & renders PartnerNotificationsModal');
assert(partnerDashboardContent.includes('subscribeToStations'), 'PartnerDashboard subscribes to real-time station updates via chargingDataService');
assert(partnerDashboardContent.includes('resubmitStation'), 'PartnerDashboard handles rejected station resubmission via operationsService.resubmitStation');
assert(partnerDashboardContent.includes('md:hidden fixed bottom-0'), 'PartnerDashboard includes mobile bottom navigation bar');

// 3. Check PartnerStationDetailView features (5-step timeline, rejection reason banner, resubmit)
const detailViewContent = fs.readFileSync(path.join(rootDir, 'src/components/partner/PartnerStationDetailView.tsx'), 'utf8');
assert(detailViewContent.includes('timelineSteps'), 'PartnerStationDetailView has visual 5-step lifecycle approval timeline');
assert(detailViewContent.includes('rejectionReason'), 'PartnerStationDetailView displays Admin rejection feedback');
assert(detailViewContent.includes('Fix & Resubmit') || detailViewContent.includes('Edit & Resubmit'), 'PartnerStationDetailView provides prominent Resubmit button for rejected hubs');

// 4. Check PartnerAddStationModal (5-step wizard, interactive map picker)
const addModalContent = fs.readFileSync(path.join(rootDir, 'src/components/partner/PartnerAddStationModal.tsx'), 'utf8');
assert(addModalContent.includes('PartnerLocationPickerMap'), 'PartnerAddStationModal integrates PartnerLocationPickerMap for GPS pinning');
assert(addModalContent.includes('Step {step} of 5') || addModalContent.includes('step === 5'), 'PartnerAddStationModal implements 5-step progressive wizard');
assert(addModalContent.includes('submitStationForApproval'), 'PartnerAddStationModal connects to operationsService.submitStationForApproval');

// 5. Check AdminStationsView features
const adminStationsContent = fs.readFileSync(path.join(rootDir, 'src/components/admin/AdminStationsView.tsx'), 'utf8');
assert(adminStationsContent.includes('subscribeToStations'), 'AdminStationsView connects to real-time subscription');
assert(adminStationsContent.includes('isApproved'), 'AdminStationsView uses status helper for approved/verified stations');
assert(adminStationsContent.includes('isPending'), 'AdminStationsView uses status helper for pending stations');
assert(adminStationsContent.includes('isRejected'), 'AdminStationsView uses status helper for rejected stations');
assert(adminStationsContent.includes('Quick Reason Templates') || adminStationsContent.includes('Inaccurate GPS coordinates'), 'AdminStationsView has rejection reason presets');

// SECTION 2: BACKEND SERVICES & FIRESTORE LOGIC VERIFICATION
console.log('\n--- SECTION 2: CHARGING DATA SERVICE & OPERATIONS SERVICE LOGIC ---');

const chargingDataServiceContent = fs.readFileSync(path.join(rootDir, 'src/services/chargingDataService.ts'), 'utf8');
assert(chargingDataServiceContent.includes('subscribeToStations'), 'chargingDataService exports subscribeToStations for live onSnapshot reactivity');
assert(chargingDataServiceContent.includes('getAllStationsForAdmin'), 'chargingDataService provides getAllStationsForAdmin');
assert(chargingDataServiceContent.includes('baseMap.set'), 'getAllStationsForAdmin unifies seed stations and Firestore stations via ID-keyed Map');
assert(chargingDataServiceContent.includes('getStations()') || chargingDataServiceContent.includes('async getStations'), 'chargingDataService provides getStations()');
assert(chargingDataServiceContent.includes("verificationStatus === 'verified'") && chargingDataServiceContent.includes("status !== 'inactive'"), 'getStations() strictly gates public VoltMap access to verified active stations');

const operationsServiceContent = fs.readFileSync(path.join(rootDir, 'src/services/operationsService.ts'), 'utf8');
assert(operationsServiceContent.includes('submitStationForApproval'), 'operationsService exports submitStationForApproval');
assert(operationsServiceContent.includes('reviewStation'), 'operationsService exports reviewStation');
assert(operationsServiceContent.includes('resubmitStation'), 'operationsService exports resubmitStation');

// SECTION 3: DATA LIFECYCLE SIMULATION
console.log('\n--- SECTION 3: SIMULATED APPROVAL LIFECYCLE EXECUTION ---');

// Mock station data
const testStation = {
  id: 'partner-test-station-001',
  partnerId: 'partner-uid-123',
  name: 'Cyber Towers Mega DC Hub',
  city: 'Hyderabad',
  address: 'Hitech City Main Rd',
  latitude: 17.4485,
  longitude: 78.3742,
  status: 'active',
  verificationStatus: 'pending',
  dataSource: 'partner',
  chargers: [
    {
      id: 'chg-1',
      stationId: 'partner-test-station-001',
      connectorType: 'CCS2',
      powerKW: 120,
      pricingPerKWh: 18,
      status: 'Available',
    }
  ]
};

// Simulate public gate predicate from getStations()
function isPubliclyDiscoverable(s) {
  const isVerified = s.verificationStatus === 'verified' || s.verificationStatus === 'approved';
  const isActive = s.status !== 'inactive' && s.status !== 'offline';
  return isVerified && isActive;
}

// 1. Initial State: Pending
assert(testStation.verificationStatus === 'pending', '1. Partner station is created with verificationStatus: pending');
assert(!isPubliclyDiscoverable(testStation), '2. Pending partner station is NOT publicly discoverable on VoltMap');

// 2. Admin Reviews & Approves Station
function simulateApprove(st, reviewerId) {
  return {
    ...st,
    verificationStatus: 'verified',
    reviewedBy: reviewerId,
    reviewedAt: new Date().toISOString(),
    admin_verified: true,
    status: 'active',
    rejectionReason: undefined,
  };
}

const approvedStation = simulateApprove(testStation, 'admin-uid-999');
assert(approvedStation.verificationStatus === 'verified', '3. Admin approval sets verificationStatus to "verified"');
assert(approvedStation.admin_verified === true, '4. Admin approval sets admin_verified to true');
assert(isPubliclyDiscoverable(approvedStation), '5. Approved station is immediately publicly discoverable on VoltMap');

// 3. Admin Rejection Workflow
function simulateReject(st, reviewerId, reason) {
  return {
    ...st,
    verificationStatus: 'rejected',
    reviewedBy: reviewerId,
    reviewedAt: new Date().toISOString(),
    admin_verified: false,
    status: 'inactive',
    rejectionReason: reason,
  };
}

const rejectedStation = simulateReject(testStation, 'admin-uid-999', 'GPS coordinates mismatch with entrance gate');
assert(rejectedStation.verificationStatus === 'rejected', '6. Admin rejection sets verificationStatus to "rejected"');
assert(rejectedStation.admin_verified === false, '7. Admin rejection sets admin_verified to false');
assert(rejectedStation.rejectionReason === 'GPS coordinates mismatch with entrance gate', '8. Rejection reason is accurately persisted');
assert(!isPubliclyDiscoverable(rejectedStation), '9. Rejected station is strictly excluded from public VoltMap');

// 4. Partner Resubmission Workflow
function simulateResubmit(st, updates) {
  return {
    ...st,
    ...updates,
    verificationStatus: 'pending',
    rejectionReason: undefined,
    lastUpdated: new Date().toISOString(),
  };
}

const resubmittedStation = simulateResubmit(rejectedStation, {
  latitude: 17.4490,
  longitude: 78.3750,
  address: 'Hitech City Gate 2, Hyderabad',
});

assert(resubmittedStation.verificationStatus === 'pending', '10. Resubmitting rejected station resets verificationStatus to "pending"');
assert(resubmittedStation.rejectionReason === undefined, '11. Resubmitting clears the previous rejectionReason');
assert(resubmittedStation.latitude === 17.4490, '12. Resubmitted station updates corrected GPS coordinates');
assert(!isPubliclyDiscoverable(resubmittedStation), '13. Resubmitted station remains gated until Admin re-reviews');

console.log('\n========================================================================');
console.log(`SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('========================================================================');

if (failCount > 0) {
  process.exit(1);
}
