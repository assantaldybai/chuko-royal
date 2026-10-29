// ============================================================
// Chuko Royal MVP — Core Game Engine & UI Logic (2.5D Ordo)
// game.js
// ============================================================

// ==================== 1. ГЛОБАЛЬНОЕ СОСТОЯНИЕ ====================
const state = {
  season: 'nomad',
  coins: 5000,
  bucks: 10,
  trophies: 0,
  piggyCoins: 0,
  knockedTotal: 0,
  playerLevel: 1,
  username: 'Nomad_kg',
  avatarEmoji: '🥷',
  totalWins: 0,
  totalLosses: 0,
  lastDailyBonus: null,
  selectedBoneCount: 5,
  equippedSakaId: 'lead',
  currentMatchId: null, // UUID с сервера Supabase
  sakaList: [
    {
      id: 'lead',
      name: 'Ханский Свинец',
      level: 1,
      color: '#f59e0b',
      border: '#fef3c7',
      massStat: 60,
      stabilityStat: 55,
      bounceStat: 52,
      upgradeCost: 800,
      isEquipped: true
    },
    {
      id: 'cyber',
      name: 'Кибер-Титан X9',
      level: 1,
      color: '#06b6d4',
      border: '#ecfeff',
      massStat: 75,
      stabilityStat: 80,
      bounceStat: 72,
      upgradeCost: 1500,
      isEquipped: false
    },
    {
      id: 'jade',
      name: 'Иссык-Кульский Нефрит',
      level: 1,
      color: '#10b981',
      border: '#d1fae5',
      massStat: 55,
      stabilityStat: 85,
      bounceStat: 65,
      upgradeCost: 1000,
      isEquipped: false
    }
  ]
};

// ==================== 2. ЗВУКОВОЙ СИНТЕЗАТОР (Web Audio API) ====================
let audioCtx = null;
function playBoneSound(type = 'hit', intensity = 1) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'hit') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220 * intensity, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.08);
      gain.gain.setValueAtTime(Math.min(0.45, 0.25 * intensity), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.085);
    } else if (type === 'out') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.18);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'khan_triumph') {
      // Королевский триумфальный фанфар (арпеджио C5 - E5 - G5 - C6)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.type = 'triangle';
        const noteStart = now + idx * 0.07;
        o.frequency.setValueAtTime(freq, noteStart);
        g.gain.setValueAtTime(0.35, noteStart);
        g.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.32);
        o.start(noteStart);
        o.stop(noteStart + 0.33);
      });
    }
  } catch (e) {}
}

// ==================== 3. ЭКРАНЫ И НАВИГАЦИЯ ====================
function showScreen(screenId) {
  const screens = ['screen-loader', 'screen-auth', 'screen-lobby', 'screen-arenas', 'screen-game'];
  screens.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', id !== screenId);
  });
  if (screenId === 'screen-arenas') {
    const arenaCoins = document.getElementById('arena-coins-view');
    if (arenaCoins) arenaCoins.textContent = state.coins.toLocaleString('ru-RU');
  }
}

function updateHUD() {
  const coinsEl = document.getElementById('hud-coins');
  const bucksEl = document.getElementById('hud-bucks');
  const trophiesEl = document.getElementById('hud-trophies');
  const piggyEl = document.getElementById('piggy-amount');
  const knockedCounter = document.getElementById('knockout-counter');
  const knockedBar = document.getElementById('knockout-bar');
  const userEl = document.getElementById('hud-username');
  const avatarEl = document.getElementById('hud-avatar');
  const levelEl = document.getElementById('hud-level');
  const equippedEl = document.getElementById('lobby-equipped-saka');

  if (coinsEl) coinsEl.textContent = Number(state.coins).toLocaleString('ru-RU');
  if (bucksEl) bucksEl.textContent = state.bucks;
  if (trophiesEl) trophiesEl.textContent = Number(state.trophies).toLocaleString('ru-RU');
  if (piggyEl) piggyEl.textContent = Number(state.piggyCoins).toLocaleString('ru-RU') + ' 🪙';
  if (knockedCounter) knockedCounter.textContent = state.knockedTotal;
  if (knockedBar) knockedBar.style.width = Math.min(100, ((state.knockedTotal % 20) / 20) * 100) + '%';
  if (userEl) userEl.textContent = state.username || 'Nomad_kg';
  if (avatarEl) avatarEl.textContent = state.avatarEmoji || '🥷';
  if (levelEl) levelEl.textContent = state.playerLevel || 1;

  const eq = getEquippedSaka();
  if (equippedEl && eq) {
    equippedEl.textContent = `${eq.name} (Ур. ${eq.level})`;
  }
}

function getEquippedSaka() {
  return state.sakaList.find(s => s.id === state.equippedSakaId) || state.sakaList[0];
}

// ==================== 4. СМЕНА СЕЗОНА ====================
function setSeasonTheme(season) {
  state.season = season;
  const vp = document.getElementById('app-viewport');
  if (vp) vp.setAttribute('data-season', season);

  const banner = document.getElementById('season-title-banner');
  const path = document.getElementById('hero-chuko-path');

  if (season === 'nomad') {
    if (banner) banner.textContent = 'Всемирные Игры Кочевников';
    if (path) path.setAttribute('stroke', '#451a03');
  } else if (season === 'cyberpunk') {
    if (banner) banner.textContent = 'Кибер-Ордо 2077 • Неоновый сезон';
    if (path) path.setAttribute('stroke', '#06b6d4');
  } else {
    if (banner) banner.textContent = 'Базовый сезон • Джайлоо Арена';
    if (path) path.setAttribute('stroke', '#365314');
  }
}

// ==================== 5. КОЛЛЕКЦИЯ И ПРОКАЧКА САКА (С СИНХРОНИЗАЦИЕЙ В SUPABASE) ====================
function openSakaModal() {
  renderSakaList();
  document.getElementById('modal-saka').classList.remove('hidden');
}

function closeSakaModal() {
  document.getElementById('modal-saka').classList.add('hidden');
}

function renderSakaList() {
  const container = document.getElementById('saka-collection-list');
  if (!container) return;
  container.innerHTML = '';

  state.sakaList.forEach(s => {
    const isEq = s.id === state.equippedSakaId;
    const card = document.createElement('div');
    card.className = `hud-card rounded-2xl p-3 border-2 ${isEq ? 'border-lime-400' : 'border-stone-700'} flex flex-col gap-2`;
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border-2 shadow" style="background:${s.color}; border-color:${s.border}; color:#09090b;">
            САКА
          </div>
          <div>
            <div class="text-xs font-black text-white">${s.name} <span class="text-amber-300">Ур. ${s.level}</span></div>
            <div class="text-[10px] text-stone-400">${isEq ? '✅ Выбран для боя' : 'В коллекции'}</div>
          </div>
        </div>
        ${isEq
          ? `<span class="text-[10px] font-black px-2 py-1 rounded-lg bg-lime-400/20 text-lime-300 border border-lime-400/40">Активен</span>`
          : `<button onclick="handleEquipSaka('${s.id}')" class="btn-tap text-[10px] font-black px-2.5 py-1.5 rounded-xl bg-stone-700 text-white hover:bg-stone-600">Выбрать</button>`
        }
      </div>

      <div class="grid grid-cols-3 gap-1.5 text-[10px]">
        <div class="bg-black/40 p-1.5 rounded-lg text-center">
          <div class="text-stone-400 text-[9px]">Вес (Мощь)</div>
          <div class="font-black text-amber-300 mt-0.5">${s.massStat}/100</div>
        </div>
        <div class="bg-black/40 p-1.5 rounded-lg text-center">
          <div class="text-stone-400 text-[9px]">Меткость</div>
          <div class="font-black text-lime-300 mt-0.5">${s.stabilityStat}/100</div>
        </div>
        <div class="bg-black/40 p-1.5 rounded-lg text-center">
          <div class="text-stone-400 text-[9px]">Упругость</div>
          <div class="font-black text-cyan-300 mt-0.5">${s.bounceStat}/100</div>
        </div>
      </div>

      <button onclick="handleUpgradeSaka('${s.id}')" class="btn-tap w-full py-1.5 rounded-xl bg-amber-400 text-stone-950 font-black text-xs hover:bg-amber-300 flex items-center justify-center gap-1.5">
        <span>⬆ Улучшить (+3)</span>
        <span class="text-[11px] opacity-90">${s.upgradeCost.toLocaleString('ru-RU')} 🪙</span>
      </button>
    `;
    container.appendChild(card);
  });
}

async function handleEquipSaka(id) {
  state.equippedSakaId = id;
  updateHUD();
  renderSakaList();

  if (currentUser) {
    await serverEquipSaka(id);
  }
}

async function handleUpgradeSaka(id) {
  const s = state.sakaList.find(x => x.id === id);
  if (!s) return;

  if (state.coins < s.upgradeCost) {
    showModal('🛒', 'Недостаточно монет', `Для улучшения требуется <b>${s.upgradeCost.toLocaleString('ru-RU')} 🪙</b>. Сыграйте матч на арене или заберите подарок!`);
    return;
  }

  if (currentUser) {
    const res = await serverUpgradeSaka(id);
    if (res && res.success) {
      showModal('✨', 'Сака улучшен!', `Уровень повышен до <b>${res.new_level}</b>! Мощь, меткость и отскок выросли на +3.`);
    }
  } else {
    // Офлайн режим
    state.coins -= s.upgradeCost;
    s.level += 1;
    s.massStat = Math.min(100, s.massStat + 3);
    s.stabilityStat = Math.min(100, s.stabilityStat + 3);
    s.bounceStat = Math.min(100, s.bounceStat + 3);
    s.upgradeCost = Math.round(s.upgradeCost * 1.4);
    updateHUD();
    renderSakaList();
    showModal('✨', 'Сака улучшен!', `Уровень повышен до <b>${s.level}</b>!`);
  }
}

// ==================== 6. ДНЕВНОЙ БОНУС (СЕРВЕРНАЯ ПРОВЕРКА ВРЕМЕНИ) ====================
async function claimFreeGift() {
  if (currentUser) {
    const res = await serverClaimDailyBonus();
    if (res && res.success) {
      const badge = document.getElementById('gift-badge');
      if (badge) badge.classList.add('hidden');
      showModal('🎁', 'Подарок получен!', `Вам начислено <b>+${res.bonus} 🪙</b> ежедневной награды!`);
    }
  } else {
    state.coins += 500;
    const badge = document.getElementById('gift-badge');
    if (badge) badge.classList.add('hidden');
    updateHUD();
    showModal('🎁', 'Бесплатный подарок!', 'Вам начислено <b>+500 🪙</b> ежедневного бонуса!');
  }
}

// ==================== 7. ЛИДЕРБОРД (ИЗ SUPABASE) ====================
async function openLeaderboardModal() {
  showModal('🌟', 'Рейтинг Ордо', '<div class="py-4 text-center text-stone-400">Загрузка рейтинга...</div>');

  let list = [];
  if (currentUser) {
    list = await serverGetLeaderboard(15);
  }

  if (!list || list.length === 0) {
    list = [
      { username: 'Manas_Pro', avatar_emoji: '👑', trophies: 4890, level: 18, total_wins: 210 },
      { username: 'Batyr_99', avatar_emoji: '🐺', trophies: 4420, level: 16, total_wins: 185 },
      { username: state.username || 'Nomad_kg', avatar_emoji: state.avatarEmoji || '🥷', trophies: state.trophies || 1230, level: state.playerLevel || 1, total_wins: state.totalWins || 14 }
    ];
  }

  let html = `<div class="flex flex-col gap-2 max-h-60 overflow-y-auto no-scrollbar text-left text-xs">`;
  list.forEach((player, i) => {
    const isMe = player.username === state.username;
    const rankMedal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : `${i + 1}.`));
    html += `
      <div class="flex items-center justify-between p-2 rounded-xl ${isMe ? 'bg-amber-500/20 border border-amber-400' : 'bg-black/30 border border-white/5'}">
        <div class="flex items-center gap-2">
          <span class="font-black text-amber-300 w-5 text-center">${rankMedal}</span>
          <span class="text-base">${player.avatar_emoji || '🥷'}</span>
          <div>
            <div class="font-bold text-white ${isMe ? 'text-amber-300' : ''}">${player.username}</div>
            <div class="text-[10px] text-stone-400">Ур. ${player.level} • Побед: ${player.total_wins}</div>
          </div>
        </div>
        <div class="font-black text-amber-400">🏆 ${Number(player.trophies).toLocaleString('ru-RU')}</div>
      </div>
    `;
  });
  html += `</div>`;

  showModal('🌟', 'Мировой Рейтинг Ордо', html);
}

// ==================== 8. МОДАЛЬНЫЕ ОКНА И ДЕТАЛИ ====================
function showModal(icon, title, body, actionsHtml = null) {
  const iconEl = document.getElementById('modal-icon');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  const actionsEl = document.getElementById('modal-actions');

  if (iconEl) iconEl.textContent = icon;
  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.innerHTML = body;
  if (actionsEl) {
    actionsEl.innerHTML = actionsHtml || `
      <button onclick="closeGenericModal()" class="btn-tap flex-1 py-2.5 rounded-xl bg-amber-400 text-stone-950 font-black uppercase text-xs">Понятно</button>
    `;
  }
  const modal = document.getElementById('modal-generic');
  if (modal) modal.classList.remove('hidden');
}

function closeGenericModal() {
  const modal = document.getElementById('modal-generic');
  if (modal) modal.classList.add('hidden');
}

function openFeatureModal(key) {
  if (key === 'rankings') {
    openLeaderboardModal();
    return;
  }

  const map = {
    profile: ['🥷', `Профиль: ${state.username}`, `ID: ${currentUser ? currentUser.id.slice(0, 8) : 'Offline'}<br>Уровень: ${state.playerLevel}<br>🏆 Кубки: ${state.trophies}<br>Побед: ${state.totalWins} | Поражений: ${state.totalLosses}`],
    clubs: ['🛡️', 'Клубы и Роды', 'Вы состоите в клане <b>«Батыры Ала-Тоо»</b> (28/30 участников). Еженедельный турнир клубов активен!'],
    shop: ['🛒', 'Магазин Chuko Royal', 'Пополнение монет, баксов и эксклюзивных сундуков с карточками редких Сака.'],
    mail: ['✉️', 'Входящая почта (1)', 'Добро пожаловать в сезонный билд Chuko Royal! Заберите ежедневный бонус в разделе подарков и покажите свое мастерство на арене!'],
    poolpass: ['🎫', 'Сезонный Pool Pass', 'Выбивайте альчики в матчах 1 на 1 и открывайте редкие скины Сака, эмоции и сундуки сезона!'],
    piggy: ['💰', 'Мешочек-копилка', `В вашем мешочке уже накоплено <b>${Number(state.piggyCoins).toLocaleString('ru-RU')} 🪙</b> с сыгранных партий!`],
    specchest: ['💎', 'Ханский Сундук', 'Содержит гарантированные карточки легендарного Сака «Кибер-Титан X9».'],
    specoffer: ['🔥', 'Спецпредложение -70%', 'Набор «Кочевник Про»: 50,000 монет + 200 баксов + редкий Сака!'],
    events: ['🏆', 'Событие: Кубок Манаса', 'Серия из 5 побед подряд на арене приносит эксклюзивную золотую рамку аватара!'],
    specevent: ['🔥', 'Спец Ивент: Охота за Ханом', 'Выбивайте центрального Хана в режиме на 9 костей и получайте двойные очки сезона!'],
    minigames: ['🎯', 'Мини-игра: Бросок на Алчы', 'Испытайте удачу: подбросьте золотой чуко — если выпадет «Алчы», вы забираете суперприз!'],
    friends: ['👥', 'Игра с друзьями', 'Отправьте ссылку-приглашение другу в Telegram/WhatsApp и сыграйте приватный матч 1 на 1 на одной арене.'],
    invite: ['🤝', 'Реферальная награда', 'За каждого приглашенного друга вы получаете +2,500 🪙 и сундук Жаштык!'],
    knockout_milestone: ['🦴', 'Призы за выбитые альчики', `Вы выбили ${state.knockedTotal} чуко! Каждые 20 выбитых костей приносят призовой сундук.`],
    chests_info: ['📦', 'Слоты сундуков', 'Побеждайте в матчах 1 на 1, чтобы заполнять слоты сундуками арен.']
  };
  const item = map[key] || ['✨', 'Раздел игры', 'Функция активна в полной версии.'];
  showModal(item[0], item[1], item[2]);
}

function openChestSlot(idx) {
  if (idx === 0) {
    state.coins += 750;
    updateHUD();
    showModal('📦', 'Сундук открыт!', 'Награда из сундука: <b>+750 🪙</b> и 4 карточки прокачки!');
  } else {
    showModal('⏳', 'Сундук открывается', 'До открытия осталось дождаться таймера или ускорить за 15 💵.');
  }
}

// ==================== 9. ВЫБОР АРЕНЫ И СЕРВЕРНЫЙ СТАРТ ====================
function openArenaSelect(mode) {
  showScreen('screen-arenas');
}

function setMatchBoneCount(count) {
  state.selectedBoneCount = count;
  const b5 = document.getElementById('mode-btn-5');
  const b9 = document.getElementById('mode-btn-9');
  if (b5) {
    b5.className = count === 5
      ? 'btn-tap py-2 px-3 rounded-xl font-black text-xs bg-amber-500 text-stone-950 border-2 border-white'
      : 'btn-tap py-2 px-3 rounded-xl font-black text-xs bg-stone-800 text-stone-200 border border-stone-600';
  }
  if (b9) {
    b9.className = count === 9
      ? 'btn-tap py-2 px-3 rounded-xl font-black text-xs bg-amber-500 text-stone-950 border-2 border-white'
      : 'btn-tap py-2 px-3 rounded-xl font-black text-xs bg-stone-800 text-stone-200 border border-stone-600';
  }
}

function startTrainingMode() {
  startArenaMatch('Тренировка (Офлайн)', 0, 0);
}

async function startArenaMatch(arenaName, fee, prize) {
  if (state.coins < fee) {
    showModal('🪙', 'Не хватает монет на взнос', 'Выберите арену с меньшим взносом или заберите подарок в меню.');
    return;
  }

  // ТОЧНАЯ МАТЕМАТИКА: списание взноса на сервере Supabase
  let matchId = null;
  if (currentUser && fee > 0) {
    matchId = await serverStartMatch(arenaName, state.selectedBoneCount, fee, prize);
    if (!matchId) return; // Ошибка баланса на сервере
  } else {
    state.coins -= fee;
    updateHUD();
  }

  state.currentMatchId = matchId;
  match.arenaName = arenaName;
  match.prizePool = prize;
  match.fee = fee;
  match.boneCount = state.selectedBoneCount;
  match.targetScore = match.boneCount === 5 ? 3 : 5;

  showScreen('screen-game');
  setTimeout(() => initMatchEngine(), 50);
}

function leaveMatch() {
  match.running = false;
  showScreen('screen-lobby');
}

// ==================== 10. ФИЗИЧЕСКИЙ ДВИЖОК 2.5D ОРДО ====================
const canvas = document.getElementById('ordo-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const match = {
  running: false,
  arenaName: 'Бишкек Арена',
  prizePool: 2000,
  fee: 1000,
  boneCount: 5,
  targetScore: 3,
  width: 390,
  height: 540,
  centerX: 195,
  centerY: 225,
  circleRadius: 158,
  tiltY: 0.76,
  stance: 'half',
  arcParam: 0,
  spinX: 0,
  spinY: 0,
  scorePlayer: 0,
  scoreBot: 0,
  turn: 'player',
  phase: 'aiming',
  knockedThisShot: 0,
  swayTime: 0,
  alchiks: [],
  saka: null,
  drag: { active: false, currX: 0, currY: 0 }
};

function resizeGameCanvas() {
  if (!canvas) return;
  const wrapper = document.getElementById('canvas-wrapper');
  if (!wrapper) return;
  const rect = wrapper.getBoundingClientRect();
  canvas.width = rect.width || 390;
  canvas.height = rect.height || 520;
  match.width = canvas.width;
  match.height = canvas.height;
  match.centerX = match.width / 2;
  match.centerY = match.height * 0.42;
  match.circleRadius = Math.min(match.width * 0.445, match.height * 0.37);
}

function toScreen(lx, ly) {
  return {
    x: match.centerX + (lx - match.centerX),
    y: match.centerY + (ly - match.centerY) * match.tiltY
  };
}

function initMatchEngine() {
  resizeGameCanvas();
  match.running = true;
  match.scorePlayer = 0;
  match.scoreBot = 0;
  match.turn = 'player';
  match.phase = 'aiming';
  match.arcParam = 0;

  const slider = document.getElementById('saka-angle-slider') || document.getElementById('saka-pos-slider');
  if (slider) slider.value = 90;
  resetSpin();

  const titleEl = document.getElementById('match-arena-title');
  const prizeEl = document.getElementById('match-prize-pool');
  const spEl = document.getElementById('score-player');
  const sbEl = document.getElementById('score-bot');
  const stEl = document.getElementById('score-target');
  const stbEl = document.getElementById('score-target-b');

  if (titleEl) titleEl.textContent = match.arenaName;
  if (prizeEl) prizeEl.textContent = match.prizePool.toLocaleString('ru-RU') + ' 🪙';
  if (spEl) spEl.textContent = '0';
  if (sbEl) sbEl.textContent = '0';
  if (stEl) stEl.textContent = match.targetScore;
  if (stbEl) stbEl.textContent = match.targetScore;

  // Каноническая расстановка Ордо гарнизона (Үймөк) вокруг Хана
  const count = match.boneCount;
  if (typeof OrdoGarrison !== 'undefined' && typeof OrdoGarrison.generateCluster === 'function') {
    match.alchiks = OrdoGarrison.generateCluster(count, match.centerX, match.centerY);
  } else if (typeof window !== 'undefined' && window.OrdoGarrison) {
    match.alchiks = window.OrdoGarrison.generateCluster(count, match.centerX, match.centerY);
  } else {
    match.alchiks = [];
    const spacing = count === 5 ? 25 : 20;
    const startX = match.centerX - ((count - 1) * spacing) / 2;
    const midIndex = Math.floor(count / 2);
    for (let i = 0; i < count; i++) {
      const isKhan = (i === midIndex);
      match.alchiks.push({
        x: startX + i * spacing,
        y: match.centerY + (i % 2 === 0 ? -4 : 4),
        vx: 0,
        vy: 0,
        radius: isKhan ? 12.5 : 11,
        mass: isKhan ? 1.38 : 1.18,
        angle: (i * 0.4) - 0.6,
        vAngle: 0,
        isKhan: isKhan,
        active: true
      });
    }
  }

  setStance('half');
  placeSakaOnArc();
  updateTurnUI();
  requestAnimationFrame(matchLoop);
}

function placeSakaOnArc(customAngle = null) {
  const eq = getEquippedSaka();
  let arcAngle;
  if (customAngle !== null) {
    arcAngle = customAngle;
  } else if (match.sakaAngle !== undefined && match.sakaAngle !== null) {
    arcAngle = match.sakaAngle;
  } else {
    arcAngle = Math.PI * 0.5; // Юг по умолчанию (90°)
  }
  match.sakaAngle = arcAngle;

  const orbitDist = match.circleRadius + 28;
  const lx = match.centerX + Math.cos(arcAngle) * orbitDist;
  const ly = match.centerY + Math.sin(arcAngle) * orbitDist;

  match.saka = {
    x: lx,
    y: ly,
    vx: 0,
    vy: 0,
    radius: 14.5,
    mass: 1.35 + (eq.massStat / 100) * 0.55,
    color: eq.color,
    border: eq.border,
    angle: arcAngle,
    vAngle: 0
  };

  updateSakaAngleUI();
}

function setSakaAngle(angleRad) {
  match.sakaAngle = angleRad;
  const orbitDist = match.circleRadius + 28;
  if (match.saka) {
    match.saka.x = match.centerX + Math.cos(angleRad) * orbitDist;
    match.saka.y = match.centerY + Math.sin(angleRad) * orbitDist;
    match.saka.angle = angleRad;
  } else {
    placeSakaOnArc(angleRad);
  }
  updateSakaAngleUI();
}

function onSakaAngleSlide(val) {
  const deg = parseFloat(val);
  const rad = (deg * Math.PI) / 180;
  setSakaAngle(rad);
  const haptics = (typeof ChukoHaptics !== 'undefined') ? ChukoHaptics : (typeof window !== 'undefined' ? window.ChukoHaptics : null);
  if (haptics && typeof haptics.selection === 'function') {
    haptics.selection();
  }
}

function setSakaCardinal(cardinal) {
  let rad = Math.PI * 0.5;
  if (cardinal === 'south') rad = Math.PI * 0.5; // 90°
  else if (cardinal === 'west') rad = Math.PI; // 180°
  else if (cardinal === 'north') rad = -Math.PI * 0.5; // 270°
  else if (cardinal === 'east') rad = 0; // 0°
  setSakaAngle(rad);
  const haptics = (typeof ChukoHaptics !== 'undefined') ? ChukoHaptics : (typeof window !== 'undefined' ? window.ChukoHaptics : null);
  if (haptics && typeof haptics.impact === 'function') {
    haptics.impact('light');
  }
}

function updateSakaAngleUI() {
  if (match.sakaAngle === undefined || match.sakaAngle === null) return;
  let deg = Math.round((match.sakaAngle * 180 / Math.PI) % 360);
  if (deg < 0) deg += 360;

  const badge = (typeof document !== 'undefined') ? document.getElementById('saka-angle-badge') : null;
  const slider = (typeof document !== 'undefined') ? document.getElementById('saka-angle-slider') : null;
  if (slider && document.activeElement !== slider) slider.value = deg;

  const perimeter = (typeof OrdoPerimeter !== 'undefined') ? OrdoPerimeter : (typeof window !== 'undefined' ? window.OrdoPerimeter : null);
  let info = { deg, nameKg: 'Түштүк', nameRu: 'Юг', icon: '⬇️' };
  if (perimeter && typeof perimeter.getCardinalInfo === 'function') {
    info = perimeter.getCardinalInfo(match.sakaAngle);
  } else {
    if (deg >= 337.5 || deg < 22.5) info = { deg, nameKg: 'Чыгыш', nameRu: 'Восток', icon: '➡️' };
    else if (deg >= 67.5 && deg < 112.5) info = { deg, nameKg: 'Түштүк', nameRu: 'Юг', icon: '⬇️' };
    else if (deg >= 157.5 && deg < 202.5) info = { deg, nameKg: 'Батыш', nameRu: 'Запад', icon: '⬅️' };
    else if (deg >= 247.5 && deg < 292.5) info = { deg, nameKg: 'Түндүк', nameRu: 'Север', icon: '⬆️' };
  }

  if (badge) {
    badge.innerHTML = `<span>${info.icon}</span> <span>${info.deg}° ${info.nameKg} (${info.nameRu})</span>`;
  }

  if (typeof document !== 'undefined') {
    const isSouth = deg >= 67 && deg <= 113;
    const isWest = deg >= 157 && deg <= 203;
    const isNorth = deg >= 247 && deg <= 293;
    const isEast = (deg >= 337 && deg <= 360) || (deg >= 0 && deg <= 23);

    const updateBtn = (id, active) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.className = active
        ? 'btn-tap py-1 rounded-lg text-[9px] font-bold bg-amber-500 text-stone-950 border border-white flex items-center justify-center gap-0.5'
        : 'btn-tap py-1 rounded-lg text-[9px] font-bold bg-stone-800 text-stone-300 border border-stone-700 flex items-center justify-center gap-0.5';
    };

    updateBtn('btn-cardinal-south', isSouth);
    updateBtn('btn-cardinal-west', isWest);
    updateBtn('btn-cardinal-north', isNorth);
    updateBtn('btn-cardinal-east', isEast);
  }
}

function setStance(stance) {
  match.stance = stance;
  if (stance === 'standing') match.tiltY = 0.82;
  else if (stance === 'half') match.tiltY = 0.75;
  else match.tiltY = 0.67;

  ['standing', 'half', 'crouch'].forEach(s => {
    const btn = document.getElementById('stance-' + s);
    if (btn) {
      if (s === stance) {
        btn.className = 'btn-tap flex-1 py-1.5 px-1.5 rounded-xl text-[10px] font-black bg-amber-500 text-stone-950 border border-white';
      } else {
        btn.className = 'btn-tap flex-1 py-1.5 px-1.5 rounded-xl text-[10px] font-black bg-stone-800 border border-stone-600 text-stone-300';
      }
    }
  });
}

function toggleSpinPopover() {
  const pop = document.getElementById('spin-popover');
  if (pop) pop.classList.toggle('hidden');
}

function resetSpin() {
  match.spinX = 0;
  match.spinY = 0;
  updateSpinVisuals();
}

function updateSpinVisuals() {
  const dot = document.getElementById('spin-selector-dot');
  const mini = document.getElementById('spin-mini-dot');
  if (dot) dot.style.transform = `translate(${match.spinX * 42}px, ${match.spinY * 42}px)`;
  if (mini) mini.style.transform = `translate(${match.spinX * 6}px, ${match.spinY * 6}px)`;
}

// ==================== 11. СТРЕЛЬБА И ОБРАБОТКА ТАЧ-СОБЫТИЙ ====================
function getCanvasTouch(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function setupTouchListeners() {
  if (!canvas) return;

  canvas.addEventListener('pointerdown', (e) => {
    if (match.turn !== 'player' || match.phase !== 'aiming' || !match.saka) return;
    const sp = getCanvasTouch(e);
    const sakaScreen = toScreen(match.saka.x, match.saka.y);
    const distToSaka = Math.hypot(sp.x - sakaScreen.x, sp.y - sakaScreen.y);

    if (distToSaka <= 48) {
      match.drag.active = true;
      match.drag.pointerId = e.pointerId;
      match.drag.currX = sp.x;
      match.drag.currY = sp.y;
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    } else {
      const w = toWorld(sp.x, sp.y);
      const angle = Math.atan2(w.y - match.centerY, w.x - match.centerX);
      setSakaAngle(angle);

      match.rimDrag = {
        active: true,
        pointerId: e.pointerId
      };
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    }
  });

  window.addEventListener('pointermove', (e) => {
    if (match.drag.active && (match.drag.pointerId === undefined || e.pointerId === match.drag.pointerId)) {
      const sp = getCanvasTouch(e);
      match.drag.currX = sp.x;
      match.drag.currY = sp.y;
    } else if (match.rimDrag && match.rimDrag.active && (match.rimDrag.pointerId === undefined || e.pointerId === match.rimDrag.pointerId)) {
      const sp = getCanvasTouch(e);
      const w = toWorld(sp.x, sp.y);
      const angle = Math.atan2(w.y - match.centerY, w.x - match.centerX);
      setSakaAngle(angle);
    }
  });

  function releaseSlingshot() {
    if (!match.drag.active) return;
    match.drag.active = false;

    const sakaScreen = toScreen(match.saka.x, match.saka.y);
    const dx = sakaScreen.x - match.drag.currX;
    const dy = (sakaScreen.y - match.drag.currY) / match.tiltY;
    const pull = Math.min(115, Math.hypot(dx, dy));
    if (pull < 14) return;

    const eq = getEquippedSaka();
    const powerRatio = pull / 115;

    let stanceMult = 1.0;
    if (match.stance === 'standing') stanceMult = 1.14;
    if (match.stance === 'crouch') stanceMult = 0.94;

    const maxSpeed = 22.4 * stanceMult * (0.92 + (eq.massStat / 100) * 0.16);
    const speed = powerRatio * maxSpeed;

    const stabilityFactor = 1 - (eq.stabilityStat / 140);
    const stanceSway = match.stance === 'standing' ? 1.2 : (match.stance === 'crouch' ? 0.65 : 0.95);
    const swayAmp = powerRatio > 0.5 ? (powerRatio - 0.5) * 0.112 * stabilityFactor * stanceSway : 0;
    const swayOffset = Math.sin(match.swayTime) * swayAmp;

    const baseAngle = Math.atan2(dy, dx) + swayOffset;
    match.saka.vx = Math.cos(baseAngle) * speed;
    match.saka.vy = Math.sin(baseAngle) * speed;
    match.knockedThisShot = 0;
    match.phase = 'moving';
    updateTurnUI();
  }

  function endRimDrag() {
    if (match.rimDrag && match.rimDrag.active) {
      match.rimDrag.active = false;
    }
  }

  window.addEventListener('pointerup', (e) => {
    releaseSlingshot();
    endRimDrag();
  });
  window.addEventListener('pointercancel', (e) => {
    if (match.drag.active) match.drag.active = false;
    endRimDrag();
  });

  const spinPad = document.getElementById('spin-pad');
  if (spinPad) {
    spinPad.addEventListener('pointerdown', (e) => {
      const rect = spinPad.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = (e.clientX - cx) / (rect.width / 2);
      let dy = (e.clientY - cy) / (rect.height / 2);
      const len = Math.hypot(dx, dy);
      if (len > 0.85) { dx = (dx / len) * 0.85; dy = (dy / len) * 0.85; }
      match.spinX = dx;
      match.spinY = dy;
      updateSpinVisuals();
    });
  }
}

// ==================== 12. ОБНОВЛЕНИЕ ФИЗИКИ ====================
function updateMatchPhysics() {
  match.swayTime += 0.065;
  if (match.phase !== 'moving') return;

  const eq = getEquippedSaka();
  const restitution = 0.68 + (eq.bounceStat / 100) * 0.12;
  const friction = match.stance === 'crouch' ? 0.946 : 0.938;

  if (match.saka && Math.hypot(match.saka.vx, match.saka.vy) > 0.6) {
    const perpX = -match.saka.vy;
    const perpY = match.saka.vx;
    match.saka.vx += perpX * match.spinX * 0.012;
    match.saka.vy += perpY * match.spinX * 0.012;
  }

  let anyMoving = false;
  const pieces = [match.saka, ...match.alchiks.filter(a => a.active)];

  pieces.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= friction;
    p.vy *= friction;
    p.angle += p.vAngle;
    p.vAngle *= 0.92;

    if (Math.hypot(p.vx, p.vy) > 0.18) {
      anyMoving = true;
    } else {
      p.vx = 0;
      p.vy = 0;
      p.vAngle = 0;
    }
  });

  // Столкновения
  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      const a = pieces[i];
      const b = pieces[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.radius + b.radius;

      if (dist < minDist && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;

        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;

        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const velAlongNormal = rvx * nx + rvy * ny;

        if (velAlongNormal < 0) {
          const imp = -(1 + restitution) * velAlongNormal / (1 / a.mass + 1 / b.mass);
          a.vx -= (imp / a.mass) * nx;
          a.vy -= (imp / a.mass) * ny;
          b.vx += (imp / b.mass) * nx;
          b.vy += (imp / b.mass) * ny;

          if (match.stance === 'standing' && a === match.saka) {
            b.vx += (Math.random() - 0.5) * 2.2;
            b.vy += (Math.random() - 0.5) * 2.2;
          }

          if (a === match.saka && match.spinY !== 0) {
            a.vx += -nx * match.spinY * 3.2;
            a.vy += -ny * match.spinY * 3.2;
          }

          a.vAngle = (Math.random() - 0.5) * 0.25;
          b.vAngle = (Math.random() - 0.5) * 0.32;
          playBoneSound('hit', Math.min(1.5, Math.abs(velAlongNormal) / 8));
          if (typeof ChukoHaptics !== 'undefined' && typeof ChukoHaptics.onCollision === 'function') {
            ChukoHaptics.onCollision(Math.abs(velAlongNormal));
          } else if (typeof window !== 'undefined' && window.ChukoHaptics) {
            window.ChukoHaptics.onCollision(Math.abs(velAlongNormal));
          }
        }
      }
    }
  }

  // Проверка вылета за пределы круга Ордо
  match.alchiks.forEach(a => {
    if (!a.active) return;
    const distFromCenter = Math.hypot(a.x - match.centerX, a.y - match.centerY);
    if (distFromCenter > match.circleRadius) {
      const khanRuleObj = (typeof KhanRule !== 'undefined') ? KhanRule : (typeof window !== 'undefined' ? window.KhanRule : null);
      if (khanRuleObj && typeof khanRuleObj.processKnockout === 'function') {
        khanRuleObj.processKnockout(a, match, state, playBoneSound, showMatchToast);
        if (a.isKhan && match.turn === 'player') {
          khanRuleObj.showTriumphModal(showModal, state.username);
        }
      } else {
        a.active = false;
        match.knockedThisShot += 1;
        playBoneSound('out');

        if (match.turn === 'player') {
          match.scorePlayer += (a.isKhan ? 3 : 1);
          state.knockedTotal += 1;
          state.piggyCoins += (a.isKhan ? 500 : 150);
          const pScoreEl = document.getElementById('score-player');
          if (pScoreEl) pScoreEl.textContent = match.scorePlayer;
        } else {
          match.scoreBot += (a.isKhan ? 3 : 1);
          const bScoreEl = document.getElementById('score-bot');
          if (bScoreEl) bScoreEl.textContent = match.scoreBot;
        }
      }
      updateHUD();
    }
  });

  if (!anyMoving) {
    onShotComplete();
  }
}

function showMatchToast(msg) {
  const t = document.getElementById('match-toast');
  if (!t) return;
  t.textContent = msg;
  t.style.opacity = '1';
  setTimeout(() => { t.style.opacity = '0'; }, 1600);
}

// ==================== 13. ЗАВЕРШЕНИЕ УДАРА И МАТЧА (ТОЧНАЯ МАТЕМАТИКА SUPABASE) ====================
async function onShotComplete() {
  const remaining = match.alchiks.filter(a => a.active).length;
  if (match.scorePlayer >= match.targetScore || match.scoreBot >= match.targetScore || remaining === 0) {
    match.phase = 'ended';
    const playerWon = match.scorePlayer >= match.scoreBot;

    // ТОЧНАЯ МАТЕМАТИКА: Завершаем матч в Supabase через RPC finish_match
    if (currentUser && state.currentMatchId) {
      const serverRes = await serverFinishMatch(
        state.currentMatchId,
        playerWon,
        match.scorePlayer,
        match.scoreBot,
        match.scorePlayer
      );

      if (serverRes) {
        if (playerWon) {
          showModal('🏆', 'Победа в Ордо!', `Блестящая победа!<br>Вы выбили <b>${match.scorePlayer} чуко</b><br>Приз арены: <b class="text-lime-300">+${serverRes.prize.toLocaleString('ru-RU')} 🪙</b><br>Кубки: <b class="text-amber-300">+${serverRes.trophy_change} 🏆</b>`, `
            <button onclick="closeGenericModal(); showScreen('screen-lobby');" class="btn-tap flex-1 py-2.5 rounded-xl bg-lime-400 text-stone-950 font-black uppercase text-xs">В меню</button>
          `);
        } else {
          showModal('🐺', 'Матч окончен', `Bot_Batyr оказался точнее (${match.scoreBot}:${match.scorePlayer}).<br>Кубки: <b class="text-rose-400">${serverRes.trophy_change} 🏆</b>.<br>Прокачайте Сака и возьмите реванш!`, `
            <button onclick="closeGenericModal(); showScreen('screen-lobby');" class="btn-tap flex-1 py-2.5 rounded-xl bg-amber-400 text-stone-950 font-black uppercase text-xs">В меню</button>
          `);
        }
        return;
      }
    }

    // Fallback офлайн результат
    if (playerWon) {
      state.coins += match.prizePool;
      state.trophies += 25;
      state.totalWins += 1;
      updateHUD();
      showModal('🏆', 'Победа в Ордо!', `Вы выбили ${match.scorePlayer} чуко и забрали банк <b>+${match.prizePool.toLocaleString('ru-RU')} 🪙</b> и <b>+25 🏆</b>!`, `
        <button onclick="closeGenericModal(); showScreen('screen-lobby');" class="btn-tap flex-1 py-2.5 rounded-xl bg-lime-400 text-stone-950 font-black uppercase text-xs">Забрать приз</button>
      `);
    } else {
      state.totalLosses += 1;
      showModal('🐺', 'Матч окончен', `Bot_Batyr выиграл (${match.scoreBot}:${match.scorePlayer}). Возьмите реванш!`, `
        <button onclick="closeGenericModal(); showScreen('screen-lobby');" class="btn-tap flex-1 py-2.5 rounded-xl bg-amber-400 text-stone-950 font-black uppercase text-xs">В меню</button>
      `);
    }
    return;
  }

  // Правило Ордо: выбил альчик — бьешь снова!
  if (match.knockedThisShot > 0) {
    showMatchToast(match.turn === 'player' ? '🔥 Чуко выбит! Бонусный ход!' : '🐺 Bot_Batyr выбил чуко и бьет снова!');
  } else {
    match.turn = match.turn === 'player' ? 'bot' : 'player';
  }

  updateTurnUI();

  if (match.turn === 'player') {
    match.phase = 'aiming';
    placeSakaOnArc();
  } else {
    match.phase = 'bot_thinking';
    const perimeter = (typeof OrdoPerimeter !== 'undefined') ? OrdoPerimeter : (typeof window !== 'undefined' ? window.OrdoPerimeter : null);
    const botAngle = (perimeter && typeof perimeter.calculateBotStance === 'function')
      ? perimeter.calculateBotStance(match.alchiks, match.centerX, match.centerY, match.circleRadius)
      : -Math.PI * 0.5;
    const orbitDist = match.circleRadius + 28;
    match.saka.x = match.centerX + Math.cos(botAngle) * orbitDist;
    match.saka.y = match.centerY + Math.sin(botAngle) * orbitDist;
    match.sakaAngle = botAngle;
    setTimeout(() => executeBotShot(), 1100);
  }
}

function executeBotShot() {
  if (!match.running || match.phase !== 'bot_thinking') return;
  const activeBones = match.alchiks.filter(a => a.active);
  if (activeBones.length === 0) return;

  activeBones.sort((a, b) => {
    const da = Math.hypot(a.x - match.centerX, a.y - match.centerY);
    const db = Math.hypot(b.x - match.centerX, b.y - match.centerY);
    return db - da;
  });

  const target = activeBones[0];
  const dx = target.x - match.saka.x;
  const dy = target.y - match.saka.y;
  const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.14;
  const speed = 17.5 + Math.random() * 3.5;

  match.saka.vx = Math.cos(angle) * speed;
  match.saka.vy = Math.sin(angle) * speed;
  match.knockedThisShot = 0;
  match.phase = 'moving';
}

function updateTurnUI() {
  const pBox = document.getElementById('player-turn-box');
  const bBox = document.getElementById('bot-turn-box');
  const badge = document.getElementById('turn-status-badge');

  if (match.turn === 'player') {
    if (pBox) pBox.className = 'flex items-center gap-2 px-2.5 py-1 rounded-xl border-2 border-lime-400 bg-lime-950/40 transition-all';
    if (bBox) bBox.className = 'flex items-center gap-2 px-2.5 py-1 rounded-xl border-2 border-transparent bg-stone-800/75 transition-all';
    if (badge) {
      badge.textContent = match.phase === 'moving' ? 'Бросок...' : 'Ваш ход • Тяните Сака';
      badge.className = 'text-[10px] font-black px-2 py-0.5 rounded bg-lime-400 text-stone-950 mt-0.5';
    }
  } else {
    if (pBox) pBox.className = 'flex items-center gap-2 px-2.5 py-1 rounded-xl border-2 border-transparent bg-stone-800/75 transition-all';
    if (bBox) bBox.className = 'flex items-center gap-2 px-2.5 py-1 rounded-xl border-2 border-amber-400 bg-amber-950/40 transition-all';
    if (badge) {
      badge.textContent = 'Ход соперника Bot_Batyr...';
      badge.className = 'text-[10px] font-black px-2 py-0.5 rounded bg-amber-400 text-stone-950 mt-0.5';
    }
  }
}

// ==================== 14. CANVAS ОТРИСОВКА ====================
function drawChukoPiece(lx, ly, radius, angle, isSaka, isKhan, customColor, customBorder) {
  if (!ctx) return;
  const sp = toScreen(lx, ly);
  ctx.save();
  ctx.translate(sp.x, sp.y);

  // Падающая 2.5D тень
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.48, radius * 1.05, radius * 0.65, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
  ctx.fill();

  // Нижний 3D слой толщины кости
  ctx.save();
  ctx.translate(0, 3.5);
  ctx.rotate(angle);
  drawBoneContour(radius, isSaka ? '#451a03' : (isKhan ? '#78350f' : '#57534e'), '#1c1917');
  ctx.restore();

  // Верхняя грань
  ctx.rotate(angle);
  const fillCol = isSaka ? customColor : (isKhan ? '#facc15' : '#fef3c7');
  const strokeCol = isSaka ? customBorder : (isKhan ? '#92400e' : '#78350f');
  drawBoneContour(radius, fillCol, strokeCol);

  if (isKhan) {
    ctx.fillStyle = '#451a03';
    ctx.font = '900 8px Rubik';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ХАН', 0, 0);
  }
  ctx.restore();
}

function drawBoneContour(r, fillStyle, strokeStyle) {
  ctx.beginPath();
  ctx.moveTo(-r * 0.75, -r * 0.65);
  ctx.quadraticCurveTo(0, -r * 0.28, r * 0.75, -r * 0.65);
  ctx.quadraticCurveTo(r * 1.15, 0, r * 0.75, r * 0.65);
  ctx.quadraticCurveTo(0, r * 0.28, -r * 0.75, r * 0.65);
  ctx.quadraticCurveTo(-r * 1.15, 0, -r * 0.75, -r * 0.65);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = strokeStyle;
  ctx.stroke();
}

function renderOrdoCanvas() {
  if (!ctx) return;
  ctx.clearRect(0, 0, match.width, match.height);

  // Фон арены
  const bgGrad = ctx.createLinearGradient(0, 0, 0, match.height);
  if (state.season === 'cyberpunk') {
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(1, '#1e1b4b');
  } else {
    bgGrad.addColorStop(0, '#1c1008');
    bgGrad.addColorStop(0.5, '#3b1d0a');
    bgGrad.addColorStop(1, '#1f1209');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, match.width, match.height);

  const rx = match.circleRadius;
  const ry = match.circleRadius * match.tiltY;

  // Бортик круга
  ctx.beginPath();
  ctx.ellipse(match.centerX, match.centerY + 6, rx + 5, ry + 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(match.centerX, match.centerY, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = state.season === 'cyberpunk' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(217, 119, 6, 0.16)';
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = state.season === 'cyberpunk' ? '#06b6d4' : '#f59e0b';
  ctx.stroke();

  // Внутреннее тактическое кольцо
  ctx.beginPath();
  ctx.setLineDash([6, 6]);
  ctx.ellipse(match.centerX, match.centerY, rx * 0.45, ry * 0.45, 0, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.stroke();
  ctx.setLineDash([]);

  // 360° Чек сызыгы: Отрисовка круговой орбиты выбора угла броска со всех сторон света
  if (match.phase === 'aiming') {
    const perimeter = (typeof OrdoPerimeter !== 'undefined') ? OrdoPerimeter : (typeof window !== 'undefined' ? window.OrdoPerimeter : null);
    if (perimeter && typeof perimeter.drawPerimeterTrack === 'function') {
      perimeter.drawPerimeterTrack(ctx, match, toScreen);
    } else {
      ctx.beginPath();
      ctx.ellipse(match.centerX, match.centerY, rx + 28, (rx + 28) * match.tiltY, 0, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Прицел со сглаженным тремором
  if (match.drag.active && match.phase === 'aiming' && match.saka) {
    const sakaSp = toScreen(match.saka.x, match.saka.y);
    const dx = sakaSp.x - match.drag.currX;
    const dy = (sakaSp.y - match.drag.currY) / match.tiltY;
    const pull = Math.min(115, Math.hypot(dx, dy));

    if (pull >= 14) {
      const eq = getEquippedSaka();
      const powerRatio = pull / 115;
      const stabilityFactor = 1 - (eq.stabilityStat / 140);
      const swayAmp = powerRatio > 0.5 ? (powerRatio - 0.5) * 0.112 * stabilityFactor : 0;
      const aimAngle = Math.atan2(dy, dx) + Math.sin(match.swayTime) * swayAmp;

      const ghostAimObj = (typeof GhostAiming !== 'undefined') ? GhostAiming : (typeof window !== 'undefined' ? window.GhostAiming : null);
      if (ghostAimObj && typeof ghostAimObj.drawGuideline === 'function') {
        ghostAimObj.drawGuideline(ctx, match, aimAngle, powerRatio, toScreen);
      } else {
        const aimLen = 80;
        const endWorldX = match.saka.x + Math.cos(aimAngle) * aimLen;
        const endWorldY = match.saka.y + Math.sin(aimAngle) * aimLen;
        const endSp = toScreen(endWorldX, endWorldY);

        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(sakaSp.x, sakaSp.y);
        ctx.lineTo(endSp.x, endSp.y);
        ctx.lineWidth = 3;
        ctx.strokeStyle = powerRatio > 0.75 ? '#ef4444' : '#fde047';
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.moveTo(sakaSp.x, sakaSp.y);
      ctx.lineTo(match.drag.currX, match.drag.currY);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.stroke();

      if (typeof ChukoHaptics !== 'undefined' && typeof ChukoHaptics.onPullStep === 'function') {
        ChukoHaptics.onPullStep(powerRatio);
      } else if (typeof window !== 'undefined' && window.ChukoHaptics) {
        window.ChukoHaptics.onPullStep(powerRatio);
      }
    }
  }

  // Отрисовка костей с Z-сортировкой
  const renderQueue = [];
  match.alchiks.forEach(a => {
    if (a.active) renderQueue.push({ type: 'alchik', obj: a });
  });
  if (match.saka) {
    renderQueue.push({ type: 'saka', obj: match.saka });
  }
  renderQueue.sort((a, b) => a.obj.y - b.obj.y);

  renderQueue.forEach(item => {
    const p = item.obj;
    if (item.type === 'saka') {
      drawChukoPiece(p.x, p.y, p.radius, p.angle, true, false, p.color, p.border);
    } else {
      drawChukoPiece(p.x, p.y, p.radius, p.angle, false, p.isKhan, null, null);
    }
  });
}

function matchLoop() {
  if (!match.running) return;
  updateMatchPhysics();
  renderOrdoCanvas();
  requestAnimationFrame(matchLoop);
}

// ==================== 15. СТАРТ ПРИЛОЖЕНИЯ ====================
async function initApp() {
  initSupabase();
  setupTouchListeners();

  // Лоадер
  let pct = 0;
  const bar = document.getElementById('loader-bar');
  const pctText = document.getElementById('loader-pct');
  const timer = setInterval(async () => {
    pct += 10;
    if (bar) bar.style.width = pct + '%';
    if (pctText) pctText.textContent = pct + '%';

    if (pct >= 100) {
      clearInterval(timer);

      // Проверяем сохраненную сессию Supabase
      const hasSession = await checkSession();
      if (hasSession) {
        showScreen('screen-lobby');
      } else {
        showScreen('screen-auth');
      }
      updateHUD();
    }
  }, 75);
}

window.addEventListener('resize', () => {
  if (match.running) resizeGameCanvas();
});

window.onload = initApp;
