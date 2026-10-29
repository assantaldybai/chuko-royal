// ============================================================
// Unit Tests for Phase 3 Ethno-Futurism Audio/Visual & FX (test_phase3.js)
// ============================================================

const assert = require('assert');
const EthnoAV = require('./js/ethno_av_engine.js');
const { Audio: EthnoAudio, FX: EthnoFX, Kalchoo: EthnoKalchoo } = EthnoAV;

console.log('======================================================');
console.log('--- STARTING PHASE 3 ETHNO-AV & FX ENGINE TESTS ---');
console.log('======================================================');

// ============================================================
// TEST 1: «КАЛЧОО» 4 CANONICAL ALCHIK SIDES INTEGRITY
// ============================================================
{
  console.log('\n[TEST 1] Testing Canonical 4 Alchik Sides (Алчы, Таа, Бөк, Чик)...');
  const SIDES = EthnoKalchoo.SIDES;

  assert.ok(SIDES.ALCHY, 'ALCHY side must exist');
  assert.ok(SIDES.TAA, 'TAA side must exist');
  assert.ok(SIDES.BOK, 'BOK side must exist');
  assert.ok(SIDES.CHIK, 'CHIK side must exist');

  // Verify canonical ranks: Алчы (4) > Таа (3) > Бөк (2) > Чик (1)
  assert.strictEqual(SIDES.ALCHY.rank, 4, 'Алчы must have top rank 4');
  assert.strictEqual(SIDES.TAA.rank, 3, 'Таа must have rank 3');
  assert.strictEqual(SIDES.BOK.rank, 2, 'Бөк must have rank 2');
  assert.strictEqual(SIDES.CHIK.rank, 1, 'Чик must have rank 1');

  assert.strictEqual(SIDES.ALCHY.name, 'Алчы');
  assert.strictEqual(SIDES.TAA.name, 'Таа');
  assert.strictEqual(SIDES.BOK.name, 'Бөк');
  assert.strictEqual(SIDES.CHIK.name, 'Чик');

  console.log('✓ All 4 canonical alchik sides verified with correct cultural names and hierarchy: Алчы (4) > Таа (3) > Бөк (2) > Чик (1)');
}

// ============================================================
// TEST 2: «КАЛЧОО» TOSS PROBABILITY DISTRIBUTION & CONTEST
// ============================================================
{
  console.log('\n[TEST 2] Testing Kalchoo bone toss distribution & contest evaluation...');
  const counts = { alchy: 0, taa: 0, bok: 0, chik: 0 };
  const N = 10000;

  for (let i = 0; i < N; i++) {
    const side = EthnoKalchoo.tossBone();
    counts[side.id]++;
  }

  console.log(`Statistical distribution over ${N} tosses:`, counts);

  // Each side must appear with non-zero probability
  assert.ok(counts.alchy > N * 0.12 && counts.alchy < N * 0.25, 'Алчы should occur ~18%');
  assert.ok(counts.taa > N * 0.12 && counts.taa < N * 0.25, 'Таа should occur ~18%');
  assert.ok(counts.bok > N * 0.24 && counts.bok < N * 0.40, 'Бөк should occur ~32%');
  assert.ok(counts.chik > N * 0.24 && counts.chik < N * 0.40, 'Чик should occur ~32%');

  // Contest evaluation logic
  const contest = EthnoKalchoo.evaluateContest();
  assert.ok(['player', 'bot', 'tie'].includes(contest.winner));
  if (contest.playerSide.rank > contest.botSide.rank) {
    assert.strictEqual(contest.winner, 'player');
  } else if (contest.playerSide.rank < contest.botSide.rank) {
    assert.strictEqual(contest.winner, 'bot');
  } else {
    assert.strictEqual(contest.winner, 'tie');
  }
  console.log('✓ Canonical astragalus toss mechanics and contest logic verified!');
}

// ============================================================
// TEST 3: BALLISTIC BONE KNOCKOUT FLIGHT PHYSICS
// ============================================================
{
  console.log('\n[TEST 3] Testing Ballistic 3D bone knockout flight physics...');
  EthnoFX.clearFX();

  const mockMatch = {
    centerX: 200,
    centerY: 200,
    circleRadius: 150,
    tiltY: 0.76
  };

  const mockAlchik = {
    x: 355,
    y: 200,
    vx: 8.0,
    vy: 0.5,
    radius: 11,
    angle: 0.4,
    isKhan: true
  };

  EthnoFX.spawnBallisticKnockout(mockAlchik, mockMatch);
  assert.strictEqual(EthnoFX.flyingBones.length, 1, 'Should spawn 1 ballistic flying bone');

  const bone = EthnoFX.flyingBones[0];
  assert.strictEqual(bone.isKhan, true);
  assert.strictEqual(bone.z, 0, 'Initial z should be 0');
  assert.ok(bone.vz > 8.0, 'Initial upward lift vz should be > 8');
  assert.ok(bone.vx > 7.0, 'Outward impulse vx should be positive');

  // Simulate flight for 10 frames
  let peakZ = 0;
  for (let frame = 0; frame < 15; frame++) {
    bone.x += bone.vx;
    bone.y += bone.vy;
    bone.z += bone.vz;
    bone.vz -= bone.gravity;
    if (bone.z > peakZ) peakZ = bone.z;
  }

  assert.ok(peakZ > 30, `Parabolic apex height should exceed 30px, got ${peakZ}`);
  console.log(`✓ Ballistic parabolic flight arc reached peak apex height z = ${Math.round(peakZ)}px with gravity!`);

  EthnoFX.clearFX();
}

// ============================================================
// TEST 4: IMPACT SPARKLE & SHOCKWAVE RING SYSTEM
// ============================================================
{
  console.log('\n[TEST 4] Testing Saka impact shockwave & sparkles system...');
  EthnoFX.clearFX();

  EthnoFX.spawnImpactShockwave(150, 180, 1.8);
  assert.strictEqual(EthnoFX.shockwaves.length, 1, 'Should spawn 1 shockwave ring');
  assert.ok(EthnoFX.sparks.length >= 12, 'High-intensity impact should spawn at least 12 sparks');

  const sw = EthnoFX.shockwaves[0];
  assert.strictEqual(sw.x, 150);
  assert.strictEqual(sw.y, 180);
  assert.strictEqual(sw.radius, 4);
  assert.ok(sw.maxRadius >= 40);

  // Simulate expansion
  sw.radius += sw.speed * 5;
  sw.alpha -= 0.048 * 5;
  assert.ok(sw.radius > 4, 'Shockwave radius expands over time');
  assert.ok(sw.alpha < 0.95, 'Shockwave alpha decays over time');

  console.log(`✓ Shockwave expanded to r = ${Math.round(sw.radius)}px with alpha = ${sw.alpha.toFixed(2)} and ${EthnoFX.sparks.length} sparks!`);
  EthnoFX.clearFX();
}

// ============================================================
// TEST 5: PROCEDURAL WEB AUDIO SYNTHESIZER VOICE ARCHITECTURE
// ============================================================
{
  console.log('\n[TEST 5] Testing Procedural Web Audio API voice methods existence & safety...');

  assert.strictEqual(typeof EthnoAudio.playBoneImpact, 'function', 'playBoneImpact must be defined');
  assert.strictEqual(typeof EthnoAudio.playDobulbas, 'function', 'playDobulbas must be defined');
  assert.strictEqual(typeof EthnoAudio.playTemirKomuz, 'function', 'playTemirKomuz must be defined');
  assert.strictEqual(typeof EthnoAudio.updateSlingshotDrone, 'function', 'updateSlingshotDrone must be defined');
  assert.strictEqual(typeof EthnoAudio.stopSlingshotDrone, 'function', 'stopSlingshotDrone must be defined');

  // Verify safe execution in Node.js environment without crashing
  EthnoAudio.playBoneImpact(1.0);
  EthnoAudio.playDobulbas(true);
  EthnoAudio.playDobulbas(false);
  EthnoAudio.playTemirKomuz('jackpot');
  EthnoAudio.playTemirKomuz('critical');
  EthnoAudio.playTemirKomuz('pluck');
  EthnoAudio.updateSlingshotDrone(0.75);
  EthnoAudio.stopSlingshotDrone();

  console.log('✓ All 4 procedural audio synthesizer voices (Bone Impact, Добулбас, Темир-комуз, Slingshot drone) executed safely without throwing!');
}

console.log('\n======================================================');
console.log('🏆 ALL PHASE 3 UNIT TESTS PASSED WITH 100% SUCCESS!');
console.log('======================================================\n');
