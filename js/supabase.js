// ============================================================
// Chuko Royal MVP — Supabase Integration Layer
// supabase.js: Auth, Profile, Match API, Saka, Leaderboard
// ============================================================

const SUPABASE_URL = 'https://dtrdicglclbfhcdxuutz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AQuKpOK5j6he7jiNt2t_gg_4h49rFuD';

// Supabase client (loaded from CDN in index.html)
let supabase;
let currentUser = null;
let currentProfile = null;

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

function initSupabase() {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Слушаем изменения авторизации
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[Auth]', event, session?.user?.email);
    if (event === 'SIGNED_IN' && session?.user) {
      currentUser = session.user;
      await loadProfile();
      onAuthSuccess();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      currentProfile = null;
      onAuthLogout();
    }
  });
}

// ==================== АВТОРИЗАЦИЯ: GOOGLE OAUTH И БЫСТРЫЙ ГОСТЬ ====================

async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + window.location.pathname
    }
  });
  if (error) {
    console.error('[Auth Error]', error.message);
    showModal('❌', 'Ошибка входа Google', error.message);
  }
}

// Быстрый гостевой вход (создает реального пользователя в Supabase с сохранением в PostgreSQL)
async function signInAsGuest(customName = null) {
  let storedGuestId = localStorage.getItem('chuko_guest_id');
  if (!storedGuestId) {
    storedGuestId = 'player_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('chuko_guest_id', storedGuestId);
  }

  const email = `${storedGuestId}@chuko.pro`;
  const password = `pwd_${storedGuestId}_123!`;
  const username = customName || ('Батыр_' + storedGuestId.slice(-4));

  // Пробуем войти
  let { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  // Если пользователя еще нет — регистрируем
  if (error) {
    const signup = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: username,
          full_name: username
        }
      }
    });

    if (signup.error) {
      console.error('[Guest Signup Error]', signup.error.message);
      // Fallback на локальный режим
      state.username = username;
      onAuthSuccess();
      return;
    }
    data = signup.data;
  }

  if (data?.user) {
    currentUser = data.user;
    await loadProfile();
    onAuthSuccess();
  }
}

async function signOut() {
  await supabase.auth.signOut();
  currentUser = null;
  currentProfile = null;
  onAuthLogout();
}

async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    await loadProfile();
    return true;
  }
  return false;
}

// ==================== ПРОФИЛЬ ИГРОКА ====================

async function loadProfile() {
  if (!currentUser) return null;

  const { data, error } = await supabase.rpc('get_my_profile');

  if (error) {
    console.error('[Profile Error]', error.message);
    // Если профиль не найден, возможно триггер ещё не сработал — ждём
    if (error.message.includes('Not authenticated')) {
      await new Promise(r => setTimeout(r, 1500));
      const retry = await supabase.rpc('get_my_profile');
      if (retry.error) {
        console.error('[Profile Retry Error]', retry.error.message);
        return null;
      }
      currentProfile = retry.data;
    } else {
      return null;
    }
  } else {
    currentProfile = data;
  }

  // Синхронизируем локальный state с сервером
  if (currentProfile?.profile) {
    syncStateFromServer(currentProfile);
  }

  return currentProfile;
}

function syncStateFromServer(serverData) {
  const p = serverData.profile;
  state.coins = p.coins;
  state.bucks = p.bucks;
  state.trophies = p.trophies;
  state.piggyCoins = p.piggy_coins;
  state.knockedTotal = p.total_knocked;
  state.playerLevel = p.level;
  state.username = p.username;
  state.avatarEmoji = p.avatar_emoji;
  state.totalWins = p.total_wins;
  state.totalLosses = p.total_losses;
  state.lastDailyBonus = p.last_daily_bonus;

  // Синхронизируем коллекцию Сака
  if (serverData.sakas && serverData.sakas.length > 0) {
    state.sakaList = serverData.sakas.map(s => ({
      id: s.saka_type,
      name: s.saka_name,
      level: s.level,
      color: s.color,
      border: s.border_color,
      massStat: s.mass_stat,
      stabilityStat: s.stability_stat,
      bounceStat: s.bounce_stat,
      upgradeCost: Math.round(800 * Math.pow(1.4, s.level - 1)),
      isEquipped: s.is_equipped
    }));
    const equipped = state.sakaList.find(s => s.isEquipped);
    if (equipped) state.equippedSakaId = equipped.id;
  }

  updateHUD();
}

// ==================== СЕРВЕРНЫЕ ОПЕРАЦИИ (RPC) ====================

// Начать матч — списывает взнос на сервере
async function serverStartMatch(arenaName, boneCount, fee, prize) {
  const { data, error } = await supabase.rpc('start_match', {
    p_arena_name: arenaName,
    p_bone_count: boneCount,
    p_fee: fee,
    p_prize: prize
  });

  if (error) {
    console.error('[Match Start Error]', error.message);
    showModal('🪙', 'Ошибка', error.message);
    return null;
  }

  return data; // match_id (UUID)
}

// Завершить матч — начисляет приз и обновляет статистику
async function serverFinishMatch(matchId, won, playerScore, botScore, knocked) {
  const { data, error } = await supabase.rpc('finish_match', {
    p_match_id: matchId,
    p_won: won,
    p_player_score: playerScore,
    p_bot_score: botScore,
    p_knocked: knocked
  });

  if (error) {
    console.error('[Match Finish Error]', error.message);
    return null;
  }

  // Перезагружаем профиль с сервера после матча
  await loadProfile();
  return data;
}

// Прокачка Сака
async function serverUpgradeSaka(sakaType) {
  const { data, error } = await supabase.rpc('upgrade_saka', {
    p_saka_type: sakaType
  });

  if (error) {
    console.error('[Upgrade Error]', error.message);
    showModal('🛒', 'Недостаточно монет', error.message);
    return null;
  }

  // Перезагружаем профиль с сервера
  await loadProfile();
  return data;
}

// Экипировать Сака
async function serverEquipSaka(sakaType) {
  const { data, error } = await supabase.rpc('equip_saka', {
    p_saka_type: sakaType
  });

  if (error) {
    console.error('[Equip Error]', error.message);
    return false;
  }

  await loadProfile();
  return true;
}

// Ежедневный бонус
async function serverClaimDailyBonus() {
  const { data, error } = await supabase.rpc('claim_daily_bonus');

  if (error) {
    console.error('[Daily Bonus Error]', error.message);
    showModal('⏰', 'Бонус уже получен', error.message);
    return null;
  }

  await loadProfile();
  return data;
}

// Лидерборд
async function serverGetLeaderboard(limit = 20) {
  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_limit: limit
  });

  if (error) {
    console.error('[Leaderboard Error]', error.message);
    return [];
  }

  return data || [];
}

// ==================== ОБРАБОТЧИКИ АВТОРИЗАЦИИ ====================

function onAuthSuccess() {
  // Скрываем экран логина, показываем лобби
  document.getElementById('screen-auth').classList.add('hidden');
  showScreen('screen-lobby');
  updateHUD();

  // Проверяем доступен ли дневной бонус
  checkDailyBonusAvailable();
}

function onAuthLogout() {
  // Показываем экран логина
  showScreen('screen-auth');
}

function checkDailyBonusAvailable() {
  if (!currentProfile?.profile) return;
  const last = currentProfile.profile.last_daily_bonus;
  const badge = document.getElementById('gift-badge');
  if (!last || new Date(last) < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
    badge.classList.remove('hidden');
    badge.textContent = '!';
  } else {
    badge.classList.add('hidden');
  }
}
