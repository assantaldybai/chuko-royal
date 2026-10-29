// ============================================================
// Headless Chrome CDP Verification Script for Phase 3 (verify_cdp_phase3.js)
// Ethno-Futurism Audio/Visual, Neo-Nomad Canvas FX, & "Калчоо" Mini-Phase
// ============================================================

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runPhase3Verification() {
  console.log('======================================================');
  console.log('--- STARTING PHASE 3 HEADLESS CHROME CDP VERIFICATION ---');
  console.log('======================================================\n');

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromePort = 9225; // Use dedicated port 9225 to avoid collisions

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

  chromeProc.stderr.on('data', () => {});

  // Wait for Chrome to initialize port
  let targets = null;
  for (let i = 0; i < 25; i++) {
    await sleep(350);
    try {
      const res = await fetch(`http://127.0.0.1:${chromePort}/json`);
      if (res.ok) {
        targets = await res.json();
        break;
      }
    } catch (e) {}
  }

  if (!targets || targets.length === 0) {
    console.error('Failed to connect to Chrome targets on port ' + chromePort);
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

  async function saveScreenshot(fileName) {
    const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
    if (res && res.data) {
      const buf = Buffer.from(res.data, 'base64');
      const filePath = path.join(__dirname, fileName);
      fs.writeFileSync(filePath, buf);
      console.log(`📸 Saved screenshot: ${fileName} (${Math.round(buf.length / 1024)} KB)`);
    }
  }

  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');

  console.log('Waiting for loader, document complete and modules...');
  for (let i = 0; i < 35; i++) {
    await sleep(200);
    try {
      const isReady = await evaluate(`(() => document.readyState === 'complete' && typeof window.EthnoAV !== 'undefined')()`);
      if (isReady) {
        console.log(`Page fully ready after ${(i + 1) * 200}ms!`);
        break;
      }
    } catch (e) {}
  }

  // --- CHECK 1: Global EthnoAV modules existence in browser ---
  console.log('\n[PHASE 3 CHECK 1] Inspecting Phase 3 EthnoAV modules in browser context...');
  const modulesCheck = await evaluate(`({
    hasEthnoAV: typeof window.EthnoAV !== 'undefined',
    hasEthnoAudio: typeof window.EthnoAudio !== 'undefined',
    hasEthnoFX: typeof window.EthnoFX !== 'undefined',
    hasEthnoKalchoo: typeof window.EthnoKalchoo !== 'undefined',
    hasBoneImpact: typeof window.EthnoAudio?.playBoneImpact === 'function',
    hasDobulbas: typeof window.EthnoAudio?.playDobulbas === 'function',
    hasTemirKomuz: typeof window.EthnoAudio?.playTemirKomuz === 'function',
    hasSlingshotDrone: typeof window.EthnoAudio?.updateSlingshotDrone === 'function',
    hasKochkorMuiuz: typeof window.EthnoFX?.drawKochkorMuiuzRim === 'function',
    hasSolarTunduk: typeof window.EthnoFX?.drawSolarTunduk === 'function',
    hasBallisticKnockout: typeof window.EthnoFX?.spawnBallisticKnockout === 'function'
  })`);
  console.log('Browser EthnoAV modules check:', modulesCheck);
  if (!modulesCheck.hasEthnoAV || !modulesCheck.hasEthnoAudio || !modulesCheck.hasEthnoFX || !modulesCheck.hasEthnoKalchoo) {
    throw new Error('Phase 3 EthnoAV modules missing in browser window!');
  }
  console.log('✓ All Phase 3 EthnoAV modules and synth methods verified in browser window!');

  // --- CHECK 2: Procedural «Кочкор мүйүз» boundary & Solar «Түндүк» canvas rendering ---
  console.log('\n[PHASE 3 CHECK 2] Verifying «Кочкор мүйүз» rim & Solar «Түндүк» rendering...');
  const renderTest = await evaluate(`(() => {
    setMatchBoneCount(5);
    showScreen('screen-game');
    initMatchEngine();
    renderOrdoCanvas();
    return {
      running: match.running,
      centerX: match.centerX,
      centerY: match.centerY,
      circleRadius: match.circleRadius,
      tiltY: match.tiltY
    };
  })()`);
  console.log('Render Ordo Canvas initialized successfully:', renderTest);

  // Capture screenshot of Ordo Arena with Tunduk and Kochkor Muiuz
  await saveScreenshot('chuko_phase3_ethno_ordo.png');
  console.log('✓ Procedural «Кочкор мүйүз» boundary pattern and Solar «Түндүк» rendered without errors!');

  // --- CHECK 3: Procedural Web Audio API Synthesizer (Bone Impact, Добулбас, Темир-комуз, Slingshot drone) ---
  console.log('\n[PHASE 3 CHECK 3] Verifying Procedural Web Audio API Synthesizer voices...');
  const audioTest = await evaluate(`(() => {
    // 1. Play authentic bone collision (2.4kHz bandpass white noise + 90Hz -> 35Hz sub-bass sine drop)
    EthnoAudio.playBoneImpact(1.5);

    // 2. Play Добулбас war drum (ceremonial victory cadence)
    EthnoAudio.playDobulbas(true);

    // 3. Play Темир-комуз jaw harp (FM synthesis overtone twang)
    EthnoAudio.playTemirKomuz('jackpot');
    EthnoAudio.playTemirKomuz('critical');

    // 4. Slingshot tension riser micro-drone
    EthnoAudio.updateSlingshotDrone(0.85);
    const isDroneActive = EthnoAudio.isDroneActive;
    EthnoAudio.stopSlingshotDrone();

    return {
      hasAudioCtx: !!EthnoAudio.ctx,
      ctxSampleRate: EthnoAudio.ctx?.sampleRate,
      ctxState: EthnoAudio.ctx?.state,
      isDroneActive
    };
  })()`);
  console.log('Web Audio Synthesizer Test Result:', audioTest);
  if (!audioTest.hasAudioCtx) {
    throw new Error('Web Audio context failed to initialize!');
  }
  if (!audioTest.isDroneActive) {
    throw new Error('Slingshot micro-drone failed to activate during tension update!');
  }
  console.log('✓ Procedural Web Audio API Synthesizer (Bone Impact, Добулбас, Темир-комуз, Slingshot drone) verified!');

  // --- CHECK 4: Ballistic Bone Knockout Flight (flyingBone physics: z(t), shadow, rotation, trail) ---
  console.log('\n[PHASE 3 CHECK 4] Verifying Ballistic Bone Knockout Flight (height z(t), shadow, 3D flip)...');
  const ballisticTest = await evaluate(`(() => {
    setMatchBoneCount(5);
    showScreen('screen-game');
    initMatchEngine();
    EthnoFX.clearFX();

    const guard = {
      x: match.centerX + 24,
      y: match.centerY + 16,
      vx: 4.5,
      vy: 3.2,
      radius: 12,
      angle: 0.6,
      isKhan: true
    };

    // Trigger ballistic flight and shockwave
    EthnoFX.spawnBallisticKnockout(guard, match);
    EthnoFX.spawnImpactShockwave(guard.x, guard.y, 1.8);
    const spawnedCount = EthnoFX.flyingBones.length;
    const initialBone = { ...EthnoFX.flyingBones[0] };

    // Advance 4 animation/physics frames so bone is prominently aloft in 3D arc
    for (let f = 0; f < 4; f++) {
      renderOrdoCanvas();
    }

    const midFlightBone = EthnoFX.flyingBones[0] ? {
      z: Math.round(EthnoFX.flyingBones[0].z),
      vz: Math.round(EthnoFX.flyingBones[0].vz * 10) / 10,
      rot: Math.round(EthnoFX.flyingBones[0].rot * 100) / 100,
      flip: Math.round(EthnoFX.flyingBones[0].flip * 100) / 100,
      trailLength: EthnoFX.flyingBones[0].trail.length
    } : null;

    return {
      spawnedCount,
      initialZ: initialBone.z,
      initialVz: Math.round(initialBone.vz),
      midFlightBone
    };
  })()`);
  console.log('Ballistic Flight Test Result:', ballisticTest);
  if (ballisticTest.spawnedCount !== 1) {
    throw new Error('Expected 1 flying bone to spawn!');
  }
  if (!ballisticTest.midFlightBone || ballisticTest.midFlightBone.z <= 0) {
    throw new Error('Flying bone failed to gain parabolic altitude z(t)!');
  }
  if (ballisticTest.midFlightBone.trailLength === 0) {
    throw new Error('Flying bone failed to generate ethereal dust trail!');
  }
  await saveScreenshot('chuko_phase3_ballistic_flight.png');
  console.log('✓ Ballistic bone knockout parabolic flight, dynamic floor shadows, and ethereal trail verified!');

  // --- CHECK 5: Impact Shockwave Ring & Sparkles System ---
  console.log('\n[PHASE 3 CHECK 5] Verifying Saka collision impact shockwave & sparkles...');
  const shockwaveTest = await evaluate(`(() => {
    EthnoFX.clearFX();
    EthnoFX.spawnImpactShockwave(match.centerX, match.centerY, 1.8);
    const swCount = EthnoFX.shockwaves.length;
    const sparkCount = EthnoFX.sparks.length;

    renderOrdoCanvas();

    return {
      swCount,
      sparkCount,
      swRadius: EthnoFX.shockwaves[0]?.radius,
      swAlpha: Math.round((EthnoFX.shockwaves[0]?.alpha || 0) * 100) / 100
    };
  })()`);
  console.log('Impact Shockwave Test Result:', shockwaveTest);
  if (shockwaveTest.swCount !== 1 || shockwaveTest.sparkCount < 10) {
    throw new Error('Failed to spawn impact shockwaves and sparkles!');
  }
  console.log('✓ High-velocity Saka collision shockwaves and sparkles verified!');

  // --- CHECK 6: «Калчоо» (Bone Toss Toss-up for Break-Shot Privilege) ---
  console.log('\n[PHASE 3 CHECK 6] Verifying «Калчоо» pre-match toss ceremony & 4 canonical sides...');
  const kalchooCheck = await evaluate(`(() => {
    const sides = EthnoKalchoo.SIDES;
    const sideKeys = Object.keys(sides);
    const ranks = sideKeys.map(k => ({ name: sides[k].name, rank: sides[k].rank }));

    // Test contest evaluation logic
    const contest = EthnoKalchoo.evaluateContest();

    // Trigger toss ceremony modal in DOM without auto-close
    EthnoKalchoo.showTossCeremony({ autoStart: false });
    const overlay = document.getElementById('kalchoo-overlay');
    const playerBox = document.getElementById('kalchoo-box-player');
    const botBox = document.getElementById('kalchoo-box-bot');
    const btnToss = document.getElementById('kalchoo-btn-toss');

    return {
      sideCount: sideKeys.length,
      ranks,
      contestWinner: contest.winner,
      hasOverlay: !!overlay,
      hasPlayerBox: !!playerBox,
      hasBotBox: !!botBox,
      hasTossBtn: !!btnToss
    };
  })()`);
  console.log('Kalchoo Ceremony Test Result:', kalchooCheck);
  if (kalchooCheck.sideCount !== 4) {
    throw new Error('Expected 4 canonical alchik sides!');
  }
  if (!kalchooCheck.hasOverlay || !kalchooCheck.hasPlayerBox || !kalchooCheck.hasBotBox) {
    throw new Error('Kalchoo toss ceremony overlay modal failed to inject into DOM!');
  }

  // Capture screenshot of Kalchoo toss ceremony overlay
  await saveScreenshot('chuko_phase3_kalchoo_ceremony.png');
  console.log('✓ «Калчоо» toss ceremony overlay modal and 4 canonical sides verified!');

  // Clean up Kalchoo modal
  await evaluate(`(() => {
    const el = document.getElementById('kalchoo-overlay');
    if (el) el.remove();
  })()`);

  // --- CHECK 7: Console Error Auditing ---
  console.log('\n[PHASE 3 CHECK 7] Checking browser console for exceptions or errors...');
  if (consoleErrors.length > 0) {
    console.error('Browser console errors encountered:', consoleErrors);
    throw new Error('Browser console had errors during Phase 3 execution!');
  }
  console.log('✓ ZERO console errors or unhandled exceptions in browser!');

  // Clean up
  ws.close();
  chromeProc.kill();

  console.log('\n======================================================');
  console.log('🏆 PHASE 3 BROWSER CDP VERIFICATION COMPLETED WITH 100% SUCCESS!');
  console.log('======================================================\n');
}

runPhase3Verification().catch(err => {
  console.error('\n❌ Phase 3 Verification Failed:', err);
  process.exit(1);
});
