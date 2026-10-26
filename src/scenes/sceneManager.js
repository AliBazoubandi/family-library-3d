import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { initThree, screenFade } from './helpers.js';
import { StreetScene } from './street.js';
import { HouseFrontSequence } from './houseFront.js';
import { InsideScene } from './inside.js';
import { renderShelfOverlay } from '../ui/shelfOverlay.js';
import { appState } from '../state.js';
import { fetchShelves, fetchBooks } from '../api/books.js';

export class SceneManager {
  constructor(canvasContainer) {
    this.container = canvasContainer;

    // Three.js Core
    const { scene, camera, renderer, ambientLight, sunLight } = initThree(canvasContainer);
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.ambientLight = ambientLight;
    this.sunLight = sunLight;

    // Raycaster & Pointer
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    // Active state
    this.currentSceneState = 'STREET'; // 'STREET' | 'HOUSE_FRONT' | 'INSIDE' | 'SHELF_VIEW'
    this.streetScene = null;
    this.houseFrontSeq = null;
    this.insideScene = null;
    this.shelfOverlayCleanup = null;

    this.clock = new THREE.Clock();
    this.isRunning = false;

    // Camera Pan & Tilt / Drag-to-Look State (Yaw + Pitch)
    this.panAngle = 0;
    this.targetPanAngle = 0;
    this.pitchAngle = 0;
    this.targetPitchAngle = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.dragLastX = 0;
    this.dragLastY = 0;
    this.hasMovedSignificantly = false;

    this.initScenes();
    this.setupEventListeners();
    this.startLoop();

    window.__sceneManager = this;
    window.__driveToUser = (targetUser) => this.driveToUserHouse(targetUser);
    window.__enterHouse = (targetUser) => this.enterHouse(targetUser);
  }

  initScenes() {
    const loggedInUser = appState.user;
    const currentHouse = appState.currentHouseUser || loggedInUser;
    const shelves = appState.shelves;
    const familyUsers = appState.familyUsers.length ? appState.familyUsers : (loggedInUser ? [loggedInUser] : []);

    // 1. Street Scene with all family member houses
    // Main character and central home house (x = 0) is ALWAYS the loggedInUser!
    this.streetScene = new StreetScene(
      this.scene,
      this.camera,
      loggedInUser,
      familyUsers,
      (clickedUser) => {
        this.handleHouseClick(clickedUser);
      }
    );

    // 2. Inside Cozy Room Scene
    this.insideScene = new InsideScene(
      this.scene,
      this.camera,
      shelves,
      currentHouse,
      (shelfId) => this.goToShelfView(shelfId),
      () => this.goToStreet()
    );

    // Initial state: STREET
    this.goToStreet(false);
  }

  rebuildScenes() {
    if (this.streetScene) this.streetScene.destroy();
    if (this.insideScene) this.insideScene.destroy();
    if (this.shelfOverlayCleanup) {
      this.shelfOverlayCleanup();
      this.shelfOverlayCleanup = null;
    }
    this.initScenes();
  }

  // --- State Transitions ---

  goToStreet(fade = true) {
    this.currentSceneState = 'STREET';
    this.panAngle = 0;
    this.targetPanAngle = 0;
    this.pitchAngle = 0;
    this.targetPitchAngle = 0;
    appState.setScene('STREET');

    const activate = () => {
      // Hide room, show street
      this.insideScene.hide();
      this.streetScene.show();

      // Street sky & lighting
      this.scene.background = new THREE.Color('#93c5fd');
      this.scene.fog = new THREE.Fog('#bfdbfe', 70, 180);
      this.ambientLight.intensity = 0.7;
      this.sunLight.intensity = 1.4;

      // Position camera to street overview centered at current house
      const centerX = this.streetScene ? this.streetScene.getCameraCenterX() : 0;
      this.camera.position.set(centerX, 10, 24);
      this.camera.lookAt(centerX, 2, 0);
    };

    if (fade) {
      screenFade(500, activate);
    } else {
      activate();
    }
  }

  goToHouseFront(targetUser = null) {
    if (this.currentSceneState !== 'STREET') return;

    const user = targetUser || appState.currentHouseUser || appState.user;
    this.currentSceneState = 'HOUSE_FRONT';
    this.panAngle = 0;
    this.targetPanAngle = 0;
    appState.setScene('HOUSE_FRONT');
    if (this.streetScene.promptEl) this.streetScene.promptEl.style.display = 'none';

    this.houseFrontSeq = new HouseFrontSequence(
      this.scene,
      this.camera,
      user,
      this.streetScene,
      () => {
        // Callback after walking into the house
        this.goToInside(false);
      }
    );

    this.houseFrontSeq.play();
  }

  /**
   * Dispatches house click: If car is already parked at this house, enters it.
   * Otherwise, drives the car to this house and stops in front of it!
   */
  handleHouseClick(clickedUser) {
    if (!clickedUser) return;
    const isParkedAtTarget = (this.streetScene.currentParkedUser?.id === clickedUser.id);
    if (isParkedAtTarget) {
      this.enterHouse(clickedUser);
    } else {
      this.driveToUserHouse(clickedUser);
    }
  }

  /**
   * Drives the car to another family member's house on the street.
   * Stops in front of that house, with the character stepping out onto the sidewalk.
   * (Does NOT automatically enter - waits for user to click on the house!)
   */
  async driveToUserHouse(targetUser) {
    if (!targetUser) return;

    // If currently inside or in shelf view, clean overlay and step back out to street view first
    if (this.shelfOverlayCleanup) {
      this.shelfOverlayCleanup();
      this.shelfOverlayCleanup = null;
    }
    if (this.currentSceneState !== 'STREET') {
      this.goToStreet(false);
    }

    this.streetScene.driveCarToHouse(targetUser, (arrivedUser) => {
      appState.setCurrentHouseUser(arrivedUser);
    });
  }

  /**
   * Enters the house when clicked: Front door swings open, character steps in,
   * loads the user's personal shelves and books, and transitions into their cozy interior room!
   */
  async enterHouse(targetUser) {
    if (!targetUser) return;

    if (this.streetScene) {
      this.streetScene.enterHouse(targetUser, async () => {
        // Fetch target family member's shelves and books
        const [userShelves, userBooks] = await Promise.all([
          fetchShelves(targetUser.id),
          fetchBooks({ ownerId: targetUser.id })
        ]);
        appState.setCurrentHouseUser(targetUser);
        appState.setShelves(userShelves);
        appState.setBooks(userBooks);

        // Rebuild inside room for this family member
        if (this.insideScene) {
          this.insideScene.destroy();
        }
        this.insideScene = new InsideScene(
          this.scene,
          this.camera,
          userShelves,
          targetUser,
          (shelfId) => this.goToShelfView(shelfId),
          () => this.goToStreet()
        );

        // Transition smoothly inside
        this.goToInside(true);
      });
    }
  }

  goToInside(fade = true) {
    this.currentSceneState = 'INSIDE';
    this.panAngle = 0;
    this.targetPanAngle = 0;
    this.pitchAngle = 0;
    this.targetPitchAngle = 0;
    appState.setScene('INSIDE');

    const activate = () => {
      // Hide street, show inside room
      this.streetScene.hide();
      this.insideScene.show();

      // Cozy warm indoor atmosphere
      this.scene.background = new THREE.Color('#0b0f19');
      this.scene.fog = new THREE.FogExp2('#0f172a', 0.025);
      this.ambientLight.intensity = 0.4;
      this.sunLight.intensity = 0.6;
    };

    if (fade) {
      screenFade(500, activate);
    } else {
      activate();
    }
  }

  goToShelfView(shelfId) {
    this.currentSceneState = 'SHELF_VIEW';
    this.panAngle = 0;
    this.targetPanAngle = 0;
    this.pitchAngle = 0;
    this.targetPitchAngle = 0;
    appState.setScene('SHELF_VIEW', shelfId);

    // Render HTML overlay over the focused 3D shelf
    this.shelfOverlayCleanup = renderShelfOverlay(shelfId, () => {
      this.closeShelfView();
    });
  }

  closeShelfView() {
    this.currentSceneState = 'INSIDE';
    this.panAngle = 0;
    this.targetPanAngle = 0;
    this.pitchAngle = 0;
    this.targetPitchAngle = 0;
    appState.setScene('INSIDE');
    if (this.shelfOverlayCleanup) {
      this.shelfOverlayCleanup();
      this.shelfOverlayCleanup = null;
    }
    // Return camera smoothly to room overview
    this.insideScene.returnToOverview();
  }

  // --- Interaction & Event Handling ---

  setupEventListeners() {
    const updatePointer = (clientX, clientY) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
    };

    const isInteractiveUI = (target) => {
      return target && target.closest(
        'button, input, select, textarea, a, .modal-dialog, .toast, .shelf-panel, .top-nav, .auth-card, .loading-screen, .shelf-overlay-wrapper'
      );
    };

    const onPointerDown = (clientX, clientY, target) => {
      if (isInteractiveUI(target)) return;
      this.isDragging = true;
      this.dragStartX = clientX;
      this.dragStartY = clientY;
      this.dragLastX = clientX;
      this.dragLastY = clientY;
      this.hasMovedSignificantly = false;
    };

    const onPointerMove = (clientX, clientY) => {
      updatePointer(clientX, clientY);

      if (this.isDragging && (this.currentSceneState === 'STREET' || (this.currentSceneState === 'INSIDE' && !this.insideScene?.isAnimating))) {
        const dx = clientX - this.dragLastX;
        const dy = clientY - this.dragLastY;
        this.dragLastX = clientX;
        this.dragLastY = clientY;

        if (Math.abs(clientX - this.dragStartX) > 5 || Math.abs(clientY - this.dragStartY) > 5) {
          this.hasMovedSignificantly = true;
          document.body.style.cursor = 'grabbing';
        }

        if (this.currentSceneState === 'STREET') {
          // Horizontal yaw: -0.45 to +0.45 rad (~26 degrees each way along street)
          this.targetPanAngle = Math.max(-0.45, Math.min(0.45, this.targetPanAngle - dx * 0.0035));
          // Vertical pitch: -0.25 to +0.35 rad (tilts camera up and down)
          this.targetPitchAngle = Math.max(-0.25, Math.min(0.35, this.targetPitchAngle + dy * 0.003));
        } else if (this.currentSceneState === 'INSIDE') {
          // Horizontal yaw: -0.65 to +0.65 rad (~37 degrees around ceiling view)
          this.targetPanAngle = Math.max(-0.65, Math.min(0.65, this.targetPanAngle - dx * 0.0035));
          // Vertical pitch: -0.32 to +0.40 rad (tilts vantage angle up and down)
          this.targetPitchAngle = Math.max(-0.32, Math.min(0.40, this.targetPitchAngle + dy * 0.003));
        }
      } else {
        if (this.currentSceneState === 'STREET') {
          this.streetScene.handlePointerMove(this.raycaster);
        } else if (this.currentSceneState === 'INSIDE') {
          this.insideScene.handlePointerMove(this.raycaster);
        }
      }
    };

    const onPointerUp = (clientX, clientY, target) => {
      const moved = this.hasMovedSignificantly;
      this.isDragging = false;
      this.hasMovedSignificantly = false;

      if (document.body.style.cursor === 'grabbing') {
        document.body.style.cursor = 'default';
      }

      // If user was dragging to pan camera, ignore click
      if (moved) return;

      if (isInteractiveUI(target)) return;

      updatePointer(clientX, clientY);

      if (this.currentSceneState === 'STREET') {
        this.streetScene.handleClick(this.raycaster);
      } else if (this.currentSceneState === 'INSIDE') {
        this.insideScene.handleClick(this.raycaster);
      }
    };

    window.addEventListener('resize', () => this.onResize());

    // Mouse Controls
    window.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY, e.target));
    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', (e) => onPointerUp(e.clientX, e.clientY, e.target));

    // Touch Controls
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY, e.target);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        onPointerUp(touch.clientX, touch.clientY, document.elementFromPoint(touch.clientX, touch.clientY));
      }
    }, { passive: true });
  }

  onResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  startLoop() {
    this.isRunning = true;
    const animate = () => {
      if (!this.isRunning) return;
      requestAnimationFrame(animate);

      const delta = this.clock.getDelta();
      const time = this.clock.getElapsedTime();

      // Update Tweens
      TWEEN.update();

      // Smooth camera pan & pitch angle interpolation (damped spring / lerp)
      this.panAngle += (this.targetPanAngle - this.panAngle) * 0.08;
      this.pitchAngle += (this.targetPitchAngle - this.pitchAngle) * 0.08;

      // Update current scene objects & interactive camera pan & tilt
      if (this.currentSceneState === 'STREET') {
        if (this.streetScene && this.streetScene.isCameraControlled()) {
          // Camera is smoothly controlled by driving or entering sequence
          this.streetScene.update(time, delta);
        } else {
          const centerX = this.streetScene ? this.streetScene.getCameraCenterX() : 0;
          const radius = 24;
          this.camera.position.x = centerX + radius * Math.sin(this.panAngle);
          this.camera.position.z = radius * Math.cos(this.panAngle) + this.pitchAngle * 4;
          this.camera.position.y = 10 - this.pitchAngle * 10;
          this.camera.lookAt(centerX, 2 - this.pitchAngle * 2, 0);
          this.streetScene.update(time, delta);
        }
      } else if (this.currentSceneState === 'HOUSE_FRONT' && this.houseFrontSeq) {
        this.houseFrontSeq.update(time);
      } else if (this.currentSceneState === 'INSIDE') {
        if (this.insideScene && !this.insideScene.isAnimating) {
          // Top-down ceiling view camera position with 2-axis drag orbit (yaw + pitch)
          const radius = 14.7;
          const height = 16.5;
          const centerZ = -1.2;
          this.camera.position.x = radius * Math.sin(this.panAngle);
          this.camera.position.z = radius * Math.cos(this.panAngle) + centerZ + this.pitchAngle * 7;
          this.camera.position.y = height + this.pitchAngle * 7;
          this.camera.lookAt(0, 1.4 - this.pitchAngle * 2, -1.2);
        }
        if (this.insideScene) {
          this.insideScene.update(time, delta);
        }
      } else if (this.currentSceneState === 'SHELF_VIEW') {
        if (this.insideScene) {
          this.insideScene.update(time, delta);
        }
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  destroy() {
    this.isRunning = false;
    this.renderer.dispose();
  }
}
