import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { createInsideRoomScene } from './procedural.js';
import { tweenCamera } from './helpers.js';
import { strings } from '../strings.js';
import { findPath, resolveCollisions } from './navigation.js';

export class InsideScene {
  constructor(scene, camera, shelves, user, onShelfClick, onBackToStreet) {
    this.scene = scene;
    this.camera = camera;
    this.shelves = shelves;
    this.user = user;
    this.onShelfClick = onShelfClick;
    this.onBackToStreet = onBackToStreet;

    this.roomData = createInsideRoomScene(shelves, user);
    this.scene.add(this.roomData.group);
    this.roomData.group.visible = false;

    this.hoveredShelfId = null;
    this.promptEl = null;
    this.backBtnEl = null;

    // Top-Down Ceiling Camera Vantage Point (Isometric / Cutaway view from above)
    this.overviewCamPos = new THREE.Vector3(0, 16.5, 13.5);
    this.overviewLookAt = new THREE.Vector3(0, 1.4, -1.2);

    // Default Home Base for Resident Homeowner (Spacious center lounge, in front of reading table)
    this.defaultCharacterPos = new THREE.Vector3(0, 0, 1.5);
    this.isAnimating = false;
    this.isWalking = false;

    // Active shelf picker
    this.activeShelfPicker = null;

    // Floor click raycast target
    this.floorPlane = null;
    this.setupFloorPlane();
    this.setupUI();
  }

  setupFloorPlane() {
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.MeshBasicMaterial({ visible: false });
    this.floorPlane = new THREE.Mesh(floorGeo, floorMat);
    this.floorPlane.rotation.x = -Math.PI / 2;
    this.floorPlane.position.y = 0.01;
    this.floorPlane.userData = { isFloor: true };
    this.roomData.group.add(this.floorPlane);
  }

  setupUI() {
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;

    // Hint prompt
    this.promptEl = document.createElement('div');
    this.promptEl.id = 'room-hint';
    this.promptEl.className = 'scene-hint';
    this.promptEl.style.display = 'none';
    this.promptEl.innerHTML = `
      <span class="scene-hint-dot" style="background: #6366f1; box-shadow: 0 0 8px #6366f1;"></span>
      <span>${strings.scene.roomPrompt}</span>
    `;
    overlay.appendChild(this.promptEl);

    // "Back to Street" HUD button
    this.backBtnEl = document.createElement('button');
    this.backBtnEl.id = 'back-to-street-btn';
    this.backBtnEl.className = 'btn btn-secondary';
    this.backBtnEl.style.position = 'absolute';
    this.backBtnEl.style.bottom = '24px';
    this.backBtnEl.style.left = '24px';
    this.backBtnEl.style.zIndex = '25';
    this.backBtnEl.style.display = 'none';
    this.backBtnEl.innerHTML = `🏡 ${strings.nav.street}`;
    this.backBtnEl.addEventListener('click', () => {
      if (this.onBackToStreet) this.onBackToStreet();
    });
    overlay.appendChild(this.backBtnEl);
  }

  show() {
    this.roomData.group.visible = true;
    if (this.promptEl) this.promptEl.style.display = 'flex';
    if (this.backBtnEl) this.backBtnEl.style.display = 'inline-flex';

    // Position camera at top-down ceiling overview
    this.camera.position.copy(this.overviewCamPos);
    this.camera.lookAt(this.overviewLookAt);

    // Reset resident character to center reading area
    const char = this.roomData.character;
    if (char) {
      char.reset();
      char.root.position.copy(this.defaultCharacterPos);
      char.root.rotation.set(0, 0, 0);
    }
    this.isWalking = false;
    this.isAnimating = false;
  }

  hide() {
    this.roomData.group.visible = false;
    if (this.promptEl) this.promptEl.style.display = 'none';
    if (this.backBtnEl) this.backBtnEl.style.display = 'none';
    this.roomData.highlightShelf(null, false);
    document.body.style.cursor = 'default';
    this.isWalking = false;
    this.isAnimating = false;
  }

  update(time, delta) {
    if (!this.roomData.group.visible) return;

    const char = this.roomData.character;
    if (char) {
      if (this.isWalking) {
        char.updateWalk(time, 10);
      } else {
        char.updateIdle(time);
      }
    }
  }

  /**
   * Executes walking along an array of 3D waypoints sequentially,
   * avoiding central table and chair obstacles.
   */
  executePathWalk(waypoints, onDone) {
    if (waypoints.length <= 1) {
      this.isWalking = false;
      if (onDone) onDone();
      return;
    }

    let currentIndex = 0;
    const char = this.roomData.character;

    const stepToNext = () => {
      if (currentIndex >= waypoints.length - 1) {
        this.isWalking = false;
        if (onDone) onDone();
        return;
      }

      const from = waypoints[currentIndex];
      const to = waypoints[currentIndex + 1];
      currentIndex++;

      const dx = to.x - from.x;
      const dz = to.z - from.z;
      const dist = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);
      const duration = Math.max(380, Math.min(1300, dist * 340));

      // 1. Smoothly rotate character to face the direction of the waypoint
      new TWEEN.Tween({ angle: char.root.rotation.y }, true)
        .to({ angle: angle }, 160)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate((obj) => {
          char.root.rotation.y = obj.angle;
        })
        .onComplete(() => {
          // 2. Walk forward along this segment
          this.isWalking = true;
          const coords = { x: from.x, y: from.y, z: from.z };
          new TWEEN.Tween(coords, true)
            .to({ x: to.x, y: to.y, z: to.z }, duration)
            .easing(TWEEN.Easing.Linear.None)
            .onUpdate((obj) => {
              char.root.position.set(obj.x, obj.y, obj.z);
            })
            .onComplete(() => {
              stepToNext();
            })
            .start();
        })
        .start();
    };

    stepToNext();
  }

  /**
   * Smoothly returns character and camera to the central room overview.
   * Closes the held book, places it back on shelf, and walks around obstacles to home base.
   */
  returnToOverview(onComplete = null) {
    this.isAnimating = true;
    if (this.promptEl) this.promptEl.style.display = 'flex';
    if (this.backBtnEl) this.backBtnEl.style.display = 'inline-flex';
    this.roomData.highlightShelf(null, false);

    const char = this.roomData.character;
    if (!char) {
      tweenCamera(
        this.camera,
        this.overviewCamPos,
        this.overviewLookAt,
        900,
        TWEEN.Easing.Cubic.Out,
        () => {
          this.isAnimating = false;
          if (onComplete) onComplete();
        }
      );
      return;
    }

    const shelfFaceAngle = this.activeShelfPicker ? this.activeShelfPicker.faceAngle : null;
    this.activeShelfPicker = null;

    // Step 1: Character closes the book and returns it back to the shelf
    char.closeBookAndReturn(null, () => {
      const startPos = char.root.position.clone();
      const homePos = this.defaultCharacterPos.clone();

      // Step 2: Calculate obstacle-free waypoints to navigate around desk and armchair
      const waypoints = findPath(startPos, homePos);

      let totalDist = 0;
      for (let i = 0; i < waypoints.length - 1; i++) {
        totalDist += waypoints[i].distanceTo(waypoints[i + 1]);
      }
      const totalWalkTime = Math.max(900, Math.min(2200, totalDist * 340));

      // Glide camera concurrently back to ceiling vantage point
      tweenCamera(
        this.camera,
        this.overviewCamPos,
        this.overviewLookAt,
        totalWalkTime + 300,
        TWEEN.Easing.Cubic.Out
      );

      // Walk along collision-free path back to home base
      this.executePathWalk(waypoints, () => {
        // Face forward toward user camera
        new TWEEN.Tween({ angle: char.root.rotation.y }, true)
          .to({ angle: 0 }, 220)
          .easing(TWEEN.Easing.Quadratic.Out)
          .onUpdate((obj) => {
            char.root.rotation.y = obj.angle;
          })
          .onComplete(() => {
            this.isAnimating = false;
            if (onComplete) onComplete();
          })
          .start();
      });
    });
  }

  handlePointerMove(raycaster) {
    if (!this.roomData.group.visible || this.isAnimating) return;

    const hitboxes = this.roomData.shelfPickers.map(p => p.hitbox);
    const intersects = raycaster.intersectObjects(hitboxes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const shelfId = hit.userData.shelfId;

      if (shelfId !== this.hoveredShelfId) {
        this.hoveredShelfId = shelfId;
        this.roomData.highlightShelf(shelfId, true);
        document.body.style.cursor = 'pointer';
      }
    } else if (this.hoveredShelfId !== null) {
      this.hoveredShelfId = null;
      this.roomData.highlightShelf(null, false);
      document.body.style.cursor = 'default';
    }
  }

  handleClick(raycaster) {
    if (!this.roomData.group.visible || this.isAnimating) return false;

    // 1. Check if user clicked on a wall bookshelf
    const hitboxes = this.roomData.shelfPickers.map(p => p.hitbox);
    const shelfIntersects = raycaster.intersectObjects(hitboxes, false);

    if (shelfIntersects.length > 0) {
      const hit = shelfIntersects[0].object;
      const shelfId = hit.userData.shelfId;
      const picker = this.roomData.shelfPickers.find(p => p.shelfData.id === shelfId);

      if (picker) {
        this.walkToShelfAndOpenBook(picker);
        return true;
      }
    }

    // 2. Check if user clicked on floor to freely walk around the library
    if (this.floorPlane) {
      const floorIntersects = raycaster.intersectObject(this.floorPlane, false);
      if (floorIntersects.length > 0) {
        const hitPoint = floorIntersects[0].point.clone();
        hitPoint.y = 0;
        resolveCollisions(hitPoint, 0.45);
        this.walkToFloorPoint(hitPoint);
        return true;
      }
    }

    return false;
  }

  /**
   * Sequence: Character walks over to wall bookshelf avoiding furniture obstacles,
   * reaches out arm, slides a book off the shelf, gathers it, and opens it with golden radiant light!
   * Then camera focuses in and displays the shelf's book catalog overlay.
   */
  walkToShelfAndOpenBook(picker) {
    this.activeShelfPicker = picker;
    this.isAnimating = true;
    if (this.promptEl) this.promptEl.style.display = 'none';
    if (this.backBtnEl) this.backBtnEl.style.display = 'none';
    document.body.style.cursor = 'default';

    const char = this.roomData.character;
    if (!char) {
      tweenCamera(
        this.camera,
        picker.cameraTarget,
        picker.lookAtTarget,
        850,
        TWEEN.Easing.Cubic.Out,
        () => {
          if (this.onShelfClick) this.onShelfClick(picker.shelfData.id);
          this.isAnimating = false;
        }
      );
      return;
    }

    const startPos = char.root.position.clone();
    const targetPos = picker.walkTarget.clone();

    // Calculate collision-free waypoints avoiding the central table and armchair
    const waypoints = findPath(startPos, targetPos);

    let totalDist = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDist += waypoints[i].distanceTo(waypoints[i + 1]);
    }
    const totalWalkTime = Math.max(800, Math.min(2200, totalDist * 340));

    // Glide camera smoothly toward the wall bookshelf
    tweenCamera(
      this.camera,
      picker.cameraTarget,
      picker.lookAtTarget,
      totalWalkTime + 450,
      TWEEN.Easing.Cubic.Out
    );

    // Execute multi-segment walk around obstacles
    this.executePathWalk(waypoints, () => {
      // Step: Turn to face bookshelf directly
      new TWEEN.Tween({ angle: char.root.rotation.y }, true)
        .to({ angle: picker.faceAngle }, 220)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate((obj) => {
          char.root.rotation.y = obj.angle;
        })
        .onComplete(() => {
          // Angle to face the camera directly so the user sees character's face holding and opening the book
          const camAngle = Math.atan2(
            picker.cameraTarget.x - picker.walkTarget.x,
            picker.cameraTarget.z - picker.walkTarget.z
          );

          // Step: Reach into shelf, pick up book, turn to face camera, and open book with radiant glow!
          char.reachForBookAndOpen(picker.hitbox, () => {
            setTimeout(() => {
              if (this.onShelfClick) this.onShelfClick(picker.shelfData.id);
              this.isAnimating = false;
            }, 300);
          }, camAngle);
        })
        .start();
    });
  }

  /**
   * Free floor navigation: Character walks to a clicked floor position avoiding obstacles.
   */
  walkToFloorPoint(targetPoint) {
    const char = this.roomData.character;
    if (!char || this.isAnimating) return;

    this.isAnimating = true;
    const startPos = char.root.position.clone();
    const waypoints = findPath(startPos, targetPoint);

    this.executePathWalk(waypoints, () => {
      this.isAnimating = false;
    });
  }

  destroy() {
    if (this.promptEl) this.promptEl.remove();
    if (this.backBtnEl) this.backBtnEl.remove();
    this.scene.remove(this.roomData.group);
  }
}
