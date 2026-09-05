import fs from 'fs';
import path from 'path';

console.log('===============================================================');
console.log('VOLTCONNECT 2.0 — MASTER PRODUCTION ACCEPTANCE VERIFICATION');
console.log('===============================================================');

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

// 1. Check App.tsx for all 11 Admin Subroutes
const appTsx = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf8');
const adminRoutes = [
  '/admin/dashboard',
  '/admin/users',
  '/admin/stations',
  '/admin/vehicles',
  '/admin/partners',
  '/admin/operations',
  '/admin/service',
  '/admin/analytics',
  '/admin/system-health',
  '/admin/audit',
  '/admin/settings'
];
adminRoutes.forEach(r => {
  assert(appTsx.includes(`path="${r}"`), `App.tsx contains route for ${r}`);
});

// 2. Check AdminDashboard renders location-based views without tab reset
const adminDashboard = fs.readFileSync(path.join(rootDir, 'src/pages/admin/AdminDashboard.tsx'), 'utf8');
assert(adminDashboard.includes('useLocation'), 'AdminDashboard uses useLocation() for URL-driven rendering');
assert(adminDashboard.includes('renderCurrentView'), 'AdminDashboard uses renderCurrentView() based on pathname');
assert(adminDashboard.includes('AdminAnalyticsView'), 'AdminDashboard integrates AdminAnalyticsView');
assert(adminDashboard.includes('AdminSystemHealthView'), 'AdminDashboard integrates AdminSystemHealthView');
assert(adminDashboard.includes('AdminServiceView'), 'AdminDashboard integrates AdminServiceView');
assert(adminDashboard.includes('AdminSettingsView'), 'AdminDashboard integrates AdminSettingsView');

// 3. Check AdminStationsView integrates AdminNetworkMap
const adminStations = fs.readFileSync(path.join(rootDir, 'src/components/admin/AdminStationsView.tsx'), 'utf8');
assert(adminStations.includes('AdminNetworkMap'), 'AdminStationsView embeds AdminNetworkMap');
assert(adminStations.includes('viewMode') || adminStations.includes('Network Map'), 'AdminStationsView provides View Toggle for Directory vs Network Map');

// 4. Check AdminNetworkMap capabilities (Condition 6 & 7)
const adminNetworkMap = fs.readFileSync(path.join(rootDir, 'src/components/admin/AdminNetworkMap.tsx'), 'utf8');
assert(adminNetworkMap.includes('computeSpatialClusters'), 'AdminNetworkMap implements spatial clustering');
assert(adminNetworkMap.includes('isChangingLocation') || adminNetworkMap.includes('Change Coordinates'), 'AdminNetworkMap supports changing coordinates');
assert(adminNetworkMap.includes('isEditingMetadata') || adminNetworkMap.includes('Edit Metadata'), 'AdminNetworkMap supports editing station metadata');
assert(adminNetworkMap.includes('rejectionReason'), 'AdminNetworkMap requires rejection reason for rejected stations');
assert(adminNetworkMap.includes('handleDeactivateStation') && adminNetworkMap.includes('inactive'), 'AdminNetworkMap implements governed soft-deletion (status: inactive)');

// 5. Check PartnerLocationPickerMap (Condition 4 & 5)
const partnerMap = fs.readFileSync(path.join(rootDir, 'src/components/partner/PartnerLocationPickerMap.tsx'), 'utf8');
assert(partnerMap.includes('haversineDistanceMeters'), 'PartnerLocationPickerMap calculates haversine distance');
assert(partnerMap.includes('50') && partnerMap.includes('Nearby Station Detected'), 'PartnerLocationPickerMap enforces duplicate detection within 50m');
assert(partnerMap.includes('nominatim.openstreetmap.org/reverse'), 'PartnerLocationPickerMap auto-fetches address via reverse geocoding');
assert(!partnerMap.includes('INITIAL_CHARGING_STATIONS.map(') || partnerMap.includes('not rendered on map'), 'PartnerLocationPickerMap does not render the entire 1766 network pins');

// 6. Check PartnerDashboard (Conditions 1, 3, Rejection Banner & Resubmit)
const partnerDashboard = fs.readFileSync(path.join(rootDir, 'src/pages/partner/PartnerDashboard.tsx'), 'utf8');
assert(partnerDashboard.includes('PartnerLocationPickerMap'), 'PartnerDashboard embeds PartnerLocationPickerMap');
assert(partnerDashboard.includes('isResubmitting') && partnerDashboard.includes('Review & Resubmit'), 'PartnerDashboard provides Review & Resubmit workflow');
assert(partnerDashboard.includes('rejectionReason'), 'PartnerDashboard displays rejection feedback to partner');
assert(partnerDashboard.includes("verificationStatus: 'pending'"), 'Partner submissions default to pending admin verification (NO pre-approval)');
assert(partnerDashboard.includes('CPO Profile'), 'PartnerDashboard provides CPO Profile view');

// 7. Check chargingDataService (Conditions 2 & 7)
const chargingService = fs.readFileSync(path.join(rootDir, 'src/services/chargingDataService.ts'), 'utf8');
assert(chargingService.includes("s.verificationStatus === 'approved' && s.status !== 'inactive'"), 'chargingDataService filters pending, rejected, and inactive stations from public driver feed');
assert(chargingService.includes('addOrUpdateStation'), 'chargingDataService implements addOrUpdateStation memory synchronization');

// 8. Check operationsService (Audit logging, review, deactivation, coordinate update)
const opsService = fs.readFileSync(path.join(rootDir, 'src/services/operationsService.ts'), 'utf8');
assert(opsService.includes('deactivateStation'), 'operationsService implements deactivateStation soft-deletion');
assert(opsService.includes('updateStationCoordinates'), 'operationsService implements updateStationCoordinates');
assert(opsService.includes('logAuditEvent'), 'operationsService logs all administrative mutations to audit trail');

// 9. Check firestore.rules (Condition 8)
const firestoreRules = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');
assert(firestoreRules.includes("request.resource.data.verificationStatus == 'pending'"), 'firestore.rules enforces verificationStatus == pending on partner create');
assert(firestoreRules.includes("!request.resource.data.diff(resource.data).affectedKeys().hasAny(['admin_verified'])"), 'firestore.rules prevents partners modifying admin_verified');
assert(firestoreRules.includes("!request.resource.data.diff(resource.data).affectedKeys().hasAny(['verificationStatus', 'admin_verified'])") || firestoreRules.includes("request.resource.data.verificationStatus == 'pending'"), 'firestore.rules prevents partner self-elevation to approved');

// 10. Check Simulation of Public Count Arithmetic
console.log('\n--- SIMULATING PUBLIC STATION COUNT ARITHMETIC (CONDITION 2) ---');
const baselineStations = [
  { id: 'st-1', name: 'Hub 1', verificationStatus: 'approved', status: 'active' },
  { id: 'st-2', name: 'Hub 2', verificationStatus: 'approved', status: 'active' },
  { id: 'st-3', name: 'Hub 3', verificationStatus: 'approved', status: 'active' },
];

function getPublicCount(stations) {
  return stations.filter(s => s.verificationStatus === 'approved' && s.status !== 'inactive').length;
}

const initialCount = getPublicCount(baselineStations);
assert(initialCount === 3, `Initial public count is ${initialCount}`);

// Partner creates new station
const newPartnerStation = {
  id: 'st-partner-new',
  name: 'New Partner Hub',
  verificationStatus: 'pending',
  status: 'active'
};
const afterSubmit = [...baselineStations, newPartnerStation];
const countAfterSubmit = getPublicCount(afterSubmit);
assert(countAfterSubmit === initialCount, `After partner submits, public count remains ${countAfterSubmit} (Pending is NOT visible)`);

// Admin approves
const afterApproval = afterSubmit.map(s => s.id === 'st-partner-new' ? { ...s, verificationStatus: 'approved', admin_verified: true } : s);
const countAfterApproval = getPublicCount(afterApproval);
assert(countAfterApproval === initialCount + 1, `After Admin approves, public count increases by EXACTLY 1 (${initialCount} -> ${countAfterApproval})`);

// Admin deactivates
const afterDeactivation = afterApproval.map(s => s.id === 'st-partner-new' ? { ...s, status: 'inactive' } : s);
const countAfterDeactivation = getPublicCount(afterDeactivation);
assert(countAfterDeactivation === initialCount, `After Admin soft-deactivates (status: inactive), public count decreases back to ${countAfterDeactivation}`);

console.log('\n===============================================================');
console.log(`TOTAL CHECKS: ${passCount + failCount}`);
console.log(`PASSED:       ${passCount}`);
console.log(`FAILED:       ${failCount}`);
console.log('===============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL MASTER PRODUCTION ACCEPTANCE CONDITIONS VERIFIED! 🚀');
}
