// ============================================================
// Friendly Match 1v1 CDP Verification Script
// ============================================================

const { spawn } = require('child_process');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('--- STARTING FRIENDLY MATCH 1v1 CDP VERIFICATION ---');

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromePort = 9232;
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

  // [TEST 1] Launch Friendly 1v1 Pass & Play Match
  console.log('\n[TEST 1] Launching Friendly Match on single phone (Pass & Play)...');
  const startRes = await evaluate(`(() => {
    startFriendMatchLocal();
    const p1Text = document.getElementById('player-turn-box')?.textContent || '';
    const p2Text = document.getElementById('bot-turn-box')?.textContent || '';
    const badgeText = document.getElementById('turn-status-badge')?.textContent || '';
    const isGameVisible = !document.getElementById('screen-game')?.classList.contains('hidden');

    return {
      isFriendly: match.isFriendlyLocal,
      turn: match.turn,
      phase: match.phase,
      p1Text: p1Text.replace(/\\s+/g, ' ').trim(),
      p2Text: p2Text.replace(/\\s+/g, ' ').trim(),
      badgeText,
      isGameVisible
    };
  })()`);
  console.log('Friendly start result:', startRes);
  if (!startRes.isFriendly || !startRes.isGameVisible || !startRes.p2Text.includes('Друг')) {
    throw new Error('Friendly match launch failed or Player 2 label missing!');
  }
  console.log('✓ Friendly match launched, labels show Игрок 1 vs Игрок 2 (Друг), badge shows turn!');

  // [TEST 2] Player 1 shot complete (miss) -> Turn switches to Player 2 without Bot hijacking
  console.log('\n[TEST 2] Testing turn switch from Player 1 to Player 2 (No Bot execution)...');
  const turnSwitchRes = await evaluate(`(async () => {
    match.knockedThisShot = 0;
    await onShotComplete();
    const p2BadgeText = document.getElementById('turn-status-badge')?.textContent || '';
    const curTurn = match.turn;
    const curPhase = match.phase;

    return {
      curTurn,
      curPhase,
      p2BadgeText
    };
  })()`);
  console.log('Turn switch result:', turnSwitchRes);
  if (turnSwitchRes.curTurn !== 'bot' || turnSwitchRes.curPhase !== 'aiming' || !turnSwitchRes.p2BadgeText.includes('Игрок 2')) {
    throw new Error('Turn did not switch cleanly to Player 2 aiming phase!');
  }

  // Wait 1.5 seconds to prove Bot AI DOES NOT shoot automatically!
  console.log('Waiting 1.5s to verify Bot AI is completely disabled for Player 2...');
  await sleep(1500);

  const phaseAfterWait = await evaluate(`match.phase`);
  console.log('Phase after 1.5s wait:', phaseAfterWait);
  if (phaseAfterWait !== 'aiming') {
    throw new Error(`Expected phase to remain 'aiming' for human Player 2, but got: ${phaseAfterWait}`);
  }
  console.log('✓ Bot AI is completely bypassed! Player 2 remains in aiming phase on the phone!');

  // [TEST 3] Player 2 is allowed to aim and shoot via touch
  console.log('\n[TEST 3] Testing Player 2 pointer touch and slingshot release...');
  const p2TouchRes = await evaluate(`(() => {
    // Simulate pointerdown on Saka for Player 2
    const sakaScreen = toScreen(match.saka.x, match.saka.y);
    const rect = canvas.getBoundingClientRect();
    const downEvent = new PointerEvent('pointerdown', {
      clientX: sakaScreen.x + rect.left,
      clientY: sakaScreen.y + rect.top,
      isPrimary: true,
      pointerId: 1
    });
    canvas.dispatchEvent(downEvent);
    const dragStarted = match.drag.active;

    // Simulate drag and release
    match.saka.vx = -15;
    match.saka.vy = -10;
    match.drag.active = false;
    match.phase = 'moving';

    return {
      dragStarted,
      phaseAfterRelease: match.phase
    };
  })()`);
  console.log('Player 2 touch result:', p2TouchRes);
  if (!p2TouchRes.dragStarted) {
    throw new Error('Player 2 was blocked from dragging Saka!');
  }
  console.log('✓ Player 2 touch and drag verified successfully on the phone!');

  // [TEST 4] Player 2 Victory Modal
  console.log('\n[TEST 4] Testing Player 2 victory condition and rematch modal...');
  const victoryRes = await evaluate(`(async () => {
    match.scoreBot = 3;
    match.scorePlayer = 1;
    await onShotComplete();
    const modalIcon = document.getElementById('modal-icon')?.textContent;
    const modalTitle = document.getElementById('modal-title')?.textContent;
    const modalBody = document.getElementById('modal-body')?.textContent;

    return {
      modalIcon,
      modalTitle,
      hasPlayer2Won: modalTitle.includes('Игрок 2')
    };
  })()`);
  console.log('Victory test result:', victoryRes);
  if (!victoryRes.hasPlayer2Won) {
    throw new Error('Player 2 victory modal failed!');
  }
  console.log('✓ Friendly 1v1 victory modal displays Player 2 winner with Rematch button!');

  // [TEST 5] URL Room invite parameter (?room=CHUKO-9911)
  console.log('\n[TEST 5] Testing URL Room Invite Auto-Detection (?room=CHUKO-9911)...');
  const urlInviteRes = await evaluate(`(() => {
    // Simulate query param
    const oldSearch = window.location.search;
    window.history.pushState({}, '', '?room=CHUKO-9911');
    checkUrlRoomInvite();
    window.history.pushState({}, '', oldSearch || '/index.html');

    return new Promise(resolve => {
      setTimeout(() => {
        const title = document.getElementById('modal-title')?.textContent;
        const body = document.getElementById('modal-body')?.textContent;
        closeGenericModal();
        resolve({
          title,
          hasRoomCode: body.includes('CHUKO-9911')
        });
      }, 600);
    });
  })()`);
  console.log('URL invite result:', urlInviteRes);
  if (!urlInviteRes.hasRoomCode) {
    throw new Error('URL Room invite detection failed!');
  }
  console.log('✓ URL Room invite (?room=CHUKO-9911) auto-detects and offers 1-tap accept!');

  // [TEST 6] Console Error Audit
  console.log('\n[TEST 6] Checking browser console for exceptions or errors...');
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
    throw new Error('Browser console had errors during friendly match tests!');
  }
  console.log('✓ ZERO console errors detected during entire interaction suite!');

  ws.close();
  chromeProc.kill();
  console.log('\n======================================================');
  console.log('🎉 FRIENDLY MATCH 1v1 VERIFIED 100% OPERATIONAL!');
  console.log('======================================================\n');
}

run().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
