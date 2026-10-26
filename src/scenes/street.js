import * as THREE from 'three';
import { createStreetScene } from './procedural.js';
import { strings } from '../strings.js';

export class StreetScene {
  constructor(scene, camera, user, familyUsers = [], onHouseClick = null) {
    this.scene = scene;
    this.camera = camera;
    this.user = user;
    this.familyUsers = familyUsers;
    this.onHouseClick = onHouseClick;

    this.currentParkedUser = user;
    this.cameraCenterX = 0;

    this.streetData = createStreetScene(user, familyUsers);
    this.scene.add(this.streetData.group);

    this.hoveredHouse = null;
    this.promptEl = null;

    this.setupPrompt();
  }

  setupPrompt() {
    this.promptEl = document.createElement('div');
    this.promptEl.id = 'street-hint';
    this.promptEl.className = 'scene-hint';
    this.promptEl.innerHTML = `
      <span class="scene-hint-dot"></span>
      <span id="street-hint-text">${strings.scene.streetPrompt}</span>
    `;
    const overlay = document.getElementById('ui-overlay');
    if (overlay) overlay.appendChild(this.promptEl);
  }

  setPrompt(message) {
    const textEl = document.getElementById('street-hint-text');
    if (textEl) {
      textEl.textContent = message;
    }
  }

  getCameraCenterX() {
    return this.cameraCenterX;
  }

  isCameraControlled() {
    return this.streetData.isCameraControlled ? this.streetData.isCameraControlled() : this.streetData.isDriving();
  }

  show() {
    this.streetData.group.visible = true;
    if (this.promptEl) this.promptEl.style.display = 'flex';

    // Ensure all front doors are closed cleanly when viewing the street
    this.streetData.houses.forEach(h => {
      if (h.doorHinge) h.doorHinge.rotation.y = 0;
    });

    if (this.currentParkedUser) {
      this.setPrompt(`🏡 In front of ${this.currentParkedUser.name}'s House. Click the house or door to enter!`);
    } else {
      this.setPrompt(strings.scene.streetPrompt);
    }
  }

  hide() {
    this.streetData.group.visible = false;
    if (this.promptEl) this.promptEl.style.display = 'none';
    if (this.hoveredHouse) {
      this.hoveredHouse.setHighlight(false);
      this.hoveredHouse = null;
    }
    document.body.style.cursor = 'default';
  }

  handlePointerMove(raycaster) {
    if (!this.streetData.group.visible || this.streetData.isDriving() || this.streetData.isEntering?.()) return;

    const hitboxes = this.streetData.houses.map(h => h.hitbox);
    const intersects = raycaster.intersectObjects(hitboxes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const targetHouse = this.streetData.houses.find(h => h.hitbox === hit);

      if (targetHouse !== this.hoveredHouse) {
        if (this.hoveredHouse) this.hoveredHouse.setHighlight(false);
        this.hoveredHouse = targetHouse;
        if (targetHouse) targetHouse.setHighlight(true);
        document.body.style.cursor = 'pointer';
      }
    } else if (this.hoveredHouse) {
      this.hoveredHouse.setHighlight(false);
      this.hoveredHouse = null;
      document.body.style.cursor = 'default';
    }
  }

  handleClick(raycaster) {
    if (!this.streetData.group.visible || this.streetData.isDriving() || this.streetData.isEntering?.()) return false;

    const hitboxes = this.streetData.houses.map(h => h.hitbox);
    const intersects = raycaster.intersectObjects(hitboxes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const targetUser = hit.userData.user;

      if (this.hoveredHouse) {
        this.hoveredHouse.setHighlight(false);
        this.hoveredHouse = null;
      }
      document.body.style.cursor = 'default';

      if (this.onHouseClick && targetUser) {
        this.onHouseClick(targetUser);
        return true;
      }
    }
    return false;
  }

  driveCarToHouse(targetUser, onParked) {
    this.setPrompt(`🚗 Driving to ${targetUser.name}'s house...`);
    this.streetData.driveCarToHouse(targetUser, this.camera, (arrivedUser) => {
      this.currentParkedUser = arrivedUser;
      const targetHouse = this.streetData.houses.find(h => h.user.id === arrivedUser.id);
      if (targetHouse) {
        this.cameraCenterX = targetHouse.offsetX;
      }
      this.setPrompt(`🏡 Parked at ${arrivedUser.name}'s House! Click the house or door to enter.`);
      if (onParked) onParked(arrivedUser);
    });
  }

  enterHouse(targetUser, onEntered) {
    this.setPrompt(`🚪 Entering ${targetUser.name}'s house...`);
    this.streetData.enterTargetHouse(targetUser, this.user, this.camera, onEntered);
  }

  update(time, delta) {
    // 1. Idle animation for character standing outside
    if (this.streetData.driverChar && this.streetData.driverChar.root.visible && !this.streetData.isDriving()) {
      this.streetData.driverChar.updateIdle(time);
    }

    // 2. Realistic cloud drift across the avenue sky
    if (this.streetData.clouds) {
      this.streetData.clouds.children.forEach(c => {
        c.position.x += (c.userData.speed || 0.6) * delta;
        if (c.position.x > 85) c.position.x = -85;
        if (c.userData.baseY) {
          c.position.y = c.userData.baseY + Math.sin(time * 0.7 + (c.userData.phase || 0)) * 0.35;
        }
      });
    }

    // 3. Sun rays rotation, warm golden glow pulse, and sky alignment
    if (this.streetData.sun) {
      const sun = this.streetData.sun;
      const targetSunX = (this.cameraCenterX || 0) + 19;
      sun.position.x += (targetSunX - sun.position.x) * 0.08;
      if (sun.userData.raysGroup) {
        sun.userData.raysGroup.rotation.z += delta * 0.12;
      }
      if (sun.userData.core) {
        const pulse = 1 + Math.sin(time * 1.6) * 0.035;
        sun.userData.core.scale.set(pulse, pulse, pulse);
      }
    }

    // 4. Flying birds: forward flight, banking into turns, undulating altitude, and wing flapping
    if (this.streetData.birds) {
      this.streetData.birds.forEach(bird => {
        if (bird.userData.isFlying) {
          // Advance across sky along +X
          bird.root.position.x += (bird.userData.speed || 4.2) * delta;
          // Loop across avenue sky
          if (bird.root.position.x > 90) {
            bird.root.position.x = -90;
          }
          // Undulating altitude
          bird.root.position.y = bird.userData.baseY + Math.sin(time * 2.2 + bird.userData.phase) * (bird.userData.amplitude || 0.55);
          // Banking into the breeze
          bird.root.rotation.z = Math.sin(time * 1.8 + bird.userData.phase) * 0.12;

          // Flapping wings
          if (bird.leftWingHinge && bird.rightWingHinge) {
            const flap = Math.sin(time * (bird.userData.flapSpeed || 9.5)) * 0.45;
            bird.leftWingHinge.rotation.z = flap;
            bird.rightWingHinge.rotation.z = -flap;
          }
        } else if (bird.userData.isPerched) {
          // Perched bird cute head tilt and occasional flutter
          if (bird.head) {
            bird.head.rotation.y = Math.sin(time * 3 + bird.userData.phase) > 0.65 ? 0.35 : -0.15;
          }
          if (bird.leftWingHinge && bird.rightWingHinge) {
            const flutter = Math.sin(time * 14) > 0.85 ? Math.sin(time * 22) * 0.25 : 0;
            bird.leftWingHinge.rotation.z = flutter;
            bird.rightWingHinge.rotation.z = -flutter;
          }
        }
      });
    }

    // 5. Chimney smoke puff animation
    if (this.streetData.smokePuffs) {
      this.streetData.smokePuffs.forEach(puff => {
        puff.position.y += (puff.userData.speed || 0.8) * delta;
        puff.position.x += Math.sin(time * 2 + puff.position.y) * 0.005;
        const progress = (puff.position.y - 6.3) / 2.8;
        const scale = 1 + progress * 0.9;
        puff.scale.set(scale, scale, scale);
        puff.material.opacity = Math.max(0, 0.65 * (1 - progress));

        if (puff.position.y > 9.1) {
          puff.position.y = 6.3;
          puff.position.x = 2 + (Math.random() - 0.5) * 0.2;
        }
      });
    }

    // 6. Gentle tree swaying in the breeze
    if (this.streetData.trees) {
      this.streetData.trees.forEach((tree, idx) => {
        tree.rotation.z = Math.sin(time * 1.6 + idx) * 0.025;
      });
    }
  }

  destroy() {
    if (this.promptEl) this.promptEl.remove();
    this.scene.remove(this.streetData.group);
  }
}
