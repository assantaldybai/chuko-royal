// ============================================================
// Chuko Royal — Phase 4 Monopoly GO Meta & Settlement Engine
// /Users/kxansky/Documents/chuko/js/monopolygo_meta.js
// ============================================================

(function (global) {
  'use strict';

  // ============================================================
  // 1. КОНФИГУРАЦИЯ РЕГИОНОВ (ROADMAP КОЧЕВЬЯ)
  // ============================================================
  const REGIONS = [
    {
      id: 1,
      name: 'Жайлоо Суусамыр',
      shortTitle: 'Суусамыр',
      tagline: 'Изумрудные высокогорные пастбища и стан батыров',
      bgGradient: 'from-emerald-950/70 via-stone-900 to-amber-950/40',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      accentColor: '#10b981',
      icon: 'yurt',
      rewardCoins: 10000,
      rewardBucks: 15,
      rewardSaka: {
        id: 'suusamyr_skin',
        name: 'Суусамыр Көк-Бөрү',
        tier: 'Региональный Эксклюзив',
        level: 1,
        color: '#059669',
        border: '#6ee7b7',
        massStat: 75,
        aimStat: 70,
        stabilityStat: 72,
        spinStat: 68,
        upgradeCost: 2000
      }
    },
    {
      id: 2,
      name: 'Озеро Иссык-Куль',
      shortTitle: 'Иссык-Куль',
      tagline: 'Священное жемчужное озеро и лазурные воды Тянь-Шаня',
      bgGradient: 'from-cyan-950/70 via-stone-900 to-blue-950/40',
      badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
      accentColor: '#06b6d4',
      icon: 'water',
      rewardCoins: 25000,
      rewardBucks: 30,
      rewardSaka: {
        id: 'issyk_kul_skin',
        name: 'Иссык-Кульский Лазурит',
        tier: 'Региональный Эксклюзив',
        level: 1,
        color: '#0284c7',
        border: '#7dd3fc',
        massStat: 82,
        aimStat: 84,
        stabilityStat: 80,
        spinStat: 78,
        upgradeCost: 3500
      }
    },
    {
      id: 3,
      name: 'Пик Хан-Теңири',
      shortTitle: 'Хан-Теңири',
      tagline: 'Цитадель Владыки Небес и царство вечных снегов',
      bgGradient: 'from-purple-950/70 via-stone-900 to-amber-950/50',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      accentColor: '#f59e0b',
      icon: 'mountain',
      rewardCoins: 60000,
      rewardBucks: 75,
      rewardSaka: {
        id: 'khan_tengri_skin',
        name: 'Хан-Теңири Алтын',
        tier: 'Королевский Мифический',
        level: 1,
        color: '#d97706',
        border: '#fde68a',
        massStat: 95,
        aimStat: 92,
        stabilityStat: 90,
        spinStat: 92,
        upgradeCost: 6000
      }
    }
  ];

  // ============================================================
  // 2. ДЕРЕВО УЛУЧШЕНИЙ ЗДАНИЙ (5 УРОВНЕЙ КАЖДОГО ЗДАНИЯ)
  // ============================================================
  const BUILDINGS_TREE = {
    yurt: {
      key: 'yurt',
      name: 'Ханская Юрта',
      icon: 'yurt',
      desc: 'Пассивный сбор дани кочевников',
      maxLevel: 5,
      costs: [1500, 3500, 7500, 15000, 30000],
      ratesPerHour: [200, 450, 800, 1300, 2000],
      caps: [1600, 3600, 6400, 10400, 16000], // 8-часовая вместимость
      getPerkText(lvl) {
        const rate = this.ratesPerHour[lvl - 1] || 200;
        return `+${rate.toLocaleString('ru-RU')} монет/час (дань)`;
      },
      getNextPerkText(lvl) {
        if (lvl >= 5) return 'МАКС. ДОХОД';
        const nextRate = this.ratesPerHour[lvl];
        return `След: +${nextRate.toLocaleString('ru-RU')} монет/час`;
      }
    },
    forge: {
      key: 'forge',
      name: 'Кузница Сака',
      icon: 'forge',
      desc: 'Скидка на улучшение характеристик Сака',
      maxLevel: 5,
      costs: [2000, 4500, 10000, 20000, 40000],
      discounts: [0.10, 0.15, 0.20, 0.25, 0.30], // 10% to 30%
      getPerkText(lvl) {
        const pct = Math.round((this.discounts[lvl - 1] || 0.10) * 100);
        return `-${pct}% цена прокачки Сака`;
      },
      getNextPerkText(lvl) {
        if (lvl >= 5) return 'МАКС. СКИДКА';
        const nextPct = Math.round(this.discounts[lvl] * 100);
        return `След: -${nextPct}% на прокачку`;
      }
    },
    stable: {
      key: 'stable',
      name: 'Загон Аргамаков',
      icon: 'stable',
      desc: 'Ускорение времени открытия сундуков',
      maxLevel: 5,
      costs: [2500, 5500, 12000, 24000, 48000],
      reductions: [0.15, 0.25, 0.35, 0.40, 0.50], // 15% to 50%
      getPerkText(lvl) {
        const pct = Math.round((this.reductions[lvl - 1] || 0.15) * 100);
        return `-${pct}% время сундуков`;
      },
      getNextPerkText(lvl) {
        if (lvl >= 5) return 'МАКС. СКОРОСТЬ';
        const nextPct = Math.round(this.reductions[lvl] * 100);
        return `След: -${nextPct}% времени`;
      }
    },
    tower: {
      key: 'tower',
      name: 'Дозорная Башня',
      icon: 'tower',
      desc: 'Емкость щитов и автоподзарядка',
      maxLevel: 5,
      costs: [3000, 6500, 15000, 30000, 60000],
      capacities: [3, 3, 4, 4, 5],
      getPerkText(lvl) {
        const cap = this.capacities[lvl - 1] || 3;
        return `Макс. ${cap} щитов (+1 каждые 8ч)`;
      },
      getNextPerkText(lvl) {
        if (lvl >= 5) return 'МАКС. ОБОРОНА';
        const nextCap = this.capacities[lvl];
        return `След: ${nextCap} щитов макс.`;
      }
    }
  };

  // ============================================================
  // 3. КОНФИГУРАЦИЯ КОПИЛКИ И ЖУРНАЛА НАБЕГОВ
  // ============================================================
  const PIGGY_CONFIG = {
    maxCapacity: 10000,
    matchBonusPercent: 0.15, // 15%
    minSmashThreshold: 500
  };

  const DEFAULT_RAID_LOG = [
    {
      id: 'atk_1',
      attackerName: 'Арстан_Ош',
      avatar: 'wolf',
      division: 'Золотое Ханство',
      timeAgo: '18 мин назад',
      timestamp: Date.now() - 18 * 60 * 1000,
      blocked: true,
      lootStolen: 500,
      revenged: false
    },
    {
      id: 'atk_2',
      attackerName: 'Беркут_Нарын',
      avatar: 'eagle',
      division: 'Лига Манаса',
      timeAgo: '1 час назад',
      timestamp: Date.now() - 65 * 60 * 1000,
      blocked: false,
      lootStolen: 4200,
      revenged: false
    },
    {
      id: 'atk_3',
      attackerName: 'Тайсон_Бишкек',
      avatar: 'fist',
      division: 'Серебряный Айыл',
      timeAgo: '3 часа назад',
      timestamp: Date.now() - 190 * 60 * 1000,
      blocked: true,
      lootStolen: 500,
      revenged: true
    },
    {
      id: 'atk_4',
      attackerName: 'Чингиз_Талас',
      avatar: 'horse',
      division: 'Золотое Ханство',
      timeAgo: '6 часов назад',
      timestamp: Date.now() - 360 * 60 * 1000,
      blocked: false,
      lootStolen: 3100,
      revenged: false
    },
    {
      id: 'atk_5',
      attackerName: 'Кайрат_Джалал-Абад',
      avatar: 'nomad',
      division: 'Бронзовый Стан',
      timeAgo: 'Вчера',
      timestamp: Date.now() - 22 * 60 * 60 * 1000,
      blocked: true,
      lootStolen: 500,
      revenged: true
    }
  ];

  // Соперники для набегов
  const RIVAL_CANDIDATES = [
    { username: 'Арстан_Ош', avatar: 'wolf', division: 'Золотое Ханство', shields: 2, yurtName: 'Ставка Волка' },
    { username: 'Беркут_Нарын', avatar: 'eagle', division: 'Лига Манаса', shields: 1, yurtName: 'Гнездо Беркута' },
    { username: 'Тайсон_Бишкек', avatar: 'fist', division: 'Серебряный Айыл', shields: 0, yurtName: 'Шатер Батыра' },
    { username: 'Чингиз_Талас', avatar: 'horse', division: 'Золотое Ханство', shields: 1, yurtName: 'Таласский Стан' },
    { username: 'Кайрат_Джалал-Абад', avatar: 'nomad', division: 'Бронзовый Стан', shields: 2, yurtName: 'Крепость Саяка' },
    { username: 'Айбек_Баткен', avatar: 'mountain', division: 'Золотое Ханство', shields: 0, yurtName: 'Баткенский Аул' }
  ];

  // ============================================================
  // 4. КЛАСС MONOPOLY GO META SINGLETON
  // ============================================================
  const MonopolyGoMeta = {
    REGIONS,
    BUILDINGS_TREE,
    PIGGY_CONFIG,

    // Ссылки
    gameState: null,
    raidLogs: [],
    currentRaid: null,
    timerIntervalId: null,

    /**
     * Инициализация модуля с синхронизацией данных
     */
    init(state) {
      this.gameState = state;

      // 1. Инициализация структуры поселения в state если отсутствует
      if (!this.gameState.village) {
        this.gameState.village = {
          region: 1,
          regionName: 'Жайлоо Суусамыр',
          shields: 3,
          maxShields: 3,
          lastShieldRechargeTime: Date.now(),
          lastTributeClaimTime: Date.now() - 30 * 60 * 1000, // 30 мин накоплений на старте
          buildings: {
            yurt: { level: 1 },
            forge: { level: 1 },
            stable: { level: 1 },
            tower: { level: 1 }
          }
        };
      }

      // Приведение зданий к корректной структуре
      const bldgs = this.gameState.village.buildings;
      ['yurt', 'forge', 'stable', 'tower'].forEach(k => {
        if (!bldgs[k] || typeof bldgs[k].level !== 'number') {
          bldgs[k] = { level: 1 };
        }
        bldgs[k].maxLevel = 5;
      });

      // 2. Загрузка из LocalStorage
      this.loadFromLocalStorage();

      // 3. Проверка автоподзарядки щитов
      this.checkShieldAutoRecharge();

      // 4. Запуск интервала фонового тика (таймеры дани и щитов каждые 5 сек)
      if (typeof window !== 'undefined') {
        if (this.timerIntervalId) clearInterval(this.timerIntervalId);
        this.timerIntervalId = setInterval(() => {
          this.checkShieldAutoRecharge();
          this.renderTributeBanner();
        }, 5000);
      }

      // 5. Отрисовка интерфейса
      this.renderAll();

      console.log('✓ MonopolyGoMeta Module Initialized successfully (Region #' + this.gameState.village.region + ')');
      return this;
    },

    /**
     * Загрузка данных из LocalStorage
     */
    loadFromLocalStorage() {
      try {
        if (typeof localStorage === 'undefined') return;

        // Поселение
        const savedVillage = localStorage.getItem('chuko_village_meta_v4');
        if (savedVillage) {
          const parsed = JSON.parse(savedVillage);
          if (parsed.region) this.gameState.village.region = parsed.region;
          if (parsed.shields !== undefined) this.gameState.village.shields = Number(parsed.shields);
          if (parsed.maxShields !== undefined) this.gameState.village.maxShields = Number(parsed.maxShields);
          if (parsed.lastTributeClaimTime) this.gameState.village.lastTributeClaimTime = Number(parsed.lastTributeClaimTime);
          if (parsed.lastShieldRechargeTime) this.gameState.village.lastShieldRechargeTime = Number(parsed.lastShieldRechargeTime);
          if (parsed.buildings) {
            Object.keys(parsed.buildings).forEach(k => {
              if (this.gameState.village.buildings[k] && parsed.buildings[k].level) {
                this.gameState.village.buildings[k].level = Number(parsed.buildings[k].level);
              }
            });
          }
        }

        // Копилка
        const savedPiggy = localStorage.getItem('chuko_piggy_v4');
        if (savedPiggy !== null) {
          this.gameState.piggyCoins = Number(savedPiggy) || 0;
        }

        // Журнал набегов
        const savedLogs = localStorage.getItem('chuko_raid_log_v4');
        if (savedLogs) {
          this.raidLogs = JSON.parse(savedLogs);
        } else {
          this.raidLogs = JSON.parse(JSON.stringify(DEFAULT_RAID_LOG));
        }

        // Синхронизация имени региона
        const currentReg = this.getCurrentRegion();
        this.gameState.village.regionName = currentReg.name;
        this.gameState.village.maxShields = this.getTowerMaxShields();
        this.gameState.village.shields = Math.min(this.gameState.village.shields, this.gameState.village.maxShields);

      } catch (e) {
        console.warn('[MonopolyGoMeta] LocalStorage read warning:', e);
      }
    },

    /**
     * Сохранение состояния в LocalStorage и асинхронный синк с Supabase
     */
    saveState() {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('chuko_village_meta_v4', JSON.stringify({
            region: this.gameState.village.region,
            shields: this.gameState.village.shields,
            maxShields: this.gameState.village.maxShields,
            lastTributeClaimTime: this.gameState.village.lastTributeClaimTime,
            lastShieldRechargeTime: this.gameState.village.lastShieldRechargeTime,
            buildings: {
              yurt: { level: this.gameState.village.buildings.yurt.level },
              forge: { level: this.gameState.village.buildings.forge.level },
              stable: { level: this.gameState.village.buildings.stable.level },
              tower: { level: this.gameState.village.buildings.tower.level }
            }
          }));

          localStorage.setItem('chuko_piggy_v4', String(this.gameState.piggyCoins));
          localStorage.setItem('chuko_raid_log_v4', JSON.stringify(this.raidLogs));
        }
      } catch (e) {
        console.warn('[MonopolyGoMeta] LocalStorage write error:', e);
      }

      // Неблокирующая облачная синхронизация
      this.syncSupabaseSafe();
    },

    /**
     * Безопасная синхронизация с Supabase с обработкой офлайна
     */
    async syncSupabaseSafe() {
      try {
        const w = (typeof window !== 'undefined') ? window : globalThis;
        if (!w.sbClient || !w.currentUser) return;

        const pId = w.currentUser.id;
        const v = this.gameState.village;

        // Попытка апсерта в village_state
        await w.sbClient.from('village_state').upsert({
          player_id: pId,
          region: v.region,
          region_name: v.regionName,
          shields: v.shields,
          max_shields: v.maxShields,
          last_shield_recharge: new Date(v.lastShieldRechargeTime || Date.now()).toISOString(),
          last_tribute_claim: new Date(v.lastTributeClaimTime || Date.now()).toISOString(),
          yurt_level: v.buildings.yurt.level,
          forge_level: v.buildings.forge.level,
          stable_level: v.buildings.stable.level,
          tower_level: v.buildings.tower.level,
          piggy_bank_coins: this.gameState.piggyCoins,
          updated_at: new Date().toISOString()
        }, { onConflict: 'player_id' }).catch(() => {});
      } catch (err) {
        // Офлайн режим — игра гарантированно продолжает работу
      }
    },

    // ============================================================
    // 5. РЕГИОНЫ И ПРОГРЕСС КОЧЕВЬЯ
    // ============================================================
    getCurrentRegion() {
      const regId = this.gameState.village?.region || 1;
      return REGIONS.find(r => r.id === regId) || REGIONS[0];
    },

    getNextRegion() {
      const regId = this.gameState.village?.region || 1;
      return REGIONS.find(r => r.id === regId + 1) || null;
    },

    /**
     * Проверка регионального завершения (все 4 здания на уровне 5)
     */
    checkLandmarkCompletion() {
      const bldgs = this.gameState.village.buildings;
      const allMax = Object.values(bldgs).every(b => b.level >= 5);

      if (allMax) {
        const currentReg = this.getCurrentRegion();
        const nextReg = this.getNextRegion();
        this.triggerMilestoneCeremony(currentReg, nextReg);
      }
    },

    /**
     * Церемония открытия нового региона (Landmark Completion)
     */
    triggerMilestoneCeremony(currentReg, nextReg) {
      const isGrandEnd = !nextReg;

      // 1. Награды
      this.gameState.coins += currentReg.rewardCoins;
      this.gameState.bucks += currentReg.rewardBucks;

      // Эксклюзивный скин Сака
      if (currentReg.rewardSaka) {
        const existing = this.gameState.sakaList.find(s => s.id === currentReg.rewardSaka.id);
        if (!existing) {
          this.gameState.sakaList.push(JSON.parse(JSON.stringify(currentReg.rewardSaka)));
        }
      }

      // 2. Переход на следующий регион (или триумф)
      if (nextReg) {
        this.gameState.village.region = nextReg.id;
        this.gameState.village.regionName = nextReg.name;

        // Сброс зданий на 1 уровень для нового региона
        Object.keys(this.gameState.village.buildings).forEach(k => {
          this.gameState.village.buildings[k].level = 1;
        });
      }

      this.saveState();
      this.renderAll();

      if (typeof window !== 'undefined' && typeof window.updateHUD === 'function') {
        window.updateHUD();
      }

      // Звук фанфар и тактильность
      if (typeof window !== 'undefined' && typeof window.playBoneSound === 'function') {
        window.playBoneSound('khan_triumph');
      }
      if (typeof window !== 'undefined' && window.ChukoHaptics && typeof window.ChukoHaptics.notification === 'function') {
        window.ChukoHaptics.notification('success');
      }

      // Показ церемониального модального окна
      this.showLandmarkCeremonyModal(currentReg, nextReg, isGrandEnd);
    },

    showLandmarkCeremonyModal(currentReg, nextReg, isGrandEnd) {
      if (typeof document === 'undefined') return;
      const modal = document.getElementById('modal-landmark');
      if (!modal) return;

      const titleEl = document.getElementById('landmark-modal-title');
      const bodyEl = document.getElementById('landmark-modal-body');
      const skinEl = document.getElementById('landmark-reward-skin');

      if (titleEl) {
        titleEl.textContent = isGrandEnd ? 'ВЛАДЫКА СЕМИРЕЧЬЯ!' : currentReg.name.toUpperCase() + ' ПОКОРЕН!';
      }

      if (bodyEl) {
        bodyEl.innerHTML = isGrandEnd
          ? `Все три региона кочевья отстроены до максимального величия! Вы удостоены верховного звания <b>Великого Хана</b>!`
          : `Все 4 ключевых ориентира полностью построены! Ваш аул перекочевал в следующий легендарный регион <b>${nextReg.name}</b>!`;
      }

      if (skinEl && currentReg.rewardSaka) {
        skinEl.textContent = `Биток «${currentReg.rewardSaka.name}»`;
      }

      const coinBadge = document.getElementById('landmark-reward-coins');
      if (coinBadge) coinBadge.innerHTML = `+${currentReg.rewardCoins.toLocaleString('ru-RU')} ${window.GameIcons ? window.GameIcons.coin(14) : ''}`;

      const bucksBadge = document.getElementById('landmark-reward-bucks');
      if (bucksBadge) bucksBadge.innerHTML = `+${currentReg.rewardBucks} ${window.GameIcons ? window.GameIcons.buck(12) : 'Баксов'}`;

      modal.classList.remove('hidden');
    },

    closeLandmarkModal() {
      if (typeof document === 'undefined') return;
      const modal = document.getElementById('modal-landmark');
      if (modal) modal.classList.add('hidden');
    },

    // ============================================================
    // 6. УЛУЧШЕНИЕ ЗДАНИЙ И ПЕРКИ
    // ============================================================
    getBuildingCost(key, level) {
      const config = BUILDINGS_TREE[key];
      if (!config) return 999999;
      if (level >= 5) return 0;
      return config.costs[level - 1] || 99999;
    },

    upgradeBuilding(bKey) {
      const bldg = this.gameState.village.buildings[bKey];
      const config = BUILDINGS_TREE[bKey];
      if (!bldg || !config) return;

      if (bldg.level >= 5) {
        this.showToast('Здание уже достигло максимального 5-го уровня!');
        return;
      }

      const cost = this.getBuildingCost(bKey, bldg.level);
      if (this.gameState.coins < cost) {
        const need = cost - this.gameState.coins;
        this.showToast('Не хватает ' + need.toLocaleString('ru-RU') + ' монет!');
        if (typeof window !== 'undefined' && window.ChukoHaptics && typeof window.ChukoHaptics.notification === 'function') {
          window.ChukoHaptics.notification('error');
        }
        return;
      }

      // Списание монет и повышение уровня
      this.gameState.coins -= cost;
      bldg.level += 1;

      // Особая логика башни: обновление лимита и подарок +1 щит
      if (bKey === 'tower') {
        const newMax = this.getTowerMaxShields();
        this.gameState.village.maxShields = newMax;
        this.gameState.village.shields = Math.min(newMax, this.gameState.village.shields + 1);
      }

      this.saveState();
      this.renderAll();

      if (typeof window !== 'undefined' && typeof window.updateHUD === 'function') {
        window.updateHUD();
      }

      if (typeof window !== 'undefined' && typeof window.playBoneSound === 'function') {
        window.playBoneSound('out', 1.25);
      }
      if (typeof window !== 'undefined' && window.ChukoHaptics && typeof window.ChukoHaptics.notification === 'function') {
        window.ChukoHaptics.notification('success');
      }

      this.showToast(`${config.name} улучшена до Ур. ${bldg.level}!`);

      // Проверка закрытия региона
      this.checkLandmarkCompletion();
    },

    getForgeDiscount() {
      const lvl = this.gameState.village?.buildings?.forge?.level || 1;
      const discounts = BUILDINGS_TREE.forge.discounts;
      return discounts[lvl - 1] || 0.10;
    },

    getStableReduction() {
      const lvl = this.gameState.village?.buildings?.stable?.level || 1;
      const reductions = BUILDINGS_TREE.stable.reductions;
      return reductions[lvl - 1] || 0.15;
    },

    getTowerMaxShields() {
      const lvl = this.gameState.village?.buildings?.tower?.level || 1;
      const caps = BUILDINGS_TREE.tower.capacities;
      return caps[lvl - 1] || 3;
    },

    // ============================================================
    // 7. ПАССИВНЫЙ СБОР ДАНИ (ХАНСКАЯ ЮРТА)
    // ============================================================
    calculateTribute() {
      const yurtLvl = this.gameState.village?.buildings?.yurt?.level || 1;
      const config = BUILDINGS_TREE.yurt;
      const ratePerHour = config.ratesPerHour[yurtLvl - 1] || 200;
      const maxCap = config.caps[yurtLvl - 1] || 1600;

      const lastClaim = this.gameState.village?.lastTributeClaimTime || Date.now();
      const elapsedMs = Math.max(0, Date.now() - lastClaim);
      const elapsedHours = elapsedMs / (1000 * 60 * 60);

      const pending = Math.min(maxCap, Math.floor(elapsedHours * ratePerHour));
      const pct = Math.min(100, Math.round((pending / maxCap) * 100));

      return {
        ratePerHour,
        maxCap,
        pending,
        pct,
        isFull: pending >= maxCap
      };
    },

    claimTribute() {
      const tribute = this.calculateTribute();
      if (tribute.pending <= 0) {
        this.showToast('⏳ Дань еще собирается кочевниками...');
        return;
      }

      const collected = tribute.pending;
      this.gameState.coins += collected;
      this.gameState.village.lastTributeClaimTime = Date.now();

      this.saveState();
      this.renderAll();

      if (typeof window !== 'undefined' && typeof window.updateHUD === 'function') {
        window.updateHUD();
      }

      if (typeof window !== 'undefined' && typeof window.playBoneSound === 'function') {
        window.playBoneSound('out', 1.4);
      }
      if (typeof window !== 'undefined' && window.ChukoHaptics && typeof window.ChukoHaptics.impact === 'function') {
        window.ChukoHaptics.impact('heavy');
      }

      this.showToast(`Собрано дани: +${collected.toLocaleString('ru-RU')} монет!`);
    },

    // ============================================================
    // 8. АВТОПОДЗАРЯДКА ЩИТОВ (ДОЗОРНАЯ БАШНЯ)
    // ============================================================
    checkShieldAutoRecharge() {
      const v = this.gameState?.village;
      if (!v) return;

      const maxShields = this.getTowerMaxShields();
      v.maxShields = maxShields;

      if (v.shields >= maxShields) {
        v.lastShieldRechargeTime = Date.now();
        return;
      }

      const rechargeInterval = 8 * 60 * 60 * 1000; // 8 часов
      const lastRecharge = v.lastShieldRechargeTime || Date.now();
      const elapsed = Date.now() - lastRecharge;

      if (elapsed >= rechargeInterval) {
        const rechargedCount = Math.floor(elapsed / rechargeInterval);
        const newShields = Math.min(maxShields, v.shields + rechargedCount);
        v.shields = newShields;
        v.lastShieldRechargeTime = Date.now() - (elapsed % rechargeInterval);
        this.saveState();
        this.renderShieldsDisplay();
      }
    },

    getShieldRechargeCountdown() {
      const v = this.gameState?.village;
      if (!v || v.shields >= v.maxShields) return null;

      const rechargeInterval = 8 * 60 * 60 * 1000;
      const lastRecharge = v.lastShieldRechargeTime || Date.now();
      const remainingMs = Math.max(0, rechargeInterval - (Date.now() - lastRecharge));

      const h = Math.floor(remainingMs / (1000 * 60 * 60));
      const m = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${h}ч ${m}м`;
    },

    // ============================================================
    // 9. ИНТЕРАКТИВНЫЙ НАБЕГ «ЧАПКЫН»
    // ============================================================
    openRaidModal(rivalName = null, options = {}) {
      let rival;
      if (rivalName) {
        rival = RIVAL_CANDIDATES.find(r => r.username === rivalName) || {
          username: rivalName,
          avatar: 'nomad',
          division: 'Золотое Ханство',
          shields: Math.random() < 0.5 ? 1 : 0,
          yurtName: 'Аул батыра'
        };
      } else {
        rival = RIVAL_CANDIDATES[Math.floor(Math.random() * RIVAL_CANDIDATES.length)];
      }

      this.currentRaid = {
        rival: JSON.parse(JSON.stringify(rival)),
        isRevenge: Boolean(options.isRevenge),
        logId: options.logId || null,
        targetHit: false
      };

      if (typeof document === 'undefined') return;
      const modal = document.getElementById('modal-raid');
      if (!modal) return;

      // Заполнение информации о сопернике
      const rivalNameEl = document.getElementById('raid-rival-name');
      const rivalDivEl = document.getElementById('raid-rival-division');
      const rivalAvatarEl = document.getElementById('raid-rival-avatar');
      const rivalShieldsEl = document.getElementById('raid-rival-shields');
      const statusBanner = document.getElementById('raid-status-banner');
      const resultCard = document.getElementById('raid-result-card');

      if (rivalNameEl) rivalNameEl.textContent = this.currentRaid.rival.username;
      if (rivalDivEl) rivalDivEl.textContent = this.currentRaid.rival.division;
      if (rivalAvatarEl) rivalAvatarEl.textContent = this.currentRaid.rival.avatar;

      if (statusBanner) {
        statusBanner.className = 'text-[11px] font-bold text-center py-1.5 px-3 rounded-xl bg-black/60 border border-amber-500/30 text-amber-300';
        statusBanner.innerHTML = options.isRevenge
          ? `<b>ОПЕРАЦИЯ «МЕСТЬ»:</b> Выберите юрту соперника для удара!`
          : `<b>ВЫБЕРИТЕ ЦЕЛЬ:</b> Нажмите на одну из 3 юрт для броска Сака!`;
      }

      if (resultCard) resultCard.classList.add('hidden');

      // Отображение щитов соперника
      if (rivalShieldsEl) {
        const sh = this.currentRaid.rival.shields;
        const shieldIcon = (typeof window !== 'undefined' && window.GameIcons) ? window.GameIcons.shield(16) : '';
        rivalShieldsEl.innerHTML = sh > 0 
          ? Array(sh).fill(shieldIcon).join(' ') + ` <span class="text-[10px] text-cyan-300">(${sh} актив.)</span>` 
          : '<span class="text-rose-400 font-bold">Без защиты</span>';
      }

      // Сброс визуала палаток
      ['khan', 'treasury', 'stable'].forEach(k => {
        const tentBtn = document.getElementById(`raid-tent-${k}`);
        if (tentBtn) {
          tentBtn.classList.remove('opacity-40', 'scale-95', 'pointer-events-none');
          const fx = tentBtn.querySelector('.tent-fx');
          if (fx) fx.innerHTML = '';
        }
      });

      // Отображение используемого Сака игрока
      const eqSaka = (typeof window !== 'undefined' && typeof window.getEquippedSaka === 'function')
        ? window.getEquippedSaka()
        : { name: 'Ханский Свинец' };

      const sakaLabel = document.getElementById('raid-player-saka-label');
      if (sakaLabel) sakaLabel.textContent = eqSaka.name;

      modal.classList.remove('hidden');
    },

    executeRaidStrike(tentKey) {
      if (!this.currentRaid || this.currentRaid.targetHit) return;
      this.currentRaid.targetHit = true;

      // Блокируем нажатия
      if (typeof document !== 'undefined') {
        ['khan', 'treasury', 'stable'].forEach(k => {
          const b = document.getElementById(`raid-tent-${k}`);
          if (b) b.classList.add('pointer-events-none');
        });
      }

      const targetBtn = (typeof document !== 'undefined') ? document.getElementById(`raid-tent-${tentKey}`) : null;
      const projectile = (typeof document !== 'undefined') ? document.getElementById('raid-saka-projectile') : null;
      const statusBanner = (typeof document !== 'undefined') ? document.getElementById('raid-status-banner') : null;
      const resultCard = (typeof document !== 'undefined') ? document.getElementById('raid-result-card') : null;

      if (statusBanner) {
        statusBanner.innerHTML = '<b>БРОСОК САКА В ПОЛЕТЕ...</b>';
        statusBanner.className = 'text-[11px] font-bold text-center py-1.5 px-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 animate-pulse';
      }

      // Анимация полета Сака
      if (projectile && targetBtn) {
        projectile.classList.remove('hidden');
        projectile.classList.add('animate-saka-strike');
      }

      setTimeout(() => {
        if (projectile) {
          projectile.classList.add('hidden');
          projectile.classList.remove('animate-saka-strike');
        }

        const rivalHasShield = this.currentRaid.rival.shields > 0;
        const fxEl = targetBtn ? targetBtn.querySelector('.tent-fx') : null;

        if (rivalHasShield) {
          // --- ЩИТ ОТРАЗИЛ УДАР ---
          this.currentRaid.rival.shields -= 1;
          const consolationCoins = 500;
          this.gameState.coins += consolationCoins;

          if (fxEl) {
            fxEl.innerHTML = `
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping">
                <span class="filter drop-shadow">${window.GameIcons ? window.GameIcons.shield(44) : ""}</span>
              </div>
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span class="text-2xl text-cyan-300 font-black tracking-wide">СКОЛ ЩИТА!</span>
              </div>
            `;
          }

          if (typeof window !== 'undefined' && typeof window.playBoneSound === 'function') {
            window.playBoneSound('hit', 1.6);
          }
          if (typeof window !== 'undefined' && window.ChukoHaptics && typeof window.ChukoHaptics.impact === 'function') {
            window.ChukoHaptics.impact('rigid');
          }

          if (statusBanner) {
            statusBanner.innerHTML = `<b>ЩИТ ОТРАЗИЛ УДАР!</b> Дозорная башня врага приняла урон.`;
            statusBanner.className = 'text-[11px] font-bold text-center py-1.5 px-3 rounded-xl bg-cyan-950/70 border border-cyan-400 text-cyan-300';
          }

          if (resultCard) {
            resultCard.innerHTML = `
              <div class="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/80 to-stone-900 border border-cyan-500/40 text-center flex flex-col gap-1.5 shadow-lg">
                <span class="flex items-center justify-center gap-1.5">${window.GameIcons ? window.GameIcons.shield(28) : ""}</span>
                <h4 class="text-sm font-black text-white">ЩИТ СОПЕРНИКА РАСКОЛОТ!</h4>
                <p class="text-[11px] text-stone-300">Соперник потерял 1 щит защиты. Вам достался малый обоз:</p>
                <div class="text-lg font-black text-amber-300 flex items-center justify-center gap-1">+${consolationCoins} ${window.GameIcons ? window.GameIcons.coin(16) : ""}</div>
                <button onclick="MonopolyGoMeta.closeRaidModal()" class="btn-tap mt-1 py-2 px-4 rounded-xl bg-cyan-400 text-stone-950 font-black text-xs uppercase shadow active:scale-95">Забрать и уйти</button>
              </div>
            `;
            resultCard.classList.remove('hidden');
          }

        } else {
          // --- ПОЛНЫЙ РАЗГРОМ (НЕТ ЩИТОВ) ---
          const multipliers = { khan: 1.5, treasury: 1.25, stable: 1.0 };
          const baseJackpot = 4000 + Math.floor(Math.random() * 3000);
          const loot = Math.round(baseJackpot * (multipliers[tentKey] || 1.0));
          const bonusPiggy = Math.round(loot * PIGGY_CONFIG.matchBonusPercent);

          this.gameState.coins += loot;
          this.gameState.piggyCoins = Math.min(PIGGY_CONFIG.maxCapacity, this.gameState.piggyCoins + bonusPiggy);

          if (fxEl) {
            fxEl.innerHTML = `
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none animate-bounce">
                <span class="flex items-center justify-center">${window.GameIcons ? window.GameIcons.flame(44) : ""}</span>
              </div>
            `;
          }

          if (typeof window !== 'undefined' && typeof window.playBoneSound === 'function') {
            window.playBoneSound('khan_triumph');
          }
          if (typeof window !== 'undefined' && window.ChukoHaptics && typeof window.ChukoHaptics.notification === 'function') {
            window.ChukoHaptics.notification('success');
          }

          if (statusBanner) {
            statusBanner.innerHTML = `<b>РАЗГРОМ И ГРАБЕЖ!</b> Шатер соперника разрушен!`;
            statusBanner.className = 'text-[11px] font-bold text-center py-1.5 px-3 rounded-xl bg-red-950/80 border border-red-500 text-rose-300';
          }

          if (resultCard) {
            resultCard.innerHTML = `
              <div class="p-3 rounded-2xl bg-gradient-to-r from-red-950/80 via-amber-950/60 to-stone-900 border border-amber-400 text-center flex flex-col gap-1.5 shadow-xl">
                <span class="flex items-center justify-center gap-2">${window.GameIcons ? window.GameIcons.trophy(36) : ""}</span>
                <h4 class="text-sm font-black text-amber-300 uppercase">ПОЛНЫЙ РАЗГРОМ АЙЫЛА!</h4>
                <p class="text-[11px] text-stone-200">Вы сокрушили стан батыра <b>${this.currentRaid.rival.username}</b>!</p>
                <div class="flex justify-center items-center gap-3 my-1">
                  <div class="px-3 py-1 rounded-xl bg-black/50 border border-amber-400/40">
                    <div class="text-[9px] text-stone-400 font-bold">Награблено:</div>
                    <div class="text-base font-black text-lime-400 flex items-center justify-center gap-1">+${loot.toLocaleString('ru-RU')} ${window.GameIcons ? window.GameIcons.coin(14) : ""}</div>
                  </div>
                  <div class="px-3 py-1 rounded-xl bg-black/50 border border-amber-400/40">
                    <div class="text-[9px] text-stone-400 font-bold">В копилку:</div>
                    <div class="text-base font-black text-amber-300 flex items-center justify-center gap-1">+${bonusPiggy.toLocaleString('ru-RU')} ${window.GameIcons ? window.GameIcons.coin(14) : ""}</div>
                  </div>
                </div>
                <button onclick="MonopolyGoMeta.closeRaidModal()" class="btn-tap mt-1 py-2 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 font-black text-xs uppercase shadow active:scale-95">Забрать куш</button>
              </div>
            `;
            resultCard.classList.remove('hidden');
          }
        }

        // Если это была месть — отмечаем в журнале
        if (this.currentRaid.isRevenge && this.currentRaid.logId) {
          const entry = this.raidLogs.find(l => l.id === this.currentRaid.logId);
          if (entry) entry.revenged = true;
        }

        this.saveState();
        this.renderAll();

        if (typeof window !== 'undefined' && typeof window.updateHUD === 'function') {
          window.updateHUD();
        }

      }, 650);
    },

    closeRaidModal() {
      if (typeof document !== 'undefined') {
        const modal = document.getElementById('modal-raid');
        if (modal) modal.classList.add('hidden');
      }
      this.currentRaid = null;
    },

    // ============================================================
    // 10. ЖУРНАЛ НАБЕГОВ (АТАКИ И МЕСТЬ)
    // ============================================================
    launchRevenge(logId, rivalName) {
      this.openRaidModal(rivalName, { isRevenge: true, logId });
    },

    renderRaidLogUI() {
      if (typeof document === 'undefined') return;
      const container = document.getElementById('village-raid-logs-list');
      if (!container) return;

      container.innerHTML = '';

      if (!this.raidLogs || this.raidLogs.length === 0) {
        container.innerHTML = `
          <div class="py-3 text-center text-[11px] text-stone-500 italic">Набегов пока не зафиксировано</div>
        `;
        return;
      }

      this.raidLogs.slice(0, 5).forEach(item => {
        const card = document.createElement('div');
        card.className = `p-2 rounded-xl border ${item.blocked ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-red-950/20 border-rose-500/30'} flex items-center justify-between gap-2 shadow`;

        const isRevenged = Boolean(item.revenged);

        const iconAvatar = (typeof window !== 'undefined' && window.GameIcons) ? window.GameIcons.avatar(item.avatar || 'batyr', 22) : '';
        const shieldSvg = (typeof window !== 'undefined' && window.GameIcons) ? window.GameIcons.shield(12) : '';
        const swordsSvg = (typeof window !== 'undefined' && window.GameIcons) ? window.GameIcons.swords(12) : '';
        const coinSvg = (typeof window !== 'undefined' && window.GameIcons) ? window.GameIcons.coin(11) : '';

        card.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="flex items-center justify-center">${iconAvatar}</span>
            <div class="text-left">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-black text-white">${item.attackerName}</span>
                <span class="text-[9px] text-stone-400">${item.timeAgo}</span>
              </div>
              <div class="text-[10px] ${item.blocked ? 'text-cyan-300' : 'text-rose-300'} font-bold flex items-center gap-1">
                ${item.blocked ? `${shieldSvg} Отбито щитом` : `${swordsSvg} Айыл разграблен`} • ${item.lootStolen.toLocaleString('ru-RU')} ${coinSvg}
              </div>
            </div>
          </div>

          <div>
            ${isRevenged
              ? `<span class="text-[9px] font-black px-2 py-1 rounded-lg bg-stone-800 text-stone-400 border border-stone-700">Отомщено ✓</span>`
              : `<button onclick="MonopolyGoMeta.launchRevenge('${item.id}', '${item.attackerName}')" class="btn-tap px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-[10px] uppercase shadow active:scale-95 cursor-pointer flex items-center gap-1">
                  ${swordsSvg} Отомстить
                </button>`
            }
          </div>
        `;
        container.appendChild(card);
      });
    },

    // ============================================================
    // 11. ХАНСКАЯ КОПИЛКА (PIGGY BANK & HAMMER CEREMONY)
    // ============================================================
    addMatchBonus(coinsPrize) {
      if (!coinsPrize || coinsPrize <= 0) return;
      const bonus = Math.round(coinsPrize * PIGGY_CONFIG.matchBonusPercent);
      this.gameState.piggyCoins = Math.min(PIGGY_CONFIG.maxCapacity, (this.gameState.piggyCoins || 0) + bonus);
      this.saveState();
      this.renderPiggyWidget();

      if (typeof window !== 'undefined' && typeof window.updateHUD === 'function') {
        window.updateHUD();
      }
    },

    openPiggyModal() {
      if (typeof document === 'undefined') return;
      const modal = document.getElementById('modal-piggy');
      if (!modal) return;

      const amtEl = document.getElementById('piggy-modal-amount');
      const barEl = document.getElementById('piggy-modal-bar');
      const breakBtn = document.getElementById('piggy-break-btn');

      const coins = this.gameState.piggyCoins || 0;
      const pct = Math.min(100, Math.round((coins / PIGGY_CONFIG.maxCapacity) * 100));

      if (amtEl) amtEl.innerHTML = `${coins.toLocaleString('ru-RU')} ${window.GameIcons ? window.GameIcons.coin(16) : ''}`; 
      if (barEl) barEl.style.width = `${pct}%`;

      if (breakBtn) {
        if (coins >= PIGGY_CONFIG.minSmashThreshold) {
          breakBtn.disabled = false;
          breakBtn.className = 'btn-tap w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-lime-400 text-stone-950 font-black text-sm uppercase shadow-xl cursor-pointer active:scale-95 animate-pulse';
          breakBtn.textContent = 'РАЗБИТЬ ЗОЛОТЫМ МОЛОТОМ!';
        } else {
          breakBtn.disabled = true;
          breakBtn.className = 'w-full py-3 rounded-2xl bg-stone-800 text-stone-500 font-bold text-xs uppercase cursor-not-allowed';
          breakBtn.textContent = `Нужно минимум ${PIGGY_CONFIG.minSmashThreshold} монет (сейчас ${coins})`;
        }
      }

      // Сброс анимации кувшина
      const jarEl = document.getElementById('piggy-jar-graphic');
      if (jarEl) {
        jarEl.className = 'text-6xl transition-transform duration-300';
      }

      modal.classList.remove('hidden');
    },

    closePiggyModal() {
      if (typeof document !== 'undefined') {
        const modal = document.getElementById('modal-piggy');
        if (modal) modal.classList.add('hidden');
      }
    },

    breakPiggyBank() {
      const coins = this.gameState.piggyCoins || 0;
      if (coins < PIGGY_CONFIG.minSmashThreshold) return;

      const breakBtn = (typeof document !== 'undefined') ? document.getElementById('piggy-break-btn') : null;
      const jarEl = (typeof document !== 'undefined') ? document.getElementById('piggy-jar-graphic') : null;
      const hammerEl = (typeof document !== 'undefined') ? document.getElementById('piggy-hammer-graphic') : null;

      if (breakBtn) breakBtn.disabled = true;

      // Анимация удара молотом
      if (hammerEl) {
        hammerEl.classList.remove('hidden');
        hammerEl.classList.add('animate-hammer-strike');
      }

      setTimeout(() => {
        // Раскол кувшина
        if (jarEl) {
          jarEl.innerHTML = window.GameIcons ? window.GameIcons.coin(54) : '✓';
          jarEl.classList.add('scale-125');
        }

        if (typeof window !== 'undefined' && typeof window.playBoneSound === 'function') {
          window.playBoneSound('khan_triumph');
        }
        if (typeof window !== 'undefined' && window.ChukoHaptics && typeof window.ChukoHaptics.impact === 'function') {
          window.ChukoHaptics.impact('heavy');
        }

        // Перевод монет игроку
        this.gameState.coins += coins;
        this.gameState.piggyCoins = 0;

        this.saveState();
        this.renderAll();

        if (typeof window !== 'undefined' && typeof window.updateHUD === 'function') {
          window.updateHUD();
        }

        setTimeout(() => {
          this.closePiggyModal();
          this.showToast(`Вы разбили копилку и забрали +${coins.toLocaleString('ru-RU')} монет!`);
        }, 800);

      }, 400);
    },

    // ============================================================
    // 12. ОТРИСОВКА ВСЕХ UI ЭЛЕМЕНТОВ
    // ============================================================
    renderAll() {
      if (typeof document === 'undefined') return;
      this.renderRegionHeader();
      this.renderTributeBanner();
      this.renderShieldsDisplay();
      this.renderBuildingsCards();
      this.renderRaidLogUI();
      this.renderPiggyWidget();
    },

    renderRegionHeader() {
      if (typeof document === 'undefined') return;
      const cur = this.getCurrentRegion();
      const bldgs = this.gameState.village.buildings;
      const maxedCount = Object.values(bldgs).filter(b => b.level >= 5).length;

      const nameEl = document.getElementById('village-region-name');
      const progEl = document.getElementById('village-progress-badge');
      const tagEl = document.getElementById('village-region-tagline');
      const cardEl = document.getElementById('village-region-card');

      if (nameEl) nameEl.textContent = cur.name;
      if (progEl) progEl.textContent = `${maxedCount} / 4`;
      if (tagEl) tagEl.textContent = cur.tagline;

      if (cardEl) {
        cardEl.className = `hud-card rounded-2xl p-3 border ${cur.borderColor || 'border-amber-500/40'} bg-gradient-to-r ${cur.bgGradient} flex justify-between items-center shadow-lg`;
      }
    },

    renderTributeBanner() {
      if (typeof document === 'undefined') return;
      const tribute = this.calculateTribute();
      const amtEl = document.getElementById('tribute-pending-amount');
      const rateEl = document.getElementById('tribute-rate-label');
      const claimBtn = document.getElementById('tribute-claim-btn');

      if (amtEl) {
        if (typeof window !== 'undefined' && window.GameIcons) {
          amtEl.innerHTML = `${tribute.pending.toLocaleString('ru-RU')} / ${tribute.maxCap.toLocaleString('ru-RU')} ${window.GameIcons.coin(13)}`;
        } else {
          amtEl.textContent = `${tribute.pending.toLocaleString('ru-RU')} / ${tribute.maxCap.toLocaleString('ru-RU')} монет`;
        }
      }
      if (rateEl) {
        if (typeof window !== 'undefined' && window.GameIcons) {
          rateEl.innerHTML = `+${tribute.ratePerHour.toLocaleString('ru-RU')} ${window.GameIcons.coin(11)}/час`;
        } else {
          rateEl.textContent = `+${tribute.ratePerHour.toLocaleString('ru-RU')} монет/час`;
        }
      }

      if (claimBtn) {
        if (tribute.pending > 0) {
          claimBtn.disabled = false;
          claimBtn.className = 'btn-tap px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 font-black text-xs uppercase shadow active:scale-95 cursor-pointer';
          claimBtn.textContent = 'Собрать';
        } else {
          claimBtn.disabled = true;
          claimBtn.className = 'px-3 py-1.5 rounded-xl bg-stone-800 text-stone-500 font-bold text-xs uppercase cursor-not-allowed';
          claimBtn.textContent = 'Сбор...';
        }
      }
    },

    renderShieldsDisplay() {
      if (typeof document === 'undefined') return;
      const v = this.gameState?.village;
      if (!v) return;

      const shDisp = document.getElementById('village-shields-display');
      const timerDisp = document.getElementById('village-shields-timer');
      const hudShields = document.getElementById('hud-shields');

      if (hudShields) {
        hudShields.textContent = `${v.shields}/${v.maxShields}`;
      }

      if (shDisp) {
        if (typeof window !== 'undefined' && window.GameIcons) {
          shDisp.innerHTML = v.shields > 0 
            ? Array(v.shields).fill(window.GameIcons.shield(18)).join(' ')
            : '<span class="text-rose-400 font-bold text-xs">Нет щитов</span>';
        } else {
          shDisp.innerHTML = v.shields > 0 ? Array(v.shields).fill(window.GameIcons ? window.GameIcons.shield(18) : 'Щит').join(' ') : '<span class="text-stone-500 font-bold text-xs">Нет щитов</span>';
        }
      }

      if (timerDisp) {
        const cd = this.getShieldRechargeCountdown();
        timerDisp.textContent = cd ? `+1 через ${cd}` : 'Полный запас';
      }
    },

    renderBuildingsCards() {
      if (typeof document === 'undefined') return;
      const bldgs = this.gameState.village.buildings;

      ['yurt', 'forge', 'stable', 'tower'].forEach(key => {
        const bldg = bldgs[key];
        const config = BUILDINGS_TREE[key];
        if (!bldg || !config) return;

        const lvlEl = document.getElementById(`bldg-${key}-lvl`);
        const perkEl = document.getElementById(`bldg-${key}-perk`);
        const nextPerkEl = document.getElementById(`bldg-${key}-next-perk`);
        const btnEl = document.getElementById(`bldg-${key}-btn`);

        if (lvlEl) {
          lvlEl.textContent = `Ур. ${bldg.level}/5`;
          if (bldg.level >= 5) {
            lvlEl.className = 'text-[9px] font-black px-1.5 py-0.2 bg-amber-400 text-stone-950 rounded border border-white';
          }
        }

        if (perkEl) perkEl.textContent = config.getPerkText(bldg.level);
        if (nextPerkEl) nextPerkEl.textContent = config.getNextPerkText(bldg.level);

        if (btnEl) {
          if (bldg.level >= 5) {
            btnEl.disabled = true;
            btnEl.className = 'px-3 py-1.5 rounded-xl bg-stone-800 text-amber-400 border border-amber-400/30 font-black text-xs uppercase cursor-default';
            btnEl.textContent = 'МАКС';
          } else {
            const cost = this.getBuildingCost(key, bldg.level);
            btnEl.disabled = false;
            btnEl.className = 'btn-tap px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 font-black text-xs uppercase shadow active:scale-95 cursor-pointer';
            if (typeof window !== 'undefined' && window.GameIcons) {
              btnEl.innerHTML = `${cost.toLocaleString('ru-RU')} ${window.GameIcons.coin(13)}`;
            } else {
              btnEl.innerHTML = `${cost.toLocaleString('ru-RU')} ${window.GameIcons ? window.GameIcons.coin(12) : ''}`; 
            }
          }
        }
      });
    },

    renderPiggyWidget() {
      if (typeof document === 'undefined') return;
      const p = document.getElementById('piggy-amount');
      const pb = document.getElementById('piggy-widget-bar');
      const badge = document.getElementById('piggy-widget-badge');

      const coins = this.gameState.piggyCoins || 0;
      const pct = Math.min(100, Math.round((coins / PIGGY_CONFIG.maxCapacity) * 100));

      if (p) p.innerHTML = `${coins.toLocaleString('ru-RU')} ${window.GameIcons ? window.GameIcons.coin(12) : ''}`; 
      if (pb) pb.style.width = `${pct}%`;

      if (badge) {
        if (coins >= PIGGY_CONFIG.minSmashThreshold) {
          badge.classList.remove('hidden');
          badge.textContent = 'ГОТОВА!';
        } else {
          badge.classList.add('hidden');
        }
      }
    },

    showToast(msg) {
      if (typeof window !== 'undefined' && typeof window.showMatchToast === 'function') {
        window.showMatchToast(msg);
      }
    }
  };

  // ============================================================
  // ЭКСПОРТ ДЛЯ БРАУЗЕРА И NODE.JS
  // ============================================================
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MonopolyGoMeta;
  }
  if (typeof window !== 'undefined') {
    window.MonopolyGoMeta = MonopolyGoMeta;
  }

})(typeof window !== 'undefined' ? window : globalThis);
