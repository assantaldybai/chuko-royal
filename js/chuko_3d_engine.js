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
      material: null,
      light: null,
      animId: null,
      isDragging: false,
      prevPointer: { x: 0, y: 0 },
      rotVelocity: { x: 0, y: 0.015 },
      targetRotation: { x: 0.3, y: 0.4 },
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
      // Check if Three.js is available
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
      // 1. First priority: Use authentic 3D scan of real sheep astragalus
      if (typeof window !== 'undefined' && window.RealAlchikModel && typeof window.RealAlchikModel.getBufferGeometry === 'function') {
        const scanGeom = window.RealAlchikModel.getBufferGeometry(THREE);
        if (scanGeom) return scanGeom;
      }

      // 2. High-precision fallback
      const width = 2.4;
      const height = 3.6;
      const depth = 1.9;
      const geom = new THREE.BoxGeometry(width, height, depth, 16, 20, 14);
      const pos = geom.attributes.position;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        const ny = y / (height * 0.5); // -1 to +1 along bone length
        const nx = x / (width * 0.5);
        const nz = z / (depth * 0.5);

        // 1. Condyle lobing at top and bottom (+Y and -Y ends)
        const endTaper = 1.0 - 0.18 * (ny * ny);
        x *= endTaper;
        z *= endTaper;

        // Top condyles groove (sulcus between medial & lateral lobes)
        if (ny > 0.4) {
          const groove = Math.sin((ny - 0.4) * Math.PI) * 0.28;
          y -= Math.abs(nx) < 0.35 ? groove : -groove * 0.3;
        }

        // Bottom trochlea cylindrical sweep
        if (ny < -0.4) {
          const trochlea = (1.0 - Math.abs(ny)) * 0.2;
          z += trochlea;
        }

        // 2. Front & Back Sides:
        // ТАА (+Z face): relatively flat, smooth plate with slight central fossa
        if (z > 0.4) {
          z += 0.15 * Math.cos(nx * Math.PI * 0.5);
        }
        // АЛЧЫ (-Z face): deep central saddle groove with prominent lateral ridge
        if (z < -0.3) {
          const saddle = Math.sin((nx + 0.2) * Math.PI);
          z += saddle * 0.32;
        }

        // 3. Lateral & Medial Sides:
        // БӨК (+X face): rounded bulging convex belly
        if (x > 0.3) {
          x += 0.28 * Math.cos(ny * Math.PI * 0.5);
        }
        // ЧИК (-X face): deep hollowed notch / waist
        if (x < -0.3) {
          x += 0.3 * Math.sin(Math.abs(ny) * Math.PI * 0.5);
        }

        pos.setXYZ(i, x, y, z);
      }

      geom.computeVertexNormals();
      return geom;
    },

    // =================================================================
    // B. HERO 3D CHUKO INITIALIZATION & CONTROLS
    // =================================================================
    initHeroChuko() {
      const canvas = document.getElementById('hero-chuko-3d-canvas');
      if (!canvas) return;

      const container = canvas.parentElement;
      const width = container.clientWidth || 180;
      const height = container.clientHeight || 140;

      // Renderer
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
      this.hero.renderer = renderer;

      // Scene & Camera
      const scene = new THREE.Scene();
      this.hero.scene = scene;

      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
      camera.position.set(0, 0, 7.8);
      this.hero.camera = camera;

      // Lighting: Warm golden key light + cool sky fill + rim light
      const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
      keyLight.position.set(4, 6, 5);
      scene.add(keyLight);
      this.hero.light = keyLight;

      const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
      fillLight.position.set(-4, -2, -3);
      scene.add(fillLight);

      const ambientLight = new THREE.AmbientLight(0xffedd5, 0.65);
      scene.add(ambientLight);

      // Contact shadow plane underneath
      const shadowGeom = new THREE.PlaneGeometry(4.5, 3.2);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.35,
        depthWrite: false
      });
      const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.y = -2.1;
      scene.add(shadowMesh);

      // Procedural Astragalus Mesh
      const geom = this.createAstragalusGeometry();
      const material = this.getSakaMaterial('lead');
      this.hero.material = material;

      const mesh = new THREE.Mesh(geom, material);
      mesh.rotation.x = 0.3;
      mesh.rotation.y = 0.4;
      scene.add(mesh);
      this.hero.mesh = mesh;

      // Setup Pointer & Touch Drag Interaction
      this.bindHeroDrag(canvas);

      // Render Loop
      const animate = () => {
        this.hero.animId = requestAnimationFrame(animate);

        if (!this.hero.isDragging) {
          mesh.rotation.y += this.hero.rotVelocity.y;
          mesh.rotation.x += this.hero.rotVelocity.x;
          // Damping
          this.hero.rotVelocity.y *= 0.985;
          this.hero.rotVelocity.x *= 0.985;
          if (Math.abs(this.hero.rotVelocity.y) < 0.008) {
            this.hero.rotVelocity.y = 0.008; // subtle idle rotation
          }
        }

        // Gentle floating bounce
        const time = performance.now() * 0.002;
        mesh.position.y = Math.sin(time) * 0.12;

        renderer.render(scene, camera);
      };
      animate();

      // Responsive resize
      window.addEventListener('resize', () => {
        if (!container) return;
        const w = container.clientWidth || 180;
        const h = container.clientHeight || 140;
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
        if (!isDown || !this.hero.mesh) return;
        const dx = clientX - startX;
        const dy = clientY - startY;
        startX = clientX;
        startY = clientY;

        this.hero.mesh.rotation.y += dx * 0.018;
        this.hero.mesh.rotation.x += dy * 0.018;

        this.hero.rotVelocity.y = dx * 0.015;
        this.hero.rotVelocity.x = dy * 0.015;
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

      // Tap spin trick on click
      canvas.addEventListener('click', () => {
        if (Math.abs(this.hero.rotVelocity.y) < 0.05) {
          this.hero.rotVelocity.y = 0.22; // energetic flip
          if (window.playBoneSound) window.playBoneSound('hit', 0.5);
          if (window.ChukoHaptics && window.ChukoHaptics.impact) {
            window.ChukoHaptics.impact('light');
          }
        }
      });
    },

    // Material generator for Saka skins
    getSakaMaterial(skinId) {
      switch (skinId) {
        case 'gold':
        case 'golden_saka':
          return new THREE.MeshStandardMaterial({
            color: 0xfbbf24,
            roughness: 0.22,
            metalness: 0.88,
            envMapIntensity: 1.5
          });
        case 'cyberpunk':
        case 'cyber_saka':
          return new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.3,
            metalness: 0.7,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.35
          });
        case 'horn':
        case 'argali_horn':
          return new THREE.MeshStandardMaterial({
            color: 0xd97706,
            roughness: 0.45,
            metalness: 0.15
          });
        case 'suusamyr_skin':
          return new THREE.MeshStandardMaterial({
            color: 0x059669,
            roughness: 0.25,
            metalness: 0.3,
            emissive: 0x10b981,
            emissiveIntensity: 0.2
          });
        case 'lead':
        default:
          return new THREE.MeshStandardMaterial({
            color: 0xfef3c7,
            roughness: 0.38,
            metalness: 0.25
          });
      }
    },

    setHeroSkin(skinId) {
      if (!this.hero.mesh) return;
      this.hero.currentSkin = skinId;
      const newMat = this.getSakaMaterial(skinId);
      this.hero.mesh.material = newMat;
      this.hero.material = newMat;
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
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.village.renderer = renderer;

      // Scene
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x061e1b, 0.025);
      this.village.scene = scene;

      // Camera: Classic Isometric Orthographic View
      const aspect = width / height;
      const d = 11;
      const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 100);
      camera.position.set(16, 20, 16);
      camera.lookAt(0, 0, 0);
      this.village.camera = camera;

      // Lighting: Sunlight on Tien Shan highlands
      const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
      sunLight.position.set(14, 22, 10);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      scene.add(sunLight);

      const hemiLight = new THREE.HemisphereLight(0x67e8f9, 0x14532d, 0.65);
      scene.add(hemiLight);

      // Cozy Forge Fire light
      const fireLight = new THREE.PointLight(0xf97316, 1.8, 8);
      fireLight.position.set(4, 1.5, -3.5);
      scene.add(fireLight);
      this.village.fireLight = fireLight;

      // 1. Terrain: High mountain pasture (Жайлоо) meadow
      this.buildVillageTerrain(scene);

      // 2. Background: Snowy Tien Shan mountain peaks
      this.buildTienShanBackdrop(scene);

      // 3. Buildings: 4 Core Interactive Nomadic Structures
      this.buildNomadYurt(scene);
      this.buildSakaForge(scene);
      this.buildHorseStable(scene);
      this.buildWatchtower(scene);

      // 4. Selection Ring indicator
      const ringGeom = new THREE.RingGeometry(2.0, 2.3, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.08;
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

        // Forge fire flickering
        if (this.village.fireLight) {
          this.village.fireLight.intensity = 1.6 + Math.sin(time * 12) * 0.4 + Math.cos(time * 7) * 0.2;
        }

        // Animate smoke particles
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
    // C1. TERRAIN & BACKGROUND
    // -----------------------------------------------------------------
    buildVillageTerrain(scene) {
      // Main green grassy island
      const islandGeom = new THREE.CylinderGeometry(13.5, 12, 1.8, 36);
      const islandMat = new THREE.MeshStandardMaterial({
        color: 0x15803d, // Lush Emerald Tien Shan Grass
        roughness: 0.75,
        metalness: 0.1
      });
      const island = new THREE.Mesh(islandGeom, islandMat);
      island.position.y = -0.9;
      island.receiveShadow = true;
      scene.add(island);

      // Stylized meandering glacial stream (Issyk-Kul mountain runoff)
      const riverGeom = new THREE.PlaneGeometry(16, 2.4, 16, 4);
      const riverPos = riverGeom.attributes.position;
      for (let i = 0; i < riverPos.count; i++) {
        const u = riverPos.getX(i);
        riverPos.setY(i, riverPos.getY(i) + Math.sin(u * 0.4) * 0.8);
      }
      riverGeom.computeVertexNormals();
      const riverMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4, // Cyan glacial water
        roughness: 0.1,
        metalness: 0.6,
        transparent: true,
        opacity: 0.85
      });
      const river = new THREE.Mesh(riverGeom, riverMat);
      river.rotation.x = -Math.PI / 2;
      river.position.set(0, 0.05, 1.5);
      scene.add(river);

      // Low-poly nomad rocks / boulders
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
      [
        [-6, 0.4, 2, 0.6],
        [7, 0.4, -1, 0.75],
        [-2, 0.3, 5, 0.5]
      ].forEach(([x, y, z, s]) => {
        const rockGeom = new THREE.DodecahedronGeometry(s, 1);
        const rock = new THREE.Mesh(rockGeom, rockMat);
        rock.position.set(x, y, z);
        rock.castShadow = true;
        scene.add(rock);
      });
    },

    buildTienShanBackdrop(scene) {
      // Majestic low-poly mountain range with snowy peaks
      const peaks = [
        [-14, 4, -15, 6, 12],
        [-6, 5.5, -18, 8, 15],
        [3, 6, -17, 9, 16],
        [12, 4.5, -15, 7, 13]
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

        // Snow cap
        const snowGeom = new THREE.ConeGeometry(r * 0.45, h * 0.4, 6);
        const snowMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.3
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
      yurtGroup.position.set(-3.8, 0, -2.5);
      yurtGroup.userData = { buildingKey: 'yurt', name: 'Ханская Юрта' };

      // Base cylinder (кереге)
      const baseGeom = new THREE.CylinderGeometry(2.2, 2.3, 1.2, 24);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0xfef3c7, // White/Ivory Felt
        roughness: 0.6
      });
      const base = new THREE.Mesh(baseGeom, baseMat);
      base.position.y = 0.6;
      base.castShadow = true;
      yurtGroup.add(base);

      // Red/Gold embroidered patterned belt (терме / тегирич)
      const bandGeom = new THREE.CylinderGeometry(2.22, 2.22, 0.22, 24);
      const bandMat = new THREE.MeshStandardMaterial({
        color: 0xd97706, // Gold & Crimson Nomad Ornament
        roughness: 0.4
      });
      const band = new THREE.Mesh(bandGeom, bandMat);
      band.position.y = 0.7;
      yurtGroup.add(band);

      // Conical dome roof
      const domeGeom = new THREE.ConeGeometry(2.35, 1.1, 24);
      const dome = new THREE.Mesh(domeGeom, baseMat);
      dome.position.y = 1.75;
      dome.castShadow = true;
      yurtGroup.add(dome);

      // Golden Skylight Crown (Түндүк)
      const tundukGeom = new THREE.TorusGeometry(0.35, 0.08, 8, 20);
      const tundukMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.85,
        roughness: 0.2
      });
      const tunduk = new THREE.Mesh(tundukGeom, tundukMat);
      tunduk.rotation.x = Math.PI / 2;
      tunduk.position.y = 2.32;
      yurtGroup.add(tunduk);

      // Wooden entrance door
      const doorGeom = new THREE.BoxGeometry(0.7, 0.9, 0.15);
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
      const door = new THREE.Mesh(doorGeom, doorMat);
      door.position.set(0, 0.5, 2.25);
      yurtGroup.add(door);

      scene.add(yurtGroup);
      this.village.buildings['yurt'] = yurtGroup;
    },

    // 2. КУЗНИЦА САКА (Forge)
    buildSakaForge(scene) {
      const forgeGroup = new THREE.Group();
      forgeGroup.position.set(4.2, 0, -3.2);
      forgeGroup.userData = { buildingKey: 'forge', name: 'Кузница Сака' };

      // Stone hearth building
      const hearthGeom = new THREE.BoxGeometry(2.4, 1.4, 2.2);
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
      const hearth = new THREE.Mesh(hearthGeom, stoneMat);
      hearth.position.y = 0.7;
      hearth.castShadow = true;
      forgeGroup.add(hearth);

      // Stone chimney
      const chimneyGeom = new THREE.BoxGeometry(0.7, 2.2, 0.7);
      const chimney = new THREE.Mesh(chimneyGeom, stoneMat);
      chimney.position.set(0.6, 1.8, -0.5);
      chimney.castShadow = true;
      forgeGroup.add(chimney);

      // Anvil outside
      const anvilGeom = new THREE.BoxGeometry(0.6, 0.5, 0.9);
      const anvilMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
      const anvil = new THREE.Mesh(anvilGeom, anvilMat);
      anvil.position.set(-0.6, 0.3, 1.5);
      anvil.castShadow = true;
      forgeGroup.add(anvil);

      // Glowing furnace mouth
      const furnaceGeom = new THREE.PlaneGeometry(0.9, 0.7);
      const furnaceMat = new THREE.MeshBasicMaterial({ color: 0xff5722 });
      const furnace = new THREE.Mesh(furnaceGeom, furnaceMat);
      furnace.position.set(0, 0.55, 1.11);
      forgeGroup.add(furnace);

      scene.add(forgeGroup);
      this.village.buildings['forge'] = forgeGroup;
    },

    // 3. ЗАГОН АРГАМАКОВ (Horse Stable)
    buildHorseStable(scene) {
      const stableGroup = new THREE.Group();
      stableGroup.position.set(-4.5, 0, 4.0);
      stableGroup.userData = { buildingKey: 'stable', name: 'Загон Аргамаков' };

      const woodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });

      // Wooden split-rail fence posts
      const posts = [
        [-1.6, -1.6], [1.6, -1.6], [1.6, 1.6], [-1.6, 1.6],
        [0, -1.6], [1.6, 0], [0, 1.6], [-1.6, 0]
      ];
      posts.forEach(([px, pz]) => {
        const postGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8);
        const post = new THREE.Mesh(postGeom, woodMat);
        post.position.set(px, 0.45, pz);
        post.castShadow = true;
        stableGroup.add(post);
      });

      // Horizontal rails
      const railGeom = new THREE.BoxGeometry(3.2, 0.08, 0.05);
      const rail1 = new THREE.Mesh(railGeom, woodMat);
      rail1.position.set(0, 0.6, -1.6);
      stableGroup.add(rail1);

      const rail2 = new THREE.Mesh(railGeom, woodMat);
      rail2.position.set(0, 0.6, 1.6);
      stableGroup.add(rail2);

      // Thatched shelter roof
      const shelterGeom = new THREE.ConeGeometry(1.6, 0.7, 4);
      const thatchMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.9 });
      const shelter = new THREE.Mesh(shelterGeom, thatchMat);
      shelter.position.set(-0.8, 1.4, -0.8);
      shelter.rotation.y = Math.PI / 4;
      shelter.castShadow = true;
      stableGroup.add(shelter);

      // Horse Flag / Banner Pole
      const poleGeom = new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8);
      const pole = new THREE.Mesh(poleGeom, woodMat);
      pole.position.set(1.6, 1.3, -1.6);
      stableGroup.add(pole);

      const flagGeom = new THREE.PlaneGeometry(0.7, 0.4);
      const flagMat = new THREE.MeshStandardMaterial({ color: 0x10b981, side: THREE.DoubleSide });
      const flag = new THREE.Mesh(flagGeom, flagMat);
      flag.position.set(1.95, 2.2, -1.6);
      stableGroup.add(flag);

      scene.add(stableGroup);
      this.village.buildings['stable'] = stableGroup;
    },

    // 4. ДОЗОРНАЯ БАШНЯ (Watchtower)
    buildWatchtower(scene) {
      const towerGroup = new THREE.Group();
      towerGroup.position.set(4.5, 0, 3.8);
      towerGroup.userData = { buildingKey: 'tower', name: 'Дозорная Башня' };

      const timberMat = new THREE.MeshStandardMaterial({ color: 0x57361a, roughness: 0.85 });

      // 4 heavy upright timber legs
      [[-0.9, -0.9], [0.9, -0.9], [0.9, 0.9], [-0.9, 0.9]].forEach(([lx, lz]) => {
        const legGeom = new THREE.CylinderGeometry(0.09, 0.12, 3.8, 8);
        const leg = new THREE.Mesh(legGeom, timberMat);
        leg.position.set(lx, 1.9, lz);
        leg.castShadow = true;
        towerGroup.add(leg);
      });

      // Elevated observation platform
      const platGeom = new THREE.BoxGeometry(2.3, 0.18, 2.3);
      const plat = new THREE.Mesh(platGeom, timberMat);
      plat.position.y = 3.6;
      plat.castShadow = true;
      towerGroup.add(plat);

      // Lookout pyramid roof
      const roofGeom = new THREE.ConeGeometry(1.8, 1.1, 4);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x0e7490, roughness: 0.5 });
      const roof = new THREE.Mesh(roofGeom, roofMat);
      roof.position.y = 4.8;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      towerGroup.add(roof);

      // Flaming Beacon Brazier
      const brazierGeom = new THREE.CylinderGeometry(0.3, 0.2, 0.35, 12);
      const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
      const brazier = new THREE.Mesh(brazierGeom, ironMat);
      brazier.position.set(0, 3.85, 0);
      towerGroup.add(brazier);

      const beaconFlameGeom = new THREE.SphereGeometry(0.18, 8, 8);
      const beaconFlameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const beaconFlame = new THREE.Mesh(beaconFlameGeom, beaconFlameMat);
      beaconFlame.position.set(0, 4.15, 0);
      towerGroup.add(beaconFlame);

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
          // Find topmost building group
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

      // Position glowing selection ring underneath
      if (this.village.selectionRing) {
        this.village.selectionRing.position.set(bldg.position.x, 0.08, bldg.position.z);
        this.village.selectionRing.material.opacity = 0.85;
      }

      // Play audio & haptics
      if (window.playBoneSound) window.playBoneSound('hit', 0.5);
      if (window.ChukoHaptics && window.ChukoHaptics.impact) {
        window.ChukoHaptics.impact('medium');
      }

      // Smooth bounce animation
      bldg.scale.set(1.12, 1.12, 1.12);
      setTimeout(() => bldg.scale.set(1, 1, 1), 180);

      // Scroll to corresponding building card in Village Tab
      const cardId = `bldg-${bKey}-btn`;
      const btn = document.getElementById(cardId);
      if (btn) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        btn.classList.add('pulse-battle-glow');
        setTimeout(() => btn.classList.remove('pulse-battle-glow'), 1200);
      }
    },

    // -----------------------------------------------------------------
    // C4. UPGRADE CELEBRATION EFFECT (FIREWORKS / GOLD STARS)
    // -----------------------------------------------------------------
    triggerUpgradeCelebration(bKey) {
      const bldg = this.village.buildings[bKey];
      if (!bldg) return;

      // Big triumphant scale bounce
      bldg.scale.set(1.3, 1.3, 1.3);
      setTimeout(() => bldg.scale.set(1, 1, 1), 320);

      // Spawn 3D golden star particles
      const starGeom = new THREE.DodecahedronGeometry(0.16, 0);
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
      // Upgrade particles
      for (let i = this.village.particles.length - 1; i >= 0; i--) {
        const p = this.village.particles[i];
        p.position.x += p.userData.vx;
        p.position.y += p.userData.vy;
        p.position.z += p.userData.vz;
        p.userData.vy -= 0.003; // gravity
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

  // Auto-init on DOMContentLoaded
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => Chuko3DEngine.init());
    } else {
      setTimeout(() => Chuko3DEngine.init(), 10);
    }
  }
})(typeof window !== 'undefined' ? window : this);
