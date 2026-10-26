import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { createTextSprite } from './helpers.js';
import { loadGltfModel, loadCenteredGltfModel } from './assetLoader.js';

/**
 * Creates low-poly trees (pine trees & deciduous trees).
 */
export function createTree(type = 'pine') {
  const tree = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 1.8, 6);
  const trunkMat = new THREE.MeshLambertMaterial({ color: '#78350f', flatShading: true });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.9;
  trunk.castShadow = true;
  tree.add(trunk);

  if (type === 'pine') {
    const leafMat = new THREE.MeshLambertMaterial({ color: '#15803d', flatShading: true });
    for (let i = 0; i < 3; i++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(1.6 - i * 0.35, 1.8 - i * 0.2, 6),
        leafMat
      );
      cone.position.y = 1.8 + i * 1.1;
      cone.castShadow = true;
      tree.add(cone);
    }
  } else {
    const foliageMat = new THREE.MeshLambertMaterial({ color: '#22c55e', flatShading: true });
    const foliage = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.4, 1),
      foliageMat
    );
    foliage.position.y = 2.6;
    foliage.castShadow = true;
    tree.add(foliage);
  }

  return tree;
}

/**
 * Creates a stylized glowing 3D Sun with rotating rays and corona halos.
 */
export function createSun() {
  const sunGroup = new THREE.Group();
  sunGroup.position.set(19, 10.8, -26); // Positioned in the visible upper-right sky above houses and mountains

  // Core Glowing Sun Sphere
  const sunMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
  const sunCore = new THREE.Mesh(new THREE.IcosahedronGeometry(2.8, 2), sunMat);
  sunGroup.add(sunCore);

  // Golden Inner Corona Halo
  const innerCoronaMat = new THREE.MeshBasicMaterial({
    color: '#fde047',
    transparent: true,
    opacity: 0.60,
    side: THREE.DoubleSide
  });
  const innerCorona = new THREE.Mesh(new THREE.RingGeometry(2.8, 4.2, 32), innerCoronaMat);
  innerCorona.rotation.x = 0.35;
  innerCorona.rotation.y = -0.4;
  sunGroup.add(innerCorona);

  // Soft Outer Amber Corona Halo
  const outerCoronaMat = new THREE.MeshBasicMaterial({
    color: '#f59e0b',
    transparent: true,
    opacity: 0.30,
    side: THREE.DoubleSide
  });
  const outerCorona = new THREE.Mesh(new THREE.RingGeometry(4.2, 6.2, 32), outerCoronaMat);
  outerCorona.rotation.copy(innerCorona.rotation);
  sunGroup.add(outerCorona);

  // 12 Stylized Geometric Sun Rays that rotate in the sky
  const raysGroup = new THREE.Group();
  raysGroup.rotation.copy(innerCorona.rotation);
  const rayMat = new THREE.MeshBasicMaterial({ color: '#fbbf24' });

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const rayLen = (i % 2 === 0) ? 2.0 : 1.4;
    const rayGeo = new THREE.ConeGeometry(0.42, rayLen, 4);
    const rayMesh = new THREE.Mesh(rayGeo, rayMat);
    const dist = 3.0 + rayLen / 2;
    rayMesh.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist, 0);
    rayMesh.rotation.z = angle - Math.PI / 2;
    raysGroup.add(rayMesh);
  }
  sunGroup.add(raysGroup);

  // Warm sunlight fill
  const sunLight = new THREE.PointLight('#fef08a', 1.0, 70);
  sunLight.position.set(0, 0, 0);
  sunGroup.add(sunLight);

  sunGroup.userData = {
    core: sunCore,
    raysGroup,
    innerCorona,
    outerCorona
  };

  return sunGroup;
}

/**
 * Creates low-poly clouds drifting across the avenue sky, enhanced with Poly.pizza 3D models.
 */
export function createClouds(streetWidth = 120) {
  const cloudsGroup = new THREE.Group();
  const cloudMat = new THREE.MeshLambertMaterial({
    color: '#ffffff',
    flatShading: true,
    opacity: 0.94,
    transparent: true
  });

  const cloudConfigs = [
    { x: -55, y: 22, z: -35, scale: 1.8, speed: 0.65, model: '/assets/models/cloud2.glb' },
    { x: -38, y: 18, z: -18, scale: 1.3, speed: 0.85, model: '/assets/models/cloud1.glb' },
    { x: -22, y: 25, z: -30, scale: 2.1, speed: 0.55, model: '/assets/models/cloud2.glb' },
    { x: -8,  y: 19, z: -12, scale: 1.2, speed: 0.95, model: '/assets/models/cloud1.glb' },
    { x: 8,   y: 23, z: -25, scale: 1.9, speed: 0.70, model: '/assets/models/cloud2.glb' },
    { x: 25,  y: 27, z: -38, scale: 2.3, speed: 0.50, model: '/assets/models/cloud2.glb' },
    { x: 42,  y: 20, z: -15, scale: 1.4, speed: 0.80, model: '/assets/models/cloud1.glb' },
    { x: 58,  y: 24, z: -28, scale: 1.7, speed: 0.60, model: '/assets/models/cloud2.glb' },
    { x: -48, y: 17, z: 8,   scale: 1.1, speed: 1.05, model: '/assets/models/cloud1.glb' },
    { x: -14, y: 21, z: 12,  scale: 1.4, speed: 0.75, model: '/assets/models/cloud1.glb' },
    { x: 18,  y: 18, z: 15,  scale: 1.2, speed: 0.90, model: '/assets/models/cloud1.glb' },
    { x: 50,  y: 22, z: 10,  scale: 1.5, speed: 0.70, model: '/assets/models/cloud2.glb' }
  ];

  cloudConfigs.forEach((cfg, idx) => {
    const cloud = new THREE.Group();
    cloud.position.set(cfg.x, cfg.y, cfg.z);
    cloud.scale.setScalar(cfg.scale);
    cloud.userData = {
      speed: cfg.speed,
      baseY: cfg.y,
      phase: idx * 1.3
    };

    // Procedural fluffy cloud as immediate display
    const proceduralCloud = new THREE.Group();
    const puffCount = 4 + (idx % 3);
    for (let j = 0; j < puffCount; j++) {
      const puff = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.4 + (j % 2) * 0.4, 1),
        cloudMat
      );
      puff.position.set((j - puffCount / 2) * 1.6, Math.sin(j) * 0.5, Math.cos(j) * 0.6);
      proceduralCloud.add(puff);
    }
    cloud.add(proceduralCloud);

    // Asynchronously enhance with Poly.pizza 3D Cloud model
    loadCenteredGltfModel(cfg.model, { targetWidth: 5.5, ground: false }).then((model) => {
      if (model) {
        cloud.add(model);
        proceduralCloud.visible = false;
      }
    });

    cloudsGroup.add(cloud);
  });

  return cloudsGroup;
}

/**
 * Creates little birds soaring in flocks and perched on roofs, enhanced with Poly.pizza bird assets.
 */
export function createBirds() {
  const birdsList = [];
  const birdsGroup = new THREE.Group();

  function buildProceduralBird(color = '#0284c7') {
    const bird = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color, flatShading: true });
    const beakMat = new THREE.MeshLambertMaterial({ color: '#f59e0b', flatShading: true });
    const bellyMat = new THREE.MeshLambertMaterial({ color: '#f8fafc', flatShading: true });

    // Streamlined bird body
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.20, 0.65, 6), bodyMat);
    body.rotation.x = Math.PI / 2;
    bird.add(body);

    // Belly patch
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), bellyMat);
    belly.position.set(0, -0.06, 0.12);
    belly.scale.set(1.0, 0.7, 1.4);
    bird.add(belly);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), bodyMat);
    head.position.set(0, 0.12, 0.35);
    bird.add(head);

    // Beak
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), beakMat);
    beak.position.set(0, 0.10, 0.50);
    beak.rotation.x = Math.PI / 2;
    bird.add(beak);

    // Articulated Left Wing
    const leftWingHinge = new THREE.Group();
    leftWingHinge.position.set(-0.13, 0.08, 0.10);
    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.02, 0.26), bodyMat);
    leftWing.position.set(-0.26, 0, 0);
    leftWingHinge.add(leftWing);
    bird.add(leftWingHinge);

    // Articulated Right Wing
    const rightWingHinge = new THREE.Group();
    rightWingHinge.position.set(0.13, 0.08, 0.10);
    const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.02, 0.26), bodyMat);
    rightWing.position.set(0.26, 0, 0);
    rightWingHinge.add(rightWing);
    bird.add(rightWingHinge);

    // Tail feathers
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.28), bodyMat);
    tail.position.set(0, 0.04, -0.42);
    bird.add(tail);

    bird.scale.setScalar(1.2);

    return { root: bird, head, leftWingHinge, rightWingHinge };
  }

  // Configurations for soaring flock and low-flying birds (all flying smoothly in the sky)
  const birdConfigs = [
    // Soaring flock in V-formation
    { x: -30, y: 16.5, z: -14, speed: 5.4, color: '#0284c7', flapSpeed: 9.5, phase: 0 },
    { x: -33, y: 17.0, z: -11.5, speed: 5.4, color: '#38bdf8', flapSpeed: 10.0, phase: 0.5 },
    { x: -33, y: 16.0, z: -16.5, speed: 5.4, color: '#0ea5e9', flapSpeed: 9.2, phase: 0.9 },
    // Low gliders cruising along the street and rooftops
    { x: 10, y: 11.5, z: 2.0, speed: 4.0, color: '#f97316', flapSpeed: 8.5, phase: 2.1 },
    { x: -45, y: 12.8, z: -7.0, speed: 4.4, color: '#10b981', flapSpeed: 8.0, phase: 3.4 },
    { x: 35, y: 10.5, z: 12.0, speed: 3.8, color: '#eab308', flapSpeed: 7.5, phase: 1.5 }
  ];

  birdConfigs.forEach((cfg, idx) => {
    const birdObj = buildProceduralBird(cfg.color);
    birdObj.root.position.set(cfg.x, cfg.y, cfg.z);
    birdObj.root.rotation.y = Math.PI / 2; // Flying eastward along +X

    birdObj.userData = {
      isFlying: true,
      speed: cfg.speed,
      baseY: cfg.y,
      phase: cfg.phase,
      flapSpeed: cfg.flapSpeed || 9,
      amplitude: 0.55
    };

    birdsGroup.add(birdObj.root);
    birdsList.push(birdObj);
  });

  return { group: birdsGroup, birds: birdsList };
}

/**
 * Creates a majestic low-poly alpine mountain range with snow-capped peaks and evergreen foothills.
 */
export function createMountainRange(streetWidth = 140) {
  const group = new THREE.Group();

  const rockMat1 = new THREE.MeshLambertMaterial({ color: '#334155', flatShading: true }); // Slate rock
  const rockMat2 = new THREE.MeshLambertMaterial({ color: '#475569', flatShading: true }); // Cool granite
  const rockMat3 = new THREE.MeshLambertMaterial({ color: '#1e293b', flatShading: true }); // Deep shadow rock
  const snowMat = new THREE.MeshLambertMaterial({ color: '#f8fafc', flatShading: true }); // Crisp snowcaps
  const hillMat1 = new THREE.MeshLambertMaterial({ color: '#166534', flatShading: true }); // Dark pine forest
  const hillMat2 = new THREE.MeshLambertMaterial({ color: '#15803d', flatShading: true }); // Vibrant alpine green

  // 1. Majestic Snow-Capped Mountain Peaks in the Background
  const peaks = [
    { x: -115, z: -46, r: 18, h: 16, seg: 7 },
    { x: -90,  z: -40, r: 17, h: 15, seg: 6 },
    { x: -68,  z: -44, r: 19, h: 17, seg: 7 },
    { x: -46,  z: -38, r: 16, h: 14, seg: 6 },
    { x: -24,  z: -42, r: 20, h: 18, seg: 7 },
    { x: -2,   z: -36, r: 15, h: 13.5, seg: 6 }, // Peak behind center house
    { x: 22,   z: -40, r: 19, h: 16.5, seg: 7 }, // Peak near the sun
    { x: 44,   z: -36, r: 15, h: 13, seg: 6 },
    { x: 68,   z: -43, r: 18, h: 16, seg: 7 },
    { x: 92,   z: -38, r: 16, h: 14.5, seg: 6 },
    { x: 116,  z: -44, r: 19, h: 16, seg: 7 },
    { x: 138,  z: -40, r: 17, h: 14, seg: 6 }
  ];

  peaks.forEach((p, idx) => {
    const peakGroup = new THREE.Group();
    peakGroup.position.set(p.x, p.h / 2, p.z);

    const rockMat = (idx % 3 === 0) ? rockMat1 : ((idx % 3 === 1) ? rockMat2 : rockMat3);
    const body = new THREE.Mesh(new THREE.ConeGeometry(p.r, p.h, p.seg), rockMat);
    body.castShadow = true;
    body.receiveShadow = true;
    peakGroup.add(body);

    // Faceted Pure White Snow Cap covering the top 36%
    const snowH = p.h * 0.36;
    const snowR = p.r * 0.36;
    const snowCap = new THREE.Mesh(new THREE.ConeGeometry(snowR, snowH, p.seg), snowMat);
    snowCap.position.y = p.h / 2 - snowH / 2 + 0.02;
    snowCap.castShadow = true;
    peakGroup.add(snowCap);

    group.add(peakGroup);
  });

  // 2. Layered Midground Foothills / Evergreen Ridges in front of the tall peaks
  const foothills = [
    { x: -105, z: -29, r: 14, h: 7.5, seg: 6, mat: hillMat1 },
    { x: -80,  z: -27, r: 13, h: 7.0, seg: 7, mat: hillMat2 },
    { x: -56,  z: -28, r: 15, h: 8.0, seg: 6, mat: hillMat1 },
    { x: -35,  z: -26, r: 12, h: 6.5, seg: 7, mat: hillMat2 },
    { x: -12,  z: -28, r: 14, h: 7.8, seg: 6, mat: hillMat1 },
    { x: 10,   z: -26, r: 13, h: 7.0, seg: 7, mat: hillMat2 },
    { x: 32,   z: -28, r: 14, h: 7.5, seg: 6, mat: hillMat1 },
    { x: 55,   z: -26, r: 12, h: 6.8, seg: 7, mat: hillMat2 },
    { x: 80,   z: -28, r: 15, h: 8.0, seg: 6, mat: hillMat1 },
    { x: 105,  z: -27, r: 13, h: 7.2, seg: 7, mat: hillMat2 },
    { x: 128,  z: -28, r: 14, h: 7.5, seg: 6, mat: hillMat1 }
  ];

  foothills.forEach(f => {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(f.r, f.h, f.seg), f.mat);
    hill.position.set(f.x, f.h / 2, f.z);
    hill.receiveShadow = true;
    group.add(hill);
  });

  return group;
}

/**
 * Builds a single customized 3D house for a user at a specified street X offset.
 */
function createSingleHouse(user, offsetX = 0) {
  const houseGroup = new THREE.Group();
  houseGroup.position.set(offsetX, 0, -1);

  // House Walls with custom user house color
  const houseColor = user?.house_color || '#4f46e5';
  const wallMat = new THREE.MeshLambertMaterial({ color: houseColor, flatShading: true });
  const walls = new THREE.Mesh(new THREE.BoxGeometry(7, 4.2, 6), wallMat);
  walls.position.y = 2.1;
  walls.castShadow = true;
  walls.receiveShadow = true;
  houseGroup.add(walls);

  // White Trim Base
  const trimMat = new THREE.MeshLambertMaterial({ color: '#f8fafc', flatShading: true });
  const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.3, 6.2), trimMat);
  baseTrim.position.y = 0.15;
  houseGroup.add(baseTrim);

  // Slanted Roof
  const roofMat = new THREE.MeshLambertMaterial({ color: '#b91c1c', flatShading: true });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.8, 2.8, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 4.2 + 1.4;
  roof.scale.set(1.15, 1, 1);
  roof.castShadow = true;
  houseGroup.add(roof);

  // Chimney & Smoke particles
  const chimneyMat = new THREE.MeshLambertMaterial({ color: '#991b1b', flatShading: true });
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.2, 0.8), chimneyMat);
  chimney.position.set(2, 5.2, -1);
  chimney.castShadow = true;
  houseGroup.add(chimney);

  const smokePuffs = [];
  const smokeMat = new THREE.MeshLambertMaterial({ color: '#f8fafc', transparent: true, opacity: 0.65, flatShading: true });
  for (let i = 0; i < 4; i++) {
    const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 1), smokeMat);
    puff.position.set(2 + (Math.random() - 0.5) * 0.2, 6.3 + i * 0.6, -1 + (Math.random() - 0.5) * 0.2);
    puff.userData = { initialY: 6.3 + i * 0.6, speed: 0.8 + Math.random() * 0.4 };
    houseGroup.add(puff);
    smokePuffs.push(puff);
  }

  // Front Porch & Steps
  const porchMat = new THREE.MeshLambertMaterial({ color: '#f1f5f9', flatShading: true });
  const porch = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 2.2), porchMat);
  porch.position.set(0, 0.2, 3.8);
  porch.receiveShadow = true;
  houseGroup.add(porch);

  // Porch Pillars
  for (const px of [-1.5, 1.5]) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.8, 6), trimMat);
    pillar.position.set(px, 1.8, 4.6);
    pillar.castShadow = true;
    houseGroup.add(pillar);
  }

  // Porch Canopy
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.25, 2.4), roofMat);
  canopy.position.set(0, 3.2, 3.8);
  canopy.castShadow = true;
  houseGroup.add(canopy);

  // Doorway Interior Alcove
  const doorwayMat = new THREE.MeshLambertMaterial({ color: '#090d16', flatShading: true });
  const doorwayAlcove = new THREE.Mesh(new THREE.BoxGeometry(1.62, 2.62, 0.08), doorwayMat);
  doorwayAlcove.position.set(0, 1.7, 3.015);
  houseGroup.add(doorwayAlcove);

  // Doorway Trim Frame
  const doorFrameMat = new THREE.MeshLambertMaterial({ color: '#f8fafc', flatShading: true });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.14, 0.18), doorFrameMat);
  lintel.position.set(0, 3.05, 3.06);
  houseGroup.add(lintel);
  const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.7, 0.18), doorFrameMat);
  leftPost.position.set(-0.87, 1.7, 3.06);
  houseGroup.add(leftPost);
  const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.7, 0.18), doorFrameMat);
  rightPost.position.set(0.87, 1.7, 3.06);
  houseGroup.add(rightPost);

  // Warm light glowing from inside doorway
  const indoorWarmLight = new THREE.PointLight('#f59e0b', 1.2, 5);
  indoorWarmLight.position.set(0, 2.0, 3.1);
  houseGroup.add(indoorWarmLight);

  // Front Door with hinge pivot
  const doorHinge = new THREE.Group();
  doorHinge.position.set(-0.8, 0.4, 3.06);

  const doorMat = new THREE.MeshLambertMaterial({ color: '#7c2d12', flatShading: true });
  const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 0.08), doorMat);
  doorMesh.position.set(0.8, 1.3, 0);
  doorMesh.castShadow = true;
  doorHinge.add(doorMesh);

  const knobMat = new THREE.MeshLambertMaterial({ color: '#fbbf24' });
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), knobMat);
  knob.position.set(1.4, 1.3, 0.06);
  doorHinge.add(knob);
  houseGroup.add(doorHinge);

  // Windows with cozy glow
  const windowMat = new THREE.MeshLambertMaterial({ color: '#fef08a', emissive: '#facc15', emissiveIntensity: 0.6 });
  for (const wx of [-2.2, 2.2]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.1), windowMat);
    win.position.set(wx, 2.4, 3.02);
    houseGroup.add(win);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.14), trimMat);
    frame.position.set(wx, 2.4, 3.01);
    houseGroup.add(frame);
  }

  // Hanging 3D Nameplate Sign: "{name}'s Library"
  const userName = user?.name || 'Family';
  const signSprite = createTextSprite(`${userName}'s Library`, {
    fontSize: 38,
    bgColor: 'rgba(15, 23, 42, 0.95)',
    textColor: '#ffffff',
    borderColor: houseColor,
    worldHeight: 1.05
  });
  signSprite.position.set(0, 4.4, 3.8);
  houseGroup.add(signSprite);

  // Raycasting Click Target
  const hitGeo = new THREE.BoxGeometry(8, 7, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const houseHitBox = new THREE.Mesh(hitGeo, hitMat);
  houseHitBox.position.set(0, 3.5, 1);
  houseHitBox.userData = { isHouse: true, user, offsetX };
  houseGroup.add(houseHitBox);

  // Hover Highlight Ring
  const ringMat = new THREE.MeshBasicMaterial({ color: houseColor, transparent: true, opacity: 0, wireframe: true });
  const highlightRing = new THREE.Mesh(new THREE.RingGeometry(4.8, 5.2, 32), ringMat);
  highlightRing.rotation.x = -Math.PI / 2;
  highlightRing.position.set(0, 0.06, 0.5);
  houseGroup.add(highlightRing);

  // Resident Homeowner Character (Inside doorway, ready to greet visitors!)
  const residentChar = createCharacter(user);
  residentChar.root.position.set(0, 0.2, 1.8);
  residentChar.root.rotation.y = 0; // Facing south toward porch
  residentChar.root.visible = false;
  houseGroup.add(residentChar.root);

  return {
    group: houseGroup,
    hitbox: houseHitBox,
    doorHinge,
    highlightRing,
    smokePuffs,
    residentChar,
    offsetX,
    user,
    setHighlight: (highlight) => {
      highlightRing.material.opacity = highlight ? 0.9 : 0;
      wallMat.emissive = new THREE.Color(highlight ? houseColor : '#000000');
      wallMat.emissiveIntensity = highlight ? 0.3 : 0;
    }
  };
}

/**
 * Floating Speech Bubble displayed when a resident homeowner greets a visiting neighbor.
 */
export function showGreetingBubble(hostName, visitorName) {
  let bubble = document.getElementById('greeting-speech-bubble');
  if (!bubble) {
    bubble = document.createElement('div');
    bubble.id = 'greeting-speech-bubble';
    bubble.className = 'greeting-speech-bubble';
    const overlay = document.getElementById('ui-overlay');
    if (overlay) overlay.appendChild(bubble);
  }
  bubble.innerHTML = `
    <div class="greeting-bubble-avatar">👋</div>
    <div class="greeting-bubble-content">
      <span class="greeting-bubble-speaker">${hostName}</span>
      <span class="greeting-bubble-text">"Hi ${visitorName}! Welcome to my library, come on in! 📚"</span>
    </div>
  `;
  bubble.style.display = 'flex';
}

export function hideGreetingBubble() {
  const bubble = document.getElementById('greeting-speech-bubble');
  if (bubble) bubble.style.display = 'none';
}

/**
 * Creates the entire 3D Street scene environment with houses for all family members,
 * animated sedan car that drives to any house, scenery, and raycasting targets.
 */
export function createStreetScene(activeUser, familyUsers = []) {
  const group = new THREE.Group();

  // Ensure active user is the central house at x = 0
  const otherUsers = familyUsers.filter(u => u.id !== activeUser?.id);
  const allUsers = activeUser ? [activeUser, ...otherUsers] : (familyUsers.length ? familyUsers : [{ name: 'Ali', house_color: '#4f46e5' }]);

  const streetWidth = Math.max(120, (allUsers.length + 1) * 26);

  // 1. Terrain: Grass ground
  const grassMat = new THREE.MeshLambertMaterial({ color: '#4ade80', flatShading: true });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(streetWidth, 80, 20, 20), grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // 2. Road & Sidewalk
  const roadMat = new THREE.MeshLambertMaterial({ color: '#334155', flatShading: true });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(streetWidth, 7), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.02, 11);
  road.receiveShadow = true;
  group.add(road);

  // Road dashed lines
  const lineMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
  const halfW = streetWidth / 2 - 5;
  for (let x = -halfW; x <= halfW; x += 6) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.3), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0.03, 11);
    group.add(line);
  }

  // Sidewalk / Curb
  const curbMat = new THREE.MeshLambertMaterial({ color: '#94a3b8', flatShading: true });
  const curb = new THREE.Mesh(new THREE.BoxGeometry(streetWidth, 0.25, 2.5), curbMat);
  curb.position.set(0, 0.12, 6.5);
  curb.receiveShadow = true;
  group.add(curb);

  // 3. Multi-User Houses along the Street
  const houses = [];
  const allSmokePuffs = [];

  allUsers.forEach((u, idx) => {
    let offsetX = 0;
    if (idx > 0) {
      const sign = (idx % 2 === 1) ? 1 : -1;
      const step = Math.ceil(idx / 2);
      offsetX = sign * step * 24; // Spaced 24 units apart along the street
    }

    // Cobblestone walkway connecting porch to sidewalk
    const pathMat = new THREE.MeshLambertMaterial({ color: '#e2e8f0', flatShading: true });
    const path = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 6.5), pathMat);
    path.position.set(offsetX, 0.05, 2.5);
    path.receiveShadow = true;
    group.add(path);

    // Build the house
    const hData = createSingleHouse(u, offsetX);
    group.add(hData.group);
    houses.push(hData);
    allSmokePuffs.push(...hData.smokePuffs);

    // Lush garden bushes around each house
    const bushPositions = [
      { x: offsetX - 3.2, z: 3.8 },
      { x: offsetX + 3.2, z: 3.8 },
      { x: offsetX - 1.6, z: 5.4 },
      { x: offsetX + 1.6, z: 5.4 }
    ];
    for (const bPos of bushPositions) {
      const bushGroup = new THREE.Group();
      bushGroup.position.set(bPos.x, 0, bPos.z);
      group.add(bushGroup);
      loadCenteredGltfModel('/assets/models/bush.glb', { targetHeight: 1.25 }).then((model) => {
        if (model) bushGroup.add(model);
      });
    }
  });

  // 4. Street Scenery (Trees, Streetlamps, Park Benches, Hydrant)
  const trees = [];
  const treePositions = [
    { x: -45, z: 2, type: 'pine' },
    { x: -34, z: -5, type: 'oak' },
    { x: -14, z: 2, type: 'pine' },
    { x: 14, z: 2, type: 'oak' },
    { x: 34, z: -5, type: 'pine' },
    { x: 45, z: 2, type: 'pine' }
  ];
  for (const pos of treePositions) {
    const t = createTree(pos.type);
    t.position.set(pos.x, 0, pos.z);
    t.rotation.y = Math.random() * Math.PI;
    group.add(t);
    trees.push(t);
  }

  // Streetlamps along sidewalk
  for (const lx of [-36, -12, 12, 36]) {
    const lamp = new THREE.Group();
    lamp.position.set(lx, 0, 7.8);

    const pLight = new THREE.PointLight('#fef08a', 1.4, 14);
    pLight.position.set(0, 4.8, 0);
    pLight.castShadow = true;
    lamp.add(pLight);

    loadCenteredGltfModel('/assets/models/streetlight.glb', { targetHeight: 5.6 }).then((model) => {
      if (model) lamp.add(model);
    });

    group.add(lamp);
  }

  // Park Benches along sidewalk
  for (const bx of [-18, 18]) {
    const benchGroup = new THREE.Group();
    benchGroup.position.set(bx, 0.25, 6.4);
    benchGroup.rotation.y = Math.PI;
    group.add(benchGroup);

    loadCenteredGltfModel('/assets/models/bench.glb', { targetWidth: 2.2 }).then((model) => {
      if (model) benchGroup.add(model);
    });
  }

  // Red Fire Hydrant
  const hydrantGroup = new THREE.Group();
  hydrantGroup.position.set(8.5, 0.25, 7.2);
  group.add(hydrantGroup);
  loadCenteredGltfModel('/assets/models/hydrant.glb', { targetHeight: 0.95 }).then((model) => {
    if (model) hydrantGroup.add(model);
  });

  // 5. Interactive Sedan Car on the Road
  const carGroup = new THREE.Group();
  let currentCarHouseX = 0;
  carGroup.position.set(-5.5, 0.02, 11.2);
  carGroup.rotation.y = Math.PI / 2; // Parked parallel along curb facing right (+X)
  group.add(carGroup);

  // Front Headlights
  const headlightL = new THREE.SpotLight('#fef08a', 0, 18, Math.PI / 5, 0.3);
  headlightL.position.set(-0.55, 0.6, 2.1);
  headlightL.target.position.set(-0.55, 0.2, 8.0);
  carGroup.add(headlightL);
  carGroup.add(headlightL.target);

  const headlightR = new THREE.SpotLight('#fef08a', 0, 18, Math.PI / 5, 0.3);
  headlightR.position.set(0.55, 0.6, 2.1);
  headlightR.target.position.set(0.55, 0.2, 8.0);
  carGroup.add(headlightR);
  carGroup.add(headlightR.target);

  loadCenteredGltfModel('/assets/models/car.glb', { targetDepth: 4.8 }).then((model) => {
    if (model) carGroup.add(model);
  });

  // Walking Pedestrian Character for entering/exiting the car
  const driverChar = createCharacter(activeUser);
  driverChar.root.position.set(0, 0.2, 3.8);
  driverChar.root.visible = false;
  group.add(driverChar.root);

  // 5. Sky & Background Environment: Alpine Mountains, Radiant 3D Sun, Clouds, and Birds
  const mountains = createMountainRange(streetWidth);
  group.add(mountains);

  const sun = createSun();
  group.add(sun);

  const clouds = createClouds(streetWidth);
  group.add(clouds);

  const birdsData = createBirds();
  group.add(birdsData.group);

  let isDriving = false;
  let isCameraControlled = false;
  let isEntering = false;

  return {
    group,
    houses,
    carGroup,
    driverChar,
    mountains,
    sun,
    clouds,
    birds: birdsData.birds,
    trees,
    smokePuffs: allSmokePuffs,
    isDriving: () => isDriving,
    isCameraControlled: () => isCameraControlled,
    isEntering: () => isEntering,
    getCurrentCarHouseX: () => currentCarHouseX,

    /**
     * Drives the car from its current location to park curbside in front of targetUser's house.
     * Features aerial top-down camera following the car, lower relaxed speed, and steps out in front of the house!
     */
    driveCarToHouse: (targetUser, camera, onParked) => {
      if (isDriving || isEntering) return;
      isDriving = true;
      isCameraControlled = true;

      const targetHouse = houses.find(h => h.user.id === targetUser?.id) || houses[0];
      const targetHouseX = targetHouse.offsetX;
      const targetCarX = targetHouseX - 5.5;
      const currentCarX = carGroup.position.x;
      const dist = Math.abs(targetCarX - currentCarX);

      // If already parked in front of this house, smoothly frame the house and finish
      if (dist < 1.2) {
        if (camera) {
          new TWEEN.Tween({ x: camera.position.x, y: camera.position.y, z: camera.position.z }, true)
            .to({ x: targetHouseX, y: 10, z: 24 }, 750)
            .easing(TWEEN.Easing.Cubic.Out)
            .onUpdate((pos) => {
              camera.position.set(pos.x, pos.y, pos.z);
              camera.lookAt(targetHouseX, 2, 0);
            })
            .onComplete(() => {
              isDriving = false;
              isCameraControlled = false;
              if (onParked) onParked(targetUser);
            })
            .start();
        } else {
          isDriving = false;
          isCameraControlled = false;
          if (onParked) onParked(targetUser);
        }
        return;
      }

      const dir = targetCarX > currentCarX ? 1 : -1;

      // Phase 1: Character walks from current porch down to car (South toward +Z)
      driverChar.root.position.set(currentCarHouseX, 0.2, 3.8);
      driverChar.root.visible = true;
      driverChar.root.rotation.y = 0; // Facing south toward car (forward walking!)

      // Smoothly lift camera toward elevated overhead view
      if (camera) {
        new TWEEN.Tween({ x: camera.position.x, y: camera.position.y, z: camera.position.z, lookX: currentCarHouseX, lookY: 2, lookZ: 0 }, true)
          .to({ x: currentCarX, y: 19.0, z: 22.0, lookX: currentCarX, lookY: 1.0, lookZ: 10.5 }, 650)
          .easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate((c) => {
            camera.position.set(c.x, c.y, c.z);
            camera.lookAt(c.lookX, c.lookY, c.lookZ);
          })
          .start();
      }

      new TWEEN.Tween({ x: currentCarHouseX, z: 3.8 }, true)
        .to({ x: currentCarX, z: 9.6 }, 650)
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate((obj) => {
          driverChar.root.position.set(obj.x, 0.2, obj.z);
          driverChar.updateWalk(Date.now() * 0.008, 12);
        })
        .onComplete(() => {
          // Character enters car
          driverChar.root.visible = false;

          // Phase 2: Start car & turn on headlights
          carGroup.rotation.y = dir === 1 ? Math.PI / 2 : -Math.PI / 2;
          headlightL.intensity = 2.8;
          headlightR.intensity = 2.8;

          // Relaxed and smooth speed (as requested: less speed than before)
          const driveDuration = Math.max(4800, dist * 180);

          // Phase 3: Car accelerates, cruises down the avenue, and decelerates into target curb!
          new TWEEN.Tween({ x: currentCarX }, true)
            .to({ x: targetCarX }, driveDuration)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate((obj) => {
              carGroup.position.x = obj.x;
              // Subtle suspension travel bounce
              carGroup.position.y = 0.02 + Math.abs(Math.sin(Date.now() * 0.015)) * 0.035;

              // Camera looks from ABOVE following the car along the avenue!
              if (camera) {
                camera.position.set(obj.x, 19.0, 22.0);
                camera.lookAt(obj.x, 1.0, 10.5);
              }
            })
            .onComplete(() => {
              // Phase 4: Car stops at target house curb
              carGroup.position.y = 0.02;
              headlightL.intensity = 0;
              headlightR.intensity = 0;
              currentCarHouseX = targetHouseX;

              // Phase 5: Character steps out onto sidewalk and walks up toward front of house (North toward -Z)
              driverChar.root.position.set(targetCarX, 0.2, 9.6);
              driverChar.root.visible = true;
              driverChar.root.rotation.y = Math.PI; // Facing north toward house (forward walking!)

              // Camera smoothly descends from overhead view down to angled front view of house and car!
              if (camera) {
                new TWEEN.Tween({ x: targetCarX, y: 19.0, z: 22.0, lookY: 1.0, lookZ: 10.5 }, true)
                  .to({ x: targetHouseX, y: 10.0, z: 24.0, lookY: 2.0, lookZ: 0 }, 1200)
                  .easing(TWEEN.Easing.Cubic.Out)
                  .onUpdate((cam) => {
                    camera.position.set(cam.x, cam.y, cam.z);
                    camera.lookAt(targetHouseX, cam.lookY, cam.lookZ);
                  })
                  .onComplete(() => {
                    isCameraControlled = false;
                  })
                  .start();
              } else {
                isCameraControlled = false;
              }

              new TWEEN.Tween({ x: targetCarX, z: 9.6 }, true)
                .to({ x: targetHouseX, z: 4.6 }, 1100)
                .easing(TWEEN.Easing.Linear.None)
                .onUpdate((obj) => {
                  driverChar.root.position.set(obj.x, 0.2, obj.z);
                  driverChar.updateWalk(Date.now() * 0.008, 10);
                })
                .onComplete(() => {
                  // Turn character around to face forward / camera when standing outside!
                  driverChar.root.rotation.y = 0;
                  isDriving = false;
                  // Stop here in front of the house! Do NOT automatically enter.
                  if (onParked) onParked(targetUser);
                })
                .start();
            })
            .start();
        })
        .start();
    },

    /**
     * Enters the target house when clicked by the user!
     * When visiting a neighbor's house, the resident homeowner comes to the door to greet us,
     * waves hello with a speech bubble, and welcomes us inside!
     */
    enterTargetHouse: (targetUser, activeVisitorUser, camera, onEntered) => {
      if (isDriving || isEntering) return;
      isEntering = true;
      isCameraControlled = true;

      const targetHouse = houses.find(h => h.user.id === targetUser?.id) || houses[0];
      const targetHouseX = targetHouse.offsetX;
      const isVisitingOther = (targetUser?.id !== activeVisitorUser?.id);

      // 1. Front door swings open
      new TWEEN.Tween({ angle: 0 }, true)
        .to({ angle: -Math.PI * 0.45 }, 500)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate((obj) => {
          if (targetHouse.doorHinge) targetHouse.doorHinge.rotation.y = obj.angle;
        })
        .start();

      if (isVisitingOther && targetHouse.residentChar) {
        // === GREETING SEQUENCE ===
        // Resident homeowner steps out through the doorway onto the front porch!
        const resident = targetHouse.residentChar;
        resident.root.position.set(0, 0.2, 1.8);
        resident.root.rotation.y = 0; // Facing south toward visitor
        resident.root.visible = true;

        // Visitor character turns towards door
        driverChar.root.rotation.y = Math.PI; // Facing north toward door

        // Resident steps out onto porch (1.8 -> 3.6)
        new TWEEN.Tween({ z: 1.8 }, true)
          .to({ z: 3.6 }, 500)
          .easing(TWEEN.Easing.Cubic.Out)
          .onUpdate((obj) => {
            resident.root.position.z = obj.z;
            resident.updateWalk(Date.now() * 0.008, 10);
          })
          .onComplete(() => {
            // Resident waves hello enthusiastically!
            let waveTimer = 0;
            const waveInterval = setInterval(() => {
              waveTimer += 0.05;
              resident.updateWave(waveTimer);
              driverChar.updateWave(waveTimer);
            }, 30);

            // Show friendly greeting speech bubble UI
            const visitorName = activeVisitorUser?.name || 'Friend';
            showGreetingBubble(targetUser.name, visitorName);

            // After 1800ms of warm greeting, resident welcomes visitor inside!
            setTimeout(() => {
              clearInterval(waveInterval);
              hideGreetingBubble();

              // Resident turns around and walks back inside (facing North)
              resident.root.rotation.y = Math.PI;
              new TWEEN.Tween({ z: 3.6 }, true)
                .to({ z: 1.2 }, 600)
                .easing(TWEEN.Easing.Linear.None)
                .onUpdate((obj) => {
                  resident.root.position.z = obj.z;
                  resident.updateWalk(Date.now() * 0.008, 10);
                })
                .onComplete(() => {
                  resident.root.visible = false;
                })
                .start();

              // Visitor character follows them inside (facing North, walking forward!)
              driverChar.root.rotation.y = Math.PI;
              new TWEEN.Tween({ z: 4.6 }, true)
                .to({ z: 1.8 }, 750)
                .easing(TWEEN.Easing.Linear.None)
                .onUpdate((obj) => {
                  driverChar.root.position.set(targetHouseX, 0.2, obj.z);
                  driverChar.updateWalk(Date.now() * 0.008, 12);
                })
                .onComplete(() => {
                  driverChar.root.visible = false;
                  setTimeout(() => {
                    isEntering = false;
                    isCameraControlled = false;
                    if (onEntered) onEntered(targetUser);
                  }, 200);
                })
                .start();

              // Camera gently pushes in toward the doorway
              if (camera) {
                new TWEEN.Tween({ x: camera.position.x, y: camera.position.y, z: camera.position.z }, true)
                  .to({ x: targetHouseX, y: 5.5, z: 12.0 }, 750)
                  .easing(TWEEN.Easing.Cubic.InOut)
                  .onUpdate((c) => {
                    camera.position.set(c.x, c.y, c.z);
                    camera.lookAt(targetHouseX, 2.0, 2.5);
                  })
                  .start();
              }
            }, 1800);
          })
          .start();
      } else {
        // Entering own house: Visitor turns to face door (North) and walks forward inside
        driverChar.root.position.set(targetHouseX, 0.2, 4.6);
        driverChar.root.visible = true;
        driverChar.root.rotation.y = Math.PI; // Facing north toward doorway (forward walking!)

        // Camera gently pushes in toward the door
        if (camera) {
          new TWEEN.Tween({ x: camera.position.x, y: camera.position.y, z: camera.position.z }, true)
            .to({ x: targetHouseX, y: 5.5, z: 12.0 }, 750)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate((c) => {
              camera.position.set(c.x, c.y, c.z);
              camera.lookAt(targetHouseX, 2.0, 2.5);
            })
            .start();
        }

        new TWEEN.Tween({ z: 4.6 }, true)
          .to({ z: 1.8 }, 750)
          .easing(TWEEN.Easing.Linear.None)
          .onUpdate((obj) => {
            driverChar.root.position.set(targetHouseX, 0.2, obj.z);
            driverChar.updateWalk(Date.now() * 0.008, 12);
          })
          .onComplete(() => {
            driverChar.root.visible = false;
            setTimeout(() => {
              isEntering = false;
              isCameraControlled = false;
              if (onEntered) onEntered(targetUser);
            }, 200);
          })
          .start();
      }
    }
  };
}

/**
 * Creates the cute low-poly character model with bone/joint hierarchy for idle & wave animations.
 */
export function createCharacter(user) {
  const root = new THREE.Group();
  const gender = user?.gender || 'm';

  // Materials
  const skinMat = new THREE.MeshLambertMaterial({ color: '#fed7aa', flatShading: true }); // Warm peach skin
  const shirtColor = user?.house_color || '#4f46e5';
  const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor, flatShading: true });
  const pantsMat = new THREE.MeshLambertMaterial({ color: '#1e293b', flatShading: true });
  const hairMat = new THREE.MeshLambertMaterial({ color: gender === 'f' ? '#7c2d12' : '#334155', flatShading: true });
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#0f172a' });

  // Body / Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.75, 0.4), shirtMat);
  torso.position.y = 1.1;
  torso.castShadow = true;
  root.add(torso);

  // Unified Head Group (Parent for skull, hair, eyes, blush, and name sprite)
  const head = new THREE.Group();
  head.position.set(0, 1.75, 0); // Neck pivot

  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.5), skinMat);
  headMesh.position.set(0, 0, 0);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Complete, Fitted 3D Haircut
  if (gender === 'f') {
    // Cute bob hair
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.24, 0.58), hairMat);
    hairTop.position.set(0, 0.22, 0);
    head.add(hairTop);

    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.48, 0.18), hairMat);
    hairBack.position.set(0, -0.02, -0.22);
    head.add(hairBack);

    for (const sx of [-0.26, 0.26]) {
      const hairSide = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.46, 0.42), hairMat);
      hairSide.position.set(sx, -0.02, 0);
      head.add(hairSide);
    }

    const hairFringe = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.12, 0.10), hairMat);
    hairFringe.position.set(0, 0.20, 0.22);
    head.add(hairFringe);
  } else {
    // Short stylish haircut (seamlessly envelopes the skull)
    const hairCrown = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.24, 0.56), hairMat);
    hairCrown.position.set(0, 0.20, -0.01);
    head.add(hairCrown);

    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.36, 0.14), hairMat);
    hairBack.position.set(0, 0.06, -0.23);
    head.add(hairBack);

    for (const sx of [-0.25, 0.25]) {
      const hairTemple = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.32, 0.44), hairMat);
      hairTemple.position.set(sx, 0.08, -0.04);
      head.add(hairTemple);
    }

    const hairBangs = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.14, 0.10), hairMat);
    hairBangs.position.set(0, 0.20, 0.23);
    head.add(hairBangs);
  }

  // Expressive Eyes: White Sclera + Dark Iris + Specular Sparkle Highlight!
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const pupilMat = new THREE.MeshBasicMaterial({ color: '#0f172a' });
  const shineMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });

  for (const ex of [-0.14, 0.14]) {
    // Sclera
    const eyeWhite = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.02), eyeWhiteMat);
    eyeWhite.position.set(ex, 0.03, 0.26);
    head.add(eyeWhite);

    // Pupil
    const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), pupilMat);
    pupil.position.set(ex, 0.03, 0.272);
    head.add(pupil);

    // Cute specular highlight dot
    const shine = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.02), shineMat);
    shine.position.set(ex + 0.022, 0.052, 0.282);
    head.add(shine);

    // Eyebrow
    const eyebrow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.02), hairMat);
    eyebrow.position.set(ex, 0.13, 0.262);
    head.add(eyebrow);
  }

  // Cute warm smiling mouth
  const mouthMat = new THREE.MeshBasicMaterial({ color: '#881337' });
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.02), mouthMat);
  mouth.position.set(0, -0.12, 0.26);
  head.add(mouth);

  // Rosy Cheeks
  const blushMat = new THREE.MeshBasicMaterial({ color: '#fb7185' });
  for (const bx of [-0.2, 0.2]) {
    const blush = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.05, 0.02), blushMat);
    blush.position.set(bx, -0.06, 0.26);
    head.add(blush);
  }

  // Homeowner Floating Name Tag Sprite (Attached to head so it moves together)
  const userName = user?.name || 'Ali';
  const nameSprite = createTextSprite(`👤 ${userName}`, {
    fontSize: 28,
    bgColor: 'rgba(15, 23, 42, 0.90)',
    textColor: '#f8fafc',
    borderColor: shirtColor,
    worldHeight: 0.38
  });
  nameSprite.position.set(0, 0.65, 0);
  head.add(nameSprite);

  root.add(head);

  // Left Arm (Articulated shoulder + forearm + hand for holding book)
  const leftShoulder = new THREE.Group();
  leftShoulder.position.set(-0.44, 1.35, 0); // Shoulder joint pivot

  const leftUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.18), shirtMat);
  leftUpperArm.position.set(-0.06, -0.2, 0);
  leftUpperArm.castShadow = true;
  leftShoulder.add(leftUpperArm);

  const leftForearmGroup = new THREE.Group();
  leftForearmGroup.position.set(-0.06, -0.4, 0); // Elbow joint pivot

  const leftForearm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.38, 0.16), skinMat);
  leftForearm.position.set(0, -0.16, 0);
  leftForearm.castShadow = true;
  leftForearmGroup.add(leftForearm);

  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.14), skinMat);
  leftHand.position.set(0, -0.34, 0);
  leftForearmGroup.add(leftHand);

  leftShoulder.add(leftForearmGroup);
  root.add(leftShoulder);
  const leftArmGroup = leftShoulder; // Backward compatibility alias

  // Right Arm (Articulated shoulder + forearm + hand for waving & holding book)
  const rightShoulder = new THREE.Group();
  rightShoulder.position.set(0.44, 1.35, 0); // Shoulder joint pivot

  const rightUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.18), shirtMat);
  rightUpperArm.position.set(0.06, -0.2, 0);
  rightUpperArm.castShadow = true;
  rightShoulder.add(rightUpperArm);

  const rightForearmGroup = new THREE.Group();
  rightForearmGroup.position.set(0.06, -0.4, 0); // Elbow joint pivot

  const rightForearm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.38, 0.16), skinMat);
  rightForearm.position.set(0, -0.16, 0);
  rightForearm.castShadow = true;
  rightForearmGroup.add(rightForearm);

  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.14), skinMat);
  rightHand.position.set(0, -0.34, 0);
  rightForearmGroup.add(rightHand);

  rightShoulder.add(rightForearmGroup);
  root.add(rightShoulder);

  // Legs with Hip Joint Pivots for Walking Animation
  const leftHip = new THREE.Group();
  leftHip.position.set(-0.18, 0.75, 0); // Left hip joint
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.26), pantsMat);
  leftLeg.position.set(0, -0.36, 0);
  leftLeg.castShadow = true;
  leftHip.add(leftLeg);
  root.add(leftHip);

  const rightHip = new THREE.Group();
  rightHip.position.set(0.18, 0.75, 0); // Right hip joint
  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.26), pantsMat);
  rightLeg.position.set(0, -0.36, 0);
  rightLeg.castShadow = true;
  rightHip.add(rightLeg);
  root.add(rightHip);

  // Interactive 3D Book in Character's Hands (Symmetrically held with both hands, opens upward with radiant face glow!)
  const heldBook = new THREE.Group();
  heldBook.position.set(0, 1.14, 0.42);
  heldBook.rotation.x = -0.52; // Tilted ~30° upward so open pages face directly toward reader's face and camera
  heldBook.visible = false;

  const bookLeatherMat = new THREE.MeshLambertMaterial({ color: '#991b1b', flatShading: true }); // Antique red leather
  const bookPagesMat = new THREE.MeshLambertMaterial({ color: '#fef3c7', flatShading: true }); // Cream pages
  const goldTrimMat = new THREE.MeshLambertMaterial({ color: '#f59e0b', flatShading: true });
  const textLineMat = new THREE.MeshBasicMaterial({ color: '#b45309', transparent: true, opacity: 0.35 });

  // Center Spine
  const spineMesh = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.44, 0.04), bookLeatherMat);
  spineMesh.position.set(0, 0, -0.015);
  heldBook.add(spineMesh);

  // Gold spine rib bands
  for (const sy of [-0.14, 0, 0.14]) {
    const spineRib = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.02, 0.044), goldTrimMat);
    spineRib.position.set(0, sy, -0.015);
    heldBook.add(spineRib);
  }

  // Left Cover & Left Pages Hinge (Opens to left, supported by left hand)
  const leftHinge = new THREE.Group();
  leftHinge.position.set(-0.022, 0, 0);

  const leftCover = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.44, 0.02), bookLeatherMat);
  leftCover.position.set(-0.14, 0, -0.01);
  leftCover.castShadow = true;
  leftHinge.add(leftCover);

  const leftPages = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.40, 0.035), bookPagesMat);
  leftPages.position.set(-0.13, 0, 0.018);
  leftHinge.add(leftPages);

  // Embossed text lines on left page
  for (let ly = -0.13; ly <= 0.13; ly += 0.038) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.008, 0.002), textLineMat);
    line.position.set(-0.13, ly, 0.037);
    leftHinge.add(line);
  }

  heldBook.add(leftHinge);

  // Right Cover & Right Pages Hinge (Opens to right, supported by right hand)
  const rightHinge = new THREE.Group();
  rightHinge.position.set(0.022, 0, 0);

  const rightCover = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.44, 0.02), bookLeatherMat);
  rightCover.position.set(0.14, 0, -0.01);
  rightCover.castShadow = true;
  rightHinge.add(rightCover);

  const rightPages = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.40, 0.035), bookPagesMat);
  rightPages.position.set(0.13, 0, 0.018);
  rightHinge.add(rightPages);

  // Embossed text lines on right page
  for (let ry = -0.13; ry <= 0.13; ry += 0.038) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.008, 0.002), textLineMat);
    line.position.set(0.13, ry, 0.037);
    rightHinge.add(line);
  }

  heldBook.add(rightHinge);

  // Radiant Golden Reading Light that illuminates character's face from the open pages!
  const pagesGlow = new THREE.PointLight('#fef08a', 0, 3.8, 1.2);
  pagesGlow.position.set(0, 0.12, 0.18); // Placed above pages, shining directly up onto face
  heldBook.add(pagesGlow);

  root.add(heldBook);

  root.scale.set(1.2, 1.2, 1.2);

  let isHoldingBook = false;

  return {
    root,
    head,
    torso,
    leftArmGroup: leftShoulder,
    leftShoulder,
    leftForearmGroup,
    rightShoulder,
    rightForearmGroup,
    leftHip,
    rightHip,
    heldBook,
    leftHinge,
    rightHinge,
    pagesGlow,
    // Idle breathing & blinking animation
    updateIdle: (time) => {
      if (isHoldingBook) {
        // Subtle breathing while looking down warmly into open book
        torso.position.y = 1.1 + Math.sin(time * 2) * 0.015;
        head.rotation.x = 0.24; // Gazing down into glowing book
        head.position.y = 1.72 + Math.sin(time * 2) * 0.015;
        return;
      }
      torso.position.y = 1.1 + Math.sin(time * 2) * 0.02;
      head.position.y = 1.75 + Math.sin(time * 2) * 0.025;
      head.rotation.set(0, 0, Math.sin(time * 1.2) * 0.03);
      leftShoulder.rotation.set(0, 0, -Math.sin(time * 1.5) * 0.04);
      leftForearmGroup.rotation.set(0, 0, 0);
      rightShoulder.rotation.set(0, 0, Math.sin(time * 1.5) * 0.04);
      rightForearmGroup.rotation.set(0, 0, 0);
      leftHip.rotation.set(0, 0, 0);
      rightHip.rotation.set(0, 0, 0);
    },
    // Realistic walk cycle with leg stride and arm swinging
    updateWalk: (time, speed = 10) => {
      const cycle = time * speed;
      // Leg stride
      leftHip.rotation.x = Math.sin(cycle) * 0.45;
      rightHip.rotation.x = -Math.sin(cycle) * 0.45;
      // Natural counter-swinging arms
      leftShoulder.rotation.x = -Math.sin(cycle) * 0.35;
      leftShoulder.rotation.y = 0;
      leftShoulder.rotation.z = 0;
      leftForearmGroup.rotation.set(0, 0, 0);
      rightShoulder.rotation.x = Math.sin(cycle) * 0.35;
      rightShoulder.rotation.y = 0;
      rightShoulder.rotation.z = 0;
      rightForearmGroup.rotation.set(0, 0, 0);
      // Cheerful walking torso bob
      torso.position.y = 1.1 + Math.abs(Math.sin(cycle)) * 0.07;
      head.position.y = 1.75 + Math.abs(Math.sin(cycle)) * 0.07;
      head.rotation.set(0, 0, Math.sin(cycle * 0.5) * 0.05);
    },
    // Waving hello greeting animation
    updateWave: (time) => {
      rightShoulder.rotation.z = Math.PI * 0.75;
      rightShoulder.rotation.x = -0.2;
      rightForearmGroup.rotation.z = Math.sin(time * 8) * 0.45 + 0.3;
      torso.position.y = 1.1 + Math.abs(Math.sin(time * 4)) * 0.12;
      head.position.y = 1.75 + Math.abs(Math.sin(time * 4)) * 0.12;
      head.rotation.z = Math.sin(time * 4) * 0.08;
    },
    // Choreographed animation: reach for shelf book, slide book out, turn to face camera, open realistically like a human!
    reachForBookAndOpen: (shelfHitbox = null, onOpened = null, camDirectionAngle = 0) => {
      isHoldingBook = true;
      // Initial closed book state
      leftHinge.rotation.y = Math.PI * 0.46;
      rightHinge.rotation.y = -Math.PI * 0.46;
      pagesGlow.intensity = 0;

      // Phase 1: Extend right arm forward and up towards the shelf book row (360ms)
      new TWEEN.Tween({
        sX: rightShoulder.rotation.x,
        sZ: rightShoulder.rotation.z,
        eX: rightForearmGroup.rotation.x,
        tX: torso.rotation.x
      }, true)
        .to({
          sX: -Math.PI * 0.44,
          sZ: -0.15,
          eX: -0.15,
          tX: 0.08
        }, 360)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate((obj) => {
          rightShoulder.rotation.x = obj.sX;
          rightShoulder.rotation.z = obj.sZ;
          rightForearmGroup.rotation.x = obj.eX;
          torso.rotation.x = obj.tX;
        })
        .onComplete(() => {
          // Phase 2: Grab book, draw arm back to chest, gather with BOTH hands holding left and right sides! (320ms)
          heldBook.visible = true;
          new TWEEN.Tween({
            rSX: rightShoulder.rotation.x,
            rSY: rightShoulder.rotation.y,
            rSZ: rightShoulder.rotation.z,
            rEX: rightForearmGroup.rotation.x,
            rEZ: rightForearmGroup.rotation.z,
            lSX: leftShoulder.rotation.x,
            lSY: leftShoulder.rotation.y,
            lSZ: leftShoulder.rotation.z,
            lEX: leftForearmGroup.rotation.x,
            lEZ: leftForearmGroup.rotation.z,
            tX: torso.rotation.x
          }, true)
            .to({
              rSX: -0.55,
              rSY: -0.90,
              rSZ: 0.35,
              rEX: -1.50,
              rEZ: -0.50,
              lSX: -0.55,
              lSY: 0.90,
              lSZ: -0.35,
              lEX: -1.50,
              lEZ: 0.50,
              tX: 0
            }, 320)
            .easing(TWEEN.Easing.Cubic.Out)
            .onUpdate((obj) => {
              rightShoulder.rotation.set(obj.rSX, obj.rSY, obj.rSZ);
              rightForearmGroup.rotation.set(obj.rEX, 0, obj.rEZ);
              leftShoulder.rotation.set(obj.lSX, obj.lSY, obj.lSZ);
              leftForearmGroup.rotation.set(obj.lEX, 0, obj.lEZ);
              torso.rotation.x = obj.tX;
            })
            .onComplete(() => {
              // Phase 3: TURN TO FACE THE CAMERA so user can see his face and holding the book! (380ms)
              new TWEEN.Tween({ angle: root.rotation.y }, true)
                .to({ angle: camDirectionAngle }, 380)
                .easing(TWEEN.Easing.Cubic.InOut)
                .onUpdate((obj) => {
                  root.rotation.y = obj.angle;
                })
                .onComplete(() => {
                  // Phase 4: Symmetrically open both sides of book (left side on left hand, right side on right hand)
                  // and illuminate character's face with golden reading glow! (480ms)
                  new TWEEN.Tween({
                    leftAngle: Math.PI * 0.46,
                    rightAngle: -Math.PI * 0.46,
                    glow: 0,
                    headX: 0
                  }, true)
                    .to({
                      leftAngle: -Math.PI * 0.18,
                      rightAngle: Math.PI * 0.18,
                      glow: 2.6,
                      headX: 0.24
                    }, 480)
                    .easing(TWEEN.Easing.Cubic.Out)
                    .onUpdate((obj) => {
                      leftHinge.rotation.y = obj.leftAngle;
                      rightHinge.rotation.y = obj.rightAngle;
                      pagesGlow.intensity = obj.glow;
                      head.rotation.x = obj.headX; // Warmly gazing down into the glowing book while face is toward camera
                    })
                    .onComplete(() => {
                      if (onOpened) onOpened();
                    })
                    .start();
                })
                .start();
            })
            .start();
        })
        .start();
    },

    // Close book, turn back toward shelf, reach out to place book back, and return hands to sides
    closeBookAndReturn: (shelfHitbox = null, onClosed = null, shelfFaceAngle = null) => {
      if (!isHoldingBook) {
        if (onClosed) onClosed();
        return;
      }

      // Phase 1: Fold book closed symmetrically and extinguish glow while facing camera (280ms)
      new TWEEN.Tween({
        leftAngle: leftHinge.rotation.y,
        rightAngle: rightHinge.rotation.y,
        glow: pagesGlow.intensity,
        headX: head.rotation.x
      }, true)
        .to({
          leftAngle: Math.PI * 0.46,
          rightAngle: -Math.PI * 0.46,
          glow: 0,
          headX: 0
        }, 280)
        .easing(TWEEN.Easing.Cubic.In)
        .onUpdate((obj) => {
          leftHinge.rotation.y = obj.leftAngle;
          rightHinge.rotation.y = obj.rightAngle;
          pagesGlow.intensity = obj.glow;
          head.rotation.x = obj.headX;
        })
        .onComplete(() => {
          // Phase 2: Turn body back towards the shelf to return book (340ms)
          const targetAngle = shelfFaceAngle !== null ? shelfFaceAngle : root.rotation.y + Math.PI;
          new TWEEN.Tween({ angle: root.rotation.y }, true)
            .to({ angle: targetAngle }, 340)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onUpdate((obj) => {
              root.rotation.y = obj.angle;
            })
            .onComplete(() => {
              // Phase 3: Slide book back onto shelf row with right hand (280ms)
              new TWEEN.Tween({
                rSX: rightShoulder.rotation.x,
                rSZ: rightShoulder.rotation.z,
                rEX: rightForearmGroup.rotation.x,
                lSX: leftShoulder.rotation.x,
                lSZ: leftShoulder.rotation.z,
                lEX: leftForearmGroup.rotation.x
              }, true)
                .to({
                  rSX: -Math.PI * 0.44,
                  rSZ: -0.15,
                  rEX: -0.15,
                  lSX: 0,
                  lSZ: 0,
                  lEX: 0
                }, 280)
                .easing(TWEEN.Easing.Cubic.Out)
                .onUpdate((obj) => {
                  rightShoulder.rotation.set(obj.rSX, 0, obj.rSZ);
                  rightForearmGroup.rotation.set(obj.rEX, 0, 0);
                  leftShoulder.rotation.set(obj.lSX, 0, obj.lSZ);
                  leftForearmGroup.rotation.set(obj.lEX, 0, 0);
                })
                .onComplete(() => {
                  heldBook.visible = false;
                  isHoldingBook = false;

                  // Phase 4: Lower arm to idle side (220ms)
                  new TWEEN.Tween({
                    rSX: rightShoulder.rotation.x,
                    rSZ: rightShoulder.rotation.z,
                    rEX: rightForearmGroup.rotation.x
                  }, true)
                    .to({ rSX: 0, rSZ: 0, rEX: 0 }, 220)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .onUpdate((obj) => {
                      rightShoulder.rotation.set(obj.rSX, 0, obj.rSZ);
                      rightForearmGroup.rotation.x = obj.rEX;
                    })
                    .onComplete(() => {
                      if (onClosed) onClosed();
                    })
                    .start();
                })
                .start();
            })
            .start();
        })
        .start();
    },

    openBook(onOpened = null) {
      this.reachForBookAndOpen(null, onOpened);
    },

    closeBook(onClosed = null) {
      this.closeBookAndReturn(null, onClosed);
    },
    reset: () => {
      isHoldingBook = false;
      heldBook.visible = false;
      root.position.set(0, 0, 0);
      root.rotation.set(0, 0, 0);
      leftHip.rotation.set(0, 0, 0);
      rightHip.rotation.set(0, 0, 0);
      leftShoulder.rotation.set(0, 0, 0);
      leftForearmGroup.rotation.set(0, 0, 0);
      rightShoulder.rotation.set(0, 0, 0);
      rightForearmGroup.rotation.set(0, 0, 0);
      head.rotation.set(0, 0, 0);
    }
  };
}

/**
 * Creates the cozy library room with 4 categorized bookshelves in the middle,
 * cutaway walls for top-down ceiling viewing, resident homeowner character, central reading area.
 */
export function createInsideRoomScene(shelves = [], user = null) {
  const group = new THREE.Group();
  const shelfPickers = [];

  // 1. Room Shell (Cutaway Walls for Top-Down Ceiling Camera View, No Ceiling mesh)
  // Wooden plank floor (Rich polished parquet walnut)
  const floorMat = new THREE.MeshLambertMaterial({ color: '#653314', flatShading: true });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Floor border baseboards
  const baseboardMat = new THREE.MeshLambertMaterial({ color: '#f8fafc', flatShading: true });
  const baseboards = new THREE.Mesh(new THREE.BoxGeometry(16.1, 0.3, 16.1), baseboardMat);
  baseboards.position.y = 0.15;
  group.add(baseboards);

  // Cutaway walls (Height: 3.2 - perfectly unobstructed from top-down ceiling camera)
  const wallMat = new THREE.MeshLambertMaterial({ color: '#1e293b', flatShading: true }); // Cozy navy slate
  const moldingMat = new THREE.MeshLambertMaterial({ color: '#f1f5f9', flatShading: true }); // Crown molding

  // Back Wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(16, 3.2, 0.4), wallMat);
  backWall.position.set(0, 1.6, -8);
  backWall.receiveShadow = true;
  group.add(backWall);

  const backMolding = new THREE.Mesh(new THREE.BoxGeometry(16.2, 0.2, 0.5), moldingMat);
  backMolding.position.set(0, 3.2, -8);
  group.add(backMolding);

  // Left Wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 16), wallMat);
  leftWall.position.set(-8, 1.6, 0);
  leftWall.receiveShadow = true;
  group.add(leftWall);

  const leftMolding = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 16.2), moldingMat);
  leftMolding.position.set(-8, 3.2, 0);
  group.add(leftMolding);

  // Right Wall
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 16), wallMat);
  rightWall.position.set(8, 1.6, 0);
  rightWall.receiveShadow = true;
  group.add(rightWall);

  const rightMolding = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 16.2), moldingMat);
  rightMolding.position.set(8, 3.2, 0);
  group.add(rightMolding);

  // Wall Art / Framed paintings on the back wall (spaced between wall shelves)
  const frameMat = new THREE.MeshLambertMaterial({ color: '#d97706', flatShading: true });
  const canvasMat = new THREE.MeshLambertMaterial({ color: '#0284c7', flatShading: true });
  for (const px of [-2.3, 2.3]) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.08), frameMat);
    frame.position.set(px, 2.3, -7.76);
    group.add(frame);
    const canvas = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 0.09), canvasMat);
    canvas.position.set(px, 2.3, -7.75);
    group.add(canvas);
  }

  // Soft Ambient Overhead Illumination
  const roomLight = new THREE.PointLight('#fef3c7', 1.8, 26);
  roomLight.position.set(0, 9.5, 0);
  roomLight.castShadow = true;
  roomLight.shadow.bias = -0.002;
  group.add(roomLight);

  // Secondary warm fill light for shelves
  const shelfFillLight = new THREE.PointLight('#fed7aa', 1.2, 18);
  shelfFillLight.position.set(0, 4.5, 2.0);
  group.add(shelfFillLight);

  // 2. Central Study Area: Ornate Round Rug, Reading Desk with Lamp, Velvet Armchair
  const rugMat = new THREE.MeshLambertMaterial({ color: '#312e81', flatShading: true }); // Royal indigo
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 0.03, 36), rugMat);
  rug.position.set(0, 0.015, 0);
  rug.receiveShadow = true;
  group.add(rug);

  // Gold ornamental border ring
  const rugRingMat = new THREE.MeshLambertMaterial({ color: '#f59e0b', flatShading: true });
  const rugRing = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.7, 36), rugRingMat);
  rugRing.rotation.x = -Math.PI / 2;
  rugRing.position.set(0, 0.025, 0);
  group.add(rugRing);

  // Central Reading Desk with Poly.pizza 3D model integration
  const desk = new THREE.Group();
  desk.position.set(0, 0, 0);

  const deskMat = new THREE.MeshLambertMaterial({ color: '#451a03', flatShading: true });
  const deskTop = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.12, 24), deskMat);
  deskTop.position.y = 1.0;
  deskTop.castShadow = true;
  desk.add(deskTop);

  const deskPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, 0.95, 16), deskMat);
  deskPedestal.position.y = 0.48;
  deskPedestal.castShadow = true;
  desk.add(deskPedestal);

  // Desk Reading Lamp with Warm Glow
  const brassMat = new THREE.MeshLambertMaterial({ color: '#fbbf24', flatShading: true });
  const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.5, 8), brassMat);
  lampStem.position.set(0.35, 1.28, 0.2);
  desk.add(lampStem);

  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.22, 12, 1, true), brassMat);
  lampShade.position.set(0.35, 1.52, 0.2);
  desk.add(lampShade);

  const lampLight = new THREE.PointLight('#fef08a', 1.1, 5.0);
  lampLight.position.set(0.35, 1.45, 0.2);
  desk.add(lampLight);

  // Open book on desk
  const bookPaperMat = new THREE.MeshLambertMaterial({ color: '#fef3c7', flatShading: true });
  const openBookL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.4), bookPaperMat);
  openBookL.position.set(-0.25, 1.06, -0.1);
  openBookL.rotation.y = 0.1;
  desk.add(openBookL);
  const openBookR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.4), bookPaperMat);
  openBookR.position.set(0.02, 1.06, -0.1);
  openBookR.rotation.y = -0.1;
  desk.add(openBookR);

  // Load Poly.pizza 3D Table & Lamp & Books with auto-centering
  loadCenteredGltfModel('/assets/models/table.glb', { targetHeight: 1.05 }).then((tableModel) => {
    if (tableModel) {
      desk.add(tableModel);
      deskTop.visible = false;
      deskPedestal.visible = false;
    }
  });

  loadCenteredGltfModel('/assets/models/lamp.glb', { targetHeight: 0.72 }).then((lampModel) => {
    if (lampModel) {
      lampModel.position.set(0.38, 1.05, 0.2);
      desk.add(lampModel);
      lampStem.visible = false;
      lampShade.visible = false;
    }
  });

  loadCenteredGltfModel('/assets/models/books.glb', { targetWidth: 0.65 }).then((booksModel) => {
    if (booksModel) {
      booksModel.position.set(-0.32, 1.05, -0.08);
      booksModel.rotation.y = 0.25;
      desk.add(booksModel);
      openBookL.visible = false;
      openBookR.visible = false;
    }
  });

  group.add(desk);

  // Cozy Velvet Armchair (Behind the desk)
  const chairMat = new THREE.MeshLambertMaterial({ color: '#991b1b', flatShading: true });
  const chair = new THREE.Group();
  chair.position.set(0, 0, -1.35);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.1), chairMat);
  seat.position.y = 0.45;
  chair.add(seat);
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 0.3), chairMat);
  backrest.position.set(0, 1.05, -0.45);
  chair.add(backrest);
  for (const ax of [-0.65, 0.65]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.6, 1.1), chairMat);
    arm.position.set(ax, 0.7, 0);
    chair.add(arm);
  }

  // Load Poly.pizza 3D Lounge Chair
  loadCenteredGltfModel('/assets/models/chair.glb', { targetHeight: 1.35 }).then((chairModel) => {
    if (chairModel) {
      chair.add(chairModel);
      seat.visible = false;
      backrest.visible = false;
    }
  });

  chair.castShadow = true;
  group.add(chair);

  // Load Poly.pizza 3D Round Rug
  loadCenteredGltfModel('/assets/models/rug.glb', { targetWidth: 6.8 }).then((rugModel) => {
    if (rugModel) {
      rugModel.position.set(0, 0.02, 0);
      group.add(rugModel);
      rug.visible = false;
      rugRing.visible = false;
    }
  });

  // Potted indoor plants in all 4 corners
  const plantPositions = [
    { x: -6.6, z: -6.6 },
    { x: 6.6, z: -6.6 },
    { x: -6.6, z: 5.4 },
    { x: 6.6, z: 5.4 }
  ];
  for (const pos of plantPositions) {
    const plantGroup = new THREE.Group();
    plantGroup.position.set(pos.x, 0, pos.z);

    const potMat = new THREE.MeshLambertMaterial({ color: '#e2e8f0', flatShading: true });
    const pMat = new THREE.MeshLambertMaterial({ color: '#15803d', flatShading: true });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.38, 0.85, 12), potMat);
    pot.position.y = 0.42;
    plantGroup.add(pot);
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(0.48, 1), pMat);
      leaf.scale.set(1.3, 0.2, 0.8);
      leaf.position.set(Math.cos(i * 1.1) * 0.38, 1.0 + i * 0.12, Math.sin(i * 1.1) * 0.38);
      leaf.rotation.set(0.3, i * 1.1, 0.35);
      plantGroup.add(leaf);
    }

    loadCenteredGltfModel('/assets/models/plant.glb', { targetHeight: 2.2 }).then((plantModel) => {
      if (plantModel) {
        plantGroup.add(plantModel);
        pot.visible = false;
      }
    });

    group.add(plantGroup);
  }

  // 3. Resident Homeowner Character (e.g. Ali)
  const character = createCharacter(user);
  character.root.position.set(0, 0, 1.5);
  character.root.rotation.y = 0; // Facing front toward camera
  group.add(character.root);

  // 4. Bookshelves Positioned on the Walls Around the Room Perimeter
  const shelfConfigs = [
    // 0: Back Wall - Left
    {
      pos: new THREE.Vector3(-4.6, 0, -7.3),
      rot: 0,
      walkTarget: new THREE.Vector3(-4.6, 0, -5.6),
      faceAngle: Math.PI, // Facing north towards back wall
      camTarget: new THREE.Vector3(-4.6, 2.05, -0.9), // Lower & further back: frames waist up, hands, open book & face
      lookAtTarget: new THREE.Vector3(-4.6, 1.35, -5.6)
    },
    // 1: Back Wall - Center
    {
      pos: new THREE.Vector3(0, 0, -7.3),
      rot: 0,
      walkTarget: new THREE.Vector3(0, 0, -5.6),
      faceAngle: Math.PI,
      camTarget: new THREE.Vector3(0, 2.05, -0.9),
      lookAtTarget: new THREE.Vector3(0, 1.35, -5.6)
    },
    // 2: Back Wall - Right
    {
      pos: new THREE.Vector3(4.6, 0, -7.3),
      rot: 0,
      walkTarget: new THREE.Vector3(4.6, 0, -5.6),
      faceAngle: Math.PI,
      camTarget: new THREE.Vector3(4.6, 2.05, -0.9),
      lookAtTarget: new THREE.Vector3(4.6, 1.35, -5.6)
    },
    // 3: Left Wall - Back
    {
      pos: new THREE.Vector3(-7.3, 0, -3.2),
      rot: Math.PI / 2, // Facing east towards room center
      walkTarget: new THREE.Vector3(-5.6, 0, -3.2),
      faceAngle: -Math.PI / 2, // Facing west towards left wall
      camTarget: new THREE.Vector3(-0.9, 2.05, -3.2),
      lookAtTarget: new THREE.Vector3(-5.6, 1.35, -3.2)
    },
    // 4: Left Wall - Front
    {
      pos: new THREE.Vector3(-7.3, 0, 1.8),
      rot: Math.PI / 2,
      walkTarget: new THREE.Vector3(-5.6, 0, 1.8),
      faceAngle: -Math.PI / 2,
      camTarget: new THREE.Vector3(-0.9, 2.05, 1.8),
      lookAtTarget: new THREE.Vector3(-5.6, 1.35, 1.8)
    },
    // 5: Right Wall - Back
    {
      pos: new THREE.Vector3(7.3, 0, -3.2),
      rot: -Math.PI / 2, // Facing west towards room center
      walkTarget: new THREE.Vector3(5.6, 0, -3.2),
      faceAngle: Math.PI / 2, // Facing east towards right wall
      camTarget: new THREE.Vector3(0.9, 2.05, -3.2),
      lookAtTarget: new THREE.Vector3(5.6, 1.35, -3.2)
    },
    // 6: Right Wall - Front
    {
      pos: new THREE.Vector3(7.3, 0, 1.8),
      rot: -Math.PI / 2,
      walkTarget: new THREE.Vector3(5.6, 0, 1.8),
      faceAngle: Math.PI / 2,
      camTarget: new THREE.Vector3(0.9, 2.05, 1.8),
      lookAtTarget: new THREE.Vector3(5.6, 1.35, 1.8)
    }
  ];

  const bookColors = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2', '#475569', '#ca8a04', '#059669'];

  shelves.slice(0, 7).forEach((shelfData, idx) => {
    const config = shelfConfigs[idx] || shelfConfigs[0];
    const shelfGroup = new THREE.Group();
    shelfGroup.position.copy(config.pos);
    shelfGroup.rotation.y = config.rot;

    const shelfWoodMat = new THREE.MeshLambertMaterial({ color: '#573010', flatShading: true });

    // Bookshelf dimensions
    const width = 3.0;
    const height = 4.4;
    const depth = 0.8;

    // Procedural shelf geometry as immediate container
    const proceduralShelfMesh = new THREE.Group();

    // Sides
    for (const sx of [-width / 2 + 0.08, width / 2 - 0.08]) {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.16, height, depth), shelfWoodMat);
      side.position.set(sx, height / 2, 0);
      side.castShadow = true;
      proceduralShelfMesh.add(side);
    }
    // Top & Bottom
    for (const sy of [0.1, height - 0.1]) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(width, 0.16, depth), shelfWoodMat);
      plank.position.set(0, sy, 0);
      plank.castShadow = true;
      proceduralShelfMesh.add(plank);
    }
    // Backboard
    const backboard = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.06), shelfWoodMat);
    backboard.position.set(0, height / 2, -depth / 2 + 0.03);
    proceduralShelfMesh.add(backboard);

    // 3 Inner Shelves & Colorful Low-Poly Books
    const tierYs = [1.1, 2.2, 3.3];
    tierYs.forEach(ty => {
      const innerPlank = new THREE.Mesh(new THREE.BoxGeometry(width - 0.3, 0.12, depth - 0.1), shelfWoodMat);
      innerPlank.position.set(0, ty, 0);
      proceduralShelfMesh.add(innerPlank);

      // Populate with books
      let bx = -width / 2 + 0.32;
      while (bx < width / 2 - 0.42) {
        const bWidth = 0.11 + Math.random() * 0.12;
        const bHeight = 0.68 + Math.random() * 0.32;
        const bDepth = 0.55 + Math.random() * 0.15;
        const bColor = bookColors[Math.floor(Math.random() * bookColors.length)];

        const bookMat = new THREE.MeshLambertMaterial({ color: bColor, flatShading: true });
        const bookMesh = new THREE.Mesh(new THREE.BoxGeometry(bWidth, bHeight, bDepth), bookMat);
        bookMesh.position.set(bx + bWidth / 2, ty + bHeight / 2 + 0.06, 0.05);
        bookMesh.castShadow = true;
        proceduralShelfMesh.add(bookMesh);

        bx += bWidth + 0.02;
      }
    });

    shelfGroup.add(proceduralShelfMesh);

    // Asynchronously load Poly.pizza 3D Bookcase with Books
    loadCenteredGltfModel('/assets/models/shelf_books.glb', { targetHeight: 4.4 }).then((shelfModel) => {
      if (shelfModel) {
        shelfGroup.add(shelfModel);
        proceduralShelfMesh.visible = false;
      }
    });

    // 3D Category Title Plaque positioned cleanly above the shelf
    const titleSprite = createTextSprite(shelfData.name, {
      fontSize: 32,
      bgColor: 'rgba(15, 23, 42, 0.95)',
      textColor: '#ffffff',
      borderColor: '#f59e0b',
      worldHeight: 0.72
    });
    titleSprite.position.set(0, height + 0.42, 0.05);
    shelfGroup.add(titleSprite);

    // Invisible Raycast Hitbox
    const hitboxGeo = new THREE.BoxGeometry(width + 0.4, height + 0.8, depth + 0.6);
    const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
    hitbox.position.set(0, height / 2, 0);
    hitbox.userData = {
      isShelf: true,
      shelfId: shelfData.id,
      shelfName: shelfData.name,
      shelfIndex: idx,
      shelfCenter: shelfGroup.position.clone().add(new THREE.Vector3(0, height / 2, 0)),
      cameraTarget: config.camTarget
    };
    shelfGroup.add(hitbox);

    // Sleek Edge Highlight
    const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(width + 0.06, height + 0.06, depth + 0.06));
    const edgeMat = new THREE.LineBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0, linewidth: 2 });
    const glowEdges = new THREE.LineSegments(edgeGeo, edgeMat);
    glowEdges.position.set(0, height / 2, 0);
    shelfGroup.add(glowEdges);

    shelfPickers.push({
      hitbox,
      shelfData,
      edgeMat,
      shelfWoodMat,
      walkTarget: config.walkTarget,
      faceAngle: config.faceAngle,
      cameraTarget: config.camTarget,
      lookAtTarget: config.lookAtTarget
    });

    group.add(shelfGroup);
  });

  return {
    group,
    shelfPickers,
    character,
    highlightShelf: (shelfId, active) => {
      for (const p of shelfPickers) {
        const isTarget = active && p.shelfData.id === shelfId;
        p.edgeMat.opacity = isTarget ? 0.95 : 0;
        if (p.shelfWoodMat) {
          p.shelfWoodMat.emissive.set(isTarget ? '#1e3a8a' : '#000000');
          p.shelfWoodMat.emissiveIntensity = isTarget ? 0.35 : 0;
        }
      }
    }
  };
}
