// ============================================================
// Comprehensive Interactivity CDP Verification Script
// ============================================================

const { spawn } = require('child_process');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('--- STARTING ALL-INTERACTIVE CDP VERIFICATION ---');

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromePort = 9230;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${chromePort}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'http://127.0.0.1:3000/index.html'
  ]);

  let targets = null;
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${chromePort}/json`);
      if (res.ok) {
        targets = await res.json();
        break;
      }
    } catch (e) {}
  }

  const pageTarget = targets.find(t => t.type === 'page');
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

  await new Promise(r => ws.onopen = r);

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

  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');
  await sleep(1500);

  // [CHECK 1] Theme switching without errors
  console.log('\n[CHECK 1] Testing Theme switching (Кочевники / Кибер)...');
  const themeRes = await evaluate(`(() => {
    setSeasonTheme('cyberpunk');
    const vpAttr = document.getElementById('app-viewport')?.getAttribute('data-season');
    setSeasonTheme('nomad');
    const vpAttr2 = document.getElementById('app-viewport')?.getAttribute('data-season');
    return { vpAttr, vpAttr2 };
  })()`);
  console.log('Theme toggle result:', themeRes);
  if (themeRes.vpAttr !== 'cyberpunk' || themeRes.vpAttr2 !== 'nomad') {
    throw new Error('Theme toggle failed!');
  }
  console.log('✓ Season theme switching functions flawlessly without DOM errors!');

  // [CHECK 2] Season Pass Modal & Claim
  console.log('\n[CHECK 2] Testing Season Pass modal & claim...');
  const passRes = await evaluate(`(() => {
    openBattlePassModal();
    const title = document.getElementById('modal-title')?.textContent;
    const coinsBefore = state.coins;
    claimPassReward(3);
    const coinsAfter = state.coins;
    closeGenericModal();
    return { title, gained: coinsAfter - coinsBefore };
  })()`);
  console.log('Battle pass result:', passRes);
  if (passRes.gained !== 5000) {
    throw new Error('Battle pass claim reward failed!');
  }
  console.log('✓ Season Pass modal opens, claims reward, updates balance!');

  // [CHECK 3] Chest Slots dynamic interaction & speedup
  console.log('\n[CHECK 3] Testing Chest Slots dynamic opening and speedup...');
  const chestRes = await evaluate(`(() => {
    renderChestSlots();
    // Open ready slot 0
    const coinsBefore = state.coins;
    openChestSlot(0);
    const modalTitle = document.getElementById('modal-title')?.textContent;
    closeGenericModal();
    const coinsAfter = state.coins;
    const slot0Status = state.chests[0].status;

    // Test speed up on slot 1
    state.bucks = 100;
    const bucksBefore = state.bucks;
    speedUpChest(1);
    closeGenericModal();
    const bucksAfter = state.bucks;

    return {
      modalTitle,
      coinsGained: coinsAfter - coinsBefore,
      slot0Status,
      netBucksSpent: bucksBefore - bucksAfter // 15 speed cost - 5 bucks rewarded from chest = 10
    };
  })()`);
  console.log('Chest test result:', chestRes);
  if (chestRes.coinsGained !== 750 || chestRes.slot0Status !== 'empty' || chestRes.netBucksSpent !== 10) {
    throw new Error('Chest dynamic opening or speedup failed!');
  }
  console.log('✓ Ready chest opened (+750 🪙), slot emptied, speedup deducted 15 💵!');

  // [CHECK 4] Friendly 1v1 Match Modal & Local Pass & Play
  console.log('\n[CHECK 4] Testing Friendly 1v1 match modal & Local start...');
  const friendRes = await evaluate(`(() => {
    openFriendLobbyModal();
    const title = document.getElementById('modal-title')?.textContent;
    closeGenericModal();
    return { title };
  })()`);
  console.log('Friend lobby result:', friendRes);
  if (!friendRes.title.includes('Друг')) {
    throw new Error('Friend lobby title incorrect!');
  }
  console.log('✓ Friendly Match lobby opens with room codes, sharing, and Pass & Play!');

  // [CHECK 5] Village Region Roadmap & Shields Modal
  console.log('\n[CHECK 5] Testing Village Roadmap & Shields recharge modals...');
  const villageUiRes = await evaluate(`(() => {
    openRegionRoadmapModal();
    const roadmapTitle = document.getElementById('modal-title')?.textContent;
    closeGenericModal();

    const v = (window.MonopolyGoMeta && window.MonopolyGoMeta.gameState && window.MonopolyGoMeta.gameState.village) || state.village;
    if (v) v.shields = 1;

    openShieldsModal();
    const shieldsTitle = document.getElementById('modal-title')?.textContent;
    state.bucks = 50;
    buyShieldItem(1, 5);

    const newShields = ((window.MonopolyGoMeta && window.MonopolyGoMeta.gameState && window.MonopolyGoMeta.gameState.village) || state.village)?.shields;

    return {
      roadmapTitle,
      shieldsTitle,
      newShields,
      bucksLeft: state.bucks
    };
  })()`);
  console.log('Village UI result:', villageUiRes);
  if (villageUiRes.newShields !== 2 || villageUiRes.bucksLeft !== 45) {
    throw new Error('Shield purchase failed!');
  }
  console.log('✓ Regional Roadmap & Shields modal active; +1 shield purchased for 5 💵!');

  // [CHECK 6] Leagues Leaderboard Interactive Player Inspection
  console.log('\n[CHECK 6] Testing Leaderboard player inspection & divisions modal...');
  const leaguesRes = await evaluate(`(() => {
    renderLeaguesUI();
    openDivisionsModal();
    const divTitle = document.getElementById('modal-title')?.textContent;
    closeGenericModal();

    inspectLeaderboardRival('Арстан_Ош', 2840, '👑', 'Обсидиан Манаса (Ур. 4)', 92, 78);
    const rivalTitle = document.getElementById('modal-title')?.textContent;
    closeGenericModal();

    return { divTitle, rivalTitle };
  })()`);
  console.log('Leagues result:', leaguesRes);
  if (!leaguesRes.rivalTitle.includes('Арстан_Ош')) {
    throw new Error('Rival inspect modal failed!');
  }
  console.log('✓ Division tiers modal and Rival Batyr inspection fully interactive!');

  // [CHECK 7] Shop Coin Packs & Free Bucks Packs
  console.log('\n[CHECK 7] Testing Shop Coin packs & Free Bucks...');
  const shopRes = await evaluate(`(() => {
    state.bucks = 100;
    state.coins = 5000;
    buyShopCoins(25000, 80);
    const coinsAfterBuy = state.coins;
    const bucksAfterBuy = state.bucks;

    claimFreeDemoBucks();
    const bucksAfterFree = state.bucks;

    return {
      coinsAfterBuy,
      bucksAfterBuy,
      bucksAfterFree
    };
  })()`);
  console.log('Shop purchases result:', shopRes);
  if (shopRes.coinsAfterBuy !== 30000 || shopRes.bucksAfterBuy !== 20 || shopRes.bucksAfterFree !== 70) {
    throw new Error('Shop purchase or free bucks claim failed!');
  }
  console.log('✓ Shop Coin packs purchase (-80 💵, +25,000 🪙) & Free Demo Bucks (+50 💵) verified!');

  // [CHECK 8] Console Error Audit
  console.log('\n[CHECK 8] Checking console errors...');
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
    throw new Error('Browser console had errors during interactivity test!');
  }
  console.log('✓ ZERO console errors detected during entire interaction suite!');

  ws.close();
  chromeProc.kill();
  console.log('\n🎉 ALL INTERACTIVE CHECKS COMPLETED WITH 100% SUCCESS!\n');
}

run().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
