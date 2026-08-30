import { voltGuardService } from '../../../../services/voltGuardService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

export async function runVoltGuardTests(): Promise<{ passed: number; total: number }> {
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

  // Test 1: Input Sanitization
  await runTest('Input XSS & Script Tag Sanitization', () => {
    const dirty = '<script>alert("xss")</script>VoltConnect Test<b>Content</b>';
    const clean = voltGuardService.sanitizeInput(dirty);
    assert(!clean.includes('<script>'), 'Script tags must be stripped');
    assert(clean.includes('VoltConnect TestContent'), 'Plain text must be preserved safely');
  });

  // Test 2: Error Reference Code Formatting
  await runTest('Sanitized User Error & Ref Code Generation', () => {
    const err = voltGuardService.formatAppError('PERMISSION_ERROR', new Error('Firestore index missing'), 'Access denied');
    assert(err.userMessage.includes('VC-'), 'Error message must contain VC- reference code');
    assert(!err.userMessage.includes('Firestore index missing'), 'Raw internal stack trace must not be exposed in user message');
  });

  // Test 3: Rate Limiting Enforcement
  await runTest('Rate Limiter Cooldown Enforcement', () => {
    const key = 'test-ip-rate-limit';
    for (let i = 0; i < 5; i++) {
      assert(voltGuardService.checkRateLimit(key, 5, 60000) === true, `Request ${i + 1} within max limit must pass`);
    }
    assert(voltGuardService.checkRateLimit(key, 5, 60000) === false, '6th request exceeding limit must be blocked');
  });

  return { passed, total };
}

// Run tests
runVoltGuardTests();
