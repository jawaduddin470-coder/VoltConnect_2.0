import { msmeDemoController } from '../../../demo/utils/demoController';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

export async function runVoltApexTests(): Promise<{ passed: number; total: number }> {
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

  // Test 1: MSME Demo Sequence Integrity
  await runTest('MSME Demonstration Sequence Verification', () => {
    const steps = msmeDemoController.getSteps();
    assert(steps.length === 8, 'Demo sequence must contain exactly 8 structured evaluation steps');
    assert(steps[0].route === '/', 'Step 1 must evaluate Landing Page');
    assert(steps[7].route === '/admin/dashboard', 'Step 8 must evaluate Admin Command Center');
  });

  return { passed, total };
}

// Run tests
runVoltApexTests();
