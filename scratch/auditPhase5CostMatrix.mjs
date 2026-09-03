// Phase 5 Journey Cost Intelligence Audit & Test Matrix Verification

async function runCostMatrixAudit() {
  console.log('=== VOLTCONNECT 2.0 — PHASE 5 JOURNEY COST TEST MATRIX ===\n');

  // BMW iX Specs
  const bmwIX = {
    manufacturer: 'BMW',
    model: 'iX xDrive50',
    batteryCapacitykWh: 111.5,
    usableCapacitykWh: 105.2,
    estimatedRangeKm: 612,
  };

  const safetyReservePercent = 15;
  const nominalRangeKm = 612;

  // Route 1: Hyderabad -> Bengaluru (~571.5 km, 2 tolls = ₹285)
  // Route 2: Hyderabad -> Srinagar (~2,306.8 km, 4 tolls = ₹395)
  const testCases = [
    { name: 'Case A: Hyderabad -> Bengaluru', distKm: 571.5, startingSOC: 100, tollsINR: 285, tollCount: 2 },
    { name: 'Case B: Hyderabad -> Bengaluru', distKm: 571.5, startingSOC: 60, tollsINR: 285, tollCount: 2 },
    { name: 'Case C: Hyderabad -> Srinagar', distKm: 2306.8, startingSOC: 100, tollsINR: 395, tollCount: 4 },
    { name: 'Case D: Hyderabad -> Srinagar', distKm: 2306.8, startingSOC: 60, tollsINR: 395, tollCount: 4 },
  ];

  testCases.forEach((tc, idx) => {
    const leg1MaxSafeKm = Math.round(nominalRangeKm * ((tc.startingSOC - safetyReservePercent) / 100));
    const subsequentMaxSafeKm = Math.round(nominalRangeKm * ((85 - safetyReservePercent) / 100)); // 428 km

    // Calculate required charging stops
    let currentDistKm = 0;
    let stopCount = 0;
    let totalKWhAdded = 0;
    let chargingCostINR = 0;

    let curSOC = tc.startingSOC;

    while (true) {
      const maxSafe = stopCount === 0 ? leg1MaxSafeKm : subsequentMaxSafeKm;
      const remainingDist = tc.distKm - currentDistKm;
      if (remainingDist <= maxSafe) break;

      const targetLegDist = Math.round(maxSafe * 0.88);
      const nextStopDist = currentDistKm + targetLegDist;
      stopCount++;

      // Energy consumed on this leg
      const consumedRatio = targetLegDist / nominalRangeKm;
      const arrSOC = Math.max(10, Math.round(curSOC - consumedRatio * 100));

      // Energy added to reach 85% target
      const energyAddedKWh = Math.round(((85 - arrSOC) / 100) * bmwIX.usableCapacitykWh);
      totalKWhAdded += energyAddedKWh;

      // Standard public DC fast charger tariff: ₹18/kWh
      const stopCost = Math.round(energyAddedKWh * 18);
      chargingCostINR += stopCost;

      currentDistKm = nextStopDist;
      curSOC = 85;
    }

    const totalJourneyCostINR = chargingCostINR + tc.tollsINR;
    const costPerKmINR = Math.round((totalJourneyCostINR / tc.distKm) * 100) / 100;
    const readinessScore = stopCount > 0 ? 100 : (tc.distKm <= leg1MaxSafeKm ? 100 : 83);

    console.log(`--- ${tc.name} ---`);
    console.log(`  - Distance: ${tc.distKm} km`);
    console.log(`  - Starting SOC: ${tc.startingSOC}%`);
    console.log(`  - Charging Stops: ${stopCount} Stops`);
    console.log(`  - Energy Purchased: ${totalKWhAdded} kWh`);
    console.log(`  - Charging Cost: ₹${chargingCostINR.toLocaleString('en-IN')}`);
    console.log(`  - Toll Count & Cost: ${tc.tollCount} Tolls (₹${tc.tollsINR.toLocaleString('en-IN')})`);
    console.log(`  - Total Journey Cost: ₹${totalJourneyCostINR.toLocaleString('en-IN')}`);
    console.log(`  - Cost per km: ₹${costPerKmINR} / km`);
    console.log(`  - Journey Readiness: ${readinessScore}/100 READY\n`);
  });
}

runCostMatrixAudit().catch(console.error);
