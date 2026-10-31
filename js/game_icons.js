// ===================================================================
// CHUKO ROYAL — TIER-1 PROFESSIONAL GAME VECTOR ICON SYSTEM
// Replaces amateur system emojis with high-end mobile esports vector SVG
// (Standards: Brawl Stars, Marvel Snap, Clash Royale)
// ===================================================================

(function (global) {
  'use strict';

  // Helper to parse polymorphic arguments (supports both fn(size, class, variant) and fn(variant, size, class))
  function parseArgs(arg1, arg2, arg3, defaultVariant, defaultSize) {
    let size = defaultSize;
    let className = '';
    let variant = defaultVariant;

    if (typeof arg1 === 'number') {
      size = arg1;
      className = typeof arg2 === 'string' ? arg2 : '';
      variant = arg3 !== undefined ? arg3 : defaultVariant;
    } else if (typeof arg1 === 'string' && (isNaN(Number(arg1)) || typeof arg2 === 'number')) {
      variant = arg1;
      size = typeof arg2 === 'number' ? arg2 : defaultSize;
      className = typeof arg3 === 'string' ? arg3 : '';
    } else {
      variant = defaultVariant;
      size = defaultSize;
    }

    return { size, className, variant };
  }

  const GameIcons = {
    // 1. Золотая монета кочевника (Gold Coin)
    coin(size = 18, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10.5" fill="url(#grad-coin-rim)" stroke="#78350f" stroke-width="1.2"/>
        <circle cx="12" cy="12" r="8" fill="url(#grad-coin-core)" stroke="#b45309" stroke-width="0.8"/>
        <circle cx="12" cy="12" r="3.2" fill="#fef08a" stroke="#d97706" stroke-width="0.8"/>
        <path d="M12 4.5V6.5M12 17.5V19.5M4.5 12H6.5M17.5 12H19.5M6.8 6.8L8.2 8.2M15.8 15.8L17.2 17.2M6.8 17.2L8.2 15.8M15.8 8.2L17.2 6.8" stroke="#fef08a" stroke-width="1.2" stroke-linecap="round"/>
        <defs>
          <linearGradient id="grad-coin-rim" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stop-color="#fde047"/>
            <stop offset="0.5" stop-color="#d97706"/>
            <stop offset="1" stop-color="#92400e"/>
          </linearGradient>
          <linearGradient id="grad-coin-core" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop stop-color="#fbbf24"/>
            <stop offset="1" stop-color="#b45309"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 2. Изумрудный бакс / кристалл (Emerald Buck)
    buck(size = 18, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L20.5 7.5V16.5L12 22L3.5 16.5V7.5L12 2Z" fill="url(#grad-buck-base)" stroke="#064e3b" stroke-width="1.2"/>
        <path d="M12 2L12 22M3.5 7.5L20.5 7.5M3.5 16.5L20.5 16.5" stroke="#6ee7b7" stroke-width="0.8" opacity="0.6"/>
        <polygon points="12,5 17,9 12,19 7,9" fill="url(#grad-buck-face)" opacity="0.85"/>
        <defs>
          <linearGradient id="grad-buck-base" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
            <stop stop-color="#34d399"/>
            <stop offset="0.6" stop-color="#059669"/>
            <stop offset="1" stop-color="#064e3b"/>
          </linearGradient>
          <linearGradient id="grad-buck-face" x1="7" y1="5" x2="17" y2="19" gradientUnits="userSpaceOnUse">
            <stop stop-color="#a7f3d0"/>
            <stop offset="1" stop-color="#10b981"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 3. Щит батыра (Nomad Shield)
    shield(size = 18, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L20 5.5V11.5C20 16.8 16.5 21 12 22.5C7.5 21 4 16.8 4 11.5V5.5L12 2Z" fill="url(#grad-shield-base)" stroke="#0e7490" stroke-width="1.2"/>
        <path d="M12 4L18 6.8V11.5C18 15.6 15.4 19.1 12 20.3C8.6 19.1 6 15.6 6 11.5V6.8L12 4Z" fill="url(#grad-shield-inner)"/>
        <circle cx="12" cy="11.5" r="3.2" fill="#fde047" stroke="#b45309" stroke-width="0.8"/>
        <circle cx="12" cy="11.5" r="1.2" fill="#78350f"/>
        <defs>
          <linearGradient id="grad-shield-base" x1="4" y1="2" x2="20" y2="22.5" gradientUnits="userSpaceOnUse">
            <stop stop-color="#38bdf8"/>
            <stop offset="0.5" stop-color="#0284c7"/>
            <stop offset="1" stop-color="#0c4a6e"/>
          </linearGradient>
          <linearGradient id="grad-shield-inner" x1="6" y1="4" x2="18" y2="20" gradientUnits="userSpaceOnUse">
            <stop stop-color="#0369a1"/>
            <stop offset="1" stop-color="#082f49"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 4. Кубок Лиги / Трофей (Trophy)
    trophy(size = 18, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 3H17V9.5C17 12.8 14.8 15.5 12 15.5C9.2 15.5 7 12.8 7 9.5V3Z" fill="url(#grad-trophy)" stroke="#92400e" stroke-width="1.2"/>
        <path d="M7 5H4C3.4 5 3 5.4 3 6V7.5C3 9.4 4.6 11 6.5 11H7V9.5" stroke="#d97706" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M17 5H20C20.6 5 21 5.4 21 6V7.5C21 9.4 19.4 11 17.5 11H17V9.5" stroke="#d97706" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M12 15.5V18.5M8.5 21.5H15.5L14.5 18.5H9.5L8.5 21.5Z" fill="#b45309" stroke="#78350f" stroke-width="1.2"/>
        <path d="M12 5.5L12.8 7.2L14.6 7.4L13.2 8.7L13.6 10.5L12 9.6L10.4 10.5L10.8 8.7L9.4 7.4L11.2 7.2L12 5.5Z" fill="#fef08a"/>
        <defs>
          <linearGradient id="grad-trophy" x1="7" y1="3" x2="17" y2="16" gradientUnits="userSpaceOnUse">
            <stop stop-color="#fde047"/>
            <stop offset="0.6" stop-color="#f59e0b"/>
            <stop offset="1" stop-color="#b45309"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 5. Скрещенные клинки боевой арены (Crossed Scimitars)
    swords(size = 20, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.5 4.5L14.5 9.5M19.5 4.5C20.5 5.5 19 8 16 11L12.5 7.5C15.5 4.5 18 3 19.5 4.5Z" fill="url(#grad-blade)" stroke="#e2e8f0" stroke-width="1"/>
        <path d="M4.5 19.5L9.5 14.5M4.5 19.5C3.5 18.5 5 16 8 13L11.5 16.5C8.5 19.5 6 21 4.5 19.5Z" fill="url(#grad-blade)" stroke="#e2e8f0" stroke-width="1"/>
        <path d="M11.5 10.5L13.5 8.5M15.5 10.5L13.5 12.5" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
        <path d="M10.5 11.5L8.5 13.5M10.5 15.5L12.5 13.5" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
        <circle cx="17.5" cy="6.5" r="1.5" fill="#f59e0b"/>
        <circle cx="6.5" cy="17.5" r="1.5" fill="#f59e0b"/>
        <defs>
          <linearGradient id="grad-blade" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop stop-color="#ffffff"/>
            <stop offset="0.6" stop-color="#cbd5e1"/>
            <stop offset="1" stop-color="#64748b"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 6. Ханская Юрта (Boz Uy)
    yurt(size = 20, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 13H21V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V13Z" fill="#e2e8f0" stroke="#475569" stroke-width="1.2"/>
        <rect x="3" y="14" width="18" height="2.5" fill="#dc2626"/>
        <path d="M2.5 13C4 8 8 5 12 4.5C16 5 20 8 21.5 13H2.5Z" fill="url(#grad-yurt-roof)" stroke="#92400e" stroke-width="1.2"/>
        <ellipse cx="12" cy="4.5" rx="3.5" ry="1.8" fill="#f59e0b" stroke="#78350f" stroke-width="0.8"/>
        <path d="M10 21V16H14V21H10Z" fill="#78350f"/>
        <defs>
          <linearGradient id="grad-yurt-roof" x1="12" y1="4" x2="12" y2="13" gradientUnits="userSpaceOnUse">
            <stop stop-color="#fef3c7"/>
            <stop offset="1" stop-color="#d4d4d8"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 7. Альчик / Сака (Chuko Bone)
    saka(arg1 = 20, arg2 = '', arg3 = 'lead') {
      const { size, className, variant: skin } = parseArgs(arg1, arg2, arg3, 'lead', 20);
      const skinGradients = {
        lead: { stop1: '#f8fafc', stop2: '#e2e8f0', stop3: '#94a3b8', core: '#475569', coreStroke: '#64748b', stroke: '#334155' },
        gold: { stop1: '#fef08a', stop2: '#fbbf24', stop3: '#b45309', core: '#78350f', coreStroke: '#fde047', stroke: '#78350f' },
        cyber: { stop1: '#a5f3fc', stop2: '#06b6d4', stop3: '#083344', core: '#ec4899', coreStroke: '#22d3ee', stroke: '#0e7490' },
        horn: { stop1: '#fed7aa', stop2: '#d97706', stop3: '#78350f', core: '#451a03', coreStroke: '#fbbf24', stroke: '#451a03' },
        obsidian: { stop1: '#475569', stop2: '#1e293b', stop3: '#090d16', core: '#a855f7', coreStroke: '#c084fc', stroke: '#020617' }
      };
      const c = skinGradients[skin] || skinGradients.lead;
      const gradId = `grad-saka-${skin}-${size}`;

      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 4.5C3.5 5.5 3 8 4 10C3 13 3.5 16 5 18C7 19.5 9 18.5 12 18.8C15 18.5 17 19.5 19 18C20.5 16 21 13 20 10C21 8 20.5 5.5 19 4.5C17 3.5 15 4.5 12 4.2C9 4.5 7 3.5 5 4.5Z" fill="url(#${gradId})" stroke="${c.stroke}" stroke-width="1.2"/>
        <circle cx="12" cy="11.5" r="3.2" fill="${c.core}" stroke="${c.coreStroke}" stroke-width="0.9"/>
        <defs>
          <linearGradient id="${gradId}" x1="4" y1="4" x2="20" y2="19" gradientUnits="userSpaceOnUse">
            <stop stop-color="${c.stop1}"/>
            <stop offset="0.55" stop-color="${c.stop2}"/>
            <stop offset="1" stop-color="${c.stop3}"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 8. Ханская Лавка (Merchant Vault / Shop)
    shop(size = 20, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6H20L21.5 11H2.5L4 6Z" fill="#b45309" stroke="#78350f" stroke-width="1.2"/>
        <path d="M3 11H21V20C21 20.6 20.6 21 20 21H4C3.4 21 3 20.6 3 20V11Z" fill="#78350f" stroke="#451a03" stroke-width="1.2"/>
        <rect x="7" y="11" width="10" height="9" fill="#92400e" stroke="#f59e0b" stroke-width="0.8"/>
        <circle cx="12" cy="15" r="1.5" fill="#fde047" stroke="#b45309" stroke-width="0.8"/>
        <path d="M8 3L9.5 6M16 3L14.5 6" stroke="#f59e0b" stroke-width="1.4" stroke-linecap="round"/>
      </svg>`;
    },

    // 9. Сундук наград (Game Chest) — Supports chest('gold', 28) and chest(28, '', 'gold')
    chest(arg1 = 'gold', arg2 = 24, arg3 = '') {
      const { size, className, variant: tier } = parseArgs(arg1, arg2, arg3, 'gold', 24);
      const colors = {
        wood: { rim: '#78350f', base: '#92400e', band: '#d97706', lock: '#fbbf24' },
        silver: { rim: '#334155', base: '#475569', band: '#94a3b8', lock: '#38bdf8' },
        gold: { rim: '#92400e', base: '#d97706', band: '#fde047', lock: '#fef08a' }
      }[tier] || { rim: '#92400e', base: '#d97706', band: '#fde047', lock: '#fef08a' };

      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6.5C3 5.4 4 4.5 5.5 4.5H18.5C19.8 4.5 21 5.4 21 6.5V9.5H3V6.5Z" fill="${colors.base}" stroke="${colors.rim}" stroke-width="1.2"/>
        <path d="M3 9.5H21V18.5C21 19.6 19.8 20.5 18.5 20.5H5.5C4 20.5 3 19.6 3 18.5V9.5Z" fill="${colors.base}" stroke="${colors.rim}" stroke-width="1.2"/>
        <rect x="6" y="4.5" width="2.5" height="16" fill="${colors.band}"/>
        <rect x="15.5" y="4.5" width="2.5" height="16" fill="${colors.band}"/>
        <rect x="10" y="8.5" width="4" height="4.5" rx="1" fill="${colors.lock}" stroke="${colors.rim}" stroke-width="0.8"/>
        <circle cx="12" cy="10.8" r="0.8" fill="#18181b"/>
      </svg>`;
    },

    // 10. Кузница (Saka Forge)
    forge(size = 20, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 14H20L18 19H6L4 14Z" fill="#334155" stroke="#0f172a" stroke-width="1.2"/>
        <path d="M7 14L8 8H16L17 14" fill="#475569"/>
        <path d="M12 4L17 9M13 3L18 8M14 6L18 10L16 12L12 8L14 6Z" fill="#f59e0b" stroke="#78350f" stroke-width="1"/>
        <circle cx="10" cy="6" r="1" fill="#fde047"/>
        <circle cx="13" cy="4" r="0.8" fill="#f97316"/>
      </svg>`;
    },

    // 11. Загон коней (Argamak Stables)
    stable(size = 20, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 4C17 4 14 5 12 7C10 5.5 8 5.5 7 7C5.5 9 6 12 6.5 14L5 17L7 18.5L9 16.5C11 18 14 18 16 16.5L18 18.5L20 17L18.5 14C19 12 19.5 9 18 4Z" fill="#92400e" stroke="#451a03" stroke-width="1.2"/>
        <path d="M14 4L16 8M12 6L14 10" stroke="#f59e0b" stroke-width="1.2" stroke-linecap="round"/>
        <circle cx="15.5" cy="8" r="0.8" fill="#fde047"/>
      </svg>`;
    },

    // 12. Дозорная Башня (Nomad Watchtower)
    tower(size = 20, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 21L9 4H15L17 21H7Z" fill="#334155" stroke="#1e293b" stroke-width="1.2"/>
        <rect x="7" y="3" width="10" height="3" fill="#92400e" stroke="#78350f" stroke-width="0.8"/>
        <path d="M6 3L12 0.5L18 3H6Z" fill="#dc2626"/>
        <path d="M8 12H16M7 17H17" stroke="#f59e0b" stroke-width="1.2"/>
      </svg>`;
    },

    // 13. Аватар батыра (Nomad Warrior Insignia / Helmet) — Supports avatar('wolf', 24) and avatar(24, '', 'wolf')
    avatar(arg1 = 'batyr', arg2 = 20, arg3 = '') {
      const { size, className, variant: type } = parseArgs(arg1, arg2, arg3, 'batyr', 20);

      if (type === 'wolf') {
        // Степной волк (Wolf Insignia)
        return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6L8 10L12 4L16 10L20 6L19 15L12 21L5 15L4 6Z" fill="#475569" stroke="#1e293b" stroke-width="1.2"/>
          <path d="M8 12L10 13M16 12L14 13" stroke="#fde047" stroke-width="1.5" stroke-linecap="round"/>
          <polygon points="12,14 10.5,17 13.5,17" fill="#0f172a"/>
        </svg>`;
      }
      if (type === 'eagle') {
        // Беркут (Golden Eagle)
        return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3C7 5 5 10 7 16L12 21L17 16C19 10 17 5 12 3Z" fill="#92400e" stroke="#78350f" stroke-width="1.2"/>
          <path d="M10 11L12 15L14 11" fill="#fde047" stroke="#b45309" stroke-width="0.8"/>
          <circle cx="10" cy="8.5" r="1.2" fill="#fef08a"/>
          <circle cx="14" cy="8.5" r="1.2" fill="#fef08a"/>
        </svg>`;
      }
      if (type === 'horse') {
        // Аргамак (Steppe Horse)
        return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 4C17 4 14 5 12 7C10 5.5 8 5.5 7 7C5.5 9 6 12 6.5 14L5 17L7 18.5L9 16.5C11 18 14 18 16 16.5L18 18.5L20 17L18.5 14C19 12 19.5 9 18 4Z" fill="#b45309" stroke="#78350f" stroke-width="1.2"/>
          <circle cx="15.5" cy="8" r="1" fill="#fef08a"/>
        </svg>`;
      }
      if (type === 'khan' || type === 'crown') {
        // Корона Хана (Khan's Imperial Crown)
        return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 17L3 7L8 11L12 4L16 11L21 7L20 17H4Z" fill="#fbbf24" stroke="#78350f" stroke-width="1.2"/>
          <rect x="4" y="17" width="16" height="3" fill="#b45309" stroke="#78350f" stroke-width="0.8"/>
          <circle cx="12" cy="11" r="1.5" fill="#ef4444"/>
          <circle cx="7" cy="14" r="1.2" fill="#3b82f6"/>
          <circle cx="17" cy="14" r="1.2" fill="#10b981"/>
        </svg>`;
      }

      // Default: Батыр в шлеме кочевника
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 13C5 7.5 8 4 12 4C16 4 19 7.5 19 13V15H5V13Z" fill="url(#grad-helmet-${size})" stroke="#78350f" stroke-width="1.2"/>
        <ellipse cx="12" cy="15.5" rx="7.5" ry="2.5" fill="#78350f" stroke="#451a03" stroke-width="0.8"/>
        <path d="M8 12C9 11 11 11 12 12C13 11 15 11 16 12" stroke="#fde047" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="10" cy="12" r="0.8" fill="#ffffff"/>
        <circle cx="14" cy="12" r="0.8" fill="#ffffff"/>
        <path d="M12 4V1" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round"/>
        <defs>
          <linearGradient id="grad-helmet-${size}" x1="5" y1="4" x2="19" y2="15" gradientUnits="userSpaceOnUse">
            <stop stop-color="#d97706"/>
            <stop offset="1" stop-color="#78350f"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 14. Пламя сезона (Nomad Flame)
    flame(size = 18, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C10 5 7 8 7 12.5C7 16.6 10.1 20 14 20C17.9 20 20 16.9 20 13C20 8.5 16 5.5 15 4C14.5 6 13.5 7 12 7.5C12 5.5 12.5 3.5 12 2Z" fill="url(#grad-flame)" stroke="#b91c1c" stroke-width="1"/>
        <path d="M12 11C10.5 12.5 10 14 10.5 16C11.5 15.5 12.5 15.5 13.5 16C14 14.8 13.5 13.5 12 11Z" fill="#fef08a"/>
        <defs>
          <linearGradient id="grad-flame" x1="12" y1="2" x2="14" y2="20" gradientUnits="userSpaceOnUse">
            <stop stop-color="#fde047"/>
            <stop offset="0.45" stop-color="#f97316"/>
            <stop offset="1" stop-color="#dc2626"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 15. Мишень тренировки (Practice Target)
    target(size = 18, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9.5" fill="#ef4444" stroke="#991b1b" stroke-width="1"/>
        <circle cx="12" cy="12" r="7" fill="#ffffff"/>
        <circle cx="12" cy="12" r="4.5" fill="#ef4444"/>
        <circle cx="12" cy="12" r="2" fill="#fde047"/>
      </svg>`;
    },

    // 16. Игра с другом / Дуэль 1v1 (Duel / Friends)
    duel(size = 18, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="4" fill="#38bdf8" stroke="#0369a1" stroke-width="1.2"/>
        <path d="M2 19C2 15.5 4.5 13 8 13C11.5 13 14 15.5 14 19H2Z" fill="#0284c7" stroke="#0369a1" stroke-width="1.2"/>
        <circle cx="16" cy="9" r="3.5" fill="#a855f7" stroke="#7e22ce" stroke-width="1.2"/>
        <path d="M12 19C12 16.5 14 14.5 16.5 14.5C19 14.5 21 16.5 21 19H12Z" fill="#9333ea" stroke="#7e22ce" stroke-width="1.2"/>
      </svg>`;
    },

    // 17. Подарок (Gift Box)
    gift(size = 18, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="9" width="16" height="12" rx="2" fill="#dc2626" stroke="#991b1b" stroke-width="1.2"/>
        <rect x="3" y="6" width="18" height="3.5" rx="1" fill="#ef4444" stroke="#991b1b" stroke-width="1.2"/>
        <rect x="10.5" y="6" width="3" height="15" fill="#fde047"/>
        <path d="M12 6C10 4 9 2.5 10 2C11 1.5 12 3.5 12 6Z" fill="#fde047"/>
        <path d="M12 6C14 4 15 2.5 14 2C13 1.5 12 3.5 12 6Z" fill="#fde047"/>
      </svg>`;
    },

    // 18. Алмаз / Премиум (Gem)
    gem(size = 18, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="6,3 18,3 22,9 12,21 2,9" fill="#06b6d4" stroke="#0e7490" stroke-width="1.2"/>
        <polygon points="6,3 18,3 15,9 9,9" fill="#67e8f9"/>
        <polygon points="9,9 15,9 12,21" fill="#0891b2"/>
        <polygon points="2,9 9,9 12,21" fill="#0284c7" opacity="0.6"/>
        <polygon points="22,9 15,9 12,21" fill="#0284c7" opacity="0.6"/>
      </svg>`;
    },

    // 19. Зеленый маркер готовности / Чекмарк (Check)
    check(size = 14, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 13L9 17L19 7" stroke="#84cc16" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    },

    // 20. Замок блокировки (Lock)
    lock(size = 14, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="10" width="14" height="11" rx="2" fill="#475569" stroke="#1e293b" stroke-width="1.2"/>
        <path d="M8 10V6C8 3.8 9.8 2 12 2C14.2 2 16 3.8 16 6V10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="15" r="1.5" fill="#fde047"/>
      </svg>`;
    },

    // 21. Звук включен (Sound On)
    soundOn(size = 16, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="#f59e0b" stroke="#78350f" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M15.54 8.46C16.48 9.4 17 10.65 17 12C17 13.35 16.48 14.6 15.54 15.54M19.07 4.93C20.94 6.8 22 9.3 22 12C22 14.7 20.94 17.2 19.07 19.07" stroke="#fbbf24" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`;
    },

    // 21b. Звук выключен (Sound Off / Muted)
    soundOff(size = 16, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="#64748b" stroke="#334155" stroke-width="1.2" stroke-linejoin="round"/>
        <line x1="23" y1="9" x2="17" y2="15" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
        <line x1="17" y1="9" x2="23" y2="15" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
    },

    // 22. Индикаторы характеристик Сака (Stats)
    statPower(size = 16, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#f59e0b" stroke="#b45309" stroke-width="1.2" stroke-linejoin="round"/>
      </svg>`;
    },
    statAim(size = 16, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" stroke="#10b981" stroke-width="1.8"/>
        <circle cx="12" cy="12" r="3" fill="#10b981"/>
        <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="#10b981" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`;
    },
    statWeight(size = 16, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 6H17L19 19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19L7 6Z" fill="#38bdf8" stroke="#0284c7" stroke-width="1.2"/>
        <circle cx="12" cy="4" r="2" stroke="#38bdf8" stroke-width="1.5"/>
        <path d="M9 13H15" stroke="#0369a1" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`;
    },
    statSpin(size = 16, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C15.5 20 18.5 17.8 19.5 14.5M19.5 14.5L16 14M19.5 14.5L21.5 17.5" stroke="#c084fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="2.5" fill="#a855f7"/>
      </svg>`;
    },

    // 23. Медали Топ-3 Лиги — Supports medal(1, 24) and medal(24, '', 1)
    medal(arg1 = 1, arg2 = 20, arg3 = '') {
      const { size, className, variant } = parseArgs(arg1, arg2, arg3, 1, 20);
      const rank = parseInt(variant, 10) || 1;
      const config = {
        1: { rim: '#78350f', base: '#fde047', ribbon: '#dc2626', text: '1' },
        2: { rim: '#334155', base: '#e2e8f0', ribbon: '#2563eb', text: '2' },
        3: { rim: '#78350f', base: '#f97316', ribbon: '#16a34a', text: '3' }
      }[rank] || { rim: '#78350f', base: '#fde047', ribbon: '#dc2626', text: '1' };

      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 2L10 10L12 7L14 10L17 2H13.5L12 5.5L10.5 2H7Z" fill="${config.ribbon}"/>
        <circle cx="12" cy="14" r="7.5" fill="${config.base}" stroke="${config.rim}" stroke-width="1.2"/>
        <text x="12" y="17" font-family="'Rubik', sans-serif" font-weight="900" font-size="9" fill="${config.rim}" text-anchor="middle">${config.text}</text>
      </svg>`;
    },

    // 24. Иконки Арен Ордо (Arenas) — Supports arenaIcon(0, 22) and arenaIcon(22, '', 0)
    arenaIcon(arg1 = 0, arg2 = 22, arg3 = '') {
      const { size, className, variant } = parseArgs(arg1, arg2, arg3, 0, 22);
      const id = parseInt(variant, 10) || 0;
      switch (id) {
        case 0: // Жаштык Арена
          return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="5" width="18" height="14" rx="3" fill="#15803d" stroke="#166534" stroke-width="1.2"/>
            <circle cx="12" cy="12" r="4" stroke="#ffffff" stroke-width="1.2"/>
            <line x1="12" y1="5" x2="12" y2="19" stroke="#ffffff" stroke-width="1.2"/>
          </svg>`;
        case 1: // Бишкек Арена
          return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 19H20M5 19V10L12 4L19 10V19M9 19V13H15V19" stroke="#f59e0b" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`;
        case 2: // Иссык-Куль
          return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 13C6 11 9 15 12 13C15 11 18 15 21 13M3 17C6 15 9 19 12 17C15 15 18 19 21 17M6 7L10 4L14 8L18 5" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round"/>
          </svg>`;
        case 3: // Хан-Теңири
        default:
          return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 19L9 6L14 14L17 9L22 19H2Z" fill="#64748b" stroke="#334155" stroke-width="1.2"/>
            <path d="M9 6L6.5 10H11.5L9 6ZM17 9L15.5 12H18.5L17 9Z" fill="#ffffff"/>
          </svg>`;
      }
    },

    // 25. Кубок кумыса / Пигги-банк (Kumys Jar / Piggy)
    kumys(size = 18, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 3H16V6C16 7.5 19 9 19 13C19 17.5 16 21 12 21C8 21 5 17.5 5 13C5 9 8 7.5 8 6V3Z" fill="url(#grad-kumys)" stroke="#78350f" stroke-width="1.2"/>
        <path d="M7 11C9 13 15 13 17 11" stroke="#fde047" stroke-width="1" stroke-linecap="round"/>
        <ellipse cx="12" cy="15" rx="2.5" ry="1.5" fill="#fde047"/>
        <defs>
          <linearGradient id="grad-kumys" x1="5" y1="3" x2="19" y2="21" gradientUnits="userSpaceOnUse">
            <stop stop-color="#d97706"/>
            <stop offset="0.6" stop-color="#b45309"/>
            <stop offset="1" stop-color="#78350f"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 26. Шестерня настроек (Settings Gear)
    gear(size = 14, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
        <path d="M12 2V5M12 19V22M2 12H5M19 12H22M4.9 4.9L7 7M17 17L19.1 19.1M4.9 19.1L7 17M17 7L19.1 4.9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
    },

    // 27. Стрелка вправо (Arrow Right)
    arrowRight(size = 14, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 5L16 12L9 19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    },

    // 28. Звезда ранга / уровня (Star)
    star(size = 14, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,2 15,8.5 22,9.3 17,14 18.5,21 12,17.5 5.5,21 7,14 2,9.3 9,8.5" fill="#fbbf24" stroke="#78350f" stroke-width="1.2"/>
      </svg>`;
    },

    // 29. Стойки броска игрока (Stance Poses) — standing, half, crouch
    stance(arg1 = 'half', arg2 = 16, arg3 = '') {
      const { size, className, variant: type } = parseArgs(arg1, arg2, arg3, 'half', 16);
      if (type === 'standing') {
        return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="4" r="2.5" fill="currentColor"/>
          <path d="M12 7V15M12 15L9 22M12 15L15 22M8 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      }
      if (type === 'crouch') {
        return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="9" cy="8" r="2.5" fill="currentColor"/>
          <path d="M9 11L7 16L12 17L15 21M7 16L4 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      }
      // Half-crouch (Полусогнут)
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="5" r="2.5" fill="currentColor"/>
        <path d="M10 8L8 14L13 16L15 22M8 14L5 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    },

    // 30. Кардинальные стрелки Ордо (Compass Direction Arrows) — south, west, north, east
        // 31. Медальон Манаса / Турнирный жетон (Manas Token / 'M' Badge)
    nomadToken(size = 20, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" fill="url(#grad-token-rim)" stroke="#d97706" stroke-width="1"/>
        <circle cx="12" cy="12" r="8.5" fill="url(#grad-token-bg)" stroke="#0284c7" stroke-width="0.8"/>
        <path d="M7 16V8L12 12.5L17 8V16" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7 16V8L12 12.5L17 8V16" stroke="#fef08a" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        <defs>
          <linearGradient id="grad-token-rim" x1="2" y1="2" x2="22" y2="22">
            <stop stop-color="#fef08a"/>
            <stop offset="0.5" stop-color="#f59e0b"/>
            <stop offset="1" stop-color="#b45309"/>
          </linearGradient>
          <linearGradient id="grad-token-bg" x1="4" y1="4" x2="20" y2="20">
            <stop stop-color="#0284c7"/>
            <stop offset="1" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 32. Энергия / Кымыз (Kumys Energy Heart)
    kumysRoll(size = 20, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#grad-heart-body)" stroke="#881337" stroke-width="1.2"/>
        <ellipse cx="8" cy="7" rx="3" ry="1.5" fill="#fecdd3" opacity="0.6"/>
        <defs>
          <linearGradient id="grad-heart-body" x1="2" y1="3" x2="22" y2="21">
            <stop stop-color="#fb7185"/>
            <stop offset="0.4" stop-color="#e11d48"/>
            <stop offset="1" stop-color="#9f1239"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 33. 3D Шестеренка Настроек (Gear 3D)
    gear3d(size = 20, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="#14532d"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9z" fill="url(#grad-gear3d)" stroke="#ffffff" stroke-width="1.2"/>
        <defs>
          <linearGradient id="grad-gear3d" x1="2" y1="2" x2="22" y2="22">
            <stop stop-color="#bef264"/>
            <stop offset="0.5" stop-color="#84cc16"/>
            <stop offset="1" stop-color="#4d7c0f"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 34. 3D Сейф Кочевника (Safe Vault)
    safe(size = 26, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="20" height="18" rx="4" fill="url(#grad-safe-body)" stroke="#1e293b" stroke-width="1.2"/>
        <rect x="4" y="5" width="16" height="14" rx="2" fill="url(#grad-safe-door)" stroke="#38bdf8" stroke-width="0.8"/>
        <circle cx="12" cy="12" r="4.5" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2"/>
        <circle cx="12" cy="12" r="2.5" fill="#f59e0b"/>
        <line x1="12" y1="8" x2="12" y2="10" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
        <defs>
          <linearGradient id="grad-safe-body" x1="2" y1="3" x2="22" y2="21">
            <stop stop-color="#38bdf8"/>
            <stop offset="0.6" stop-color="#0284c7"/>
            <stop offset="1" stop-color="#0369a1"/>
          </linearGradient>
          <linearGradient id="grad-safe-door" x1="4" y1="5" x2="20" y2="19">
            <stop stop-color="#0f172a"/>
            <stop offset="1" stop-color="#1e293b"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 35. 3D Алтын Чарх / Рулетка (Slot Machine)
    slot(size = 26, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="2" width="18" height="20" rx="3" fill="url(#grad-slot-body)" stroke="#78350f" stroke-width="1.2"/>
        <rect x="5" y="6" width="14" height="7" rx="1.5" fill="#ffffff" stroke="#b45309" stroke-width="0.8"/>
        <text x="6" y="12" font-size="6" font-weight="900" fill="#dc2626">7</text>
        <text x="10.5" y="12" font-size="6" font-weight="900" fill="#f59e0b">7</text>
        <text x="15" y="12" font-size="6" font-weight="900" fill="#16a34a">7</text>
        <circle cx="12" cy="17" r="2" fill="#ef4444" stroke="#ffffff" stroke-width="0.8"/>
        <defs>
          <linearGradient id="grad-slot-body" x1="3" y1="2" x2="21" y2="22">
            <stop stop-color="#fef08a"/>
            <stop offset="0.5" stop-color="#f59e0b"/>
            <stop offset="1" stop-color="#b45309"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 36. 3D Бомба / Набег (Raid Bomb)
    bomb(size = 26, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="14" r="8" fill="url(#grad-bomb-sphere)" stroke="#09090b" stroke-width="1.2"/>
        <ellipse cx="8" cy="10" rx="2.5" ry="1.5" fill="#94a3b8" opacity="0.6"/>
        <rect x="9" y="4" width="4" height="3" rx="1" fill="#71717a" stroke="#27272a" stroke-width="0.8"/>
        <path d="M13 5C15 3 18 3 19 2" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="19" cy="2" r="1.5" fill="#ef4444"/>
        <defs>
          <radialGradient id="grad-bomb-sphere" cx="9" cy="11" r="9" gradientUnits="userSpaceOnUse">
            <stop stop-color="#3f3f46"/>
            <stop offset="0.7" stop-color="#18181b"/>
            <stop offset="1" stop-color="#09090b"/>
          </radialGradient>
        </defs>
      </svg>`;
    },

    // 37. 3D Байге / Гонка (Race / Cash & Shades)
    race(size = 26, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="6" width="18" height="12" rx="2" fill="#22c55e" stroke="#14532d" stroke-width="1.2"/>
        <circle cx="12" cy="12" r="3.5" fill="#15803d"/>
        <rect x="4" y="9" width="7" height="4" rx="1.5" fill="#0f172a" stroke="#e2e8f0" stroke-width="0.8"/>
        <rect x="13" y="9" width="7" height="4" rx="1.5" fill="#0f172a" stroke="#e2e8f0" stroke-width="0.8"/>
        <line x1="11" y1="10.5" x2="13" y2="10.5" stroke="#e2e8f0" stroke-width="1"/>
      </svg>`;
    },

    // 38. 3D Изумрудный Гексагон (Gem Hexagon)
    gemHex(size = 26, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="url(#grad-gem-hex)" stroke="#064e3b" stroke-width="1.2"/>
        <polygon points="12,5 18,9 18,15 12,19 6,15 6,9" fill="#34d399" opacity="0.4"/>
        <line x1="12" y1="2" x2="12" y2="22" stroke="#a7f3d0" stroke-width="0.8" opacity="0.7"/>
        <defs>
          <linearGradient id="grad-gem-hex" x1="3" y1="2" x2="21" y2="22">
            <stop stop-color="#6ee7b7"/>
            <stop offset="0.5" stop-color="#10b981"/>
            <stop offset="1" stop-color="#047857"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 39. 3D Шахта Подарков / Кристаллы (Crystal Mine)
    crystalMine(size = 26, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 18L9 7L15 6L20 18L13 21L4 18Z" fill="#475569" stroke="#1e293b" stroke-width="1.2"/>
        <polygon points="11,3 14,7 12,12 9,8" fill="#ec4899" stroke="#be185d" stroke-width="0.8"/>
        <polygon points="15,6 18,10 16,14 13,11" fill="#f472b6" stroke="#db2777" stroke-width="0.8"/>
        <polygon points="6,9 10,12 8,16 5,13" fill="#f472b6" stroke="#db2777" stroke-width="0.8"/>
      </svg>`;
    },

    // 40. 3D Полоса Сокровищ / Корона (Streak Crown)
    streakCrown(size = 26, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 18L5 9L9.5 13L12 6L14.5 13L19 9L21 18H3Z" fill="url(#grad-crown-gold)" stroke="#78350f" stroke-width="1.2"/>
        <rect x="2" y="18" width="20" height="3" rx="1.5" fill="#f59e0b" stroke="#78350f" stroke-width="1"/>
        <circle cx="5" cy="9" r="1.5" fill="#ef4444"/>
        <circle cx="12" cy="6" r="1.8" fill="#3b82f6"/>
        <circle cx="19" cy="9" r="1.5" fill="#ef4444"/>
        <defs>
          <linearGradient id="grad-crown-gold" x1="3" y1="6" x2="21" y2="18">
            <stop stop-color="#fef08a"/>
            <stop offset="0.5" stop-color="#fbbf24"/>
            <stop offset="1" stop-color="#d97706"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 41. 3D Ханская Копилка (Piggy Bank)
    piggy3d(size = 26, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="12" cy="13" rx="9" ry="7" fill="url(#grad-pig-body)" stroke="#b45309" stroke-width="1.2"/>
        <ellipse cx="6" cy="14" rx="2.5" ry="3.5" fill="#fbbf24" stroke="#b45309" stroke-width="1"/>
        <circle cx="5" cy="13" r="0.8" fill="#78350f"/>
        <circle cx="5" cy="15" r="0.8" fill="#78350f"/>
        <polygon points="15,6 18,3 19,8" fill="#f59e0b" stroke="#b45309" stroke-width="0.8"/>
        <circle cx="10" cy="10" r="1.2" fill="#0f172a"/>
        <rect x="11" y="6" width="3" height="1" rx="0.5" fill="#78350f"/>
        <defs>
          <linearGradient id="grad-pig-body" x1="3" y1="6" x2="21" y2="20">
            <stop stop-color="#fef08a"/>
            <stop offset="0.4" stop-color="#fbbf24"/>
            <stop offset="1" stop-color="#d97706"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 42. 3D Молот Прокачки (Builder Hammer)
    hammer(size = 18, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 6L18 10L16 12L12 8L14 6Z" fill="#38bdf8" stroke="#0369a1" stroke-width="1"/>
        <rect x="7" y="11" width="3" height="11" rx="1.5" transform="rotate(-45 7 11)" fill="#b45309" stroke="#78350f" stroke-width="1"/>
        <path d="M13 5L15 3L19 7L17 9L13 5Z" fill="#0284c7"/>
      </svg>`;
    },

    // 43. 3D Новости / Свиток (News Tab)
    news(size = 22, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="18" height="16" rx="2" fill="#f8fafc" stroke="#64748b" stroke-width="1.2"/>
        <rect x="5" y="7" width="5" height="4" fill="#cbd5e1"/>
        <line x1="12" y1="8" x2="18" y2="8" stroke="#475569" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="12" y1="11" x2="18" y2="11" stroke="#475569" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="5" y1="14" x2="18" y2="14" stroke="#94a3b8" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="5" y1="17" x2="14" y2="17" stroke="#94a3b8" stroke-width="1.2" stroke-linecap="round"/>
      </svg>`;
    },

    // 44. 3D Задания / Чеклист (Tasks Tab)
    tasks(size = 22, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="5" width="16" height="16" rx="3" fill="#fef3c7" stroke="#d97706" stroke-width="1.2"/>
        <rect x="9" y="3" width="6" height="3" rx="1.5" fill="#f59e0b" stroke="#b45309" stroke-width="0.8"/>
        <path d="M7 10L9 12L12 8" stroke="#16a34a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="14" y1="10" x2="18" y2="10" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M7 15L9 17L12 13" stroke="#16a34a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="14" y1="15" x2="18" y2="15" stroke="#78350f" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`;
    },

    // 45. 3D Центральная Юрта (Elevated Yurt Tab)
    yurtHero(size = 36, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C7 2 3 7 3 11V18C3 19.1 3.9 20 5 20H19C20.1 20 21 19.1 21 18V11C21 7 17 2 12 2Z" fill="url(#grad-yurt-hero-dome)" stroke="#ffffff" stroke-width="1.5"/>
        <rect x="9" y="13" width="6" height="7" rx="1" fill="#78350f" stroke="#fbbf24" stroke-width="1"/>
        <circle cx="12" cy="7" r="3" fill="#fbbf24" stroke="#d97706" stroke-width="1"/>
        <line x1="12" y1="4" x2="12" y2="10" stroke="#78350f" stroke-width="1"/>
        <line x1="9" y1="7" x2="15" y2="7" stroke="#78350f" stroke-width="1"/>
        <defs>
          <linearGradient id="grad-yurt-hero-dome" x1="3" y1="2" x2="21" y2="20">
            <stop stop-color="#ef4444"/>
            <stop offset="0.6" stop-color="#dc2626"/>
            <stop offset="1" stop-color="#991b1b"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 46. 3D Клан / Батыры (Guild Shield Tab)
    guildShield(size = 22, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 5V11C4 16.5 7.4 21.6 12 23C16.6 21.6 20 16.5 20 11V5L12 2Z" fill="url(#grad-guild-shield)" stroke="#f59e0b" stroke-width="1.2"/>
        <circle cx="12" cy="10" r="3" fill="#ffffff"/>
        <circle cx="8" cy="12" r="2" fill="#e2e8f0" opacity="0.8"/>
        <circle cx="16" cy="12" r="2" fill="#e2e8f0" opacity="0.8"/>
        <defs>
          <linearGradient id="grad-guild-shield" x1="4" y1="2" x2="20" y2="23">
            <stop stop-color="#f59e0b"/>
            <stop offset="0.5" stop-color="#b45309"/>
            <stop offset="1" stop-color="#78350f"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    // 47. 3D Кошелек / Сака (Wallet Tab)
    walletSaka(size = 22, className = '') {
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="5" width="20" height="15" rx="3" fill="url(#grad-wallet-body)" stroke="#4c1d95" stroke-width="1.2"/>
        <path d="M16 11H22V15H16C14.9 15 14 14.1 14 13C14 11.9 14.9 11 16 11Z" fill="#a855f7" stroke="#e9d5ff" stroke-width="1"/>
        <circle cx="17.5" cy="13" r="1.2" fill="#22c55e"/>
        <defs>
          <linearGradient id="grad-wallet-body" x1="2" y1="5" x2="22" y2="20">
            <stop stop-color="#7c3aed"/>
            <stop offset="1" stop-color="#4c1d95"/>
          </linearGradient>
        </defs>
      </svg>`;
    },
    cardinal(arg1 = 'south', arg2 = 14, arg3 = '') {
      const { size, className, variant: dir } = parseArgs(arg1, arg2, arg3, 'south', 14);
      let angle = 180;
      if (dir === 'west') angle = 270;
      else if (dir === 'north') angle = 0;
      else if (dir === 'east') angle = 90;
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${angle}deg);">
        <path d="M12 3L19 11H14V21H10V11H5L12 3Z" fill="#fbbf24" stroke="#78350f" stroke-width="1.2"/>
      </svg>`;
    },

    sun(arg1 = 24, arg2 = '', arg3 = '') {
      const { size, className } = parseArgs(arg1, arg2, arg3, 24);
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="5" fill="url(#sun-grad)" stroke="#b45309" stroke-width="1.2"/>
        <path d="M12 2V5M12 19V22M2 12H5M19 12H22M4.93 4.93L7.05 7.05M16.95 16.95L19.07 19.07M4.93 19.07L7.05 16.95M16.95 7.05L19.07 4.93" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="12" cy="12" r="2.2" fill="#fef3c7"/>
        <defs>
          <linearGradient id="sun-grad" x1="7" y1="7" x2="17" y2="17" gradientUnits="userSpaceOnUse">
            <stop stop-color="#fef08a"/>
            <stop offset="1" stop-color="#f59e0b"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    sparkles(arg1 = 24, arg2 = '', arg3 = '') {
      const { size, className } = parseArgs(arg1, arg2, arg3, 24);
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" fill="url(#sparkle-grad)" stroke="#d97706" stroke-width="0.8"/>
        <path d="M19 16L19.9 19.1L23 20L19.9 20.9L19 24L18.1 20.9L15 20L18.1 19.1L19 16Z" fill="#fef08a"/>
        <path d="M5 2L5.6 4.4L8 5L5.6 5.6L5 8L4.4 5.6L2 5L4.4 4.4L5 2Z" fill="#fde047"/>
        <defs>
          <linearGradient id="sparkle-grad" x1="4" y1="2" x2="20" y2="18" gradientUnits="userSpaceOnUse">
            <stop stop-color="#fef08a"/>
            <stop offset="1" stop-color="#f59e0b"/>
          </linearGradient>
        </defs>
      </svg>`;
    },

    wind(arg1 = 24, arg2 = '', arg3 = '') {
      const { size, className } = parseArgs(arg1, arg2, arg3, 24);
      return `<svg class="inline-block shrink-0 align-middle ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 8H15C16.6569 8 18 6.65685 18 5C18 3.34315 16.6569 2 15 2C13.3431 2 12 3.34315 12 5" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
        <path d="M2 13H19C20.6569 13 22 14.3431 22 16C22 17.6569 20.6569 19 19 19C17.3431 19 16 17.6569 16 16" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round"/>
        <path d="M5 18H11C12.1046 18 13 18.8954 13 20C13 21.1046 12.1046 22 11 22C9.89543 22 9 21.1046 9 20" stroke="#7dd3fc" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`;
    },

    fire(arg1 = 24, arg2 = '', arg3 = '') {
      return this.flame(arg1, arg2, arg3);
    },

    chukoBone(arg1 = 24, arg2 = '', arg3 = '') {
      return this.saka(arg1, arg2, arg3);
    },

    // 31. Получить SVG разметку по выражению типа "iconName:size:variant"
    getIconMarkup(expr, customClass = '') {
      if (!expr) return '';
      const parts = String(expr).split(':');
      const name = parts[0];
      const size = parseInt(parts[1], 10) || 18;
      const extra = parts[2] || undefined;
      if (typeof this[name] === 'function') {
        return this[name](size, customClass, extra);
      }
      return '';
    },

    render(expr, customClass = '') {
      return this.getIconMarkup(expr, customClass);
    },

    // 32. Автоматическая гидратация DOM для всех элементов [data-game-icon]
    renderAll(root = (typeof document !== 'undefined' ? document : null)) {
      if (!root || typeof root.querySelectorAll !== 'function') return;
      root.querySelectorAll('[data-game-icon]').forEach(el => {
        const expr = el.getAttribute('data-game-icon');
        if (!expr) return;
        const parts = expr.split(':');
        const name = parts[0];
        const size = parseInt(parts[1], 10) || 18;
        const extra = parts[2] || undefined;
        if (typeof GameIcons[name] === 'function') {
          el.innerHTML = GameIcons[name](size, '', extra);
        }
      });
    }
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => GameIcons.renderAll());
    } else {
      setTimeout(() => GameIcons.renderAll(), 0);
    }
  }

  global.GameIcons = GameIcons;
})(typeof window !== 'undefined' ? window : globalThis);
