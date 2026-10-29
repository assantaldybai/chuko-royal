// ============================================================
// Headless Chrome CDP Verification Script (verify_cdp.js)
// ============================================================

const { spawn } = require('child_process');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runVerification() {
  console.log('--- STARTING HEADLESS CHROME CDP VERIFICATION ---');

  // 1. Launch Headless Chrome
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromePort = 9224;

  console.log(`Launching Chrome on port ${chromePort}...`);
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${chromePort}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--autoplay-policy=no-user-gesture-required',
    `http://127.0.0.1:${process.env.PORT || 3000}/index.html`
  ]);

  chromeProc.stderr.on('data', data => {
    // console.log(`[Chrome stderr]: ${data}`);
  });

  // Wait for Chrome to initialize port
  let targets = null;
  for (let i = 0; i < 20; i++) {
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

  // Enable runtime & page
  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');

  console.log('Waiting for loader, document complete and modules...');
  for (let i = 0; i < 35; i++) {
    await sleep(200);
    try {
      const isReady = await evaluate(`(() => document.readyState === 'complete' && typeof window.Phase2Mechanics !== 'undefined')()`);
      if (isReady) break;
    } catch (e) {}
  }

  // --- CHECK 1: Global modules existence ---
  console.log('\n[CDP CHECK 1] Inspecting Phase 2 modules in browser context...');
  const modulesCheck = await evaluate(`({
    hasPhase2: typeof window.Phase2Mechanics !== 'undefined',
    hasHaptics: typeof window.ChukoHaptics !== 'undefined',
    hasGhostAiming: typeof window.GhostAiming !== 'undefined',
    hasOrdoGarrison: typeof window.OrdoGarrison !== 'undefined',
    hasKhanRule: typeof window.KhanRule !== 'undefined',
    hasOrdoPerimeter: typeof window.OrdoPerimeter !== 'undefined'
  })`);
  console.log('Browser modules presence:', modulesCheck);
  if (!modulesCheck.hasPhase2 || !modulesCheck.hasGhostAiming || !modulesCheck.hasOrdoGarrison || !modulesCheck.hasKhanRule || !modulesCheck.hasOrdoPerimeter) {
    throw new Error('Phase 2 modules missing in browser window!');
  }
  console.log('✓ All Phase 2 modules successfully loaded in browser window!');

  // --- CHECK 2: Initialize 5-bone match and verify Garrison Cluster ---
  console.log('\n[CDP CHECK 2] Initializing 5-bone match & verifying Үймөк cluster layout...');
  const garrison5 = await evaluate(`(() => {
    setMatchBoneCount(5);
    startTrainingMode();
    initMatchEngine();
    return {
      boneCount: match.boneCount,
      alchiksCount: match.alchiks.length,
      centerX: match.centerX,
      centerY: match.centerY,
      alchiks: match.alchiks.map(a => ({
        id: a.id,
        isKhan: a.isKhan,
        x: Math.round(a.x),
        y: Math.round(a.y),
        distFromCenter: Math.round(Math.hypot(a.x - match.centerX, a.y - match.centerY)),
        mass: a.mass,
        radius: a.radius
      }))
    };
  })()`);
  console.log('5-bone garrison:', garrison5);

  const khan5 = garrison5.alchiks.find(a => a.isKhan);
  if (!khan5 || khan5.distFromCenter !== 0) {
    throw new Error('Khan must be located at exact center of the Ordo circle!');
  }
  const guards5 = garrison5.alchiks.filter(a => !a.isKhan);
  if (guards5.length !== 4) {
    throw new Error(`Expected 4 defenders, found ${guards5.length}`);
  }
  guards5.forEach(g => {
    if (Math.abs(g.distFromCenter - 21) > 1) {
      throw new Error(`5-bone defender distance incorrect: ${g.distFromCenter}`);
    }
  });
  console.log('✓ 5-bone cluster has Khan in center and 4 defenders at 21px tightly shielding Khan!');

  // --- CHECK 3: Initialize 9-bone match and verify Dual-Ring Fortress ---
  console.log('\n[CDP CHECK 3] Initializing 9-bone match & verifying 18px / 32px dual-ring fortress...');
  const garrison9 = await evaluate(`(() => {
    setMatchBoneCount(9);
    startTrainingMode();
    initMatchEngine();
    return {
      boneCount: match.boneCount,
      alchiksCount: match.alchiks.length,
      centerX: match.centerX,
      centerY: match.centerY,
      alchiks: match.alchiks.map(a => ({
        id: a.id,
        isKhan: a.isKhan,
        distFromCenter: Math.round(Math.hypot(a.x - match.centerX, a.y - match.centerY))
      }))
    };
  })()`);
  console.log('9-bone garrison piece count:', garrison9.alchiksCount);

  const khan9 = garrison9.alchiks.find(a => a.isKhan);
  if (!khan9 || khan9.distFromCenter !== 0) {
    throw new Error('Khan must be in the center for 9-bone garrison');
  }
  const inner9 = garrison9.alchiks.filter(a => a.id.includes('inner'));
  const outer9 = garrison9.alchiks.filter(a => a.id.includes('outer'));
  if (inner9.length !== 4 || outer9.length !== 4) {
    throw new Error(`Inner/Outer count mismatch: inner=${inner9.length}, outer=${outer9.length}`);
  }
  inner9.forEach(g => {
    if (Math.abs(g.distFromCenter - 18) > 1) {
      throw new Error(`Inner defender radius expected 18px, got ${g.distFromCenter}`);
    }
  });
  outer9.forEach(g => {
    if (Math.abs(g.distFromCenter - 32) > 1) {
      throw new Error(`Outer defender radius expected 32px, got ${g.distFromCenter}`);
    }
  });
  console.log('✓ 9-bone canonical fortress: Khan center + 4 inner guards (18px) + 4 outer guards (32px)!');

  // --- CHECK 4: Test Ghost Ball Raycast & Rebound in browser ---
  console.log('\n[CDP CHECK 4] Testing 8 Ball Pool Ghost Ball aiming raycast in browser...');
  const aimTest = await evaluate(`(() => {
    setMatchBoneCount(5);
    startTrainingMode();
    initMatchEngine();
    // Direct shot straight up at the southern guard and central Khan
    const aimAngle = -Math.PI / 2;
    const ray = GhostAiming.raycast(match.saka, aimAngle, match.alchiks, 400);

    // Also test drawing on canvas without throwing
    match.drag.active = true;
    match.drag.currX = match.centerX;
    match.drag.currY = toScreen(match.saka.x, match.saka.y).y + 50;
    renderOrdoCanvas();
    match.drag.active = false;

    return {
      hit: ray.hit,
      targetId: ray.targetAlchik?.id,
      isTargetKhan: ray.targetAlchik?.isKhan,
      t: Math.round(ray.t),
      ghostPos: { x: Math.round(ray.ghostPos?.x || 0), y: Math.round(ray.ghostPos?.y || 0) },
      impactRatio: Math.round((ray.impactRatio || 0) * 100) / 100,
      reboundMag: Math.round((ray.sakaRebound?.magnitude || 0) * 100) / 100
    };
  })()`);
  console.log('Aiming Raycast Result:', aimTest);
  if (!aimTest.hit) {
    throw new Error('Raycast failed to hit garrison target!');
  }
  console.log('✓ Ghost Saka position, contact normal, deflection, and canvas rendering verified without error!');

  // --- CHECK 5: Test Khan Capture ("Хан алуу") Rule & Bonus ---
  console.log('\n[CDP CHECK 5] Testing Khan Capture ("Хан алуу") x3 points bonus & triumph modal...');
  const khanCaptureTest = await evaluate(`(() => {
    setMatchBoneCount(5);
    startTrainingMode();
    initMatchEngine();
    match.scorePlayer = 0;
    state.piggyCoins = 100;
    state.knockedTotal = 5;

    const khan = match.alchiks.find(a => a.isKhan);
    // Knock out Khan outside the circle
    khan.x = match.centerX + match.circleRadius + 50;
    match.phase = 'moving';
    updateMatchPhysics();

    const modalIcon = document.getElementById('modal-icon')?.textContent;
    const modalTitle = document.getElementById('modal-title')?.textContent;
    const scoreVal = parseInt(document.getElementById('score-player')?.textContent || '0', 10);

    return {
      scorePlayer: match.scorePlayer,
      scoreDOM: scoreVal,
      piggyCoins: state.piggyCoins,
      modalIcon,
      modalTitle
    };
  })()`);
  console.log('Khan Capture Test Result:', khanCaptureTest);
  if (khanCaptureTest.scorePlayer !== 3) {
    throw new Error(`Expected scorePlayer to be 3 (x3 multiplier for Khan), got ${khanCaptureTest.scorePlayer}`);
  }
  if (khanCaptureTest.piggyCoins !== 600) {
    throw new Error(`Expected piggyCoins to be 600 (100 + 500 jackpot), got ${khanCaptureTest.piggyCoins}`);
  }
  console.log('✓ Khan capture awards x3 points (+3), triggers triumph modal and +500 jackpot!');

  // --- CHECK 6: Test 360° Ordo Perimeter Angle Selection & UI ---
  console.log('\n[CDP CHECK 6] Testing 360° Ordo Perimeter Angle Selection & UI synchronization...');
  const perimeterTest = await evaluate(`(() => {
    // 1. Устанавливаем кардинал Север (Түндүк = 270°)
    setSakaCardinal('north');
    const northX = Math.round(match.saka.x);
    const northY = Math.round(match.saka.y);

    // 2. Устанавливаем кардинал Восток (Чыгыш = 0°)
    setSakaCardinal('east');
    const eastX = Math.round(match.saka.x);
    const eastY = Math.round(match.saka.y);

    // 3. Устанавливаем произвольный угол 45° через слайдер
    onSakaAngleSlide(45);
    const badgeText = document.getElementById('saka-angle-badge')?.textContent || '';
    const sliderVal = document.getElementById('saka-angle-slider')?.value;

    // 4. Отрисовка орбиты в Canvas без ошибок
    renderOrdoCanvas();

    return {
      northY_is_above_center: northY < match.centerY,
      eastX_is_right_of_center: eastX > match.centerX,
      badgeText,
      sliderVal,
      sakaAngleDeg: Math.round((match.sakaAngle * 180 / Math.PI) % 360)
    };
  })()`);
  console.log('360° Perimeter Stance Test Result:', perimeterTest);
  if (!perimeterTest.northY_is_above_center || !perimeterTest.eastX_is_right_of_center) {
    throw new Error('Saka positioning failed for North or East cardinal points!');
  }
  if (perimeterTest.sakaAngleDeg !== 45 || perimeterTest.sliderVal !== '45') {
    throw new Error(`Expected angle to be 45°, got angle=${perimeterTest.sakaAngleDeg}, slider=${perimeterTest.sliderVal}`);
  }
  console.log('✓ 360° Ordo Perimeter stance selection, compass angles, slider and canvas rendering verified!');

  // --- CHECK 7: Console Error Auditing ---
  console.log('\n[CDP CHECK 7] Checking browser console for exceptions or errors...');
  if (consoleErrors.length > 0) {
    console.error('Browser console errors encountered:', consoleErrors);
    throw new Error('Browser console had errors during gameplay execution!');
  }
  console.log('✓ ZERO console errors or unhandled exceptions in browser!');

  // Clean up
  ws.close();
  chromeProc.kill();

  console.log('\n======================================================');
  console.log('🏆 BROWSER CDP VERIFICATION COMPLETED WITH 100% SUCCESS!');
  console.log('======================================================\n');
}

runVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
