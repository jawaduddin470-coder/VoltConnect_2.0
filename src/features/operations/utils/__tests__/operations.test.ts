import { operationsService } from '../../../../services/operationsService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

export async function runOperationsTests(): Promise<{ passed: number; total: number }> {
  let passed = 0;
  let total = 0;

  async function runTest(name: string, fn: () => Promise<void> | void) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`[PASS] ${name}`);
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err.message);
    }
  }

  // Test 1: Audit Logging Engine
  await runTest('Audit Log Recording', async () => {
    const log = operationsService.logAuditEvent(
      'admin-01',
      'admin@voltconnect.io',
      'admin',
      'TEST_ACTION',
      'test_collection',
      'res-101',
      { key: 'value' }
    );

    assert(log.action === 'TEST_ACTION', 'Action must match logged value');
    assert(log.actorRole === 'admin', 'Actor role must match logged role');
    const logs = await operationsService.getAuditLogs();
    assert(logs.some(l => l.id === log.id), 'Log must be present in audit log stream');
  });

  // Test 2: Station Approval Pipeline
  await runTest('Station Approval Pipeline State Machine', async () => {
    const pendingStation = await operationsService.submitStationForApproval({
      name: 'Test Partner Station',
      description: 'Test Hub',
      address: 'Test Address',
      city: 'Hyderabad',
      latitude: 17.4,
      longitude: 78.4,
      operatingHours: '24/7',
      amenities: [],
      voltScore: 90,
      status: 'active',
      dataSource: 'partner',
      chargers: [],
    });

    assert(pendingStation.verificationStatus === 'pending', 'Submitted station must start in pending state');

    const reviewed = await operationsService.reviewStation(pendingStation.id, 'approved', 'admin-01', 'admin@voltconnect.io');
    assert(reviewed === true, 'Review operation must succeed for valid pending station');
  });

  return { passed, total };
}

// Run tests
runOperationsTests();
