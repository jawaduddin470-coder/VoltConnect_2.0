// Test Phase 2 Cost Engine logic on test routes and SOC levels

const testCases = [
  { route: 'Hyderabad -> Srinagar', distKm: 2306.8, soc: 100, stops: 4, energyKwh: 210, tolls: 395 },
  { route: 'Hyderabad -> Srinagar', distKm: 2306.8, soc: 85, stops: 4, energyKwh: 228, tolls: 395 },
  { route: 'Hyderabad -> Srinagar', distKm: 2306.8, soc: 50, stops: 5, energyKwh: 250, tolls: 395 },
  { route: 'Hyderabad -> Srinagar', distKm: 2306.8, soc: 20, stops: 5, energyKwh: 275, tolls: 395 },
  { route: 'Hyderabad -> Bengaluru', distKm: 571.5, soc: 100, stops: 1, energyKwh: 45, tolls: 280 },
  { route: 'Hyderabad -> Bengaluru', distKm: 571.5, soc: 85, stops: 2, energyKwh: 65, tolls: 280 },
  { route: 'Delhi -> Mumbai', distKm: 1343.9, soc: 85, stops: 3, energyKwh: 140, tolls: 680 },
  { route: 'Mumbai -> Pune', distKm: 148.5, soc: 100, stops: 0, energyKwh: 0, tolls: 320 },
  { route: 'Chennai -> Bengaluru', distKm: 346.2, soc: 85, stops: 1, energyKwh: 35, tolls: 210 },
];

console.log('=== PHASE 2 JOURNEY COST INTELLIGENCE MULTI-ROUTE & SOC TESTS ===\n');

testCases.forEach((tc, idx) => {
  const chargingCostINR = Math.round(tc.energyKwh * 18);
  const totalCostINR = chargingCostINR + tc.tolls;
  const costPerKm = tc.distKm > 0 ? Math.round((totalCostINR / tc.distKm) * 100) / 100 : 0;
  const chgPercent = totalCostINR > 0 ? Math.round((chargingCostINR / totalCostINR) * 100) : 0;
  const tollPercent = totalCostINR > 0 ? (100 - chgPercent) : 0;

  console.log(`Test ${idx + 1}: ${tc.route} (SOC: ${tc.soc}%)`);
  console.log(`  Distance: ${tc.distKm} km`);
  console.log(`  Stops: ${tc.stops} charging stops`);
  console.log(`  Energy Purchased: ${tc.energyKwh} kWh`);
  console.log(`  Charging Cost: ₹${chargingCostINR}`);
  console.log(`  Tolls: ₹${tc.tolls}`);
  console.log(`  TOTAL JOURNEY COST: ₹${totalCostINR}`);
  console.log(`  Cost per km: ₹${costPerKm} / km`);
  console.log(`  Split: ⚡ Charging ${chgPercent}% | 🛣️ Tolls ${tollPercent}%\n`);
});
