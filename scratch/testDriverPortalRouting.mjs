// VoltConnect 2.0 — Driver Portal Routing Isolation & Boundary Test Suite
import assert from 'assert';

console.log('================================================================');
console.log('VOLTCONNECT 2.0 — PORTAL ROUTING ISOLATION & RBAC BOUNDARY SUITE');
console.log('================================================================\n');

let total = 0;
let passed = 0;
let failed = 0;

async function runTest(num, title, fn) {
  total++;
  try {
    await fn();
    passed++;
    console.log(`[TEST ${num}] ✓ PASS: ${title}`);
  } catch (err) {
    failed++;
    console.error(`[TEST ${num}] ✗ FAIL: ${title}`);
    console.error(`  Error: ${err.message}\n`);
  }
}

// -----------------------------------------------------------------------------
// Router & RBAC Guard Simulation based exactly on src/App.tsx ProtectedRoute
// -----------------------------------------------------------------------------
class MockRoutingEnvironment {
  constructor() {
    this.user = null;
    this.localStorage = new Map();
    this.sessionStorage = new Map();
  }

  setUser(userProfile) {
    this.user = userProfile;
    if (userProfile) {
      this.localStorage.set('vc_user', JSON.stringify(userProfile));
    } else {
      this.localStorage.delete('vc_user');
    }
  }

  logout() {
    this.user = null;
    this.localStorage.delete('vc_user');
    this.localStorage.delete('vc_vehicles');
    this.sessionStorage.clear();
  }

  // Exact reproduction of login() in AuthContext.tsx
  async login(userDb, email, pass, requestedRole) {
    this.user = null;
    this.localStorage.delete('vc_user');

    const account = userDb.get(email);
    if (!account) {
      throw new Error('No registered account found with this email address.');
    }
    if (account.password !== pass) {
      throw new Error('Invalid email or password.');
    }

    const profile = account.profile;

    // Driver portal authoritative role check
    if (requestedRole === 'driver') {
      if (profile.role === 'admin' || profile.role === 'super_admin') {
        throw new Error("This account has Administrator privileges. Please sign in via the Admin Command Center at /login/admin.");
      }
      if (profile.role === 'partner') {
        throw new Error("This account is registered as a CPO Partner. Please sign in via the Partner Portal at /login/partner.");
      }
      if (profile.role === 'technician') {
        throw new Error("This account is registered as a Field Technician. Please sign in via the Technician Portal at /login/technician.");
      }
    }

    // Restricted portals check
    if (requestedRole && requestedRole !== 'driver') {
      const isAllowed =
        profile.role === requestedRole ||
        (requestedRole === 'admin' && profile.role === 'super_admin') ||
        (requestedRole === 'partner' && (profile.role === 'admin' || profile.role === 'super_admin')) ||
        (requestedRole === 'technician' && (profile.role === 'admin' || profile.role === 'super_admin'));

      if (!isAllowed) {
        throw new Error(`Unauthorized: User role '${profile.role}' does not have '${requestedRole}' access privileges.`);
      }
    }

    this.setUser(profile);
    return profile;
  }

  // Exact reproduction of ProtectedRoute in src/App.tsx
  resolveRoute(pathname) {
    const user = this.user;
    const role = user?.role || 'driver';
    const onboardingComplete = user?.onboardingComplete ?? false;

    const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
    const isPartnerRoute = pathname === '/partner' || pathname.startsWith('/partner/');
    const isTechnicianRoute = pathname === '/technician' || pathname.startsWith('/technician/');

    // 1. Unauthenticated Visitors per Portal:
    if (!user) {
      if (isAdminRoute) {
        return { action: 'REDIRECT', target: '/login/admin', shell: null };
      }
      if (isPartnerRoute) {
        return { action: 'REDIRECT', target: '/login/partner', shell: null };
      }
      if (isTechnicianRoute) {
        return { action: 'REDIRECT', target: '/login/technician', shell: null };
      }
      return { action: 'RENDER', target: pathname, shell: 'AppLayout', component: 'AuthGateView' };
    }

    // 2. Admin Routes: strictly allowed for 'admin' and 'super_admin'
    if (isAdminRoute) {
      if (role !== 'admin' && role !== 'super_admin') {
        if (role === 'partner') return { action: 'REDIRECT', target: '/partner/dashboard', shell: 'PartnerUI' };
        if (role === 'technician') return { action: 'REDIRECT', target: '/technician/dashboard', shell: 'TechnicianUI' };
        return { action: 'REDIRECT', target: '/dashboard', shell: 'AppLayout' };
      }
      return { action: 'RENDER', target: pathname, shell: 'AdminShell', component: 'AdminDashboard' };
    }

    // 3. Partner Routes: allowed for 'partner', 'admin', 'super_admin'
    if (isPartnerRoute) {
      if (role !== 'partner' && role !== 'admin' && role !== 'super_admin') {
        if (role === 'technician') return { action: 'REDIRECT', target: '/technician/dashboard', shell: 'TechnicianUI' };
        return { action: 'REDIRECT', target: '/dashboard', shell: 'AppLayout' };
      }
      return { action: 'RENDER', target: pathname, shell: 'PartnerUI', component: 'PartnerDashboard' };
    }

    // 4. Technician Routes: allowed for 'technician', 'admin', 'super_admin'
    if (isTechnicianRoute) {
      if (role !== 'technician' && role !== 'admin' && role !== 'super_admin') {
        if (role === 'partner') return { action: 'REDIRECT', target: '/partner/dashboard', shell: 'PartnerUI' };
        return { action: 'REDIRECT', target: '/dashboard', shell: 'AppLayout' };
      }
      return { action: 'RENDER', target: pathname, shell: 'TechnicianUI', component: 'TechnicianDashboard' };
    }

    // 5. Driver Routes (all other protected routes):
    if (role === 'admin' || role === 'super_admin') {
      return { action: 'REDIRECT', target: '/admin/dashboard', shell: 'AdminShell' };
    }
    if (role === 'partner') {
      return { action: 'REDIRECT', target: '/partner/dashboard', shell: 'PartnerUI' };
    }
    if (role === 'technician') {
      return { action: 'REDIRECT', target: '/technician/dashboard', shell: 'TechnicianUI' };
    }

    // User is guaranteed to be a DRIVER
    if (!onboardingComplete && pathname !== '/onboarding') {
      return { action: 'REDIRECT', target: '/onboarding', shell: 'AppLayout' };
    }
    if (onboardingComplete && pathname === '/onboarding') {
      return { action: 'REDIRECT', target: '/dashboard', shell: 'AppLayout' };
    }

    return { action: 'RENDER', target: pathname, shell: 'AppLayout', component: 'DriverPage' };
  }
}

// -----------------------------------------------------------------------------
// Test Execution
// -----------------------------------------------------------------------------
async function main() {
  const usersDb = new Map();
  usersDb.set('driver@voltconnect.io', {
    password: 'password123',
    profile: { uid: 'd-1', email: 'driver@voltconnect.io', name: 'Volt Driver', role: 'driver', onboardingComplete: true },
  });
  usersDb.set('newdriver@voltconnect.io', {
    password: 'password123',
    profile: { uid: 'd-2', email: 'newdriver@voltconnect.io', name: 'New Driver', role: 'driver', onboardingComplete: false },
  });
  usersDb.set('admin2.0@voltconnect.io', {
    password: 'VoltAdmin2026!',
    profile: { uid: 'a-1', email: 'admin2.0@voltconnect.io', name: 'Super Admin', role: 'admin', onboardingComplete: true },
  });
  usersDb.set('partner@voltconnect.io', {
    password: 'PartnerPass2026!',
    profile: { uid: 'p-1', email: 'partner@voltconnect.io', name: 'CPO Partner', role: 'partner', onboardingComplete: true },
  });

  const env = new MockRoutingEnvironment();

  // Test 1: Driver Login & Route Resolution
  await runTest(1, 'Driver authenticates via /login and navigates to /dashboard', async () => {
    const profile = await env.login(usersDb, 'driver@voltconnect.io', 'password123', 'driver');
    assert.strictEqual(profile.role, 'driver', 'User profile role must be driver');
    
    const result = env.resolveRoute('/dashboard');
    assert.strictEqual(result.action, 'RENDER', 'Driver on /dashboard must RENDER');
    assert.strictEqual(result.shell, 'AppLayout', 'Driver must render inside AppLayout');
    assert.notStrictEqual(result.shell, 'AdminShell', 'Driver must NEVER render inside AdminShell');
  });

  // Test 2: Driver Navigation across all Driver Portal Pages
  await runTest(2, 'Driver navigates all 13 driver routes without Admin contamination', async () => {
    const driverRoutes = [
      '/dashboard',
      '/explore',
      '/voltmap',
      '/trips',
      '/garage',
      '/my-ev',
      '/health',
      '/care',
      '/homecharge',
      '/sos',
      '/volt-ai',
      '/insight',
      '/profile',
    ];

    for (const route of driverRoutes) {
      const res = env.resolveRoute(route);
      assert.strictEqual(res.action, 'RENDER', `Route ${route} must RENDER for driver`);
      assert.strictEqual(res.shell, 'AppLayout', `Route ${route} must use AppLayout`);
      assert.notStrictEqual(res.shell, 'AdminShell', `Route ${route} must NEVER use AdminShell`);
      assert.notStrictEqual(res.component, 'AdminDashboard', `Route ${route} must NEVER mount AdminDashboard`);
    }
  });

  // Test 3: Driver Boundary - Access to Admin Console Forbidden
  await runTest(3, 'Driver attempting to access /admin/dashboard is blocked and redirected to /dashboard', async () => {
    const adminRoutes = ['/admin', '/admin/dashboard', '/admin/users', '/admin/stations', '/admin/audit'];
    for (const route of adminRoutes) {
      const res = env.resolveRoute(route);
      assert.strictEqual(res.action, 'REDIRECT', `Driver visiting ${route} must be redirected`);
      assert.strictEqual(res.target, '/dashboard', `Driver must be redirected to /dashboard`);
      assert.notStrictEqual(res.shell, 'AdminShell', 'Driver must NEVER mount AdminShell');
    }
  });

  // Test 4: Driver Boundary - Access to Partner Portal Forbidden
  await runTest(4, 'Driver attempting to access /partner/dashboard is blocked and redirected to /dashboard', async () => {
    const res = env.resolveRoute('/partner/dashboard');
    assert.strictEqual(res.action, 'REDIRECT', 'Driver visiting /partner/dashboard must be redirected');
    assert.strictEqual(res.target, '/dashboard', 'Driver must be redirected to /dashboard');
  });

  // Test 5: Unauthenticated Admin Route Isolation
  await runTest(5, 'Unauthenticated visitor to /admin/* redirects to /login/admin (no AppLayout)', async () => {
    env.logout();
    const res = env.resolveRoute('/admin/dashboard');
    assert.strictEqual(res.action, 'REDIRECT', 'Unauthenticated admin visit must redirect');
    assert.strictEqual(res.target, '/login/admin', 'Must redirect directly to /login/admin');
    assert.strictEqual(res.shell, null, 'Must NOT render AppLayout or Driver Navbar');
  });

  // Test 6: Unauthenticated Partner Route Isolation
  await runTest(6, 'Unauthenticated visitor to /partner/* redirects to /login/partner (no AppLayout)', async () => {
    env.logout();
    const res = env.resolveRoute('/partner/dashboard');
    assert.strictEqual(res.action, 'REDIRECT', 'Unauthenticated partner visit must redirect');
    assert.strictEqual(res.target, '/login/partner', 'Must redirect directly to /login/partner');
    assert.strictEqual(res.shell, null, 'Must NOT render AppLayout');
  });

  // Test 7: Admin Authentication & Admin Console Navigation
  await runTest(7, 'Admin authenticates at /login/admin and navigates /admin/*', async () => {
    const profile = await env.login(usersDb, 'admin2.0@voltconnect.io', 'VoltAdmin2026!', 'admin');
    assert.strictEqual(profile.role, 'admin', 'Profile role must be admin');

    const adminSubroutes = [
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
      '/admin/settings',
    ];

    for (const route of adminSubroutes) {
      const res = env.resolveRoute(route);
      assert.strictEqual(res.action, 'RENDER', `Admin on ${route} must RENDER`);
      assert.strictEqual(res.shell, 'AdminShell', `Admin on ${route} must use AdminShell`);
      assert.notStrictEqual(res.shell, 'AppLayout', `Admin on ${route} must NEVER render Driver AppLayout`);
    }
  });

  // Test 8: Admin Visiting Driver Route is Kept in Admin Console
  await runTest(8, 'Admin attempting to navigate to /dashboard is redirected to /admin/dashboard', async () => {
    const res = env.resolveRoute('/dashboard');
    assert.strictEqual(res.action, 'REDIRECT', 'Admin visiting /dashboard must be redirected');
    assert.strictEqual(res.target, '/admin/dashboard', 'Admin must be redirected to /admin/dashboard');
  });

  // Test 9: Partner Authentication & Boundary
  await runTest(9, 'Partner authenticates at /login/partner and is isolated to /partner/dashboard', async () => {
    const profile = await env.login(usersDb, 'partner@voltconnect.io', 'PartnerPass2026!', 'partner');
    assert.strictEqual(profile.role, 'partner', 'Profile role must be partner');

    const res = env.resolveRoute('/partner/dashboard');
    assert.strictEqual(res.action, 'RENDER', 'Partner on /partner/dashboard must RENDER');
    assert.strictEqual(res.shell, 'PartnerUI', 'Partner must use PartnerUI');

    // Partner visiting /admin/dashboard -> redirected to /partner/dashboard
    const adminRes = env.resolveRoute('/admin/dashboard');
    assert.strictEqual(adminRes.action, 'REDIRECT');
    assert.strictEqual(adminRes.target, '/partner/dashboard');

    // Partner visiting /dashboard -> redirected to /partner/dashboard
    const driverRes = env.resolveRoute('/dashboard');
    assert.strictEqual(driverRes.action, 'REDIRECT');
    assert.strictEqual(driverRes.target, '/partner/dashboard');
  });

  // Test 10: Front-Door Defense — Admin credentials rejected on Driver /login
  await runTest(10, 'Admin credentials on Driver /login are rejected with informative message', async () => {
    env.logout();
    let caught = null;
    try {
      await env.login(usersDb, 'admin2.0@voltconnect.io', 'VoltAdmin2026!', 'driver');
    } catch (err) {
      caught = err;
    }
    assert(caught !== null, 'Driver login must throw when given admin credentials');
    assert(caught.message.includes('Administrator privileges'), 'Must inform user of admin privileges');
    assert(caught.message.includes('/login/admin'), 'Must direct user to /login/admin');
    assert.strictEqual(env.user, null, 'User state must remain null');
    assert.strictEqual(env.localStorage.get('vc_user'), undefined, 'LocalStorage must have zero residue');
  });

  // Test 11: Front-Door Defense — Partner credentials rejected on Driver /login
  await runTest(11, 'Partner credentials on Driver /login are rejected with informative message', async () => {
    env.logout();
    let caught = null;
    try {
      await env.login(usersDb, 'partner@voltconnect.io', 'PartnerPass2026!', 'driver');
    } catch (err) {
      caught = err;
    }
    assert(caught !== null, 'Driver login must throw when given partner credentials');
    assert(caught.message.includes('CPO Partner'), 'Must inform user of partner privileges');
    assert(caught.message.includes('/login/partner'), 'Must direct user to /login/partner');
    assert.strictEqual(env.user, null, 'User state must remain null');
  });

  // Test 12: Session Cleanliness — Admin logout leaves 0 state for subsequent Driver login
  await runTest(12, 'Admin logout purges all persistent state; subsequent Driver login is 100% clean', async () => {
    await env.login(usersDb, 'admin2.0@voltconnect.io', 'VoltAdmin2026!', 'admin');
    assert.strictEqual(env.user?.role, 'admin');

    env.logout();
    assert.strictEqual(env.user, null, 'User state must be null');
    assert.strictEqual(env.localStorage.get('vc_user'), undefined, 'vc_user in localStorage must be cleared');

    // Subsequent driver login
    await env.login(usersDb, 'driver@voltconnect.io', 'password123', 'driver');
    assert.strictEqual(env.user?.role, 'driver', 'Driver role must be clean driver');

    const res = env.resolveRoute('/dashboard');
    assert.strictEqual(res.shell, 'AppLayout');
    assert.notStrictEqual(res.shell, 'AdminShell');
  });

  // Test 13: Incomplete Driver Profile enforces /onboarding
  await runTest(13, 'Incomplete driver profile is directed to /onboarding', async () => {
    await env.login(usersDb, 'newdriver@voltconnect.io', 'password123', 'driver');
    const res = env.resolveRoute('/dashboard');
    assert.strictEqual(res.action, 'REDIRECT');
    assert.strictEqual(res.target, '/onboarding');

    const onbRes = env.resolveRoute('/onboarding');
    assert.strictEqual(onbRes.action, 'RENDER');
  });

  console.log('----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('----------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test suite failed unexpectedly:', err);
  process.exit(1);
});
