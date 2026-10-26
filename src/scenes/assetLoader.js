import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const loader = new GLTFLoader();
const assetCache = new Map();

/**
 * Attempts to load an external GLB model from /assets/models/.
 * Returns an object { scene, animations } or null if not found.
 * Properly clones skinned meshes and armatures using SkeletonUtils.
 */
export async function loadGltfAsset(url) {
  if (typeof window === 'undefined') return null;

  if (assetCache.has(url)) {
    const cached = assetCache.get(url);
    const sceneClone = cached.scene ? SkeletonUtils.clone(cached.scene) : null;
    return {
      scene: sceneClone,
      animations: cached.animations || []
    };
  }

  return new Promise((resolve) => {
    loader.load(
      url,
      (gltf) => {
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        assetCache.set(url, { scene: gltf.scene, animations: gltf.animations || [] });
        resolve({
          scene: SkeletonUtils.clone(gltf.scene),
          animations: gltf.animations || []
        });
      },
      undefined,
      (err) => {
        // Fall back gracefully
        console.warn(`[AssetLoader] Could not load ${url}, falling back to procedural.`, err);
        resolve(null);
      }
    );
  });
}

/**
 * Convenience method: loads just the 3D scene (Group/Mesh) of a model.
 */
export async function loadGltfModel(url) {
  const asset = await loadGltfAsset(url);
  return asset ? asset.scene : null;
}

/**
 * Normalizes any 3D GLTF model by centering its X and Z coordinates,
 * optionally grounding its bottom at Y=0, and uniformly scaling to target dimensions.
 */
export function makeCenteredModel(gltfScene, options = {}) {
  const { targetHeight, targetWidth, targetDepth, scale: customScale, ground = true } = options;
  const box = new THREE.Box3().setFromObject(gltfScene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  let scale = 1;
  if (targetHeight && size.y > 0) {
    scale = targetHeight / size.y;
  } else if (targetWidth && size.x > 0) {
    scale = targetWidth / size.x;
  } else if (targetDepth && size.z > 0) {
    scale = targetDepth / size.z;
  } else if (customScale) {
    scale = customScale;
  }

  const wrapper = new THREE.Group();
  gltfScene.scale.set(scale, scale, scale);
  const offsetY = ground ? -box.min.y * scale : -center.y * scale;
  gltfScene.position.set(-center.x * scale, offsetY, -center.z * scale);
  wrapper.add(gltfScene);
  return wrapper;
}

/**
 * Loads a GLTF model and automatically wraps it in makeCenteredModel.
 */
export async function loadCenteredGltfModel(url, options = {}) {
  const model = await loadGltfModel(url);
  if (!model) return null;
  return makeCenteredModel(model, options);
}
