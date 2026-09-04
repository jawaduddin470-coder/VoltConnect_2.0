// Automated Test Suite for Voice Navigation Service

import {
  normalizeVoiceTranscript,
  resolveVoiceCommand,
  VOICE_ROUTES,
} from '../src/services/voiceNavigationService.ts';

function runTests() {
  console.log('=== RUNNING VOICE NAVIGATION SERVICE AUTOMATED TESTS ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✕ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Normalization Tests
  console.log('--- 1. NORMALIZATION TESTS ---');
  assert(normalizeVoiceTranscript('  Open Dashboard!  ') === 'open dashboard', 'Punctuation and trim normalization');
  assert(normalizeVoiceTranscript('Show Volt Map...') === 'show voltmap', 'Compound volt map normalization');
  assert(normalizeVoiceTranscript('Ask Volt AI?') === 'ask voltai', 'Compound volt ai normalization');
  assert(normalizeVoiceTranscript('Check Battery S.O.H.') === 'check battery soh', 'SOH normalization');

  // 2. Command Aliases & Route Resolution Tests
  console.log('\n--- 2. COMMAND RESOLUTION TESTS ---');
  
  const testCases = [
    // Dashboard
    { input: 'open dashboard', expectedRoute: '/dashboard', label: 'Dashboard' },
    { input: 'go to dashboard', expectedRoute: '/dashboard', label: 'Dashboard' },
    { input: 'take me to dashboard', expectedRoute: '/dashboard', label: 'Dashboard' },
    { input: 'dashboard', expectedRoute: '/dashboard', label: 'Dashboard' },
    { input: 'home', expectedRoute: '/dashboard', label: 'Dashboard' },

    // Map
    { input: 'open map', expectedRoute: '/explore', label: 'VoltMap' },
    { input: 'show voltmap', expectedRoute: '/explore', label: 'VoltMap' },
    { input: 'find chargers', expectedRoute: '/explore', label: 'VoltMap' },
    { input: 'where to charge', expectedRoute: '/explore', label: 'VoltMap' },

    // Trips
    { input: 'plan trip', expectedRoute: '/trips', label: 'Smart Trip Planner' },
    { input: 'open trips', expectedRoute: '/trips', label: 'Smart Trip Planner' },
    { input: 'route planner', expectedRoute: '/trips', label: 'Smart Trip Planner' },
    { input: 'calculate route', expectedRoute: '/trips', label: 'Smart Trip Planner' },

    // Garage
    { input: 'open garage', expectedRoute: '/garage', label: 'Garage & Vehicles' },
    { input: 'my ev', expectedRoute: '/garage', label: 'Garage & Vehicles' },
    { input: 'my vehicles', expectedRoute: '/garage', label: 'Garage & Vehicles' },

    // Health
    { input: 'battery health', expectedRoute: '/health', label: 'VoltHealth SOH' },
    { input: 'check battery health', expectedRoute: '/health', label: 'VoltHealth SOH' },
    { input: 'open volthealth', expectedRoute: '/health', label: 'VoltHealth SOH' },

    // Care
    { input: 'book service', expectedRoute: '/care', label: 'VoltCare Service' },
    { input: 'open maintenance', expectedRoute: '/care', label: 'VoltCare Service' },
    { input: 'voltcare', expectedRoute: '/care', label: 'VoltCare Service' },

    // Insight
    { input: 'open analytics', expectedRoute: '/insight', label: 'VoltInsight Analytics' },
    { input: 'show charging cost', expectedRoute: '/insight', label: 'VoltInsight Analytics' },
    { input: 'insights', expectedRoute: '/insight', label: 'VoltInsight Analytics' },

    // AI
    { input: 'ask ai', expectedRoute: '/volt-ai', label: 'VoltAI Copilot' },
    { input: 'open copilot', expectedRoute: '/volt-ai', label: 'VoltAI Copilot' },
    { input: 'voltai', expectedRoute: '/volt-ai', label: 'VoltAI Copilot' },

    // Profile & Settings
    { input: 'open profile', expectedRoute: '/profile', label: 'Driver Profile & Settings' },
    { input: 'open settings', expectedRoute: '/profile', label: 'Driver Profile & Settings' },
    { input: 'account settings', expectedRoute: '/profile', label: 'Driver Profile & Settings' },
  ];

  testCases.forEach(tc => {
    const res = resolveVoiceCommand(tc.input);
    assert(
      res.matched === true && res.targetRoute === tc.expectedRoute,
      `"${tc.input}" resolves to ${tc.expectedRoute} (${res.targetLabel})`
    );
  });

  // 3. Navigation Intent Tests (Back / Return)
  console.log('\n--- 3. GO BACK INTENT TESTS ---');
  const backCases = ['go back', 'back', 'previous page', 'return', 'take me back'];
  backCases.forEach(bw => {
    const res = resolveVoiceCommand(bw);
    assert(res.matched === true && res.intent === 'GO_BACK', `"${bw}" resolves to GO_BACK intent`);
  });

  // 4. Repeated Commands Stress Test
  console.log('\n--- 4. REPEATED COMMANDS STRESS TEST ---');
  for (let i = 1; i <= 5; i++) {
    const res1 = resolveVoiceCommand('open dashboard');
    const res2 = resolveVoiceCommand('open profile');
    const res3 = resolveVoiceCommand('open map');
    assert(
      res1.targetRoute === '/dashboard' && res2.targetRoute === '/profile' && res3.targetRoute === '/explore',
      `Iteration ${i}: Sequential multi-command resolution consistent`
    );
  }

  // 5. Unknown Command Handling
  console.log('\n--- 5. UNKNOWN COMMAND TESTS ---');
  const unknownRes = resolveVoiceCommand('play music on radio');
  assert(unknownRes.matched === false && unknownRes.intent === 'UNKNOWN', '"play music on radio" safely unhandled as UNKNOWN');

  console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runTests();
