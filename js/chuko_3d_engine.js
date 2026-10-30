// ===================================================================
// CHUKO ROYAL — 3D GRAPHICS & SIMULATION ENGINE
// Interactive 3D Hero Chuko & 3D Isometric Nomadic Village (Айыл)
// Built with Three.js (r128)
// ===================================================================

(function (global) {
  'use strict';

  const Chuko3DEngine = {
    // -----------------------------------------------------------------
    // 1. HERO 3D CHUKO STATE & RENDERER
    // -----------------------------------------------------------------
    hero: {
      renderer: null,
      scene: null,
      camera: null,
      mesh: null,
      leadPlug: null,
      material: null,
      light: null,
      animId: null,
      isDragging: false,
      prevPointer: { x: 0, y: 0 },
      rotVelocity: { x: 0, y: 0.012 },
      targetRotation: { x: 0.35, y: 0.45 },
      currentSkin: 'lead'
    },

    // -----------------------------------------------------------------
    // 2. 3D ISOMETRIC VILLAGE (АЙЫЛ) STATE & RENDERER
    // -----------------------------------------------------------------
    village: {
      renderer: null,
      scene: null,
      camera: null,
      animId: null,
      buildings: {},
      selectedBuilding: null,
      raycaster: null,
      mouse: null,
      particles: [],
      smokeParticles: [],
      fireLight: null,
      selectionRing: null
    },

    // =================================================================
    // INITIALIZATION DISPATCHER
    // =================================================================
    init() {
      if (typeof THREE === 'undefined') {
        console.warn('[Chuko3DEngine] THREE is not loaded yet. Waiting...');
        setTimeout(() => this.init(), 100);
        return;
      }

      this.initHeroChuko();
      this.initAyylVillage();
    },

    // =================================================================
    // A. REAL 3D CHUKO (AUTHENTIC OVIS ARIES BONE SCAN)
    // 37,617 vertices scan capturing exact anatomical sides:
    // Алчы (Spine/Ridge), Таа (Trochlea spool), Бөк (Belly), Чик (Hollow)
    // =================================================================
    createAstragalusGeometry() {
      if (typeof window !== 'undefined' && window.RealAlchikModel && typeof window.RealAlchikModel.getBufferGeometry === 'function') {
        const scanGeom = window.RealAlchikModel.getBufferGeometry(THREE);
        if (scanGeom) {
          scanGeom.center();
          scanGeom.computeVertexNormals();
          return scanGeom;
        }
      }

      // High-precision organic fallback
      const width = 2.4;
      const height = 3.6;
      const depth = 1.9;
      const geom = new THREE.BoxGeometry(width, height, depth, 18, 22, 16);
      const pos = geom.attributes.position;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        const ny = y / (height * 0.5);
        const nx = x / (width * 0.5);

        const endTaper = 1.0 - 0.18 * (ny * ny);
        x *= endTaper;
        z *= endTaper;

        if (ny > 0.4) {
          const groove = Math.sin((ny - 0.4) * Math.PI) * 0.28;
          y -= Math.abs(nx) < 0.35 ? groove : -groove * 0.3;
        }
        if (ny < -0.4) {
          const trochlea = (1.0 - Math.abs(ny)) * 0.2;
          z += trochlea;
        }
        if (z > 0.4) {
          z += 0.15 * Math.cos(nx * Math.PI * 0.5);
        }
        if (z < -0.3) {
          const saddle = Math.sin((nx + 0.2) * Math.PI);
          z += saddle * 0.32;
        }
        if (x > 0.3) {
          x += 0.28 * Math.cos(ny * Math.PI * 0.5);
        }
        if (x < -0.3) {
          x += 0.3 * Math.sin(Math.abs(ny) * Math.PI * 0.5);
        }

        pos.setXYZ(i, x, y, z);
      }

      geom.computeVertexNormals();
      geom.center();
      return geom;
    },

    // =================================================================
    // B. HERO 3D CHUKO INITIALIZATION & CONTROLS
    // =================================================================
    initHeroChuko() {
      const canvas = document.getElementById('hero-chuko-3d-canvas');
      if (!canvas) return;

      const container = canvas.parentElement;
      const width = container.clientWidth || 200;
      const height = container.clientHeight || 150;

      // Renderer with cinematic PBR tone mapping
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (THREE.ACESFilmicToneMapping) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
      }
      if (THREE.sRGBEncoding) {
        renderer.outputEncoding = THREE.sRGBEncoding;
      }
      this.hero.renderer = renderer;

      // Scene & Camera
      const scene = new THREE.Scene();
      this.hero.scene = scene;

      const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
      camera.position.set(0, 0.15, 6.2);
      this.hero.camera = camera;

      // Studio 3-Point Balanced Lighting (Preserves authentic ivory bone depth)
      const ambientLight = new THREE.AmbientLight(0xfff8f0, 0.45);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xfff8ee, 0.85);
      keyLight.position.set(3.2, 4.2, 3.8);
      keyLight.castShadow = true;
      scene.add(keyLight);
      this.hero.light = keyLight;

      const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.32);
      fillLight.position.set(-3.5, -1, 2.5);
      scene.add(fillLight);

      const backLight = new THREE.DirectionalLight(0xffedd5, 0.38);
      backLight.position.set(0, 3.2, -3.5);
      scene.add(backLight);

      // Contact shadow on pedestal
      const shadowGeom = new THREE.CircleGeometry(1.5, 32);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.65,
        depthWrite: false
      });
      const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.y = -2.05;
      scene.add(shadowMesh);

      // Nomad Ceremonial Pedestal Dais (Walnut / Felt Stand with Gold Trim)
      const pedestalGeom = new THREE.CylinderGeometry(2.1, 2.3, 0.35, 48);
      const pedestalMat = new THREE.MeshStandardMaterial({
        color: 0x151210, // Dark polished walnut
        roughness: 0.65,
        metalness: 0.1
      });
      const pedestal = new THREE.Mesh(pedestalGeom, pedestalMat);
      pedestal.position.y = -2.25;
      pedestal.receiveShadow = true;
      scene.add(pedestal);

      // Glowing Nomad Gold Runic Ring
      const ringGeom = new THREE.RingGeometry(1.92, 2.15, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = -2.07;
      scene.add(ringMesh);

      // Procedural Astragalus Mesh
      const boneGeom = this.createAstragalusGeometry();
      const boneMat = this.getSakaMaterial('lead');
      this.hero.material = boneMat;

      const boneGroup = new THREE.Group();

      const mesh = new THREE.Mesh(boneGeom, boneMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      boneGroup.add(mesh);
      this.hero.mesh = mesh;

      // Authentic Lead Core Inlay (Коргошун куюлган Сака) in lateral fossa
      const plugGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.25, 20);
      const plugMat = new THREE.MeshStandardMaterial({
        color: 0x334155, // Gunmetal Lead
        metalness: 0.88,
        roughness: 0.32
      });
      const plugMesh = new THREE.Mesh(plugGeom, plugMat);
      plugMesh.rotation.z = Math.PI / 2;
      plugMesh.position.set(-0.95, 0.1, 0.05);
      boneGroup.add(plugMesh);
      this.hero.leadPlug = plugMesh;

      boneGroup.rotation.x = 0.35;
      boneGroup.rotation.y = 0.45;
      scene.add(boneGroup);
      this.hero.boneGroup = boneGroup;

      // Setup Pointer & Touch Drag Interaction
      this.bindHeroDrag(canvas);

      // Render Loop
      const animate = () => {
        this.hero.animId = requestAnimationFrame(animate);

        if (!this.hero.isDragging) {
          boneGroup.rotation.y += this.hero.rotVelocity.y;
          boneGroup.rotation.x += this.hero.rotVelocity.x;
          // Damping
          this.hero.rotVelocity.y *= 0.985;
          this.hero.rotVelocity.x *= 0.985;
          if (Math.abs(this.hero.rotVelocity.y) < 0.006) {
            this.hero.rotVelocity.y = 0.006; // calm idle spin
          }
        }

        // Gentle floating bounce
        const time = performance.now() * 0.002;
        boneGroup.position.y = Math.sin(time) * 0.1;

        renderer.render(scene, camera);
      };
      animate();

      // Responsive resize
      window.addEventListener('resize', () => {
        if (!container) return;
        const w = container.clientWidth || 200;
        const h = container.clientHeight || 150;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
    },

    bindHeroDrag(canvas) {
      let isDown = false;
      let startX = 0;
      let startY = 0;

      const onStart = (clientX, clientY) => {
        isDown = true;
        this.hero.isDragging = true;
        startX = clientX;
        startY = clientY;
      };

      const onMove = (clientX, clientY) => {
        if (!isDown || !this.hero.boneGroup) return;
        const dx = clientX - startX;
        const dy = clientY - startY;
        startX = clientX;
        startY = clientY;

        this.hero.boneGroup.rotation.y += dx * 0.016;
        this.hero.boneGroup.rotation.x += dy * 0.016;

        this.hero.rotVelocity.y = dx * 0.014;
        this.hero.rotVelocity.x = dy * 0.014;
      };

      const onEnd = () => {
        if (!isDown) return;
        isDown = false;
        this.hero.isDragging = false;
      };

      canvas.addEventListener('pointerdown', e => onStart(e.clientX, e.clientY));
      window.addEventListener('pointermove', e => onMove(e.clientX, e.clientY));
      window.addEventListener('pointerup', onEnd);
      window.addEventListener('pointercancel', onEnd);

      // Tap spin flip on click
      canvas.addEventListener('click', () => {
        if (Math.abs(this.hero.rotVelocity.y) < 0.05) {
          this.hero.rotVelocity.y = 0.24;
          if (window.playBoneSound) window.playBoneSound('hit', 0.5);
          if (window.ChukoHaptics && window.ChukoHaptics.impact) {
            window.ChukoHaptics.impact('light');
          }
        }
      });
    },

    // Rotate Hero 3D Chuko to 4 canonical anatomical views
    rotateHeroTo(viewName) {
      if (!this.hero.boneGroup) return;
      this.hero.isDragging = true;
      const targets = {
        alchy: { x: 0.1, y: 0.0 },               // Алчы (Dorsal Spine Ridge)
        taa: { x: 0.1, y: Math.PI },             // Таа (Plantar Saddle Spool)
        bok: { x: 0.0, y: Math.PI * 0.5 },       // Бөк (Convex Belly)
        chik: { x: 0.0, y: -Math.PI * 0.5 },     // Чик (Medial Hollow Notch)
        onbashy: { x: Math.PI * 0.5, y: 0.0 }    // Оңбашы (Head End)
      };

      const target = targets[viewName] || targets.alchy;
      this.hero.boneGroup.rotation.x = target.x;
      this.hero.boneGroup.rotation.y = target.y;
      this.hero.rotVelocity = { x: 0, y: 0.005 };
      setTimeout(() => { this.hero.isDragging = false; }, 300);
      if (window.playBoneSound) window.playBoneSound('hit', 0.4);
    },

    // Material generator for Saka skins
    getSakaMaterial(skinId) {
      switch (skinId) {
        case 'gold':
        case 'golden_saka':
          return new THREE.MeshStandardMaterial({
            color: 0xfbbf24, // Royal Imperial Gold
            roughness: 0.26,
            metalness: 0.88
          });
        case 'cyberpunk':
        case 'cyber_saka':
        case 'cyber':
        case 'nomad':
          return new THREE.MeshStandardMaterial({
            color: 0x090d16,
            roughness: 0.24,
            metalness: 0.65,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.45
          });
        case 'obsidian':
        case 'obsidian_manas':
          return new THREE.MeshStandardMaterial({
            color: 0x0a0f1d,
            roughness: 0.16,
            metalness: 0.48,
            emissive: 0x7c3aed,
            emissiveIntensity: 0.28
          });
        case 'batyr':
        case 'argali_horn':
        case 'horn':
          return new THREE.MeshStandardMaterial({
            color: 0xe5dac9, // Heavy weathered steppe fossil bone
            roughness: 0.58,
            metalness: 0.02
          });
        case 'lead':
        default:
          return new THREE.MeshStandardMaterial({
            color: 0xf4ece1, // Authentic Natural Sheep Astragalus Ivory Bone
            roughness: 0.52,
            metalness: 0.0
          });
      }
    },

    setHeroSkin(skinId) {
      if (!this.hero.mesh) return;
      this.hero.currentSkin = skinId;
      const newMat = this.getSakaMaterial(skinId);
      this.hero.mesh.material = newMat;
      this.hero.material = newMat;

      // Update lead plug styling
      if (this.hero.leadPlug) {
        if (skinId === 'gold') {
          this.hero.leadPlug.material.color.setHex(0xd97706);
          this.hero.leadPlug.material.metalness = 0.95;
        } else if (skinId === 'cyber' || skinId === 'nomad') {
          this.hero.leadPlug.material.color.setHex(0x22d3ee);
          this.hero.leadPlug.material.emissive = new THREE.Color(0x06b6d4);
        } else if (skinId === 'obsidian') {
          this.hero.leadPlug.material.color.setHex(0xa855f7);
          this.hero.leadPlug.material.emissive = new THREE.Color(0x6b21a8);
        } else {
          this.hero.leadPlug.material.color.setHex(0x334155);
          this.hero.leadPlug.material.emissive = new THREE.Color(0x000000);
        }
      }
    },

    // =================================================================
    // C. 3D ISOMETRIC NOMADIC VILLAGE (МОЯ ОРДА)
    // =================================================================
    initAyylVillage() {
      const canvas = document.getElementById('ayyl-3d-canvas');
      if (!canvas) return;

      const container = canvas.parentElement;
      const width = container.clientWidth || 390;
      const height = container.clientHeight || 240;

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (THREE.ACESFilmicToneMapping) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
      }
      this.village.renderer = renderer;

      // Scene with lush mountain atmosphere
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0c1d2e); // Mountain Twilight Sky
      scene.fog = new THREE.FogExp2(0x0c1d2e, 0.022);
      this.village.scene = scene;

      // Camera: Crisp Orthographic View focused tightly on village
      const aspect = width / height;
      const d = 8.5; // Closer, larger view of buildings
      const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 100);
      camera.position.set(15, 18, 15);
      camera.lookAt(0, 0.2, 0);
      this.village.camera = camera;

      // Lighting: Warm golden sunlight on Tien Shan mountain valley
      const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.25);
      sunLight.position.set(12, 20, 10);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      scene.add(sunLight);

      const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x166534, 0.6);
      scene.add(hemiLight);

      // Cozy Forge Fire light
      const fireLight = new THREE.PointLight(0xf97316, 2.0, 9);
      fireLight.position.set(3.8, 1.4, -2.8);
      scene.add(fireLight);
      this.village.fireLight = fireLight;

      // 1. Terrain: High mountain pasture (Жайлоо) meadow
      this.buildVillageTerrain(scene);

      // 2. Background: Majestic snowy Tien Shan mountain ridges
      this.buildTienShanBackdrop(scene);

      // 3. Buildings: 4 Core Interactive Nomadic Structures
      this.buildNomadYurt(scene);
      this.buildSakaForge(scene);
      this.buildHorseStable(scene);
      this.buildWatchtower(scene);

      // 4. Selection Ring indicator
      const ringGeom = new THREE.RingGeometry(2.0, 2.35, 36);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.09;
      scene.add(ringMesh);
      this.village.selectionRing = ringMesh;

      // Raycaster for tap interaction
      this.village.raycaster = new THREE.Raycaster();
      this.village.mouse = new THREE.Vector2();
      this.bindVillageInteraction(canvas);

      // Animation Loop
      const animate = () => {
        this.village.animId = requestAnimationFrame(animate);

        const time = performance.now() * 0.001;

        if (this.village.fireLight) {
          this.village.fireLight.intensity = 1.8 + Math.sin(time * 10) * 0.4 + Math.cos(time * 6) * 0.2;
        }

        this.updateVillageParticles(time);

        renderer.render(scene, camera);
      };
      animate();

      // Resize
      window.addEventListener('resize', () => {
        if (!container) return;
        const w = container.clientWidth || 390;
        const h = container.clientHeight || 240;
        const asp = w / h;
        camera.left = -d * asp;
        camera.right = d * asp;
        camera.top = d;
        camera.bottom = -d;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
    },

    // -----------------------------------------------------------------
    // C1. TERRAIN & ENVIRONMENT
    // -----------------------------------------------------------------
    buildVillageTerrain(scene) {
      // Main emerald pasture island
      const islandGeom = new THREE.CylinderGeometry(12.5, 11, 1.8, 40);
      const islandMat = new THREE.MeshStandardMaterial({
        color: 0x166534, // Lush Tien Shan Mountain Grass
        roughness: 0.78,
        metalness: 0.05
      });
      const island = new THREE.Mesh(islandGeom, islandMat);
      island.position.y = -0.9;
      island.receiveShadow = true;
      scene.add(island);

      // Meandering glacial stream (Issyk-Kul runoff)
      const riverGeom = new THREE.PlaneGeometry(16, 2.6, 20, 6);
      const riverPos = riverGeom.attributes.position;
      for (let i = 0; i < riverPos.count; i++) {
        const u = riverPos.getX(i);
        riverPos.setY(i, riverPos.getY(i) + Math.sin(u * 0.45) * 0.9);
      }
      riverGeom.computeVertexNormals();
      const riverMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.12,
        metalness: 0.65,
        transparent: true,
        opacity: 0.9
      });
      const river = new THREE.Mesh(riverGeom, riverMat);
      river.rotation.x = -Math.PI / 2;
      river.position.set(0, 0.05, 1.2);
      scene.add(river);

      // Wooden bridge over the glacial stream
      const bridgeGeom = new THREE.BoxGeometry(1.6, 0.12, 3.2);
      const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 });
      const bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
      bridge.position.set(0.2, 0.14, 1.2);
      scene.add(bridge);

      // Mountain Pine / Juniper Trees (Арча)
      const treeMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.6 });
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
      const treePositions = [
        [-6.5, 0, -4.5],
        [-7.2, 0, 1.5],
        [6.8, 0, 1.8],
        [6.2, 0, -4.2],
        [-2.5, 0, -5.5]
      ];

      treePositions.forEach(([x, y, z]) => {
        const treeGroup = new THREE.Group();
        treeGroup.position.set(x, y, z);

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.7, 8), trunkMat);
        trunk.position.y = 0.35;
        treeGroup.add(trunk);

        const foliage1 = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.4, 8), treeMat);
        foliage1.position.y = 1.2;
        treeGroup.add(foliage1);

        const foliage2 = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.1, 8), treeMat);
        foliage2.position.y = 1.8;
        treeGroup.add(foliage2);

        scene.add(treeGroup);
      });

      // Low-poly nomad boulders
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });
      [
        [-5.5, 0.35, 3.2, 0.55],
        [5.8, 0.35, -1.2, 0.65],
        [-1.5, 0.25, 4.2, 0.45]
      ].forEach(([x, y, z, s]) => {
        const rockGeom = new THREE.DodecahedronGeometry(s, 1);
        const rock = new THREE.Mesh(rockGeom, rockMat);
        rock.position.set(x, y, z);
        rock.castShadow = true;
        scene.add(rock);
      });
    },

    buildTienShanBackdrop(scene) {
      // Layered Tien Shan mountain ridges with snow caps
      const peaks = [
        [-13, 2, -12, 6, 11],
        [-6, 3.5, -14, 7.5, 13],
        [2, 4.0, -13, 8.5, 14],
        [10, 2.5, -12, 7, 11]
      ];

      peaks.forEach(([x, y, z, r, h]) => {
        const peakGeom = new THREE.ConeGeometry(r, h, 6);
        const peakMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.85
        });
        const peak = new THREE.Mesh(peakGeom, peakMat);
        peak.position.set(x, y, z);
        scene.add(peak);

        // Snowy peak cap
        const snowGeom = new THREE.ConeGeometry(r * 0.45, h * 0.4, 6);
        const snowMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.25
        });
        const snow = new THREE.Mesh(snowGeom, snowMat);
        snow.position.set(x, y + h * 0.3, z);
        scene.add(snow);
      });
    },

    // -----------------------------------------------------------------
    // C2. PROCEDURAL 3D NOMADIC STRUCTURES
    // -----------------------------------------------------------------
    // 1. ХАНСКАЯ ЮРТА (Khan's Yurt)
    buildNomadYurt(scene) {
      const yurtGroup = new THREE.Group();
      yurtGroup.position.set(-3.5, 0, -2.2);
      yurtGroup.userData = { buildingKey: 'yurt', name: 'Ханская Юрта' };

      // Base felt cylinder (кереге)
      const baseGeom = new THREE.CylinderGeometry(2.1, 2.2, 1.2, 24);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0xfef3c7, // Ivory felt
        roughness: 0.62
      });
      const base = new THREE.Mesh(baseGeom, baseMat);
      base.position.y = 0.6;
      base.castShadow = true;
      yurtGroup.add(base);

      // Red/Gold embroidered ornament belt (терме)
      const bandGeom = new THREE.CylinderGeometry(2.12, 2.12, 0.22, 24);
      const bandMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.35
      });
      const band = new THREE.Mesh(bandGeom, bandMat);
      band.position.y = 0.7;
      yurtGroup.add(band);

      // Conical dome roof
      const domeGeom = new THREE.ConeGeometry(2.25, 1.15, 24);
      const dome = new THREE.Mesh(domeGeom, baseMat);
      dome.position.y = 1.75;
      dome.castShadow = true;
      yurtGroup.add(dome);

      // Golden Skylight Crown (Түндүк)
      const tundukGeom = new THREE.TorusGeometry(0.38, 0.08, 8, 24);
      const tundukMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.88,
        roughness: 0.18
      });
      const tunduk = new THREE.Mesh(tundukGeom, tundukMat);
      tunduk.rotation.x = Math.PI / 2;
      tunduk.position.y = 2.35;
      yurtGroup.add(tunduk);

      // Wooden entrance door
      const doorGeom = new THREE.BoxGeometry(0.7, 0.9, 0.15);
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
      const door = new THREE.Mesh(doorGeom, doorMat);
      door.position.set(0, 0.5, 2.15);
      yurtGroup.add(door);

      scene.add(yurtGroup);
      this.village.buildings['yurt'] = yurtGroup;
    },

    // 2. КУЗНИЦА САКА (Forge)
    buildSakaForge(scene) {
      const forgeGroup = new THREE.Group();
      forgeGroup.position.set(3.8, 0, -2.8);
      forgeGroup.userData = { buildingKey: 'forge', name: 'Кузница Сака' };

      // Stone hearth
      const hearthGeom = new THREE.BoxGeometry(2.4, 1.4, 2.2);
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.88 });
      const hearth = new THREE.Mesh(hearthGeom, stoneMat);
      hearth.position.y = 0.7;
      hearth.castShadow = true;
      forgeGroup.add(hearth);

      // Stone chimney
      const chimneyGeom = new THREE.BoxGeometry(0.7, 2.2, 0.7);
      const chimney = new THREE.Mesh(chimneyGeom, stoneMat);
      chimney.position.set(0.6, 1.8, -0.6);
      chimney.castShadow = true;
      forgeGroup.add(chimney);

      // Open forge furnace opening with glowing coals
      const fireboxGeom = new THREE.BoxGeometry(1.0, 0.8, 0.9);
      const coalsMat = new THREE.MeshStandardMaterial({
        color: 0xea580c,
        emissive: 0xf97316,
        emissiveIntensity: 0.85,
        roughness: 0.4
      });
      const firebox = new THREE.Mesh(fireboxGeom, coalsMat);
      firebox.position.set(-0.4, 0.5, 0.7);
      forgeGroup.add(firebox);

      // Heavy Iron Anvil
      const anvilGeom = new THREE.BoxGeometry(0.8, 0.6, 0.45);
      const ironMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.35
      });
      const anvil = new THREE.Mesh(anvilGeom, ironMat);
      anvil.position.set(0.9, 0.3, 1.4);
      anvil.castShadow = true;
      forgeGroup.add(anvil);

      scene.add(forgeGroup);
      this.village.buildings['forge'] = forgeGroup;
    },

    // 3. ЗАГОН АРГАМАКОВ (Stables)
    buildHorseStable(scene) {
      const stableGroup = new THREE.Group();
      stableGroup.position.set(-3.8, 0, 3.2);
      stableGroup.userData = { buildingKey: 'stable', name: 'Загон Аргамаков' };

      const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 });

      // Wooden fence posts
      const postGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 8);
      const corners = [
        [-1.8, 0.55, -1.4],
        [1.8, 0.55, -1.4],
        [1.8, 0.55, 1.4],
        [-1.8, 0.55, 1.4],
        [-1.8, 0.55, 0],
        [1.8, 0.55, 0]
      ];
      corners.forEach(([px, py, pz]) => {
        const post = new THREE.Mesh(postGeom, woodMat);
        post.position.set(px, py, pz);
        post.castShadow = true;
        stableGroup.add(post);
      });

      // Horizontal fence rails
      const railGeomLong = new THREE.BoxGeometry(3.6, 0.08, 0.08);
      const railGeomShort = new THREE.BoxGeometry(0.08, 0.08, 2.8);

      const r1 = new THREE.Mesh(railGeomLong, woodMat);
      r1.position.set(0, 0.8, -1.4);
      stableGroup.add(r1);

      const r2 = new THREE.Mesh(railGeomLong, woodMat);
      r2.position.set(0, 0.4, -1.4);
      stableGroup.add(r2);

      const r3 = new THREE.Mesh(railGeomShort, woodMat);
      r3.position.set(-1.8, 0.6, 0);
      stableGroup.add(r3);

      const r4 = new THREE.Mesh(railGeomShort, woodMat);
      r4.position.set(1.8, 0.6, 0);
      stableGroup.add(r4);

      // Hay canopy shelter
      const roofGeom = new THREE.ConeGeometry(1.6, 0.8, 4);
      const hayMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
      const roof = new THREE.Mesh(roofGeom, hayMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.set(0.6, 1.7, -0.6);
      roof.castShadow = true;
      stableGroup.add(roof);

      scene.add(stableGroup);
      this.village.buildings['stable'] = stableGroup;
    },

    // 4. ДОЗОРНАЯ БАШНЯ (Watchtower)
    buildWatchtower(scene) {
      const towerGroup = new THREE.Group();
      towerGroup.position.set(4.2, 0, 3.2);
      towerGroup.userData = { buildingKey: 'tower', name: 'Дозорная Башня' };

      const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });

      // 4 Main wooden support stilts
      const stiltGeom = new THREE.CylinderGeometry(0.1, 0.12, 3.4, 8);
      [
        [-0.7, 1.7, -0.7],
        [0.7, 1.7, -0.7],
        [0.7, 1.7, 0.7],
        [-0.7, 1.7, 0.7]
      ].forEach(([sx, sy, sz]) => {
        const stilt = new THREE.Mesh(stiltGeom, woodMat);
        stilt.position.set(sx, sy, sz);
        stilt.castShadow = true;
        towerGroup.add(stilt);
      });

      // Lookout observation deck
      const platformGeom = new THREE.BoxGeometry(2.0, 0.15, 2.0);
      const platform = new THREE.Mesh(platformGeom, woodMat);
      platform.position.y = 3.35;
      towerGroup.add(platform);

      // Protective canopy roof
      const roofGeom = new THREE.ConeGeometry(1.8, 0.9, 4);
      const canvasMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 });
      const roof = new THREE.Mesh(roofGeom, canvasMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 4.4;
      roof.castShadow = true;
      towerGroup.add(roof);

      // Fluttering Red Kyrgyz Battle Pennant
      const flagGeom = new THREE.PlaneGeometry(0.7, 0.45);
      const flagMat = new THREE.MeshBasicMaterial({
        color: 0xdc2626,
        side: THREE.DoubleSide
      });
      const flag = new THREE.Mesh(flagGeom, flagMat);
      flag.position.set(0.35, 4.85, 0);
      towerGroup.add(flag);

      scene.add(towerGroup);
      this.village.buildings['tower'] = towerGroup;
    },

    // -----------------------------------------------------------------
    // C3. INTERACTION & TAP RAYCASTING
    // -----------------------------------------------------------------
    bindVillageInteraction(canvas) {
      canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        this.village.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.village.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.village.raycaster.setFromCamera(this.village.mouse, this.village.camera);
        const intersectObjects = Object.values(this.village.buildings);
        const intersects = this.village.raycaster.intersectObjects(intersectObjects, true);

        if (intersects.length > 0) {
          let hitGroup = intersects[0].object;
          while (hitGroup.parent && !hitGroup.userData.buildingKey) {
            hitGroup = hitGroup.parent;
          }

          if (hitGroup && hitGroup.userData.buildingKey) {
            this.selectBuilding(hitGroup.userData.buildingKey);
          }
        }
      });
    },

    selectBuilding(bKey) {
      const bldg = this.village.buildings[bKey];
      if (!bldg) return;

      this.village.selectedBuilding = bKey;

      if (this.village.selectionRing) {
        this.village.selectionRing.position.set(bldg.position.x, 0.08, bldg.position.z);
        this.village.selectionRing.material.opacity = 0.85;
      }

      if (window.playBoneSound) window.playBoneSound('hit', 0.5);
      if (window.ChukoHaptics && window.ChukoHaptics.impact) {
        window.ChukoHaptics.impact('medium');
      }

      bldg.scale.set(1.15, 1.15, 1.15);
      setTimeout(() => bldg.scale.set(1, 1, 1), 200);

      const cardId = `bldg-${bKey}-btn`;
      const btn = document.getElementById(cardId);
      if (btn) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        btn.classList.add('pulse-battle-glow');
        setTimeout(() => btn.classList.remove('pulse-battle-glow'), 1200);
      }
    },

    // -----------------------------------------------------------------
    // C4. UPGRADE CELEBRATION EFFECT (GOLD STAR PARTICLES)
    // -----------------------------------------------------------------
    triggerUpgradeCelebration(bKey) {
      const bldg = this.village.buildings[bKey];
      if (!bldg) return;

      bldg.scale.set(1.3, 1.3, 1.3);
      setTimeout(() => bldg.scale.set(1, 1, 1), 320);

      const starGeom = new THREE.DodecahedronGeometry(0.18, 0);
      const starMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xf59e0b,
        metalness: 0.9,
        roughness: 0.1
      });

      for (let i = 0; i < 24; i++) {
        const star = new THREE.Mesh(starGeom, starMat);
        star.position.set(
          bldg.position.x + (Math.random() - 0.5) * 1.5,
          bldg.position.y + 1.2 + Math.random() * 0.5,
          bldg.position.z + (Math.random() - 0.5) * 1.5
        );
        star.userData = {
          vx: (Math.random() - 0.5) * 0.12,
          vy: 0.08 + Math.random() * 0.12,
          vz: (Math.random() - 0.5) * 0.12,
          life: 1.0
        };
        this.village.scene.add(star);
        this.village.particles.push(star);
      }
    },

    updateVillageParticles(time) {
      for (let i = this.village.particles.length - 1; i >= 0; i--) {
        const p = this.village.particles[i];
        p.position.x += p.userData.vx;
        p.position.y += p.userData.vy;
        p.position.z += p.userData.vz;
        p.userData.vy -= 0.003;
        p.userData.life -= 0.02;

        p.rotation.x += 0.1;
        p.rotation.y += 0.1;
        p.scale.setScalar(Math.max(0.01, p.userData.life));

        if (p.userData.life <= 0) {
          this.village.scene.remove(p);
          this.village.particles.splice(i, 1);
        }
      }
    }
  };

  global.Chuko3DEngine = Chuko3DEngine;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => Chuko3DEngine.init());
    } else {
      setTimeout(() => Chuko3DEngine.init(), 10);
    }
  }
})(typeof window !== 'undefined' ? window : this);
