import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

/**
 * Initializes Three.js WebGL renderer, scene, camera, lighting, and shadow setup.
 */
export function initThree(container) {
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  // 1. Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#93c5fd'); // Cozy daylight sky
  scene.fog = new THREE.Fog('#bfdbfe', 70, 180);

  // 2. Camera
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
  camera.position.set(0, 10, 24);
  camera.lookAt(0, 2, 0);

  // 3. Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // 4. Lighting
  const ambientLight = new THREE.AmbientLight('#ffffff', 0.7);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight('#fff7ed', 1.4);
  sunLight.position.set(15, 25, 12);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 60;
  sunLight.shadow.camera.left = -18;
  sunLight.shadow.camera.right = 18;
  sunLight.shadow.camera.top = 18;
  sunLight.shadow.camera.bottom = -18;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight('#93c5fd', 0.4);
  fillLight.position.set(-15, 12, -10);
  scene.add(fillLight);

  return { scene, camera, renderer, ambientLight, sunLight };
}

/**
 * Smooth camera tween animation using tween.js
 */
export function tweenCamera(camera, targetPos, lookAtPos, duration = 1200, easing = TWEEN.Easing.Cubic.InOut, onComplete = null) {
  // Current lookAt target tracker
  const currentLookAt = new THREE.Vector3();
  camera.getWorldDirection(currentLookAt);
  currentLookAt.multiplyScalar(10).add(camera.position);

  const coords = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    lx: currentLookAt.x,
    ly: currentLookAt.y,
    lz: currentLookAt.z
  };

  const targetCoords = {
    x: targetPos.x,
    y: targetPos.y,
    z: targetPos.z,
    lx: lookAtPos.x,
    ly: lookAtPos.y,
    lz: lookAtPos.z
  };

  return new TWEEN.Tween(coords, true)
    .to(targetCoords, duration)
    .easing(easing)
    .onUpdate(() => {
      camera.position.set(coords.x, coords.y, coords.z);
      camera.lookAt(coords.lx, coords.ly, coords.lz);
    })
    .onComplete(() => {
      camera.position.set(targetPos.x, targetPos.y, targetPos.z);
      camera.lookAt(lookAtPos.x, lookAtPos.y, lookAtPos.z);
      if (onComplete) onComplete();
    })
    .start();
}

/**
 * Screen fade transition (fade out to black, then fade back in)
 */
export function screenFade(durationMs = 600, callback = null) {
  const fadeEl = document.getElementById('screen-fade');
  if (!fadeEl) {
    if (callback) callback();
    return;
  }

  fadeEl.classList.add('active');

  setTimeout(() => {
    if (callback) callback();
    setTimeout(() => {
      fadeEl.classList.remove('active');
    }, 100);
  }, durationMs / 2);
}

/**
 * Generates a crisp billboard sprite text texture for 3D signs & shelf labels.
 */
export function createTextSprite(text, options = {}) {
  const fontSize = options.fontSize || 36;
  const padding = options.padding || 16;
  const bgColor = options.bgColor || 'rgba(15, 23, 42, 0.88)';
  const textColor = options.textColor || '#ffffff';
  const borderColor = options.borderColor || 'rgba(255, 255, 255, 0.25)';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  ctx.font = `600 ${fontSize}px 'Outfit', sans-serif`;
  const textMetrics = ctx.measureText(text);
  const textWidth = Math.ceil(textMetrics.width);
  const textHeight = Math.ceil(fontSize * 1.3);

  canvas.width = textWidth + padding * 2;
  canvas.height = textHeight + padding * 2;

  // Background pill
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 3;

  const r = 12;
  ctx.beginPath();
  ctx.roundRect(2, 2, canvas.width - 4, canvas.height - 4, r);
  ctx.fill();
  ctx.stroke();

  // Text
  ctx.font = `600 ${fontSize}px 'Outfit', sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const aspect = canvas.width / canvas.height;
  const heightWorld = options.worldHeight || 0.7;
  const widthWorld = heightWorld * aspect;

  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(widthWorld, heightWorld, 1);
  sprite.renderOrder = 999;

  return sprite;
}
