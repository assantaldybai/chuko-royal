// ============================================================
// Chuko Royal — Phase 3 Ethno-Futurism Audio/Visual & FX Engine
// EthnoAV: Procedural Web Audio API Synthesizer, Neo-Nomad Canvas FX,
// Ballistic 3D Bone Flight & Canonical "Калчоо" Toss-Up Phase
// /Users/kxansky/Documents/chuko/js/ethno_av_engine.js
// ============================================================

(function (global) {
  'use strict';

  // ============================================================
  // 1. PROCEDURAL WEB AUDIO API SYNTHESIZER (ZERO EXTERNAL MP3 ASSETS)
  // ============================================================
  const EthnoAudio = {
    ctx: null,
    noiseBuffer: null,
    droneOsc1: null,
    droneOsc2: null,
    droneGain: null,
    droneFilter: null,
    droneLFO: null,
    droneLFOGain: null,
    isDroneActive: false,
    isMuted: false,

    /**
     * Initializes or resumes the AudioContext with user-gesture unlock.
     */
    getContext() {
      if (this.isMuted || (typeof window !== 'undefined' && window.isAudioMuted)) {
        return null;
      }
      if (!this.ctx) {
        const AudioContextClass = (typeof window !== 'undefined')
          ? (window.AudioContext || window.webkitAudioContext)
          : null;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    },

    /**
     * Pre-generates a 1-second normalized white noise buffer for bandpass transients.
     */
    getNoiseBuffer() {
      const ctx = this.getContext();
      if (!ctx) return null;
      if (!this.noiseBuffer) {
        const bufferSize = ctx.sampleRate; // 1 second
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buffer;
      }
      return this.noiseBuffer;
    },

    /**
     * 1. AUTHENTIC BONE COLLISION SOUND:
     * Crisp dry acoustic knucklebone clack (high-frequency bandpass click at 2.6kHz + 
     * hollow bone resonance at 850Hz + subtle felt table absorption). Zero muddy 808 synth drop.
     * @param {number} velocity Impact velocity or normalized intensity (0.1 to 2.5)
     */
    playBoneImpact(velocity = 1.0) {
      try {
        if (this.isMuted || (typeof window !== 'undefined' && window.isAudioMuted)) return;
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const clampedVel = Math.max(0.15, Math.min(2.5, velocity));

        // --- COMPONENT A: High-Frequency Bandpass White Noise Click (2.6kHz, 12ms) ---
        const noiseBuf = this.getNoiseBuffer();
        if (noiseBuf) {
          const noiseSrc = ctx.createBufferSource();
          noiseSrc.buffer = noiseBuf;

          const bandpass = ctx.createBiquadFilter();
          bandpass.type = 'bandpass';
          bandpass.frequency.setValueAtTime(2600, now);
          bandpass.Q.setValueAtTime(3.2, now);

          const noiseGain = ctx.createGain();
          const noiseVol = Math.min(0.65, 0.32 * clampedVel);
          noiseGain.gain.setValueAtTime(noiseVol, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.014); // 14ms crisp decay

          noiseSrc.connect(bandpass);
          bandpass.connect(noiseGain);
          noiseGain.connect(ctx.destination);

          noiseSrc.start(now);
          noiseSrc.stop(now + 0.016);
        }

        // --- COMPONENT B: Acoustic Knucklebone Body Resonance (850Hz -> 380Hz, 24ms) ---
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(850, now);
        osc.frequency.exponentialRampToValueAtTime(380, now + 0.024);

        const oscVol = Math.min(0.45, 0.22 * Math.sqrt(clampedVel));
        oscGain.gain.setValueAtTime(oscVol, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.028);
      } catch (e) {
        // AudioContext disabled or blocked
      }
    },

    /**
     * 2. «ДОБУЛБАС» (KYRGYZ WAR DRUM):
     * Deep resonant low-frequency percussion upon match victory or Khan knockout.
     * Uses punch transient + deep leather cavity resonance (120Hz -> 42Hz) with warm decay.
     * @param {boolean} isVictory If true, plays a 3-strike ceremonial military cadence.
     */
    playDobulbas(isVictory = false) {
      try {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        const strikes = isVictory
          ? [
              { offset: 0, pitchMult: 1.0, vol: 0.8 },
              { offset: 0.22, pitchMult: 1.14, vol: 0.7 },
              { offset: 0.48, pitchMult: 0.92, vol: 0.95 }
            ]
          : [{ offset: 0, pitchMult: 1.0, vol: 0.85 }];

        strikes.forEach(({ offset, pitchMult, vol }) => {
          const strikeTime = now + offset;

          // 1. Initial beater mallet punch (short 20ms pitch plunge)
          const punchOsc = ctx.createOscillator();
          const punchGain = ctx.createGain();
          punchOsc.type = 'triangle';
          punchOsc.frequency.setValueAtTime(200 * pitchMult, strikeTime);
          punchOsc.frequency.exponentialRampToValueAtTime(55 * pitchMult, strikeTime + 0.025);
          punchGain.gain.setValueAtTime(vol * 0.5, strikeTime);
          punchGain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.03);
          punchOsc.connect(punchGain);
          punchGain.connect(ctx.destination);
          punchOsc.start(strikeTime);
          punchOsc.stop(strikeTime + 0.035);

          // 2. Deep resonant Dobulbas membrane body (sine wave 125Hz -> 42Hz with 1.3s decay)
          const bodyOsc = ctx.createOscillator();
          const bodyGain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(260, strikeTime);
          filter.Q.setValueAtTime(2.4, strikeTime);

          bodyOsc.type = 'sine';
          bodyOsc.frequency.setValueAtTime(125 * pitchMult, strikeTime);
          bodyOsc.frequency.exponentialRampToValueAtTime(42 * pitchMult, strikeTime + 1.25);

          bodyGain.gain.setValueAtTime(vol * 0.9, strikeTime);
          bodyGain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 1.3);

          bodyOsc.connect(filter);
          filter.connect(bodyGain);
          bodyGain.connect(ctx.destination);

          bodyOsc.start(strikeTime);
          bodyOsc.stop(strikeTime + 1.35);
        });
      } catch (e) {}
    },

    /**
     * 3. «ТЕМИР-КОМУЗ» (KYRGYZ JAW HARP / VARGAN):
     * Harmonic frequency-modulated twang for jackpots, critical strikes, and daily rewards.
     * Carrier fundamental ~98Hz + 4x overtone modulator + dynamic formant mouth cavity sweep (700Hz -> 1800Hz -> 850Hz).
     * @param {'pluck'|'jackpot'|'critical'|'fanfare'} style
     */
    playTemirKomuz(style = 'jackpot') {
      try {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        let notes;
        if (style === 'jackpot' || style === 'fanfare') {
          // Melodic 3-note ascending overtone twangs: G2 (98Hz), C3 (130.8Hz), E3 (164.8Hz)
          notes = [
            { f0: 98, offset: 0, dur: 0.35, vol: 0.38 },
            { f0: 130.8, offset: 0.13, dur: 0.35, vol: 0.42 },
            { f0: 164.8, offset: 0.28, dur: 0.55, vol: 0.48 }
          ];
        } else if (style === 'critical') {
          // Rapid double bite twang
          notes = [
            { f0: 110, offset: 0, dur: 0.25, vol: 0.4 },
            { f0: 146.8, offset: 0.09, dur: 0.45, vol: 0.5 }
          ];
        } else {
          // Single authentic pluck
          notes = [{ f0: 104, offset: 0, dur: 0.45, vol: 0.45 }];
        }

        notes.forEach(({ f0, offset, dur, vol }) => {
          const t = now + offset;

          // Carrier: tongue reed vibration
          const carrier = ctx.createOscillator();
          carrier.type = 'sawtooth';
          carrier.frequency.setValueAtTime(f0, t);

          // Modulator: harmonic overtone frequency modulation (FM index)
          const mod = ctx.createOscillator();
          const modGain = ctx.createGain();
          mod.type = 'sine';
          mod.frequency.setValueAtTime(f0 * 4, t); // 4th harmonic
          modGain.gain.setValueAtTime(280, t);
          modGain.gain.exponentialRampToValueAtTime(25, t + dur * 0.7);

          mod.connect(carrier.frequency);

          // Formant Filter: simulates changing oral cavity acoustics ("А-О-У")
          const formant = ctx.createBiquadFilter();
          formant.type = 'bandpass';
          formant.Q.setValueAtTime(5.2, t);
          formant.frequency.setValueAtTime(700, t);
          formant.frequency.exponentialRampToValueAtTime(1850, t + dur * 0.35);
          formant.frequency.exponentialRampToValueAtTime(850, t + dur);

          // Pluck Gain envelope: metallic sharp attack + ringing decay
          const mainGain = ctx.createGain();
          mainGain.gain.setValueAtTime(0.001, t);
          mainGain.gain.exponentialRampToValueAtTime(vol, t + 0.004); // 4ms attack
          mainGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

          carrier.connect(formant);
          formant.connect(mainGain);
          mainGain.connect(ctx.destination);

          mod.start(t);
          carrier.start(t);
          mod.stop(t + dur + 0.02);
          carrier.stop(t + dur + 0.02);
        });
      } catch (e) {}
    },

    /**
     * 4. SLINGSHOT TENSION RISER MICRO-DRONE:
     * Rising pitch micro-drone while dragging Saka backwards.
     * Frequency ramps from 110Hz to 420Hz, filter opens 250Hz -> 1300Hz as powerRatio goes 0 to 1.
     * @param {number} powerRatio 0.0 to 1.0 pull tension
     */
    updateSlingshotDrone(powerRatio) {
      try {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const p = Math.max(0, Math.min(1, powerRatio));

        if (!this.isDroneActive) {
          // Start drone voice
          this.droneOsc1 = ctx.createOscillator();
          this.droneOsc2 = ctx.createOscillator();
          this.droneFilter = ctx.createBiquadFilter();
          this.droneGain = ctx.createGain();

          this.droneOsc1.type = 'triangle';
          this.droneOsc2.type = 'sawtooth';

          this.droneFilter.type = 'lowpass';
          this.droneFilter.Q.setValueAtTime(3.0, now);

          this.droneGain.gain.setValueAtTime(0.001, now);

          // LFO for subtle tension tremolo
          this.droneLFO = ctx.createOscillator();
          this.droneLFOGain = ctx.createGain();
          this.droneLFO.type = 'sine';
          this.droneLFO.frequency.setValueAtTime(7.5, now); // 7.5 Hz micro-drone
          this.droneLFOGain.gain.setValueAtTime(0.04, now);
          this.droneLFO.connect(this.droneGain.gain);

          this.droneOsc1.connect(this.droneFilter);
          this.droneOsc2.connect(this.droneFilter);
          this.droneFilter.connect(this.droneGain);
          this.droneGain.connect(ctx.destination);

          this.droneOsc1.start(now);
          this.droneOsc2.start(now);
          this.droneLFO.start(now);
          this.isDroneActive = true;
        }

        if (this.isDroneActive && this.droneOsc1 && this.droneGain) {
          const targetFreq = 110 + Math.pow(p, 1.8) * 310; // 110Hz -> 420Hz
          this.droneOsc1.frequency.setTargetAtTime(targetFreq, now, 0.03);
          this.droneOsc2.frequency.setTargetAtTime(targetFreq * 1.012, now, 0.03); // slight detune

          const targetCutoff = 240 + Math.pow(p, 1.5) * 1100; // 240Hz -> 1340Hz
          this.droneFilter.frequency.setTargetAtTime(targetCutoff, now, 0.03);

          const targetVol = p >= 0.12 ? Math.min(0.22, 0.04 + p * 0.18) : 0.001;
          this.droneGain.gain.setTargetAtTime(targetVol, now, 0.02);
        }
      } catch (e) {}
    },

    /**
     * Smoothly stops and releases the slingshot micro-drone.
     */
    stopSlingshotDrone() {
      if (!this.isDroneActive) return;
      try {
        const ctx = this.getContext();
        const now = ctx ? ctx.currentTime : 0;
        if (this.droneGain && ctx) {
          this.droneGain.gain.setTargetAtTime(0.0001, now, 0.025);
        }
        setTimeout(() => {
          try {
            if (this.droneOsc1) { this.droneOsc1.stop(); this.droneOsc1.disconnect(); }
            if (this.droneOsc2) { this.droneOsc2.stop(); this.droneOsc2.disconnect(); }
            if (this.droneLFO) { this.droneLFO.stop(); this.droneLFO.disconnect(); }
            if (this.droneGain) { this.droneGain.disconnect(); }
          } catch (e) {}
          this.droneOsc1 = null;
          this.droneOsc2 = null;
          this.droneLFO = null;
          this.droneFilter = null;
          this.droneGain = null;
          this.isDroneActive = false;
        }, 60);
      } catch (e) {
        this.isDroneActive = false;
      }
    }
  };


  // ============================================================
  // 2. NEO-NOMAD ETHNO-FUTURISM CANVAS OVERLAY & FX
  // ============================================================
  const EthnoFX = {
    flyingBones: [],
    shockwaves: [],
    sparks: [],

    /**
     * 2.1. PROCEDURAL «КОЧКОР МҮЙҮЗ» (RAM'S HORN) BOUNDARY ORNAMENT:
     * Neon-etched ornamental boundary pattern along the outer circle of the Ordo arena.
     * Procedural symmetrical ram horn scrolls with glowing gold/cyan strokes.
     */
    drawKochkorMuiuzRim(ctx, match, toScreen) {
      if (!ctx || !match) return;
      const rx = match.circleRadius;
      const ry = match.circleRadius * match.tiltY;
      const cx = match.centerX;
      const cy = match.centerY;
      const count = 28; // Number of symmetrical horn scrolls around perimeter
      const time = match.swayTime || 0;
      const pulse = 0.75 + 0.25 * Math.sin(time * 2.2);

      const isCyber = (match.season === 'cyberpunk');
      const coreColor = isCyber ? '#22d3ee' : '#fbbf24';
      const glowColor = isCyber ? `rgba(6, 182, 212, ${0.35 * pulse})` : `rgba(245, 158, 11, ${0.4 * pulse})`;
      const runeColor = isCyber ? '#67e8f9' : '#fef08a';

      ctx.save();

      // Outer glow layer
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const angle = (i * Math.PI * 2) / count;
        const nextAngle = ((i + 1) * Math.PI * 2) / count;
        const midAngle = (angle + nextAngle) * 0.5;

        // Position on 2.5D ellipse
        const px = cx + Math.cos(angle) * rx;
        const py = cy + Math.sin(angle) * ry;
        const nx = cx + Math.cos(nextAngle) * rx;
        const ny = cy + Math.sin(nextAngle) * ry;

        // Radial outward horn curl crest
        const hornOut = 8.5;
        const mx = cx + Math.cos(midAngle) * (rx + hornOut);
        const my = cy + Math.sin(midAngle) * (ry + hornOut * match.tiltY);

        if (i === 0) ctx.moveTo(px, py);
        ctx.quadraticCurveTo(mx, my, nx, ny);
      }
      ctx.closePath();
      ctx.lineWidth = 4.2;
      ctx.strokeStyle = glowColor;
      ctx.stroke();

      // Core etched neon stroke
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = coreColor;
      ctx.stroke();

      // Procedural inner spiral horn tips («Мүйүз бүктөмдөрү»)
      for (let i = 0; i < count; i++) {
        const angle = (i * Math.PI * 2) / count;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const bx = cx + cosA * rx;
        const by = cy + sinA * ry;

        // Tangent vectors along the perimeter
        const tx = -sinA;
        const ty = cosA * match.tiltY;

        // Left curl
        const lTipX = bx + tx * 5.5 - cosA * 4.5;
        const lTipY = by + ty * 5.5 - sinA * (4.5 * match.tiltY);

        // Right curl
        const rTipX = bx - tx * 5.5 - cosA * 4.5;
        const rTipY = by - ty * 5.5 - sinA * (4.5 * match.tiltY);

        ctx.beginPath();
        ctx.moveTo(lTipX, lTipY);
        ctx.quadraticCurveTo(bx + tx * 3.5 + cosA * 3.5, by + ty * 3.5 + sinA * (3.5 * match.tiltY), bx, by);
        ctx.quadraticCurveTo(bx - tx * 3.5 + cosA * 3.5, by - ty * 3.5 + sinA * (3.5 * match.tiltY), rTipX, rTipY);
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = coreColor;
        ctx.stroke();

        // Alternating diamond runes at the vertex
        if (i % 2 === 0) {
          const runeX = cx + cosA * (rx + 5.5);
          const runeY = cy + sinA * (ry + 5.5 * match.tiltY);
          ctx.beginPath();
          ctx.arc(runeX, runeY, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = runeColor;
          ctx.fill();
        }
      }

      ctx.restore();
    },

    /**
     * 2.2. GLOWING SOLAR «ТҮНДҮК» (SACRED YURT ROOF WHEEL):
     * Soft radial ambient breathing animation beneath the Khan's garrison at center.
     * Traditional wheel rim (Чанак) + 3x3 curved crossbars (Чамгарак) forming the solar grid.
     */
    drawSolarTunduk(ctx, match, toScreen) {
      if (!ctx || !match) return;
      const cx = match.centerX;
      const cy = match.centerY;
      const time = match.swayTime || 0;

      // Soft breathing factor (smooth 1.8Hz cycle)
      const breath = 1.0 + 0.07 * Math.sin(time * 2.0);
      const baseRadius = 40;
      const rx = baseRadius * breath;
      const ry = baseRadius * match.tiltY * breath;

      const isCyber = (match.season === 'cyberpunk');
      const goldCore = isCyber ? '#06b6d4' : '#f59e0b';
      const goldBright = isCyber ? '#67e8f9' : '#fde047';

      ctx.save();

      // 1. Soft radial ambient breathing aura behind Tündük
      const auraRx = rx * 1.65;
      const auraRy = ry * 1.65;
      const auraGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, auraRx);
      if (isCyber) {
        auraGrad.addColorStop(0, `rgba(6, 182, 212, ${0.32 * breath})`);
        auraGrad.addColorStop(0.55, `rgba(6, 182, 212, ${0.12 * breath})`);
        auraGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      } else {
        auraGrad.addColorStop(0, `rgba(245, 158, 11, ${0.35 * breath})`);
        auraGrad.addColorStop(0.6, `rgba(245, 158, 11, ${0.14 * breath})`);
        auraGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      }

      ctx.beginPath();
      ctx.ellipse(cx, cy, auraRx, auraRy, 0, 0, Math.PI * 2);
      ctx.fillStyle = auraGrad;
      ctx.fill();

      // 2. Outer Yurt Wheel Rim (Чанак / Алкак) - Double concentric golden circle
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = goldCore;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.82, ry * 0.82, 0, 0, Math.PI * 2);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = goldBright;
      ctx.stroke();

      // 3. Solar Crossbars (Чамгарак): 3 curved horizontal + 3 curved vertical bars
      // Horizontal arched bars
      const hOffsets = [-0.42, 0, 0.42];
      hOffsets.forEach(ratio => {
        const yOffset = ry * 0.82 * ratio;
        const xSpan = Math.sqrt(Math.max(0, 1 - ratio * ratio)) * rx * 0.82;
        const arch = -5.5 * (1 - Math.abs(ratio)); // upward dome curve

        ctx.beginPath();
        ctx.moveTo(cx - xSpan, cy + yOffset);
        ctx.quadraticCurveTo(cx, cy + yOffset + arch, cx + xSpan, cy + yOffset);
        ctx.lineWidth = ratio === 0 ? 2.0 : 1.4;
        ctx.strokeStyle = goldCore;
        ctx.stroke();
      });

      // Vertical arched bars
      const vOffsets = [-0.42, 0, 0.42];
      vOffsets.forEach(ratio => {
        const xOffset = rx * 0.82 * ratio;
        const ySpan = Math.sqrt(Math.max(0, 1 - ratio * ratio)) * ry * 0.82;
        const arch = 5.5 * ratio; // lateral dome curve

        ctx.beginPath();
        ctx.moveTo(cx + xOffset, cy - ySpan);
        ctx.quadraticCurveTo(cx + xOffset + arch, cy, cx + xOffset, cy + ySpan);
        ctx.lineWidth = ratio === 0 ? 2.0 : 1.4;
        ctx.strokeStyle = goldCore;
        ctx.stroke();
      });

      // 4. Radiating Solar Rays (8 Sacred Sun Beams)
      for (let i = 0; i < 8; i++) {
        const rayAngle = (i * Math.PI * 2) / 8 + time * 0.08;
        const r1x = cx + Math.cos(rayAngle) * rx;
        const r1y = cy + Math.sin(rayAngle) * ry;
        const r2x = cx + Math.cos(rayAngle) * (rx + 7.5);
        const r2y = cy + Math.sin(rayAngle) * (ry + 7.5 * match.tiltY);

        ctx.beginPath();
        ctx.moveTo(r1x, r1y);
        ctx.lineTo(r2x, r2y);
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = goldBright;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(r2x, r2y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = goldBright;
        ctx.fill();
      }

      ctx.restore();
    },

    /**
     * 2.3. BALLISTIC BONE KNOCKOUT FX:
     * When an alchik is knocked out of the circle, spawn a 3D-like parabolic trajectory entity
     * with height z(t), tumbling rotation, dynamic floor shadow, and ethereal dust trail.
     * @param {Object} alchik Knocked out bone entity
     * @param {Object} match Active match state
     */
    spawnBallisticKnockout(alchik, match) {
      if (!alchik || !match) return;

      // Determine outward impulse vector from arena center
      const dx = alchik.x - match.centerX;
      const dy = alchik.y - match.centerY;
      const dist = Math.hypot(dx, dy) || 1;
      const dirX = dx / dist;
      const dirY = dy / dist;

      // Retain or boost bone velocity
      const curSpeed = Math.hypot(alchik.vx || 0, alchik.vy || 0);
      const launchSpeed = Math.max(7.5, curSpeed * 1.35);

      this.flyingBones.push({
        id: 'fb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        x: alchik.x,
        y: alchik.y,
        vx: dirX * launchSpeed + (Math.random() - 0.5) * 2.0,
        vy: dirY * launchSpeed + (Math.random() - 0.5) * 2.0,
        z: 0,
        vz: 10.5 + Math.random() * 4.2, // Initial upward lift
        gravity: 0.52,
        rot: alchik.angle || 0,
        vRot: (Math.random() - 0.5) * 0.45,
        flip: 0,
        vFlip: 0.28 + Math.random() * 0.22, // 3D end-over-end tumbling
        radius: alchik.radius || 11,
        isKhan: !!alchik.isKhan,
        trail: [],
        bounces: 0,
        maxBounces: 1,
        life: 0,
        maxLife: 75,
        alpha: 1.0
      });
    },

    /**
     * Updates and renders ballistic flying bones, floor shadows, and trails.
     */
    updateAndRenderFlyingBones(ctx, match, toScreen) {
      if (!ctx || !match || this.flyingBones.length === 0) return;

      for (let i = this.flyingBones.length - 1; i >= 0; i--) {
        const b = this.flyingBones[i];
        b.life++;

        // Physics step
        b.x += b.vx;
        b.y += b.vy;
        b.vx *= 0.985;
        b.vy *= 0.985;

        b.z += b.vz;
        b.vz -= b.gravity;

        b.rot += b.vRot;
        b.flip += b.vFlip;

        // Ground collision & bounce
        if (b.z <= 0) {
          b.z = 0;
          if (b.bounces < b.maxBounces) {
            b.bounces++;
            b.vz = Math.abs(b.vz) * 0.38; // Bounce restitution
            b.vx *= 0.75;
            b.vy *= 0.75;
            // Spawn tiny ground dust puffs on bounce
            this.spawnImpactShockwave(b.x, b.y, 0.45);
          } else {
            b.vz = 0;
            b.vx *= 0.85;
            b.vy *= 0.85;
          }
        }

        // Record ethereal trail particle
        if (b.z > 2 || Math.hypot(b.vx, b.vy) > 1.5) {
          b.trail.push({
            x: b.x,
            y: b.y,
            z: b.z,
            alpha: 1.0,
            size: b.radius * 0.45
          });
          if (b.trail.length > 18) b.trail.shift();
        }

        // Fade out towards end of life
        if (b.life > b.maxLife - 25) {
          b.alpha = Math.max(0, (b.maxLife - b.life) / 25);
        }

        // --- RENDER 1: Dynamic Floor Shadow ---
        const groundSp = toScreen(b.x, b.y);
        const shadowExpand = 1 + b.z / 65;
        const shadowAlpha = Math.max(0.08, 0.52 / (1 + b.z / 38)) * b.alpha;
        const shadowRx = b.radius * 1.15 * shadowExpand;
        const shadowRy = b.radius * 0.65 * match.tiltY * shadowExpand;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(groundSp.x, groundSp.y, shadowRx, shadowRy, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.fill();
        ctx.restore();

        // --- RENDER 2: Ethereal / Dust Trail ---
        for (let t = 0; t < b.trail.length; t++) {
          const pt = b.trail[t];
          pt.alpha *= 0.91;
          const ptSp = toScreen(pt.x, pt.y);
          const ptScreenY = ptSp.y - pt.z;

          ctx.save();
          ctx.beginPath();
          ctx.arc(ptSp.x, ptScreenY, pt.size * (t / b.trail.length), 0, Math.PI * 2);
          if (b.isKhan) {
            ctx.fillStyle = `rgba(250, 204, 21, ${pt.alpha * 0.55 * b.alpha})`;
          } else {
            ctx.fillStyle = `rgba(254, 243, 199, ${pt.alpha * 0.35 * b.alpha})`;
          }
          ctx.fill();
          ctx.restore();
        }

        // --- RENDER 3: 3D Tumbling Bone Body ---
        const boneScreenY = groundSp.y - b.z;
        const scaleZ = 1 + b.z / 320; // 3D camera depth scale
        const flipScale = Math.cos(b.flip); // Tumbling 3D perspective flip

        ctx.save();
        ctx.translate(groundSp.x, boneScreenY);
        ctx.scale(flipScale * scaleZ, scaleZ);
        ctx.rotate(b.rot);
        ctx.globalAlpha = b.alpha;

        // 3D thickness layer
        ctx.save();
        ctx.translate(0, 3.2);
        this.drawBoneContour(ctx, b.radius, b.isKhan ? '#78350f' : '#57534e', '#1c1917');
        ctx.restore();

        // Top bone layer
        const fillCol = b.isKhan ? '#facc15' : '#fef3c7';
        const strokeCol = b.isKhan ? '#92400e' : '#78350f';
        this.drawBoneContour(ctx, b.radius, fillCol, strokeCol);

        if (b.isKhan) {
          ctx.fillStyle = '#451a03';
          ctx.font = '900 8px Rubik, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('ХАН', 0, 0);
        }

        ctx.restore();

        if (b.life >= b.maxLife || b.alpha <= 0.01) {
          this.flyingBones.splice(i, 1);
        }
      }
    },

    /**
     * Helper to draw the canonical H-bone chuko contour.
     */
    drawBoneContour(ctx, r, fillStyle, strokeStyle) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.75, -r * 0.65);
      ctx.quadraticCurveTo(0, -r * 0.28, r * 0.75, -r * 0.65);
      ctx.quadraticCurveTo(r * 1.15, 0, r * 0.75, r * 0.65);
      ctx.quadraticCurveTo(0, r * 0.28, -r * 0.75, r * 0.65);
      ctx.quadraticCurveTo(-r * 1.15, 0, -r * 0.75, -r * 0.65);
      ctx.closePath();
      ctx.fillStyle = fillStyle;
      ctx.fill();
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = strokeStyle;
      ctx.stroke();
    },

    /**
     * 2.4. IMPACT SPARKLE & SHOCKWAVE RING:
     * Visual pulse at the point of high-velocity Saka collision.
     * @param {number} x Logical world X
     * @param {number} y Logical world Y
     * @param {number} intensity Normalized collision intensity
     */
    spawnImpactShockwave(x, y, intensity = 1.0) {
      const clampedInt = Math.max(0.4, Math.min(2.5, intensity));

      // Expanding Shockwave Ring
      this.shockwaves.push({
        x,
        y,
        radius: 4,
        maxRadius: 28 + clampedInt * 12,
        speed: 2.8 + clampedInt * 1.2,
        alpha: 0.95,
        lineWidth: 2.8
      });

      // Radial Impact Sparkles
      const sparkCount = Math.floor(8 + clampedInt * 5);
      for (let i = 0; i < sparkCount; i++) {
        const sparkAngle = Math.random() * Math.PI * 2;
        const sparkSpeed = 2.5 + Math.random() * 5.0 * clampedInt;
        this.sparks.push({
          x,
          y,
          vx: Math.cos(sparkAngle) * sparkSpeed,
          vy: Math.sin(sparkAngle) * sparkSpeed,
          alpha: 1.0,
          decay: 0.038 + Math.random() * 0.025,
          size: 1.8 + Math.random() * 1.6,
          color: (Math.random() > 0.4) ? '#fde047' : '#ffffff'
        });
      }
    },

    /**
     * Updates and renders expanding shockwave rings and sparkles in 2.5D floor perspective.
     */
    updateAndRenderImpactFX(ctx, match, toScreen) {
      if (!ctx || !match) return;

      // 1. Shockwave rings
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.radius += sw.speed;
        sw.alpha -= 0.048;

        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          this.shockwaves.splice(i, 1);
          continue;
        }

        const sp = toScreen(sw.x, sw.y);
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(sp.x, sp.y, sw.radius, sw.radius * match.tiltY, 0, 0, Math.PI * 2);
        ctx.lineWidth = sw.lineWidth * sw.alpha;
        ctx.strokeStyle = `rgba(253, 224, 71, ${sw.alpha})`;
        ctx.stroke();
        ctx.restore();
      }

      // 2. Sparks
      for (let i = this.sparks.length - 1; i >= 0; i--) {
        const sp = this.sparks[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vx *= 0.92;
        sp.vy *= 0.92;
        sp.alpha -= sp.decay;

        if (sp.alpha <= 0) {
          this.sparks.splice(i, 1);
          continue;
        }

        const scr = toScreen(sp.x, sp.y);
        ctx.save();
        ctx.beginPath();
        ctx.arc(scr.x, scr.y, sp.size * sp.alpha, 0, Math.PI * 2);
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = sp.alpha;
        ctx.fill();
        ctx.restore();
      }
    },

    /**
     * Master render hook called inside renderOrdoCanvas().
     */
    renderOverlayAndFX(ctx, match, toScreen) {
      this.updateAndRenderFlyingBones(ctx, match, toScreen);
      this.updateAndRenderImpactFX(ctx, match, toScreen);
    },

    /**
     * Clears all active visual FX.
     */
    clearFX() {
      this.flyingBones = [];
      this.shockwaves = [];
      this.sparks = [];
    }
  };


  // ============================================================
  // 3. «КАЛЧОО» (BONE TOSS TOSS-UP FOR BREAK-SHOT PRIVILEGE)
  // ============================================================
  const KalchooSides = {
    ALCHY: {
      id: 'alchy',
      name: 'Алчы',
      rank: 4,
      symbol: 'Алчы [IV]',
      renderIcon(size = 36) {
        return (typeof window !== 'undefined' && window.GameIcons) ? window.GameIcons.saka(size, '', 'gold') : 'Алчы';
      },
      badgeColor: 'bg-emerald-500 text-stone-950',
      borderColor: 'border-emerald-400',
      title: 'Алчы (Высшее положение)',
      description: 'Вертикально выемкой вверх. «Алчы консун!» — Высший бросок кочевника, дающий неоспоримое право первого удара.'
    },
    TAA: {
      id: 'taa',
      name: 'Таа',
      rank: 3,
      symbol: 'Таа [III]',
      renderIcon(size = 36) {
        return (typeof window !== 'undefined' && window.GameIcons) ? window.GameIcons.saka(size, '', 'lead') : 'Таа';
      },
      badgeColor: 'bg-amber-400 text-stone-950',
      borderColor: 'border-amber-400',
      title: 'Таа (Второе положение)',
      description: 'Вертикально плоской выемкой вверх. Второй по старшинству бросок кости.'
    },
    BOK: {
      id: 'bok',
      name: 'Бөк',
      rank: 2,
      symbol: 'Бөк [II]',
      renderIcon(size = 36) {
        return (typeof window !== 'undefined' && window.GameIcons) ? window.GameIcons.saka(size, '', 'horn') : 'Бөк';
      },
      badgeColor: 'bg-orange-500 text-stone-950',
      borderColor: 'border-orange-400',
      title: 'Бөк (Выпуклая спинка)',
      description: 'Лежит на брюшке, выпуклая спинка («бөк») обращена вверх.'
    },
    CHIK: {
      id: 'chik',
      name: 'Чик',
      rank: 1,
      symbol: 'Чик [I]',
      renderIcon(size = 36) {
        return (typeof window !== 'undefined' && window.GameIcons) ? window.GameIcons.saka(size, '', 'lead') : 'Чик';
      },
      badgeColor: 'bg-stone-400 text-stone-950',
      borderColor: 'border-stone-500',
      title: 'Чик (Вогнутое брюшко)',
      description: 'Лежит на спинке, вогнутое брюшко («чик») обращено вверх.'
    }
  };

  const EthnoKalchoo = {
    SIDES: KalchooSides,

    /**
     * Simulates tossing one canonical knuckle-bone with natural physical probability distribution.
     * In real sheep astragalus physics:
     * - Narrow upright edges (Алчы, Таа): ~18% each
     * - Broad flat/curved faces (Бөк, Чик): ~32% each
     */
    tossBone() {
      const rand = Math.random() * 100;
      if (rand < 18) return KalchooSides.ALCHY;
      if (rand < 36) return KalchooSides.TAA;
      if (rand < 68) return KalchooSides.BOK;
      return KalchooSides.CHIK;
    },

    /**
     * Evaluates a break-shot contest between Player and Opponent.
     * @returns {Object} { playerSide, botSide, winner: 'player'|'bot'|'tie', diff }
     */
    evaluateContest() {
      const playerSide = this.tossBone();
      const botSide = this.tossBone();

      let winner = 'tie';
      if (playerSide.rank > botSide.rank) winner = 'player';
      else if (playerSide.rank < botSide.rank) winner = 'bot';

      return {
        playerSide,
        botSide,
        winner,
        diff: playerSide.rank - botSide.rank
      };
    },

    /**
     * Shows pre-match "Калчоо" toss ceremony overlay modal.
     * @param {Object} options { onComplete(winner), autoStart: true }
     */
    showTossCeremony(options = {}) {
      if (typeof document === 'undefined') {
        // Headless Node environment: evaluate immediately
        const res = this.evaluateContest();
        const winner = res.winner === 'tie' ? 'player' : res.winner;
        if (options.onComplete) options.onComplete(winner, res);
        return res;
      }

      // Remove existing ceremony if any
      const existing = document.getElementById('kalchoo-overlay');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'kalchoo-overlay';
      overlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in select-none';

      overlay.innerHTML = `
        <div class="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-500/50 p-5 shadow-2xl shadow-amber-950/60 text-stone-100 flex flex-col items-center">
          <!-- Solar Tunduk Header Icon -->
          <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 p-0.5 shadow-lg shadow-amber-500/30 mb-2 flex items-center justify-center animate-pulse">
            <div class="w-full h-full rounded-full bg-stone-950 flex items-center justify-center">
              ${(typeof window !== 'undefined' && window.GameIcons) ? window.GameIcons.coin(28) : '☀️'}
            </div>
          </div>

          <h2 class="text-xl font-black uppercase tracking-wider text-amber-300">Калчоо</h2>
          <p class="text-[11px] text-stone-400 text-center mt-0.5">
            Жеребьевка альчиков • Определение права первого броска
          </p>

          <!-- 4 Canonical Sides Legend Badge -->
          <div class="flex items-center gap-1.5 my-3 px-2 py-1 rounded-full bg-stone-800/80 border border-stone-700 text-[10px] font-semibold text-stone-300">
            <span class="text-emerald-400 font-black">Алчы (4)</span> &gt;
            <span class="text-amber-400 font-black">Таа (3)</span> &gt;
            <span class="text-orange-400 font-black">Бөк (2)</span> &gt;
            <span class="text-stone-400 font-black">Чик (1)</span>
          </div>

          <!-- Dual Toss Pedestals -->
          <div class="w-full grid grid-cols-2 gap-3 my-2">
            <!-- Player Pedestal -->
            <div id="kalchoo-box-player" class="flex flex-col items-center p-3 rounded-2xl bg-stone-900/90 border-2 border-stone-700 transition-all">
              <span class="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Сиз (Игрок)</span>
              <div id="kalchoo-icon-player" class="my-2 transition-transform duration-300 flex items-center justify-center">${(typeof window !== 'undefined' && window.GameIcons) ? window.GameIcons.saka(36, '', 'lead') : '🦴'}</div>
              <div id="kalchoo-name-player" class="text-xs font-black text-stone-300">Ожидание...</div>
              <span id="kalchoo-badge-player" class="text-[9px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 mt-1">Ранг: —</span>
            </div>

            <!-- Bot Pedestal -->
            <div id="kalchoo-box-bot" class="flex flex-col items-center p-3 rounded-2xl bg-stone-900/90 border-2 border-stone-700 transition-all">
              <span class="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Bot_Batyr</span>
              <div id="kalchoo-icon-bot" class="my-2 transition-transform duration-300 flex items-center justify-center">${(typeof window !== 'undefined' && window.GameIcons) ? window.GameIcons.saka(36, '', 'gold') : '🦴'}</div>
              <div id="kalchoo-name-bot" class="text-xs font-black text-stone-300">Ожидание...</div>
              <span id="kalchoo-badge-bot" class="text-[9px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 mt-1">Ранг: —</span>
            </div>
          </div>

          <!-- Result & Guidance Message -->
          <div id="kalchoo-status" class="w-full text-center text-xs font-bold text-amber-200 min-h-[38px] flex items-center justify-center my-1.5 px-2">
            Бросок решит, кто начнет партию...
          </div>

          <!-- Action Buttons -->
          <div class="w-full mt-2 flex gap-2">
            <button id="kalchoo-btn-toss" class="btn-tap flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black uppercase text-xs tracking-wider shadow-lg shadow-amber-500/20">
              Бросить альчик (Калчоо!)
            </button>
            <button id="kalchoo-btn-skip" class="btn-tap px-3 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 font-bold text-xs uppercase">
              Пропуск
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const btnToss = document.getElementById('kalchoo-btn-toss');
      const btnSkip = document.getElementById('kalchoo-btn-skip');
      let isTossing = false;

      const finishCeremony = (winner) => {
        if (!overlay.parentNode) return;
        overlay.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => {
          overlay.remove();
          if (typeof options.onComplete === 'function') {
            options.onComplete(winner);
          }
        }, 300);
      };

      const executeToss = () => {
        if (isTossing) return;
        isTossing = true;
        btnToss.disabled = true;
        btnToss.classList.add('opacity-50');

        // Play authentic bone roll sounds & jaw harp overtone
        EthnoAudio.playTemirKomuz('critical');
        EthnoAudio.playBoneImpact(1.4);

        const iconP = document.getElementById('kalchoo-icon-player');
        const iconB = document.getElementById('kalchoo-icon-bot');
        const statusEl = document.getElementById('kalchoo-status');

        let rolls = 0;
        const rollInterval = setInterval(() => {
          rolls++;
          const skins = ['gold', 'lead', 'cyber', 'horn'];
          const s1 = skins[rolls % skins.length];
          const s2 = skins[(rolls + 2) % skins.length];
          if (typeof window !== 'undefined' && window.GameIcons) {
            iconP.innerHTML = window.GameIcons.saka(36, '', s1);
            iconB.innerHTML = window.GameIcons.saka(36, '', s2);
          }
          iconP.style.transform = `rotate(${rolls * 45}deg) scale(1.1)`;
          iconB.style.transform = `rotate(-${rolls * 45}deg) scale(1.1)`;
          EthnoAudio.playBoneImpact(0.4 + (rolls % 3) * 0.2);

          if (rolls >= 8) {
            clearInterval(rollInterval);

            // Determine canonical contest results
            let contest = EthnoKalchoo.evaluateContest();
            // In case of tie, re-toss until winner
            while (contest.winner === 'tie') {
              contest = EthnoKalchoo.evaluateContest();
            }

            const p = contest.playerSide;
            const b = contest.botSide;

            iconP.style.transform = 'scale(1.25)';
            iconB.style.transform = 'scale(1.25)';
            if (typeof window !== 'undefined' && window.GameIcons) {
              iconP.innerHTML = p.renderIcon ? p.renderIcon(40) : window.GameIcons.saka(40, '', 'gold');
              iconB.innerHTML = b.renderIcon ? b.renderIcon(40) : window.GameIcons.saka(40, '', 'lead');
            } else {
              iconP.textContent = p.name;
              iconB.textContent = b.name;
            }

            const nameP = document.getElementById('kalchoo-name-player');
            const nameB = document.getElementById('kalchoo-name-bot');
            const badgeP = document.getElementById('kalchoo-badge-player');
            const badgeB = document.getElementById('kalchoo-badge-bot');
            const boxP = document.getElementById('kalchoo-box-player');
            const boxB = document.getElementById('kalchoo-box-bot');

            nameP.textContent = p.name;
            nameB.textContent = b.name;
            badgeP.textContent = `Ранг ${p.rank}: ${p.name}`;
            badgeB.textContent = `Ранг ${b.rank}: ${b.name}`;

            if (contest.winner === 'player') {
              boxP.className = 'flex flex-col items-center p-3 rounded-2xl bg-emerald-950/60 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20';
              boxB.className = 'flex flex-col items-center p-3 rounded-2xl bg-stone-900 border-2 border-stone-800 opacity-60';
              statusEl.innerHTML = `<span class="text-emerald-400 font-black inline-flex items-center gap-1">${(typeof window !== 'undefined' && window.GameIcons) ? window.GameIcons.trophy(14) : ''} Сиз жеңдиңиз!</span> Альчик түштү: <b class="text-white">${p.name}</b> (ранг ${p.rank}). Баштоо укугу сиздики!`;
              EthnoAudio.playDobulbas(false);
              EthnoAudio.playTemirKomuz('jackpot');
            } else {
              boxP.className = 'flex flex-col items-center p-3 rounded-2xl bg-stone-900 border-2 border-stone-800 opacity-60';
              boxB.className = 'flex flex-col items-center p-3 rounded-2xl bg-amber-950/60 border-2 border-amber-400 shadow-lg shadow-amber-500/20';
              statusEl.innerHTML = `<span class="text-amber-400 font-black inline-flex items-center gap-1">${(typeof window !== 'undefined' && window.GameIcons) ? window.GameIcons.avatar('batyr', 14) : ''} Bot_Batyr жеңди!</span> Каршылашта: <b class="text-white">${b.name}</b> (ранг ${b.rank}). Биринчи бросокту бот баштайт.`;
              EthnoAudio.playDobulbas(false);
            }

            btnToss.textContent = 'Баштоо (В бой!)';
            btnToss.disabled = false;
            btnToss.classList.remove('opacity-50');
            btnToss.onclick = () => finishCeremony(contest.winner);

            // Auto-advance after 2.4s if not tapped
            setTimeout(() => {
              finishCeremony(contest.winner);
            }, 2400);
          }
        }, 85);
      };

      btnToss.onclick = executeToss;
      btnSkip.onclick = () => finishCeremony('player');

      // If autoStart is requested, trigger toss after a gentle 350ms delay
      if (options.autoStart !== false) {
        setTimeout(() => {
          if (!isTossing) executeToss();
        }, 350);
      }
    }
  };


  // ============================================================
  // 4. MAIN EXPORT ARCHITECTURE
  // ============================================================
  const EthnoAV = {
    Audio: EthnoAudio,
    FX: EthnoFX,
    Kalchoo: EthnoKalchoo
  };

  // Node.js module export for headless test runner
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EthnoAV;
  }

  // Browser global export
  if (typeof window !== 'undefined') {
    window.EthnoAV = EthnoAV;
    window.EthnoAudio = EthnoAudio;
    window.EthnoFX = EthnoFX;
    window.EthnoKalchoo = EthnoKalchoo;
  }

})(typeof window !== 'undefined' ? window : globalThis);
