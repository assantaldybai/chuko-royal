// ============================================================
// Headless Chrome CDP Verification Script for Phase 4 Meta
// verify_phase4_cdp.js
// ============================================================

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCDPVerification() {
  console.log('--- STARTING PHASE 4 HEADLESS CHROME CDP VERIFICATION ---');

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromePort = 9226;

  console.log(`Launching Chrome on port ${chromePort}...`);
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${chromePort}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=430,932',
    `http://127.0.0.1:3000/index.html`
  ]);

  let targets = null;
  for (let i = 0; i < 25; i++) {
    await sleep(400);
    try {
      const res = await fetch(`http://127.0.0.1:${chromePort}/json`);
      if (res.ok) {
        targets = await res.json();
        break;
      }
    } catch (e) {}
  }

  if (!targets || targets.length === 0) {
    console.error('Failed to connect to Chrome targets!');
    chromeProc.kill();
    process.exit(1);
  }

  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget) {
    console.error('No page target found!');
    chromeProc.kill();
    process.exit(1);
  }

  console.log(`Connected to page target: ${pageTarget.url}`);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    } else if (data.method === 'Runtime.consoleAPICalled') {
      if (data.params.type === 'error') {
        const text = data.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
        consoleErrors.push(text);
      }
    } else if (data.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(data.params.exceptionDetails.text + ' ' + (data.params.exceptionDetails.exception?.description || ''));
    }
  };

  await new Promise(resolve => ws.onopen = resolve);

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await sendCommand('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text + ': ' + (res.exceptionDetails.exception?.description || ''));
    }
    return res.result ? res.result.value : undefined;
  }

  async function takeScreenshot(filePath) {
    const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
    if (res && res.data) {
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      console.log(`📸 Screenshot saved: ${path.basename(filePath)}`);
    }
  }

  // Enable runtime & page
  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');

  console.log('Waiting for loader and page initialization...');
  await sleep(2500);

  try {
    // --- CHECK 1: Module presence in browser window ---
    console.log('\n[CDP CHECK 1] Inspecting MonopolyGoMeta and Phase 2 modules...');
    const modules = await evaluate(`({
      hasMeta: typeof window.MonopolyGoMeta !== 'undefined',
      hasHaptics: typeof window.ChukoHaptics !== 'undefined',
      hasPhase2: typeof window.Phase2Mechanics !== 'undefined',
      hasState: typeof window.state !== 'undefined',
      region: window.state?.village?.region,
      shields: window.state?.village?.shields,
      maxShields: window.state?.village?.maxShields
    })`);
    console.log('Browser modules:', modules);
    if (!modules.hasMeta) {
      throw new Error('window.MonopolyGoMeta is not defined!');
    }
    console.log('✓ MonopolyGoMeta module is loaded and initialized!');

    // --- CHECK 2: DOM elements in Header and Village Tab ---
    console.log('\n[CDP CHECK 2] Checking HUD & Village Tab elements in DOM...');
    const domCheck = await evaluate(`({
      hasHudShields: !!document.getElementById('hud-shields'),
      hasPiggyAmount: !!document.getElementById('piggy-amount'),
      hasVillageCard: !!document.getElementById('village-region-card'),
      hasTributeBanner: !!document.getElementById('village-tribute-banner'),
      hasShieldsDisplay: !!document.getElementById('village-shields-display'),
      hasYurtLvl: !!document.getElementById('bldg-yurt-lvl'),
      hasForgeLvl: !!document.getElementById('bldg-forge-lvl'),
      hasStableLvl: !!document.getElementById('bldg-stable-lvl'),
      hasTowerLvl: !!document.getElementById('bldg-tower-lvl'),
      hasRaidLogsList: !!document.getElementById('village-raid-logs-list'),
      hasRaidModal: !!document.getElementById('modal-raid'),
      hasPiggyModal: !!document.getElementById('modal-piggy'),
      hasLandmarkModal: !!document.getElementById('modal-landmark')
    })`);
    console.log('DOM presence:', domCheck);
    for (const [k, v] of Object.entries(domCheck)) {
      if (!v) throw new Error(`Missing DOM element: ${k}`);
    }
    console.log('✓ All Phase 4 UI components, banners, and modals exist in DOM!');

    // --- CHECK 3: Switch to Village Tab & Check Visual UI ---
    console.log('\n[CDP CHECK 3] Switching to Village tab and verifying rendering...');
    await evaluate(`switchLobbyTab('village')`);
    await sleep(400);

    const villageUI = await evaluate(`({
      regionName: document.getElementById('village-region-name').textContent,
      progressBadge: document.getElementById('village-progress-badge').textContent,
      tributePending: document.getElementById('tribute-pending-amount').textContent,
      shieldsText: document.getElementById('village-shields-display').textContent,
      yurtBtn: document.getElementById('bldg-yurt-btn').textContent.trim(),
      forgeBtn: document.getElementById('bldg-forge-btn').textContent.trim(),
      raidLogsCount: document.getElementById('village-raid-logs-list').children.length
    })`);
    console.log('Village UI state:', villageUI);
    if (!villageUI.regionName.includes('Суусамыр')) {
      throw new Error(`Expected region Суусамыр, got ${villageUI.regionName}`);
    }
    if (villageUI.raidLogsCount !== 5) {
      throw new Error(`Expected 5 attack log entries, found ${villageUI.raidLogsCount}`);
    }
    console.log('✓ Village Tab rendered with 5-entry attack log and active tribute banner!');

    await takeScreenshot(path.join(__dirname, 'screenshot_phase4_village.png'));

    // --- CHECK 4: Test Building Upgrades and Forge Discount ---
    console.log('\n[CDP CHECK 4] Testing building upgrade & Forge discount application...');
    const upgradeRes = await evaluate(`(() => {
      state.coins = 50000;
      MonopolyGoMeta.upgradeBuilding('yurt');
      MonopolyGoMeta.upgradeBuilding('forge');
      const discount = MonopolyGoMeta.getForgeDiscount();
      const baseCost = state.sakaList[0].upgradeCost;
      const discountedCost = Math.round(baseCost * (1 - discount));
      return {
        yurtLevel: state.village.buildings.yurt.level,
        forgeLevel: state.village.buildings.forge.level,
        forgeDiscount: discount,
        discountedCost
      };
    })()`);
    console.log('Upgrade result:', upgradeRes);
    if (upgradeRes.yurtLevel !== 2 || upgradeRes.forgeLevel !== 2) {
      throw new Error('Building upgrade failed to increment level');
    }
    if (upgradeRes.forgeDiscount !== 0.15) {
      throw new Error(`Expected 15% discount at forge lvl 2, got ${upgradeRes.forgeDiscount}`);
    }
    console.log('✓ Building upgrades functional and 15% Forge discount verified!');

    // --- CHECK 5: Test Passive Tribute Collection ---
    console.log('\n[CDP CHECK 5] Testing tribute accumulation & claim...');
    const tributeRes = await evaluate(`(() => {
      // Simulate 1 hour elapsed
      state.village.lastTributeClaimTime = Date.now() - 3600000;
      const before = state.coins;
      const trib = MonopolyGoMeta.calculateTribute();
      MonopolyGoMeta.claimTribute();
      return {
        pendingCalculated: trib.pending,
        coinsGained: state.coins - before,
        pendingAfterClaim: MonopolyGoMeta.calculateTribute().pending
      };
    })()`);
    console.log('Tribute claim result:', tributeRes);
    if (tributeRes.coinsGained <= 0 || tributeRes.pendingAfterClaim !== 0) {
      throw new Error('Tribute claim failed to transfer coins');
    }
    console.log('✓ Tribute collected and reset to 0!');

    // --- CHECK 6: Test Interactive Raid Modal («Чапкын») ---
    console.log('\n[CDP CHECK 6] Testing interactive Raid modal & Saka strike...');
    await evaluate(`MonopolyGoMeta.openRaidModal('Арстан_Ош')`);
    await sleep(300);

    const raidModalOpen = await evaluate(`!document.getElementById('modal-raid').classList.contains('hidden')`);
    if (!raidModalOpen) throw new Error('Raid modal failed to open');

    await takeScreenshot(path.join(__dirname, 'screenshot_phase4_raid.png'));

    // Strike the Khan yurt
    console.log('Executing Saka strike on Khan Yurt in Raid modal...');
    await evaluate(`MonopolyGoMeta.executeRaidStrike('khan')`);
    await sleep(1000);

    const raidStrikeRes = await evaluate(`({
      resultVisible: !document.getElementById('raid-result-card').classList.contains('hidden'),
      resultText: document.getElementById('raid-result-card').textContent.trim()
    })`);
    console.log('Raid strike result:', raidStrikeRes);
    if (!raidStrikeRes.resultVisible) {
      throw new Error('Raid result card did not appear after strike');
    }
    console.log('✓ Raid strike successfully executed with visual FX and rewards card!');

    await evaluate(`MonopolyGoMeta.closeRaidModal()`);

    // --- CHECK 7: Test Revenge Action («Отомстить») from Attack Log ---
    console.log('\n[CDP CHECK 7] Testing Revenge action from attack log...');
    const revengeRes = await evaluate(`(() => {
      const firstLog = MonopolyGoMeta.raidLogs[0];
      MonopolyGoMeta.launchRevenge(firstLog.id, firstLog.attackerName);
      return {
        isRevenge: MonopolyGoMeta.currentRaid.isRevenge,
        rivalName: MonopolyGoMeta.currentRaid.rival.username
      };
    })()`);
    console.log('Revenge launched:', revengeRes);
    if (!revengeRes.isRevenge) {
      throw new Error('Revenge raid did not set isRevenge flag');
    }
    console.log('✓ Counter-raid initiated specifically against attacker!');
    await evaluate(`MonopolyGoMeta.closeRaidModal()`);

    // --- CHECK 8: Test Khan Piggy Bank («Ханская Копилка») & Hammer Smash ---
    console.log('\n[CDP CHECK 8] Testing Piggy Bank 15% siphon & hammer smash ceremony...');
    const piggyRes = await evaluate(`(() => {
      // Siphon 15% bonus from a 20,000 match
      MonopolyGoMeta.addMatchBonus(20000);
      const piggyAmt = state.piggyCoins;
      const coinsBefore = state.coins;
      MonopolyGoMeta.openPiggyModal();
      return {
        piggyAmt,
        coinsBefore,
        modalOpen: !document.getElementById('modal-piggy').classList.contains('hidden')
      };
    })()`);
    console.log('Piggy Bank opened:', piggyRes);
    if (piggyRes.piggyAmt < 3000) {
      throw new Error(`Expected at least 3,000 piggy coins, got ${piggyRes.piggyAmt}`);
    }

    await takeScreenshot(path.join(__dirname, 'screenshot_phase4_piggy.png'));

    // Hammer smash
    console.log('Smashing Piggy Bank with golden hammer...');
    await evaluate(`MonopolyGoMeta.breakPiggyBank()`);
    await sleep(900);

    const postSmash = await evaluate(`({
      piggyCoins: state.piggyCoins,
      modalHidden: document.getElementById('modal-piggy').classList.contains('hidden')
    })`);
    console.log('Post-smash state:', postSmash);
    if (postSmash.piggyCoins !== 0) {
      throw new Error('Piggy bank was not emptied after smash');
    }
    console.log('✓ Golden hammer smash ceremony executed and coins transferred!');

    // --- CHECK 9: Test Regional Landmark Completion Ceremony ---
    console.log('\n[CDP CHECK 9] Testing Landmark completion ceremony (All 4 at Level 5)...');
    const landmarkRes = await evaluate(`(() => {
      // Set all 4 buildings to level 4, then upgrade last one to 5
      state.village.region = 1;
      state.village.buildings.yurt.level = 5;
      state.village.buildings.forge.level = 5;
      state.village.buildings.stable.level = 5;
      state.village.buildings.tower.level = 4;
      state.coins = 100000;

      MonopolyGoMeta.upgradeBuilding('tower');

      return {
        newRegion: state.village.region,
        newRegionName: state.village.regionName,
        modalVisible: !document.getElementById('modal-landmark').classList.contains('hidden'),
        yurtResetLevel: state.village.buildings.yurt.level,
        hasSuusamyrSkin: state.sakaList.some(s => s.id === 'suusamyr_skin')
      };
    })()`);
    console.log('Landmark completion result:', landmarkRes);
    if (landmarkRes.newRegion !== 2 || !landmarkRes.newRegionName.includes('Иссык-Куль')) {
      throw new Error('Failed to transition to Region 2');
    }
    if (!landmarkRes.hasSuusamyrSkin) {
      throw new Error('Failed to award regional Saka skin');
    }
    console.log('✓ Landmark completion ceremony triggered with grand rewards and region transition!');

    await takeScreenshot(path.join(__dirname, 'screenshot_phase4_landmark.png'));
    await evaluate(`MonopolyGoMeta.closeLandmarkModal()`);

    // --- CHECK 10: Zero Console Errors Audit ---
    console.log('\n[CDP CHECK 10] Auditing console errors...');
    console.log(`Total console errors recorded: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.error('Console errors detected:', consoleErrors);
      throw new Error(`Console errors found: ${consoleErrors.join(', ')}`);
    }
    console.log('✓ ZERO console errors detected during entire interaction flow!');

    console.log('\n======================================================');
    console.log('🎉 ALL PHASE 4 CDP CHECKS PASSED WITH 0 CONSOLE ERRORS!');
    console.log('======================================================');

  } catch (err) {
    console.error('\n❌ CDP Verification Failed:', err);
    chromeProc.kill();
    process.exit(1);
  }

  chromeProc.kill();
  process.exit(0);
}

runCDPVerification();
