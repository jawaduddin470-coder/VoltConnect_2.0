// Node script to test Phase 3A Journey Readiness Calculation Engine across routes and SOC levels

const testScenarios = [
  { route: 'Hyderabad -> Srinagar', distKm: 2306.8, soc: 100, reserve: 15, rangeKm: 382, stops: 4, corridor: 120, soh: 98 },
  { route: 'Hyderabad -> Srinagar', distKm: 2306.8, soc: 85, reserve: 15, rangeKm: 382, stops: 4, corridor: 120, soh: 98 },
  { route: 'Hyderabad -> Srinagar', distKm: 2306.8, soc: 50, reserve: 15, rangeKm: 382, stops: 5, corridor: 120, soh: 98 },
  { route: 'Hyderabad -> Srinagar', distKm: 2306.8, soc: 20, reserve: 15, rangeKm: 382, stops: 5, corridor: 120, soh: 98 },
  { route: 'Hyderabad -> Bengaluru', distKm: 571.5, soc: 100, reserve: 15, rangeKm: 382, stops: 1, corridor: 80, soh: 98 },
  { route: 'Hyderabad -> Bengaluru', distKm: 571.5, soc: 85, reserve: 15, rangeKm: 382, stops: 2, corridor: 80, soh: 98 },
  { route: 'Delhi -> Mumbai', distKm: 1343.9, soc: 85, reserve: 15, rangeKm: 382, stops: 3, corridor: 100, soh: 95 },
  { route: 'Mumbai -> Pune', distKm: 148.5, soc: 100, reserve: 15, rangeKm: 382, stops: 0, corridor: 30, soh: 98 },
  { route: 'Chennai -> Bengaluru', distKm: 346.2, soc: 85, reserve: 15, rangeKm: 382, stops: 1, corridor: 40, soh: 98 },
  // Edge cases
  { route: 'Sparse Route (No Chargers)', distKm: 800, soc: 85, reserve: 15, rangeKm: 382, stops: 0, corridor: 0, soh: 98 },
  { route: 'Tight Reserve Buffer', distKm: 571.5, soc: 85, reserve: 8, rangeKm: 382, stops: 2, corridor: 80, soh: 98 },
  { route: 'Degraded Battery SOH', distKm: 571.5, soc: 85, reserve: 15, rangeKm: 382, stops: 2, corridor: 80, soh: 75 },
];

function calcReadiness(sc) {
  let batteryScore = sc.soc >= 80 ? 25 : sc.soc >= 50 ? 18 : sc.soc >= 25 ? 10 : 3;
  let planScore = sc.corridor === 0 && sc.distKm > sc.rangeKm ? 0 : 25;
  let reserveScore = sc.reserve >= 15 ? 15 : sc.reserve >= 10 ? 10 : 4;
  let coverageScore = sc.corridor >= 5 || sc.distKm <= sc.rangeKm ? 15 : sc.corridor >= 1 ? 10 : 0;
  let sohScore = sc.soh >= 90 ? 10 : sc.soh >= 80 ? 7 : 4;
  let routeDataScore = 5;
  let costScore = 5;

  const totalScore = batteryScore + planScore + reserveScore + coverageScore + sohScore + routeDataScore + costScore;
  let status = totalScore >= 90 ? 'READY' : totalScore >= 75 ? 'READY_WITH_ATTENTION' : totalScore >= 50 ? 'REVIEW' : 'NOT_READY';
  return { totalScore, status, batteryScore, planScore, reserveScore, coverageScore, sohScore };
}

console.log('=== PHASE 3A JOURNEY READINESS ENGINE DETERMINISTIC TESTS ===\n');

testScenarios.forEach((sc, idx) => {
  const res = calcReadiness(sc);
  console.log(`Test ${idx + 1}: ${sc.route} (SOC: ${sc.soc}%, SOH: ${sc.soh}%, Reserve: ${sc.reserve}%)`);
  console.log(`  Readiness Score: ${res.totalScore} / 100`);
  console.log(`  Status: ${res.status}`);
  console.log(`  Factor Scores: Battery=${res.batteryScore}/25, Plan=${res.planScore}/25, Reserve=${res.reserveScore}/15, Coverage=${res.coverageScore}/15, SOH=${res.sohScore}/10\n`);
});
