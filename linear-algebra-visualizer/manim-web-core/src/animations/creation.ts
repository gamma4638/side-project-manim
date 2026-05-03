/**
 * Creation animations - FadeIn, FadeOut, Create, etc.
 * Corresponds to ManimCE's creation.py and fading.py
 */

import * as THREE from "three";
import { Animation, AnimationConfig } from "./Animation";
import { Mobject } from "../mobjects/Mobject";
import { VMobject } from "../mobjects/VMobject";

/**
 * Fade in a mobject by animating opacity from 0 to 1
 */
export interface FadeInConfig extends AnimationConfig {
  shiftDirection?: THREE.Vector3;
  shiftAmount?: number;
  scale?: number;
}

export class FadeIn extends Animation {
  protected shiftDirection: THREE.Vector3 | null;
  protected shiftAmount: number;
  protected targetScale: number;
  protected startPosition: THREE.Vector3 | null = null;
  protected startScale: THREE.Vector3 | null = null;

  constructor(mobject: Mobject, config: FadeInConfig = {}) {
    super(mobject, config);

    this.shiftDirection = config.shiftDirection?.clone() ?? null;
    this.shiftAmount = config.shiftAmount ?? 0.5;
    this.targetScale = config.scale ?? 1;
  }

  begin(): void {
    super.begin();
    this.startPosition = this.mobject.position.clone();
    this.startScale = this.mobject.scale.clone();

    // Start invisible
    this.mobject.setOpacity(0);

    // Apply initial shift if specified
    if (this.shiftDirection) {
      const offset = this.shiftDirection.clone().normalize().multiplyScalar(this.shiftAmount);
      this.mobject.position.sub(offset);
    }

    // Apply initial scale
    if (this.targetScale !== 1) {
      this.mobject.scale.multiplyScalar(0);
    }
  }

  protected interpolate(alpha: number): void {
    // Animate opacity
    this.mobject.setOpacity(alpha);

    // Animate position if shifting
    if (this.shiftDirection && this.startPosition) {
      const offset = this.shiftDirection.clone().normalize().multiplyScalar(this.shiftAmount * (1 - alpha));
      const currentPos = this.startPosition.clone().sub(offset);
      this.mobject.position.copy(currentPos);
    }

    // Animate scale
    if (this.targetScale !== 1 && this.startScale) {
      const currentScale = this.startScale.clone().multiplyScalar(alpha);
      this.mobject.scale.copy(currentScale);
    }
  }

  finish(): void {
    this.mobject.setOpacity(1);
    if (this.startPosition) {
      this.mobject.position.copy(this.startPosition);
    }
    if (this.startScale) {
      this.mobject.scale.copy(this.startScale);
    }
    super.finish();
  }
}

/**
 * Fade out a mobject by animating opacity from 1 to 0
 */
export interface FadeOutConfig extends AnimationConfig {
  shiftDirection?: THREE.Vector3;
  shiftAmount?: number;
  scale?: number;
}

export class FadeOut extends Animation {
  protected shiftDirection: THREE.Vector3 | null;
  protected shiftAmount: number;
  protected targetScale: number;
  protected startPosition: THREE.Vector3 | null = null;
  protected startScale: THREE.Vector3 | null = null;

  constructor(mobject: Mobject, config: FadeOutConfig = {}) {
    super(mobject, config);

    this.shiftDirection = config.shiftDirection?.clone() ?? null;
    this.shiftAmount = config.shiftAmount ?? 0.5;
    this.targetScale = config.scale ?? 1;
  }

  begin(): void {
    super.begin();
    this.startPosition = this.mobject.position.clone();
    this.startScale = this.mobject.scale.clone();
  }

  protected interpolate(alpha: number): void {
    // Animate opacity (1 -> 0)
    this.mobject.setOpacity(1 - alpha);

    // Animate position if shifting
    if (this.shiftDirection && this.startPosition) {
      const offset = this.shiftDirection.clone().normalize().multiplyScalar(this.shiftAmount * alpha);
      const currentPos = this.startPosition.clone().add(offset);
      this.mobject.position.copy(currentPos);
    }

    // Animate scale
    if (this.targetScale !== 1 && this.startScale) {
      const currentScale = this.startScale.clone().multiplyScalar(1 - alpha);
      this.mobject.scale.copy(currentScale);
    }
  }

  finish(): void {
    this.mobject.setOpacity(0);
    super.finish();
  }
}

/**
 * Create animation - draws the mobject by animating along its path
 */
export class Create extends Animation {
  constructor(mobject: Mobject, config: AnimationConfig = {}) {
    super(mobject, { runTime: 2, ...config });
  }

  begin(): void {
    super.begin();
    // Start with the mobject invisible (will be revealed progressively)
    this.mobject.setOpacity(0);
  }

  protected interpolate(alpha: number): void {
    if (this.mobject instanceof VMobject) {
      // For VMobjects, we reveal points progressively
      const allPoints = (this.startingMobject as VMobject)?.getPoints() || [];
      const numPoints = Math.floor(allPoints.length * alpha);
      const visiblePoints = allPoints.slice(0, Math.max(numPoints, 2));

      this.mobject.setOpacity(alpha > 0 ? 1 : 0);
      this.mobject.setPoints(visiblePoints);
    } else {
      // For other mobjects, just fade in
      this.mobject.setOpacity(alpha);
    }
  }

  finish(): void {
    if (this.startingMobject instanceof VMobject) {
      (this.mobject as VMobject).setPoints(this.startingMobject.getPoints());
    }
    this.mobject.setOpacity(1);
    super.finish();
  }
}

/**
 * Uncreate animation - reverse of Create
 */
export class Uncreate extends Animation {
  protected originalPoints: THREE.Vector3[] = [];

  constructor(mobject: Mobject, config: AnimationConfig = {}) {
    super(mobject, { runTime: 2, ...config });
  }

  begin(): void {
    super.begin();
    if (this.mobject instanceof VMobject) {
      this.originalPoints = this.mobject.getPoints().map(p => p.clone());
    }
  }

  protected interpolate(alpha: number): void {
    if (this.mobject instanceof VMobject) {
      const reverseAlpha = 1 - alpha;
      const numPoints = Math.floor(this.originalPoints.length * reverseAlpha);
      const visiblePoints = this.originalPoints.slice(0, Math.max(numPoints, 2));
      this.mobject.setPoints(visiblePoints);
    } else {
      this.mobject.setOpacity(1 - alpha);
    }
  }

  finish(): void {
    this.mobject.setOpacity(0);
    super.finish();
  }
}

/**
 * DrawBorderThenFill - Draws the border then fills
 */
export class DrawBorderThenFill extends Animation {
  protected borderDrawTime: number;

  constructor(mobject: Mobject, config: AnimationConfig = {}) {
    super(mobject, { runTime: 2, ...config });
    this.borderDrawTime = 0.5; // Border takes 50% of time
  }

  begin(): void {
    super.begin();
    this.mobject.setOpacity(0);
    this.mobject.setFillOpacity(0);
  }

  protected interpolate(alpha: number): void {
    if (alpha <= this.borderDrawTime) {
      // Drawing border phase
      const borderAlpha = alpha / this.borderDrawTime;
      this.mobject.setStrokeOpacity(borderAlpha);

      if (this.mobject instanceof VMobject) {
        const allPoints = (this.startingMobject as VMobject)?.getPoints() || [];
        const numPoints = Math.floor(allPoints.length * borderAlpha);
        const visiblePoints = allPoints.slice(0, Math.max(numPoints, 2));
        this.mobject.setPoints(visiblePoints);
      }
    } else {
      // Filling phase
      const fillAlpha = (alpha - this.borderDrawTime) / (1 - this.borderDrawTime);
      this.mobject.setStrokeOpacity(1);
      this.mobject.setFillOpacity(fillAlpha);

      if (this.mobject instanceof VMobject && this.startingMobject instanceof VMobject) {
        this.mobject.setPoints(this.startingMobject.getPoints());
      }
    }
  }

  finish(): void {
    if (this.startingMobject instanceof VMobject) {
      (this.mobject as VMobject).setPoints(this.startingMobject.getPoints());
    }
    this.mobject.setOpacity(1);
    super.finish();
  }
}

/**
 * GrowFromCenter - Grow a mobject from its center
 */
export class GrowFromCenter extends Animation {
  protected startScale: THREE.Vector3 | null = null;

  constructor(mobject: Mobject, config: AnimationConfig = {}) {
    super(mobject, config);
  }

  begin(): void {
    super.begin();
    this.startScale = this.mobject.scale.clone();
    this.mobject.scale.set(0, 0, 0);
    this.mobject.setOpacity(0);
  }

  protected interpolate(alpha: number): void {
    if (this.startScale) {
      this.mobject.scale.copy(this.startScale.clone().multiplyScalar(alpha));
    }
    this.mobject.setOpacity(alpha);
  }

  finish(): void {
    if (this.startScale) {
      this.mobject.scale.copy(this.startScale);
    }
    this.mobject.setOpacity(1);
    super.finish();
  }
}

/**
 * GrowArrow - Specialized animation for growing arrows
 */
export class GrowArrow extends GrowFromCenter {
  constructor(mobject: Mobject, config: AnimationConfig = {}) {
    super(mobject, config);
  }
}

/**
 * SpinInFromNothing - Spin and scale from nothing
 */
export class SpinInFromNothing extends Animation {
  protected startScale: THREE.Vector3 | null = null;
  protected rotations: number;

  constructor(mobject: Mobject, config: AnimationConfig & { rotations?: number } = {}) {
    super(mobject, { runTime: 1.5, ...config });
    this.rotations = config.rotations ?? 1;
  }

  begin(): void {
    super.begin();
    this.startScale = this.mobject.scale.clone();
    this.mobject.scale.set(0, 0, 0);
    this.mobject.setOpacity(0);
  }

  protected interpolate(alpha: number): void {
    // Scale up
    if (this.startScale) {
      this.mobject.scale.copy(this.startScale.clone().multiplyScalar(alpha));
    }

    // Rotate
    const angle = this.rotations * 2 * Math.PI * (1 - alpha);
    this.mobject.rotation.z = angle;

    this.mobject.setOpacity(alpha);
  }

  finish(): void {
    if (this.startScale) {
      this.mobject.scale.copy(this.startScale);
    }
    this.mobject.rotation.z = 0;
    this.mobject.setOpacity(1);
    super.finish();
  }
}
