import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { createCharacter } from './procedural.js';
import { tweenCamera, screenFade } from './helpers.js';

export class HouseFrontSequence {
  constructor(scene, camera, user, streetScene, onComplete) {
    this.scene = scene;
    this.camera = camera;
    this.user = user;
    this.streetScene = streetScene;
    this.onComplete = onComplete;

    this.character = createCharacter(user);
    this.character.root.position.set(0, 0.4, 2.7); // Inside doorway
    this.character.root.visible = false;
    this.scene.add(this.character.root);

    this.isWaving = false;
    this.startTime = 0;
    this.greetingBubble = null;
  }

  play() {
    const doorHinge = this.streetScene.streetData.doorHinge;

    // 1. Tween camera from street overview to front porch
    const porchCamPos = new THREE.Vector3(0, 2.8, 8.5);
    const porchLookAt = new THREE.Vector3(0, 2.0, 3.0);

    tweenCamera(this.camera, porchCamPos, porchLookAt, 1200, TWEEN.Easing.Cubic.Out, () => {
      // 2. Door swings open smoothly
      new TWEEN.Tween({ angle: 0 }, true)
        .to({ angle: -Math.PI * 0.45 }, 600)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate((obj) => {
          if (doorHinge) doorHinge.rotation.y = obj.angle;
        })
        .onComplete(() => {
          // 3. Character steps out onto the porch
          this.character.root.visible = true;
          this.showGreeting();

          new TWEEN.Tween({ z: 2.7 }, true)
            .to({ z: 3.9 }, 700)
            .easing(TWEEN.Easing.Cubic.Out)
            .onUpdate((obj) => {
              this.character.root.position.z = obj.z;
            })
            .onComplete(() => {
              // 4. Character waves enthusiastically
              this.isWaving = true;

              // After 1.8 seconds of waving hello, camera smoothly steps inside through the door
              setTimeout(() => {
                this.enterHouse();
              }, 1800);
            })
            .start();
        })
        .start();
    });
  }

  showGreeting() {
    this.greetingBubble = document.createElement('div');
    this.greetingBubble.className = 'scene-hint';
    this.greetingBubble.style.borderColor = '#10b981';
    this.greetingBubble.innerHTML = `
      <span class="scene-hint-dot" style="background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
      <span>👋 Welcome to my library! Come on in!</span>
    `;
    const overlay = document.getElementById('ui-overlay');
    if (overlay) overlay.appendChild(this.greetingBubble);
  }

  enterHouse() {
    if (this.greetingBubble) this.greetingBubble.remove();

    // Camera zooms straight through the door into the house
    const enterPos = new THREE.Vector3(0, 2.2, 1.8);
    const enterLookAt = new THREE.Vector3(0, 2.2, -6.0);

    // Fade to black right as camera reaches the threshold
    screenFade(700, () => {
      this.cleanup();
      if (this.onComplete) this.onComplete();
    });

    tweenCamera(this.camera, enterPos, enterLookAt, 700, TWEEN.Easing.Cubic.In);
  }

  update(time) {
    if (this.isWaving) {
      this.character.updateWave(time);
    } else if (this.character.root.visible) {
      this.character.updateIdle(time);
    }
  }

  cleanup() {
    if (this.greetingBubble) this.greetingBubble.remove();
    this.isWaving = false;
    this.scene.remove(this.character.root);
    // Reset door
    if (this.streetScene.streetData.doorHinge) {
      this.streetScene.streetData.doorHinge.rotation.y = 0;
    }
  }
}
