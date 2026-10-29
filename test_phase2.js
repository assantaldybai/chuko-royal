// ============================================================
// Unit Tests for Phase 2 Mechanics (test_phase2.js)
// ============================================================

const assert = require('assert');
const Phase2Mechanics = require('./js/phase2_mechanics.js');
const { Haptics, GhostAiming, OrdoGarrison, KhanRule } = Phase2Mechanics;

console.log('--- STARTING PHASE 2 MECHANICS TESTS ---');

// ============================================================
// TEST 1: RAYCAST HEAD-ON COLLISION
// ============================================================
{
  console.log('\n[TEST 1] Raycast: Head-on collision...');
  const saka = { x: 100, y: 300, radius: 15 };
  // Target at (100, 200), distance = 100, target radius = 10 -> combinedR = 25
  const alchiks = [{ id: 'target', x: 100, y: 200, radius: 10, isKhan: false, active: true }];
  const aimAngle = -Math.PI / 2; // Straight up (0, -1)

  const res = GhostAiming.raycast(saka, aimAngle, alchiks, 400);

  assert.strictEqual(res.hit, true, 'Should detect collision');
  // Expected contact distance: 100 - 25 = 75
  assert.ok(Math.abs(res.t - 75) < 0.001, `t should be 75, got ${res.t}`);
  assert.ok(Math.abs(res.ghostPos.x - 100) < 0.001, 'Ghost X should be 100');
  assert.ok(Math.abs(res.ghostPos.y - 225) < 0.001, 'Ghost Y should be 225 (300 - 75)');
  assert.ok(Math.abs(res.normal.x - 0) < 0.001, 'Normal X should be 0');
  assert.ok(Math.abs(res.normal.y - (-1)) < 0.001, 'Normal Y should be -1');
  assert.ok(Math.abs(res.impactRatio - 1) < 0.001, 'Impact ratio for head-on should be 1.0');
  assert.ok(Math.abs(res.sakaRebound.magnitude - 0) < 0.001, 'Rebound magnitude for head-on should be 0 (stopped)');
  console.log('✓ Head-on collision passed perfectly!');
}

// ============================================================
// TEST 2: RAYCAST 45-DEGREE CUT SHOT & 90-DEGREE POOL TANGENT RULE
// ============================================================
{
  console.log('\n[TEST 2] Raycast: 45° cut shot & 90° Pool ricochet rule...');
  const saka = { x: 100, y: 300, radius: 15 };
  // Saka moves straight up (dx = 0, dy = -1).
  // Target is offset to the right so that collision normal is at 45 degrees
  // In contact: Ghost Saka center G = (100, 200).
  // Target is at (100 + 25 * cos(-45°), 200 + 25 * sin(-45°)) = (100 + 25*0.7071, 200 - 25*0.7071)
  const combinedR = 25;
  const targetX = 100 + combinedR * Math.cos(Math.PI / 4); // right
  const targetY = 200 - combinedR * Math.sin(Math.PI / 4); // up
  const alchiks = [{ id: 'target_cut', x: targetX, y: targetY, radius: 10, isKhan: false, active: true }];
  const aimAngle = -Math.PI / 2; // Straight up

  const res = GhostAiming.raycast(saka, aimAngle, alchiks, 400);

  assert.strictEqual(res.hit, true, 'Should detect collision on cut shot');
  assert.ok(Math.abs(res.ghostPos.x - 100) < 0.01, `Ghost X should be 100, got ${res.ghostPos.x}`);
  assert.ok(Math.abs(res.ghostPos.y - 200) < 0.01, `Ghost Y should be 200, got ${res.ghostPos.y}`);

  // Dot product between target deflection and Saka rebound must be 0 (exactly 90 degrees!)
  const dotDeflectionRebound = res.targetDeflection.x * res.sakaRebound.x + res.targetDeflection.y * res.sakaRebound.y;
  assert.ok(Math.abs(dotDeflectionRebound) < 0.001, `Pool tangent 90° angle failed: dot product is ${dotDeflectionRebound}`);

  // Rebound magnitude should be sin(45°) ≈ 0.7071
  assert.ok(Math.abs(res.sakaRebound.magnitude - Math.sin(Math.PI / 4)) < 0.01, `Rebound magnitude error: ${res.sakaRebound.magnitude}`);
  console.log('✓ 45° cut shot obeys 90-degree pool ricochet tangent rule!');
}

// ============================================================
// TEST 3: RAYCAST MISS & MULTIPLE ALCHIKS ORDERING
// ============================================================
{
  console.log('\n[TEST 3] Raycast: Miss & Multiple Alchiks selection...');
  const saka = { x: 100, y: 300, radius: 15 };
  const alchiks = [
    { id: 'far', x: 100, y: 100, radius: 10, active: true },
    { id: 'near', x: 100, y: 200, radius: 10, active: true },
    { id: 'miss', x: 300, y: 200, radius: 10, active: true },
    { id: 'inactive_near', x: 100, y: 250, radius: 10, active: false }
  ];

  // 1. Aim straight up (should hit 'near', ignoring inactive and far)
  const hitRes = GhostAiming.raycast(saka, -Math.PI / 2, alchiks, 400);
  assert.strictEqual(hitRes.hit, true);
  assert.strictEqual(hitRes.targetAlchik.id, 'near', 'Must hit closest active target');

  // 2. Aim to the left (should miss completely)
  const missRes = GhostAiming.raycast(saka, Math.PI, alchiks, 400);
  assert.strictEqual(missRes.hit, false, 'Should not hit anything to the left');
  assert.ok(missRes.endPoint, 'Should have endPoint on miss');
  console.log('✓ Closest target selection and miss handling verified!');
}

// ============================================================
// TEST 4: CANONICAL ORDO GARRISON CLUSTERS (5 & 9 BONES)
// ============================================================
{
  console.log('\n[TEST 4] Ordo Garrison Cluster Generation (5 & 9 Bones)...');
  const cx = 200, cy = 250;

  // 5 Bones
  const cluster5 = OrdoGarrison.generateCluster(5, cx, cy);
  assert.strictEqual(cluster5.length, 5, '5-bone cluster must have 5 pieces');
  const khan5 = cluster5.find(a => a.isKhan);
  assert.ok(khan5, 'Khan must be present');
  assert.strictEqual(khan5.x, cx, 'Khan X must be center');
  assert.strictEqual(khan5.y, cy, 'Khan Y must be center');
  assert.strictEqual(khan5.radius, 12.5, 'Khan radius must be 12.5');
  assert.strictEqual(khan5.mass, 1.45, 'Khan mass must be 1.45');

  const defenders5 = cluster5.filter(a => !a.isKhan);
  assert.strictEqual(defenders5.length, 4, 'Must have 4 defenders in 5-bone cluster');
  defenders5.forEach(d => {
    const dist = Math.hypot(d.x - cx, d.y - cy);
    assert.ok(Math.abs(dist - 21.0) < 0.001, `Defender distance should be 21, got ${dist}`);
  });

  // 9 Bones
  const cluster9 = OrdoGarrison.generateCluster(9, cx, cy);
  assert.strictEqual(cluster9.length, 9, '9-bone cluster must have 9 pieces');
  const khan9 = cluster9.find(a => a.isKhan);
  assert.ok(khan9, 'Khan must be present');
  assert.strictEqual(khan9.x, cx, 'Khan X must be center');
  assert.strictEqual(khan9.y, cy, 'Khan Y must be center');

  const defenders9 = cluster9.filter(a => !a.isKhan);
  assert.strictEqual(defenders9.length, 8, 'Must have 8 defenders in 9-bone cluster');

  const innerGuards = defenders9.filter(d => d.id.includes('inner'));
  const outerGuards = defenders9.filter(d => d.id.includes('outer'));
  assert.strictEqual(innerGuards.length, 4, 'Must have 4 inner ring defenders');
  assert.strictEqual(outerGuards.length, 4, 'Must have 4 outer ring defenders');

  innerGuards.forEach(d => {
    const dist = Math.hypot(d.x - cx, d.y - cy);
    assert.ok(Math.abs(dist - 18.0) < 0.01, `Inner guard distance should be 18, got ${dist}`);
  });

  outerGuards.forEach(d => {
    const dist = Math.hypot(d.x - cx, d.y - cy);
    assert.ok(Math.abs(dist - 32.0) < 0.01, `Outer guard distance should be 32, got ${dist}`);
  });

  console.log('✓ Canonical Ordo Garrison (Үймөк) layouts for 5 and 9 bones verified!');
}

// ============================================================
// TEST 5: KHAN CAPTURE ("ХАН АЛУУ") RULES & TRIUMPH BONUSES
// ============================================================
{
  console.log('\n[TEST 5] Khan Capture ("Хан алуу") Rule...');
  const state = {
    knockedTotal: 10,
    piggyCoins: 1000
  };
  const match = {
    turn: 'player',
    scorePlayer: 1,
    scoreBot: 0,
    knockedThisShot: 0
  };

  let soundPlayed = null;
  let toastMsg = null;
  const playSound = (s) => { soundPlayed = s; };
  const showToast = (m) => { toastMsg = m; };

  // 1. Regular Alchik Knockout
  const normalAlchik = { id: 'guard_1', isKhan: false, active: true };
  const normRes = KhanRule.processKnockout(normalAlchik, match, state, playSound, showToast);
  assert.strictEqual(normRes.points, 1, 'Regular knockout gives 1 point');
  assert.strictEqual(match.scorePlayer, 2, 'Player score should become 2');
  assert.strictEqual(state.knockedTotal, 11, 'Knocked total incremented');
  assert.strictEqual(state.piggyCoins, 1150, 'Piggy coins +150');
  assert.strictEqual(soundPlayed, 'out');

  // 2. Khan Knockout (ХАН АЛУУ!)
  const khanBone = { id: 'khan', isKhan: true, active: true };
  const khanRes = KhanRule.processKnockout(khanBone, match, state, playSound, showToast);
  assert.strictEqual(khanRes.points, 3, 'Khan knockout must give x3 bonus points (3 points)');
  assert.strictEqual(match.scorePlayer, 5, 'Player score should become 5 (2 + 3)');
  assert.strictEqual(state.piggyCoins, 1650, 'Piggy coins should receive +500 jackpot');
  assert.strictEqual(match.khanCapturedBy, 'player', 'Player flagged as Khan conqueror');
  assert.strictEqual(soundPlayed, 'khan_triumph', 'Sound should be celebratory fanfare');
  assert.ok(toastMsg && toastMsg.includes('ХАН АЛУУ'), 'Toast must announce ХАН АЛУУ');

  console.log('✓ Khan Capture x3 multiplier and jackpot bonus verified!');
}

// ============================================================
// TEST 6: HAPTICS FACADE WITH TELEGRAM & NAVIGATOR FALLBACK
// ============================================================
{
  console.log('\n[TEST 6] Haptics facade fallback & Telegram compatibility...');

  // Mock navigator.vibrate
  let vibrateCalls = [];
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      vibrate: (pattern) => { vibrateCalls.push(pattern); }
    },
    configurable: true
  });

  Haptics.impact('heavy');
  assert.strictEqual(vibrateCalls.length, 1);
  assert.strictEqual(vibrateCalls[0], 55);

  Haptics.notification('success');
  assert.strictEqual(vibrateCalls.length, 2);
  assert.deepStrictEqual(vibrateCalls[1], [35, 45, 35, 45, 90]);

  Haptics.selection();
  assert.strictEqual(vibrateCalls.length, 3);
  assert.strictEqual(vibrateCalls[2], 8);

  // Mock Telegram WebApp
  let tgImpact = null;
  let tgNotif = null;
  let tgSel = 0;
  global.window = {
    Telegram: {
      WebApp: {
        HapticFeedback: {
          impactOccurred: (s) => { tgImpact = s; },
          notificationOccurred: (t) => { tgNotif = t; },
          selectionChanged: () => { tgSel++; }
        }
      }
    }
  };

  Haptics.impact('rigid');
  assert.strictEqual(tgImpact, 'rigid', 'Telegram WebApp impact should be called');

  Haptics.notification('warning');
  assert.strictEqual(tgNotif, 'warning', 'Telegram WebApp notification should be called');

  Haptics.selection();
  assert.strictEqual(tgSel, 1, 'Telegram WebApp selection should be called');

  console.log('✓ Haptics facade handles both Telegram WebApp and navigator.vibrate fallback!');
}

console.log('\n========================================');
console.log('🎉 ALL PHASE 2 MECHANICS TESTS PASSED 100%!');
console.log('========================================\n');
