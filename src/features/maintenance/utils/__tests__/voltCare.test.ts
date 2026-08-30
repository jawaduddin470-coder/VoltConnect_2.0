import { voltCareService } from '../../../../services/voltCareService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

export async function runVoltCareTests(): Promise<{ passed: number; total: number }> {
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

  // Test 1: Service Request Submission & Initial State
  await runTest('Service Request State Machine Initial State', async () => {
    const req = await voltCareService.createServiceRequest({
      userId: 'test-user-1',
      vehicleId: 'veh-01',
      category: 'charging_issue',
      description: 'Test charging issue description',
      priority: 'HIGH',
      preferredLocationType: 'home_service',
    });

    assert(req.status === 'SUBMITTED', 'New service request state must be SUBMITTED');
    assert(req.priority === 'HIGH', 'Priority must match requested level');
  });

  // Test 2: Service Request Cancellation
  await runTest('Service Request Cancellation', async () => {
    const req = await voltCareService.createServiceRequest({
      userId: 'test-user-1',
      vehicleId: 'veh-01',
      category: 'battery_issue',
      description: 'SOH check request',
      priority: 'NORMAL',
      preferredLocationType: 'workshop_visit',
    });

    const cancelled = await voltCareService.cancelServiceRequest(req.id);
    assert(cancelled === true, 'SUBMITTED request must be cancellable');
  });

  // Test 3: Honest Partner Discovery Empty State
  await runTest('Honest Partner Discovery Empty State', async () => {
    const partners = await voltCareService.getVerifiedPartners();
    assert(Array.isArray(partners), 'Partners must return an array');
    assert(partners.length === 0, 'Unverified database must return empty list for honest empty state');
  });

  return { passed, total };
}

// Run tests
runVoltCareTests();
