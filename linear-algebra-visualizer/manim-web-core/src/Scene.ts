/**
 * Scene class - The main container for all Mobjects and animations
 * Corresponds to ManimCE's Scene class
 */

import * as THREE from "three";
import { Mobject } from "./mobjects/Mobject";
import { VMobject } from "./mobjects/VMobject";
import { Animation, Wait } from "./animations/Animation";
import { RateFunc, smooth } from "./rate-functions";
import { BACKGROUND_COLOR } from "./colors";
import { FRAME_WIDTH, FRAME_HEIGHT } from "./constants";

export interface SceneConfig {
  backgroundColor?: string;
  width?: number;
  height?: number;
  frameWidth?: number;
  frameHeight?: number;
  antialias?: boolean;
  pixelRatio?: number;
}

export interface PlayOptions {
  runTime?: number;
  rateFunc?: RateFunc;
}

/**
 * The Scene manages the Three.js scene, camera, renderer, and animation timeline
 */
export class Scene {
  protected threeScene: THREE.Scene;
  protected camera: THREE.OrthographicCamera | THREE.PerspectiveCamera;
  protected renderer: THREE.WebGLRenderer;
  protected container: HTMLElement | null = null;

  protected mobjects: Set<Mobject> = new Set();
  protected animationQueue: Animation[] = [];
  protected isPlaying: boolean = false;
  protected currentTime: number = 0;
  protected totalTime: number = 0;

  protected frameWidth: number;
  protected frameHeight: number;
  protected width: number;
  protected height: number;

  // Animation frame ID for cancellation
  protected animationFrameId: number | null = null;

  // Callback for animation updates
  protected onUpdate: ((progress: number) => void) | null = null;
  protected onAnimationComplete: (() => void) | null = null;

  constructor(config: SceneConfig = {}) {
    this.frameWidth = config.frameWidth ?? FRAME_WIDTH;
    this.frameHeight = config.frameHeight ?? FRAME_HEIGHT;
    this.width = config.width ?? 800;
    this.height = config.height ?? 450;

    // Create Three.js scene
    this.threeScene = new THREE.Scene();
    this.threeScene.background = new THREE.Color(
      config.backgroundColor ?? BACKGROUND_COLOR
    );

    // Create orthographic camera for 2D (like Manim)
    const aspect = this.width / this.height;
    const halfWidth = this.frameWidth / 2;
    const halfHeight = this.frameHeight / 2;

    this.camera = new THREE.OrthographicCamera(
      -halfWidth * aspect,
      halfWidth * aspect,
      halfHeight,
      -halfHeight,
      0.1,
      1000
    );
    this.camera.position.z = 10;

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: config.antialias ?? true,
      alpha: true,
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(config.pixelRatio ?? window.devicePixelRatio);
  }

  /**
   * Mount the scene to a DOM element
   */
  mount(container: HTMLElement): void {
    this.container = container;
    container.appendChild(this.renderer.domElement);
    this.resize(container.clientWidth, container.clientHeight);
    this.render();
  }

  /**
   * Unmount the scene
   */
  unmount(): void {
    if (this.container && this.renderer.domElement.parentElement) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.container = null;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /**
   * Resize the scene
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    const aspect = width / height;
    const halfWidth = this.frameWidth / 2;
    const halfHeight = this.frameHeight / 2;

    if (this.camera instanceof THREE.OrthographicCamera) {
      this.camera.left = -halfWidth * aspect;
      this.camera.right = halfWidth * aspect;
      this.camera.top = halfHeight;
      this.camera.bottom = -halfHeight;
      this.camera.updateProjectionMatrix();
    }

    this.renderer.setSize(width, height);

    // Update VMobject resolutions
    for (const mobject of this.mobjects) {
      if (mobject instanceof VMobject) {
        mobject.setResolution(width, height);
      }
    }

    this.render();
  }

  /**
   * Get the Three.js scene
   */
  getThreeScene(): THREE.Scene {
    return this.threeScene;
  }

  /**
   * Get the camera
   */
  getCamera(): THREE.OrthographicCamera | THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get the renderer
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Switch to 3D perspective camera
   */
  use3DCamera(fov: number = 60): void {
    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);
    this.render();
  }

  /**
   * Switch back to 2D orthographic camera
   */
  use2DCamera(): void {
    const aspect = this.width / this.height;
    const halfWidth = this.frameWidth / 2;
    const halfHeight = this.frameHeight / 2;

    this.camera = new THREE.OrthographicCamera(
      -halfWidth * aspect,
      halfWidth * aspect,
      halfHeight,
      -halfHeight,
      0.1,
      1000
    );
    this.camera.position.z = 10;
    this.render();
  }

  /**
   * Add mobject(s) to the scene
   */
  add(...mobjects: Mobject[]): void {
    for (const mobject of mobjects) {
      this.mobjects.add(mobject);
      this.threeScene.add(mobject);

      // Set resolution for VMobjects
      if (mobject instanceof VMobject) {
        mobject.setResolution(this.width, this.height);
      }
    }
    this.render();
  }

  /**
   * Remove mobject(s) from the scene
   */
  remove(...mobjects: Mobject[]): void {
    for (const mobject of mobjects) {
      this.mobjects.delete(mobject);
      this.threeScene.remove(mobject);
    }
    this.render();
  }

  /**
   * Clear all mobjects from the scene
   */
  clear(): void {
    for (const mobject of this.mobjects) {
      this.threeScene.remove(mobject);
    }
    this.mobjects.clear();
    this.render();
  }

  /**
   * Render the scene
   */
  render(): void {
    this.renderer.render(this.threeScene, this.camera);
  }

  /**
   * Play animation(s)
   */
  async play(...animations: Animation[]): Promise<void> {
    if (animations.length === 0) return;

    // Begin all animations
    for (const animation of animations) {
      animation.begin();

      // Make sure the mobject is in the scene
      const mobject = animation.getMobject();
      if (mobject && !this.mobjects.has(mobject)) {
        this.add(mobject);
      }
    }

    // Get max run time
    const maxRunTime = Math.max(...animations.map(a => a.getRunTime()));

    // Animate
    return new Promise<void>((resolve) => {
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = (currentTime - startTime) / 1000; // Convert to seconds
        const alpha = Math.min(elapsed / maxRunTime, 1);

        // Update all animations
        for (const animation of animations) {
          const localAlpha = Math.min(elapsed / animation.getRunTime(), 1);
          animation.update(localAlpha);
        }

        this.render();

        if (this.onUpdate) {
          this.onUpdate(alpha);
        }

        if (alpha < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          // Finish all animations
          for (const animation of animations) {
            animation.finish();
            animation.cleanUp();
          }
          this.render();

          if (this.onAnimationComplete) {
            this.onAnimationComplete();
          }

          resolve();
        }
      };

      this.animationFrameId = requestAnimationFrame(animate);
    });
  }

  /**
   * Wait for a duration
   */
  async wait(duration: number = 1): Promise<void> {
    return this.play(new Wait(duration));
  }

  /**
   * Play animations in sequence
   */
  async playSequence(...animations: Animation[]): Promise<void> {
    for (const animation of animations) {
      await this.play(animation);
    }
  }

  /**
   * Set update callback
   */
  setOnUpdate(callback: (progress: number) => void): void {
    this.onUpdate = callback;
  }

  /**
   * Set animation complete callback
   */
  setOnAnimationComplete(callback: () => void): void {
    this.onAnimationComplete = callback;
  }

  /**
   * Stop current animation
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.stop();
    this.unmount();

    // Dispose mobjects
    for (const mobject of this.mobjects) {
      mobject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          } else if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          }
        }
      });
    }

    this.mobjects.clear();
    this.renderer.dispose();
  }

  /**
   * Create a snapshot as a data URL
   */
  toDataURL(type: string = "image/png"): string {
    this.render();
    return this.renderer.domElement.toDataURL(type);
  }

  /**
   * Get all mobjects in the scene
   */
  getMobjects(): Mobject[] {
    return Array.from(this.mobjects);
  }
}

/**
 * Create a scene and mount it to a container
 */
export function createScene(
  container: HTMLElement,
  config?: SceneConfig
): Scene {
  const scene = new Scene(config);
  scene.mount(container);
  return scene;
}
