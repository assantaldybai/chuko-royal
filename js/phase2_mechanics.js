// ============================================================
// Chuko Royal — Phase 2 Mechanics Module
// 8 Ball Pool Aiming + Kyrgyz Ordo Canonical Rules & Haptics
// /Users/kxansky/Documents/chuko/js/phase2_mechanics.js
// ============================================================

(function (global) {
  'use strict';

  // ============================================================
  // 1. МОДУЛЬ ТАКТИЛЬНОГО ОТКЛИКА (HAPTICS FACADE)
  // Telegram WebApp HapticFeedback + navigator.vibrate fallback
  // ============================================================
  const ChukoHaptics = {
    /**
     * Возвращает Telegram WebApp HapticFeedback объект если доступен
     */
    getTgHaptic() {
      try {
        const w = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis.window : null);
        if (w && w.Telegram && w.Telegram.WebApp) {
          return w.Telegram.WebApp.HapticFeedback || null;
        }
      } catch (e) {}
      return null;
    },

    /**
     * Тактильный удар заданной силы
     * @param {'light'|'medium'|'heavy'|'rigid'|'soft'} style
     */
    impact(style = 'medium') {
      const tg = this.getTgHaptic();
      if (tg && typeof tg.impactOccurred === 'function') {
        try {
          tg.impactOccurred(style);
          return;
        } catch (e) {}
      }

      // Fallback: Web Vibration API
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          const map = {
            light: 10,
            soft: 14,
            medium: 26,
            rigid: 38,
            heavy: 55
          };
          navigator.vibrate(map[style] || 25);
        } catch (e) {}
      }
    },

    /**
     * Уведомление об успехе, предупреждении или ошибке
     * @param {'success'|'warning'|'error'} type
     */
    notification(type = 'success') {
      const tg = this.getTgHaptic();
      if (tg && typeof tg.notificationOccurred === 'function') {
        try {
          tg.notificationOccurred(type);
          return;
        } catch (e) {}
      }

      // Fallback: вибро-паттерны
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          if (type === 'success') {
            navigator.vibrate([35, 45, 35, 45, 90]);
          } else if (type === 'warning') {
            navigator.vibrate([45, 90, 45]);
          } else if (type === 'error') {
            navigator.vibrate([60, 100, 60, 100, 70]);
          }
        } catch (e) {}
      }
    },

    /**
     * Легкий щелчок выбора/шага натяжения
     */
    selection() {
      const tg = this.getTgHaptic();
      if (tg && typeof tg.selectionChanged === 'function') {
        try {
          tg.selectionChanged();
          return;
        } catch (e) {}
      }

      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate(8);
        } catch (e) {}
      }
    },

    // --- Семантические триггеры для игры Chuko Royal ---
    onPullStep() {
      this.selection();
    },

    onCollision(intensity = 1.0) {
      if (intensity > 1.25) {
        this.impact('heavy');
      } else if (intensity > 0.6) {
        this.impact('medium');
      } else {
        this.impact('light');
      }
    },

    onKnockout(isKhan = false) {
      if (isKhan) {
        this.onKhanCapture();
      } else {
        this.impact('heavy');
      }
    },

    onKhanCapture() {
      this.notification('success');
      // Праздничный вибро-фанфар для мобильных браузеров
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate([60, 50, 90, 60, 140, 70, 260]);
        } catch (e) {}
      }
    }
  };

  // ============================================================
  // 2. АЛГОРИТМ ПРИЦЕЛИВАНИЯ GHOST SAKA (8 BALL POOL GUIDELINE)
  // Рейкаст с кругами, расчет нормали столкновения и тангенса отскока
  // ============================================================
  const GhostAiming = {
    /**
     * Трассирует луч из Saka по aimAngle и находит пересечение с ближайшим активным альчиком.
     * @param {Object} saka {x, y, radius}
     * @param {number} aimAngle Угол полета в радианах
     * @param {Array} alchiks Список альчиков
     * @param {number} maxRange Максимальная длина луча прицела (в логических px)
     * @returns {Object} Результаты рейкаста
     */
    raycast(saka, aimAngle, alchiks, maxRange = 360) {
      if (!saka) return { hit: false };

      const dx = Math.cos(aimAngle);
      const dy = Math.sin(aimAngle);

      let closestHit = null;
      let minT = Infinity;

      const activeAlchiks = (alchiks || []).filter(a => a && a.active);

      for (let i = 0; i < activeAlchiks.length; i++) {
        const alchik = activeAlchiks[i];
        const combinedR = saka.radius + alchik.radius;

        // Вектор от центра целевого альчика к старту Сака
        const px = saka.x - alchik.x;
        const py = saka.y - alchik.y;
        const pLenSq = px * px + py * py;

        // Скалярное произведение направления и вектора положения
        const h = px * dx + py * dy;
        const c = pLenSq - combinedR * combinedR;
        const discr = h * h - c;

        // Если дискриминант < 0 — луч проходит мимо расширенной сферы
        if (discr < 0) continue;

        const sqrtDiscr = Math.sqrt(discr);
        let t = -h - sqrtDiscr;

        // Если Saka уже касается/перекрывает альчик, берем выходную точку
        if (t < 0.1) {
          t = -h + sqrtDiscr;
        }

        if (t > 0.1 && t < minT && t <= maxRange) {
          minT = t;
          closestHit = {
            alchik,
            t,
            combinedR
          };
        }
      }

      if (!closestHit) {
        // Столкновений нет — свободный луч до предела видимости
        return {
          hit: false,
          rayLength: maxRange,
          endPoint: {
            x: saka.x + dx * maxRange,
            y: saka.y + dy * maxRange
          }
        };
      }

      // Центр Ghost Saka в момент касания
      const ghostX = saka.x + dx * closestHit.t;
      const ghostY = saka.y + dy * closestHit.t;

      // Нормаль соударения (линия центров от Ghost Saka к целевому альчику)
      let nx = closestHit.alchik.x - ghostX;
      let ny = closestHit.alchik.y - ghostY;
      const nLen = Math.hypot(nx, ny) || 1;
      nx /= nLen;
      ny /= nLen;

      // Доля импульса, передаваемого в цель (cos угла между лучом и нормалью)
      const impactRatio = Math.max(0, Math.min(1, dx * nx + dy * ny));

      // Вектор разлета целевого альчика (строго по нормали n)
      const targetDeflection = {
        x: nx,
        y: ny,
        impactRatio
      };

      // Тангенциальный вектор отскока Сака (v_rebound = d - (d · n) * n)
      // В классической бильярдной физике угол между отскоком битка и целью = 90°
      const rx = dx - impactRatio * nx;
      const ry = dy - impactRatio * ny;
      const rLen = Math.hypot(rx, ry);

      const sakaRebound = {
        x: rLen > 0.001 ? rx / rLen : 0,
        y: rLen > 0.001 ? ry / rLen : 0,
        magnitude: rLen // 0 = лобовой удар (биток встает), 1 = тонкая резка
      };

      return {
        hit: true,
        t: closestHit.t,
        ghostPos: { x: ghostX, y: ghostY },
        targetAlchik: closestHit.alchik,
        normal: { x: nx, y: ny },
        targetDeflection,
        sakaRebound,
        impactRatio
      };
    },

    /**
     * Отрисовывает линию прицела, контур Ghost Saka, траекторию целевого альчика
     * и тангенциальный рикошет Сака в стиле 8 Ball Pool.
     */
    drawGuideline(ctx, match, aimAngle, pullRatio, toScreenFn) {
      if (!ctx || !match || !match.saka) return;
      const toScreen = toScreenFn || ((lx, ly) => ({
        x: match.centerX + (lx - match.centerX),
        y: match.centerY + (ly - match.centerY) * (match.tiltY || 0.76)
      }));

      const saka = match.saka;
      const sakaSp = toScreen(saka.x, saka.y);
      const maxRange = Math.min(match.circleRadius * 2.1, 380);

      const result = this.raycast(saka, aimAngle, match.alchiks, maxRange);

      ctx.save();

      if (!result.hit) {
        // Луч без столкновения — рисуем чистую пунктирную линию
        const endSp = toScreen(result.endPoint.x, result.endPoint.y);
        ctx.beginPath();
        ctx.setLineDash([5, 6]);
        ctx.moveTo(sakaSp.x, sakaSp.y);
        ctx.lineTo(endSp.x, endSp.y);
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = pullRatio > 0.75 ? '#ef4444' : '#fde047';
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        return;
      }

      // --- 1. Линия полета Сака до точки контакта (Ghost Saka) ---
      const ghostSp = toScreen(result.ghostPos.x, result.ghostPos.y);
      ctx.beginPath();
      ctx.setLineDash([5, 5]);
      ctx.moveTo(sakaSp.x, sakaSp.y);
      ctx.lineTo(ghostSp.x, ghostSp.y);
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = pullRatio > 0.75 ? '#f87171' : '#fde047';
      ctx.stroke();
      ctx.setLineDash([]);

      // --- 2. Полупрозрачный контур Ghost Saka (Точка контакта) ---
      const tilt = match.tiltY || 0.76;
      const ghostRadius = saka.radius;

      // Тень Ghost Saka
      ctx.beginPath();
      ctx.ellipse(ghostSp.x, ghostSp.y + 2, ghostRadius * 0.95, ghostRadius * 0.95 * tilt, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.fill();

      // Контур фантома Сака (светящаяся проекция)
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.ellipse(ghostSp.x, ghostSp.y, ghostRadius, ghostRadius * tilt, 0, 0, Math.PI * 2);
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = result.targetAlchik.isKhan ? 'rgba(251, 191, 36, 0.95)' : 'rgba(255, 255, 255, 0.85)';
      ctx.fillStyle = result.targetAlchik.isKhan ? 'rgba(251, 191, 36, 0.18)' : 'rgba(245, 158, 11, 0.15)';
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      // Маленькая точка в центре фантома
      ctx.beginPath();
      ctx.arc(ghostSp.x, ghostSp.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // --- 3. Стрелка траектории целевого альчика ---
      const target = result.targetAlchik;
      const targetSp = toScreen(target.x, target.y);

      // Длина стрелки зависит от силы и коэффициента лобового удара
      const targetArrowLen = 22 + 42 * result.targetDeflection.impactRatio * (0.6 + pullRatio * 0.4);
      const targetEndWorld = {
        x: target.x + result.targetDeflection.x * targetArrowLen,
        y: target.y + result.targetDeflection.y * targetArrowLen
      };
      const targetEndSp = toScreen(targetEndWorld.x, targetEndWorld.y);

      // Линия пути выбиваемого альчика
      ctx.beginPath();
      ctx.moveTo(targetSp.x, targetSp.y);
      ctx.lineTo(targetEndSp.x, targetEndSp.y);
      ctx.lineWidth = target.isKhan ? 3.4 : 2.6;
      ctx.strokeStyle = target.isKhan ? '#f59e0b' : '#38bdf8';
      ctx.stroke();

      // Наконечник стрелки цели
      this._drawArrowHead(ctx, targetSp, targetEndSp, target.isKhan ? '#f59e0b' : '#38bdf8', target.isKhan ? 9 : 7);

      // Если цель — Хан, рисуем сияющую мини-корону или нимб над фантомом
      if (target.isKhan) {
        ctx.fillStyle = '#fde047';
        ctx.font = '900 10px Rubik, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👑 ХАН', ghostSp.x, ghostSp.y - ghostRadius * tilt - 6);
      }

      // --- 4. Тангенциальный вектор отскока Сака (Рикошет 90°) ---
      if (result.sakaRebound.magnitude > 0.08) {
        const reboundArrowLen = 18 + 36 * result.sakaRebound.magnitude * (0.5 + pullRatio * 0.5);
        const reboundEndWorld = {
          x: result.ghostPos.x + result.sakaRebound.x * reboundArrowLen,
          y: result.ghostPos.y + result.sakaRebound.y * reboundArrowLen
        };
        const reboundEndSp = toScreen(reboundEndWorld.x, reboundEndWorld.y);

        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(ghostSp.x, ghostSp.y);
        ctx.lineTo(reboundEndSp.x, reboundEndSp.y);
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.stroke();
        ctx.setLineDash([]);

        this._drawArrowHead(ctx, ghostSp, reboundEndSp, 'rgba(255, 255, 255, 0.85)', 6);
      }

      ctx.restore();
    },

    _drawArrowHead(ctx, fromSp, toSp, color, size = 7) {
      const angle = Math.atan2(toSp.y - fromSp.y, toSp.x - fromSp.x);
      ctx.save();
      ctx.translate(toSp.x, toSp.y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-size, -size * 0.55);
      ctx.lineTo(-size * 0.7, 0);
      ctx.lineTo(-size, size * 0.55);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    }
  };

  // ============================================================
  // 3. КАНОНИЧЕСКАЯ РАССТАНОВКА ОРДО ГАРНИЗОНА (ҮЙМӨК / ОСАДА ХАНА)
  // Хан в центре ставки + круговая/ромбическая защита
  // ============================================================
  const OrdoGarrison = {
    /**
     * Генерирует гарнизон костей для 5 или 9 альчиков
     * @param {number} count 5 или 9
     * @param {number} centerX Центр поля по X
     * @param {number} centerY Центр поля по Y
     * @returns {Array} Массив сконфигурированных объектов костей
     */
    generateCluster(count = 5, centerX = 195, centerY = 225) {
      const alchiks = [];

      // 1. Центральный Хан — ставка правителя
      const khan = {
        id: 'khan',
        x: centerX,
        y: centerY,
        vx: 0,
        vy: 0,
        radius: 12.5,
        mass: 1.45, // Тяжелый хан
        angle: 0,
        vAngle: 0,
        isKhan: true,
        active: true
      };
      alchiks.push(khan);

      if (count === 5) {
        // --- 5 костей: Хан в центре + 4 защитника плотным ромбом/крестом вокруг Хана ---
        // Радиус гарнизона 21px обеспечивает плотное прилегание без самопроизвольного взрыва физики
        const dist = 21.0;
        const defenders = [
          { dx: 0, dy: -dist, angle: 0.35 },  // Северный защитник (сверху)
          { dx: 0, dy: dist, angle: -0.4 },   // Южный защитник (прикрывает Хана от фронтального броска)
          { dx: -dist, dy: 0, angle: 0.25 },  // Западный защитник (слева)
          { dx: dist, dy: 0, angle: -0.3 }    // Восточный защитник (справа)
        ];

        defenders.forEach((d, idx) => {
          alchiks.push({
            id: `guard_5_${idx}`,
            x: centerX + d.dx,
            y: centerY + d.dy,
            vx: 0,
            vy: 0,
            radius: 11.0,
            mass: 1.18,
            angle: d.angle,
            vAngle: 0,
            isKhan: false,
            active: true
          });
        });
      } else {
        // --- 9 костей: Хан в центре + 4 защитника во внутреннем кольце (18px) + 4 защитника во внешнем (32px) ---
        // Каноническая осада Хана: 8 защитников блокируют все сектора атаки
        const rInner = 18.0;
        const rOuter = 32.0;

        // Внутреннее кольцо: 4 защитника под углами 0°, 90°, 180°, 270°
        const innerAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
        innerAngles.forEach((ang, idx) => {
          alchiks.push({
            id: `guard_inner_${idx}`,
            x: centerX + Math.cos(ang) * rInner,
            y: centerY + Math.sin(ang) * rInner,
            vx: 0,
            vy: 0,
            radius: 11.0,
            mass: 1.20,
            angle: (idx * 0.45) - 0.2,
            vAngle: 0,
            isKhan: false,
            active: true
          });
        });

        // Внешнее кольцо: 4 защитника со смещением 45° (шахматный замок, прикрывающий бреши)
        const outerAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
        outerAngles.forEach((ang, idx) => {
          alchiks.push({
            id: `guard_outer_${idx}`,
            x: centerX + Math.cos(ang) * rOuter,
            y: centerY + Math.sin(ang) * rOuter,
            vx: 0,
            vy: 0,
            radius: 11.0,
            mass: 1.16,
            angle: -(idx * 0.4) + 0.3,
            vAngle: 0,
            isKhan: false,
            active: true
          });
        });
      }

      return alchiks;
    }
  };

  // ============================================================
  // 4. ПРАВИЛО «ХАН АЛУУ» (ВЗЯТИЕ ХАНА) И СУПЕР-БОНУС
  // Выбивание Хана дает x3 очков, джекпот и триумфальный отклик
  // ============================================================
  const KhanRule = {
    KHAN_SCORE_MULTIPLIER: 3,
    KHAN_JACKPOT_COINS: 500,

    /**
     * Проверяет выбивание кости и начисляет очки/бонусы с правилом Хан алуу
     * @param {Object} alchik
     * @param {Object} match
     * @param {Object} state
     * @param {Function} playSoundFn
     * @param {Function} showToastFn
     * @returns {Object} Информация о событии выбивания
     */
    processKnockout(alchik, match, state, playSoundFn, showToastFn) {
      if (!alchik || !alchik.active) return null;

      alchik.active = false;
      const isKhan = !!alchik.isKhan;
      const points = isKhan ? this.KHAN_SCORE_MULTIPLIER : 1;

      match.knockedThisShot = (match.knockedThisShot || 0) + 1;

      if (playSoundFn) {
        playSoundFn(isKhan ? 'khan_triumph' : 'out');
      }

      // Тактильный отклик
      ChukoHaptics.onKnockout(isKhan);

      if (match.turn === 'player') {
        match.scorePlayer = (match.scorePlayer || 0) + points;
        if (state) {
          state.knockedTotal = (state.knockedTotal || 0) + 1;
          state.piggyCoins = (state.piggyCoins || 0) + (isKhan ? this.KHAN_JACKPOT_COINS : 150);
        }

        if (isKhan) {
          match.khanCapturedBy = 'player';
          if (showToastFn) {
            showToastFn('👑 ХАН АЛУУ! Хан выбит! (+3 ОЧКА)');
          }
        }
      } else {
        match.scoreBot = (match.scoreBot || 0) + points;
        if (isKhan) {
          match.khanCapturedBy = 'bot';
          if (showToastFn) {
            showToastFn('🐺 Bot_Batyr совершил ХАН АЛУУ! (+3)');
          }
        }
      }

      return {
        isKhan,
        points,
        turn: match.turn,
        scorePlayer: match.scorePlayer,
        scoreBot: match.scoreBot
      };
    },

    /**
     * Показывает специальное модальное окно триумфа "Хан алуу"
     */
    showTriumphModal(showModalFn, winnerName = 'Игрок') {
      if (typeof showModalFn !== 'function') return;

      const title = 'ХАН АЛУУ!';
      const body = `
        <div class="py-2 text-center">
          <div class="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
            Королевский триумф Ордо
          </div>
          <div class="text-sm font-black text-white mb-2">
            Ставка Хана сокрушена точным ударом!
          </div>
          <div class="bg-amber-500/15 border border-amber-400/40 rounded-2xl p-3 flex flex-col gap-1.5 text-xs text-amber-200">
            <div class="flex justify-between items-center font-bold">
              <span>Бонус «Хан алуу»:</span>
              <span class="text-lime-400 text-sm font-black">+3 ОЧКА</span>
            </div>
            <div class="flex justify-between items-center font-bold">
              <span>Ханский джекпот в копилку:</span>
              <span class="text-amber-300 font-black">+${this.KHAN_JACKPOT_COINS} 🪙</span>
            </div>
          </div>
        </div>
      `;

      showModalFn('👑', title, body, `
        <button onclick="closeGenericModal()" class="btn-tap flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 font-black uppercase text-xs shadow-lg">
          Вперед к победе!
        </button>
      `);
    }
  };

  // Экспорт для браузера и Node.js среды тестирования
  const Phase2Mechanics = {
    Haptics: ChukoHaptics,
    GhostAiming,
    OrdoGarrison,
    KhanRule
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Phase2Mechanics;
  }
  if (typeof window !== 'undefined') {
    window.Phase2Mechanics = Phase2Mechanics;
    window.ChukoHaptics = ChukoHaptics;
    window.GhostAiming = GhostAiming;
    window.OrdoGarrison = OrdoGarrison;
    window.KhanRule = KhanRule;
  }

})(typeof window !== 'undefined' ? window : globalThis);
