// ============================================================
// Chuko Royal — Telegram Mini App (TMA) Integration Module
// Path: /Users/kxansky/Documents/chuko/js/telegram_tma.js
// Handles: WebApp SDK lifecycle, Auto-Auth, Viewport lock,
// Safe Area, Haptics, Deep-linking, and Telegram Share.
// ============================================================

(function (global) {
  'use strict';

  const TelegramTMA = {
    isAvailable: false,
    tg: null,
    user: null,
    botUsername: 'chukobattle_bot', // Telegram bot username

    /**
     * Initializes Telegram WebApp environment
     * @param {Object} state Game state object
     * @param {Function} onReady Callback when user is identified
     */
    init(state, onReady) {
      try {
        const tg = (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp)
          ? window.Telegram.WebApp
          : null;

        if (!tg || !tg.initData) {
          console.log('[TMA] Running in standard browser mode (fallback profile active).');
          return;
        }

        this.tg = tg;
        this.isAvailable = true;

        // 1. Ready & Expand to full screen height
        tg.ready();
        try {
          tg.expand();
        } catch (_) {}

        // 2. Visual Theme & Header Color
        try {
          tg.setHeaderColor('#06101e');
          tg.setBackgroundColor('#06101e');
          tg.enableClosingConfirmation();
        } catch (_) {}

        // 3. Disable vertical swipe-to-close
        // Crucial for physics / slingshot games so pulling Saka downwards doesn't minimize Telegram sheet
        try {
          if (typeof tg.disableVerticalSwipes === 'function') {
            tg.disableVerticalSwipes();
          }
          tg.isVerticalSwipesEnabled = false;
        } catch (_) {}

        // 4. Safe Area Insets for iOS Dynamic Island / notch & Android navigation bar
        try {
          const applySafeArea = () => {
            const insetTop = (tg.safeAreaInset && tg.safeAreaInset.top) || 0;
            const insetBottom = (tg.safeAreaInset && tg.safeAreaInset.bottom) || 0;
            if (insetTop > 0) {
              document.documentElement.style.setProperty('--sat', `${insetTop}px`);
            }
            if (insetBottom > 0) {
              document.documentElement.style.setProperty('--sab', `${insetBottom}px`);
            }
            if (tg.viewportStableHeight) {
              document.documentElement.style.setProperty('--tg-viewport-stable-height', `${tg.viewportStableHeight}px`);
            }
          };
          applySafeArea();
          if (typeof tg.onEvent === 'function') {
            tg.onEvent('viewportChanged', applySafeArea);
          }
        } catch (_) {}

        // 5. Telegram User Auto-Authentication
        const tgUser = tg.initDataUnsafe && tg.initDataUnsafe.user;
        if (tgUser && state) {
          this.user = tgUser;
          const displayName = tgUser.username
            ? '@' + tgUser.username
            : (tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : ''));

          state.username = displayName;
          state.telegramId = tgUser.id;
          state.avatarUrl = tgUser.photo_url || null;
          state.isTelegram = true;

          // Isolated persistent local storage for this specific Telegram ID
          const storageKey = 'chuko_tg_profile_' + tgUser.id;
          const savedData = localStorage.getItem(storageKey);
          if (savedData) {
            try {
              const parsed = JSON.parse(savedData);
              if (parsed.coins !== undefined) state.coins = parsed.coins;
              if (parsed.bucks !== undefined) state.bucks = parsed.bucks;
              if (parsed.trophies !== undefined) state.trophies = parsed.trophies;
              if (parsed.village) state.village = parsed.village;
              if (parsed.sakaCustomization) state.sakaCustomization = parsed.sakaCustomization;
            } catch (_) {}
          } else {
            // Welcome bonus for Telegram users
            state.coins = Math.max(state.coins || 0, 5000);
            state.bucks = Math.max(state.bucks || 0, 25);
            this.saveProfile(state);
          }

          // Global profile auto-saver
          window.saveTelegramProfile = () => this.saveProfile(state);

          if (typeof onReady === 'function') {
            onReady(tgUser);
          }
        }

        // 6. Deep linking handling (startapp=duel_123 or startapp=ref_123)
        const startParam = tg.initDataUnsafe && tg.initDataUnsafe.start_param;
        if (startParam) {
          console.log('[TMA] Detected deep link start_param:', startParam);
          this.handleDeepLink(startParam, state);
        }

        console.log('[TMA] Telegram Mini App initialized successfully!', tgUser?.username || tgUser?.id || 'Guest');
      } catch (err) {
        console.warn('[TMA] Telegram WebApp init warning:', err);
      }
    },

    saveProfile(state) {
      if (!this.user || !state) return;
      try {
        const storageKey = 'chuko_tg_profile_' + this.user.id;
        localStorage.setItem(storageKey, JSON.stringify({
          coins: state.coins,
          bucks: state.bucks,
          trophies: state.trophies,
          village: state.village,
          sakaCustomization: state.sakaCustomization,
          updatedAt: Date.now()
        }));
      } catch (_) {}
    },

    handleDeepLink(param, state) {
      if (!param) return;
      if (param.startsWith('duel_') || param.startsWith('room_')) {
        const code = param.replace('duel_', '').replace('room_', '');
        setTimeout(() => {
          if (typeof window.showMatchToast === 'function') {
            window.showMatchToast(`Подключение к дуэли #${code}...`);
          }
          if (typeof window.startFriendMatchLocal === 'function') {
            // Auto open friend duel
            window.openFriendLobbyModal && window.openFriendLobbyModal();
          }
        }, 800);
      } else if (param.startsWith('ref_')) {
        const inviterId = param.replace('ref_', '');
        const refClaimKey = 'chuko_tg_ref_claimed_' + inviterId;
        if (!localStorage.getItem(refClaimKey)) {
          localStorage.setItem(refClaimKey, 'true');
          setTimeout(() => {
            if (typeof window.showModal === 'function') {
              window.showModal('gift', 'Добро пожаловать в Ордо!', `Вы перешли по приглашению друга (ID #${inviterId}). Вам начислено <b>+1,000 монет</b>!`);
              if (state) {
                state.coins = (state.coins || 0) + 1000;
                if (typeof window.updateHUD === 'function') window.updateHUD();
              }
            }
          }, 1000);
        }
      }
    },

    /**
     * Share friend duel invitation via Telegram native chat picker
     */
    shareInvite(code) {
      const tgUserId = this.user ? this.user.id : 'player';
      const appUrl = `https://t.me/${this.botUsername}/play?startapp=duel_${code}`;
      const text = `Сыграй со мной в кыргызское Ордо в Chuko Royal! Комната #${code}:`;
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(text)}`;

      if (this.tg && typeof this.tg.openTelegramLink === 'function') {
        this.tg.openTelegramLink(shareUrl);
      } else if (typeof navigator !== 'undefined' && navigator.share) {
        navigator.share({ title: 'Chuko Royal', text, url: appUrl }).catch(() => {
          this.copyToClipboard(appUrl);
        });
      } else {
        this.copyToClipboard(appUrl);
      }
    },

    copyToClipboard(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          if (typeof window.showMatchToast === 'function') {
            window.showMatchToast('Ссылка скопирована!');
          }
        }).catch(() => {});
      }
    },

    /**
     * Native Telegram Haptic Feedback trigger
     */
    haptic(type = 'light') {
      try {
        if (this.tg && this.tg.HapticFeedback) {
          if (type === 'selection') {
            this.tg.HapticFeedback.selectionChanged();
          } else if (type === 'success' || type === 'warning' || type === 'error') {
            this.tg.HapticFeedback.notificationOccurred(type);
          } else {
            this.tg.HapticFeedback.impactOccurred(type);
          }
        }
      } catch (_) {}
    }
  };

  global.TelegramTMA = TelegramTMA;
})(typeof window !== 'undefined' ? window : globalThis);
