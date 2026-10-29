// ============================================================
// Unit Tests for Phase 4 Monopoly GO Meta & Settlement Engine
// test_phase4_meta.js
// ============================================================

const assert = require('assert');

// Mock localStorage for Node.js environment
const mockStorage = new Map();
global.localStorage = {
  getItem: (k) => mockStorage.get(k) || null,
  setItem: (k, v) => mockStorage.set(k, String(v)),
  removeItem: (k) => mockStorage.delete(k),
  clear: () => mockStorage.clear()
};

const MonopolyGoMeta = require('./js/monopolygo_meta.js');

console.log('--- STARTING PHASE 4 MONOPOLY GO META TESTS ---');

// ============================================================
// TEST 1: MODULE INITIALIZATION & DEFAULT STATE
// ============================================================
{
  console.log('\n[TEST 1] Testing MonopolyGoMeta initialization & default state...');
  mockStorage.clear();

  const state = {
    coins: 50000,
    bucks: 20,
    trophies: 100,
    piggyCoins: 0,
    sakaList: [
      { id: 'lead', name: 'Ханский Свинец', upgradeCost: 1000, level: 1 }
    ]
  };

  MonopolyGoMeta.init(state);

  assert.ok(state.village, 'state.village must be created');
  assert.strictEqual(state.village.region, 1, 'Initial region must be 1 (Суусамыр)');
  assert.strictEqual(state.village.shields, 3, 'Initial shields must be 3');
  assert.strictEqual(state.village.maxShields, 3, 'Initial maxShields must be 3');
  assert.strictEqual(state.village.buildings.yurt.level, 1, 'Yurt starting level 1');
  assert.strictEqual(state.village.buildings.forge.level, 1, 'Forge starting level 1');
  assert.strictEqual(state.village.buildings.stable.level, 1, 'Stable starting level 1');
  assert.strictEqual(state.village.buildings.tower.level, 1, 'Tower starting level 1');
  console.log('✓ Initialization passed successfully!');
}

// ============================================================
// TEST 2: 5-LEVEL BUILDING UPGRADE TREE & PERKS
// ============================================================
{
  console.log('\n[TEST 2] Testing 5-level building upgrades, costs and perks...');
  mockStorage.clear();

  const state = {
    coins: 500000,
    bucks: 50,
    piggyCoins: 0,
    sakaList: [{ id: 'lead', name: 'Ханский Свинец', upgradeCost: 1000, level: 1 }]
  };
  MonopolyGoMeta.init(state);

  // 1. Ханская Юрта (1..5)
  assert.strictEqual(MonopolyGoMeta.getBuildingCost('yurt', 1), 1500);
  assert.strictEqual(MonopolyGoMeta.getBuildingCost('yurt', 2), 3500);
  assert.strictEqual(MonopolyGoMeta.getBuildingCost('yurt', 3), 7500);
  assert.strictEqual(MonopolyGoMeta.getBuildingCost('yurt', 4), 15000);
  assert.strictEqual(MonopolyGoMeta.getBuildingCost('yurt', 5), 0); // Max

  // Upgrade Yurt to 2
  const coinsBefore = state.coins;
  MonopolyGoMeta.upgradeBuilding('yurt');
  assert.strictEqual(state.village.buildings.yurt.level, 2, 'Yurt should be level 2');
  assert.strictEqual(state.coins, coinsBefore - 1500, 'Coins deducted correctly for yurt upgrade');

  // 2. Кузница Сака (Скидки -10%..-30%)
  assert.strictEqual(MonopolyGoMeta.getForgeDiscount(), 0.10, 'Lvl 1 forge gives 10% discount');
  MonopolyGoMeta.upgradeBuilding('forge'); // -> Lvl 2
  assert.strictEqual(state.village.buildings.forge.level, 2);
  assert.strictEqual(MonopolyGoMeta.getForgeDiscount(), 0.15, 'Lvl 2 forge gives 15% discount');
  MonopolyGoMeta.upgradeBuilding('forge'); // -> Lvl 3
  assert.strictEqual(MonopolyGoMeta.getForgeDiscount(), 0.20, 'Lvl 3 forge gives 20% discount');
  MonopolyGoMeta.upgradeBuilding('forge'); // -> Lvl 4
  assert.strictEqual(MonopolyGoMeta.getForgeDiscount(), 0.25, 'Lvl 4 forge gives 25% discount');
  MonopolyGoMeta.upgradeBuilding('forge'); // -> Lvl 5
  assert.strictEqual(MonopolyGoMeta.getForgeDiscount(), 0.30, 'Lvl 5 forge gives 30% discount');

  // 3. Загон Аргамаков (Снижение времени -15%..-50%)
  assert.strictEqual(MonopolyGoMeta.getStableReduction(), 0.15, 'Lvl 1 stable gives 15% reduction');
  MonopolyGoMeta.upgradeBuilding('stable'); // -> Lvl 2
  assert.strictEqual(MonopolyGoMeta.getStableReduction(), 0.25, 'Lvl 2 stable gives 25% reduction');
  MonopolyGoMeta.upgradeBuilding('stable'); // -> Lvl 3
  assert.strictEqual(MonopolyGoMeta.getStableReduction(), 0.35, 'Lvl 3 stable gives 35% reduction');
  MonopolyGoMeta.upgradeBuilding('stable'); // -> Lvl 4
  assert.strictEqual(MonopolyGoMeta.getStableReduction(), 0.40, 'Lvl 4 stable gives 40% reduction');
  MonopolyGoMeta.upgradeBuilding('stable'); // -> Lvl 5
  assert.strictEqual(MonopolyGoMeta.getStableReduction(), 0.50, 'Lvl 5 stable gives 50% reduction');

  // 4. Дозорная Башня (Емкость щитов до 5)
  assert.strictEqual(MonopolyGoMeta.getTowerMaxShields(), 3, 'Lvl 1 tower max shields = 3');
  MonopolyGoMeta.upgradeBuilding('tower'); // -> Lvl 2
  assert.strictEqual(MonopolyGoMeta.getTowerMaxShields(), 3, 'Lvl 2 tower max shields = 3');
  MonopolyGoMeta.upgradeBuilding('tower'); // -> Lvl 3
  assert.strictEqual(MonopolyGoMeta.getTowerMaxShields(), 4, 'Lvl 3 tower max shields = 4');
  assert.strictEqual(state.village.maxShields, 4, 'state.village.maxShields updated to 4');
  MonopolyGoMeta.upgradeBuilding('tower'); // -> Lvl 4
  assert.strictEqual(MonopolyGoMeta.getTowerMaxShields(), 4, 'Lvl 4 tower max shields = 4');
  MonopolyGoMeta.upgradeBuilding('tower'); // -> Lvl 5
  assert.strictEqual(MonopolyGoMeta.getTowerMaxShields(), 5, 'Lvl 5 tower max shields = 5 (Max)');
  assert.strictEqual(state.village.maxShields, 5, 'state.village.maxShields updated to 5');

  console.log('✓ 5-level building tree, scaling costs and perks verified!');
}

// ============================================================
// TEST 3: PASSIVE TRIBUTE COLLECTION (ХАНСКАЯ ЮРТА)
// ============================================================
{
  console.log('\n[TEST 3] Testing passive tribute claim & accumulation...');
  mockStorage.clear();

  const state = {
    coins: 1000,
    village: {
      region: 1,
      buildings: { yurt: { level: 3 } }, // 800 coins/hr
      lastTributeClaimTime: Date.now() - 2 * 60 * 60 * 1000 // 2 hours ago
    }
  };
  MonopolyGoMeta.init(state);

  const trib = MonopolyGoMeta.calculateTribute();
  assert.strictEqual(trib.ratePerHour, 800, 'Rate at level 3 is 800/hr');
  assert.ok(trib.pending >= 1590 && trib.pending <= 1610, `Pending should be ~1600 coins (got ${trib.pending})`);

  // Claim tribute
  const coinsBefore = state.coins;
  MonopolyGoMeta.claimTribute();
  assert.ok(state.coins >= coinsBefore + 1590, 'Coins should be added to player balance');
  assert.ok(Date.now() - state.village.lastTributeClaimTime < 1000, 'Claim timestamp updated to now');

  const afterClaim = MonopolyGoMeta.calculateTribute();
  assert.strictEqual(afterClaim.pending, 0, 'Pending tribute reset to 0 after claim');
  console.log('✓ Passive tribute accumulation and claim verified!');
}

// ============================================================
// TEST 4: TOWER AUTO-RECHARGE LOGIC (1 SHIELD PER 8 HOURS)
// ============================================================
{
  console.log('\n[TEST 4] Testing tower shield auto-recharge (1 shield per 8 hours)...');
  mockStorage.clear();

  const state = {
    coins: 1000,
    village: {
      region: 1,
      shields: 1,
      maxShields: 5,
      buildings: { tower: { level: 5 } },
      lastShieldRechargeTime: Date.now() - 17 * 60 * 60 * 1000 // 17 hours elapsed -> 2 full 8-hour cycles
    }
  };
  MonopolyGoMeta.init(state);

  assert.strictEqual(state.village.shields, 3, '1 shield + 2 recharged shields = 3 shields');

  const cd = MonopolyGoMeta.getShieldRechargeCountdown();
  assert.ok(cd.includes('ч') && cd.includes('м'), 'Countdown string formatted properly');
  console.log('✓ Shield auto-recharge verified!');
}

// ============================================================
// TEST 5: REGIONAL ROADMAP & LANDMARK COMPLETION
// ============================================================
{
  console.log('\n[TEST 5] Testing Regional Roadmap milestone ceremony (Region 1 -> 2 -> 3)...');
  mockStorage.clear();

  const state = {
    coins: 1000000,
    bucks: 10,
    piggyCoins: 0,
    sakaList: [{ id: 'lead', name: 'Ханский Свинец' }]
  };
  MonopolyGoMeta.init(state);

  assert.strictEqual(state.village.region, 1, 'Starting at Region #1');

  // Upgrade all 4 buildings to level 5 in Region #1
  ['yurt', 'forge', 'stable', 'tower'].forEach(key => {
    while (state.village.buildings[key].level < 5) {
      MonopolyGoMeta.upgradeBuilding(key);
    }
  });

  // Verify transition to Region #2
  assert.strictEqual(state.village.region, 2, 'Should transition to Region #2 (Иссык-Куль)');
  assert.strictEqual(state.village.regionName, 'Озеро Иссык-Куль', 'Region name should be Озеро Иссык-Куль');
  assert.ok(state.coins >= 10000, 'Should award regional coin bonus (+10,000)');
  assert.ok(state.bucks >= 25, 'Should award regional bucks bonus (+15)');
  assert.ok(state.sakaList.some(s => s.id === 'suusamyr_skin'), 'Should award exclusive Суусамыр Көк-Бөрү Saka');

  // Verify building levels reset to 1 for Region #2
  assert.strictEqual(state.village.buildings.yurt.level, 1, 'Yurt resets to 1 for Region 2');
  assert.strictEqual(state.village.buildings.forge.level, 1, 'Forge resets to 1 for Region 2');

  // Upgrade all 4 buildings to level 5 in Region #2
  ['yurt', 'forge', 'stable', 'tower'].forEach(key => {
    while (state.village.buildings[key].level < 5) {
      MonopolyGoMeta.upgradeBuilding(key);
    }
  });

  // Verify transition to Region #3
  assert.strictEqual(state.village.region, 3, 'Should transition to Region #3 (Хан-Теңири)');
  assert.strictEqual(state.village.regionName, 'Пик Хан-Теңири', 'Region name should be Пик Хан-Теңири');
  assert.ok(state.sakaList.some(s => s.id === 'issyk_kul_skin'), 'Should award exclusive Иссык-Кульский Лазурит Saka');

  console.log('✓ Regional roadmap progression & milestone ceremony verified!');
}

// ============================================================
// TEST 6: ASYNCHRONOUS RAID «ЧАПКЫН» (BUILD & RAID LOOP)
// ============================================================
{
  console.log('\n[TEST 6] Testing interactive Raid «Чапкын»...');
  mockStorage.clear();

  const state = {
    coins: 5000,
    piggyCoins: 0,
    village: { region: 1, shields: 3, maxShields: 3, buildings: { yurt: { level: 1 } } }
  };
  MonopolyGoMeta.init(state);

  // Case A: Rival with shields
  MonopolyGoMeta.currentRaid = {
    rival: { username: 'Арстан_Ош', shields: 2 },
    isRevenge: false,
    targetHit: false
  };

  const coinsBeforeBlocked = state.coins;
  // Simulate strike on yurt
  MonopolyGoMeta.executeRaidStrike('khan');

  // Wait for strike timeout
  setTimeout(() => {
    assert.strictEqual(MonopolyGoMeta.currentRaid.rival.shields, 1, 'Rival shield should be decremented');
    assert.strictEqual(state.coins, coinsBeforeBlocked + 500, 'Consolation reward (+500) awarded');

    // Case B: Rival with 0 shields
    MonopolyGoMeta.currentRaid = {
      rival: { username: 'Тайсон_Бишкек', shields: 0 },
      isRevenge: false,
      targetHit: false
    };

    const coinsBeforeDestroyed = state.coins;
    const piggyBefore = state.piggyCoins;

    MonopolyGoMeta.executeRaidStrike('khan');

    setTimeout(() => {
      assert.ok(state.coins >= coinsBeforeDestroyed + 2500, 'Jackpot coins awarded for destroying yurt');
      assert.ok(state.piggyCoins > piggyBefore, '15% bonus coins siphoned into Piggy Bank');
      console.log('✓ Raid shield block and yurt destruction verified!');
    }, 700);

  }, 700);
}

// ============================================================
// TEST 7: ATTACK & DEFENSE LOG WITH REVENGE
// ============================================================
setTimeout(() => {
  console.log('\n[TEST 7] Testing Attack & Defense Log («Журнал набегов») and Revenge...');
  mockStorage.clear();

  const state = { coins: 5000, piggyCoins: 0 };
  MonopolyGoMeta.init(state);

  assert.strictEqual(MonopolyGoMeta.raidLogs.length, 5, 'Should maintain 5 recent attacks');
  const targetLog = MonopolyGoMeta.raidLogs[0];
  assert.strictEqual(targetLog.revenged, false, 'Initial revenge status false');

  // Launch revenge against targetLog
  MonopolyGoMeta.openRaidModal(targetLog.attackerName, { isRevenge: true, logId: targetLog.id });
  assert.strictEqual(MonopolyGoMeta.currentRaid.rival.username, targetLog.attackerName);
  assert.strictEqual(MonopolyGoMeta.currentRaid.isRevenge, true);

  MonopolyGoMeta.executeRaidStrike('khan');

  setTimeout(() => {
    assert.strictEqual(targetLog.revenged, true, 'Revenge marked as completed in raid log');
    console.log('✓ Attack log and Revenge counter-raid verified!');
  }, 700);

}, 1500);

// ============================================================
// TEST 8: PIGGY BANK («ХАНСКАЯ КОПИЛКА») & HAMMER SMASH
// ============================================================
setTimeout(() => {
  console.log('\n[TEST 8] Testing Piggy Bank 15% siphon & golden hammer break ceremony...');
  mockStorage.clear();

  const state = { coins: 5000, piggyCoins: 0 };
  MonopolyGoMeta.init(state);

  // Siphon 15% from match (e.g. 10,000 prize -> 1,500 into piggy)
  MonopolyGoMeta.addMatchBonus(10000);
  assert.strictEqual(state.piggyCoins, 1500, '15% bonus (1,500) siphoned into Piggy Bank');

  // Siphon from another match (20,000 prize -> +3,000)
  MonopolyGoMeta.addMatchBonus(20000);
  assert.strictEqual(state.piggyCoins, 4500, 'Piggy total should be 4,500');

  // Golden hammer smash
  const coinsBefore = state.coins;
  MonopolyGoMeta.breakPiggyBank();

  setTimeout(() => {
    assert.strictEqual(state.piggyCoins, 0, 'Piggy coins reset to 0 after hammer smash');
    assert.strictEqual(state.coins, coinsBefore + 4500, 'All 4,500 coins transferred to player balance');
    console.log('✓ Piggy Bank siphon and hammer break ceremony verified!');

    console.log('\n========================================');
    console.log('🎉 ALL PHASE 4 MONOPOLY GO META TESTS PASSED 100%!');
    console.log('========================================');
  }, 600);

}, 2500);
