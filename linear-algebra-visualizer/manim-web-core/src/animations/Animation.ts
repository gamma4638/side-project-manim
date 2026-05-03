/**
 * Base Animation class
 * Corresponds to ManimCE's Animation class
 */

import { Mobject } from "../mobjects/Mobject";
import { RateFunc, smooth } from "../rate-functions";
import { DEFAULT_ANIMATION_RUN_TIME } from "../constants";

export interface AnimationConfig {
  runTime?: number;
  rateFunc?: RateFunc;
  lagRatio?: number;
  suspendMobjectUpdating?: boolean;
  name?: string;
}

/**
 * Base class for all animations
 */
export abstract class Animation {
  protected mobject: Mobject;
  protected runTime: number;
  protected rateFunc: RateFunc;
  protected lagRatio: number;
  protected name: string;

  protected startingMobject: Mobject | null = null;
  protected _isFinished: boolean = false;

  constructor(mobject: Mobject, config: AnimationConfig = {}) {
    this.mobject = mobject;
    this.runTime = config.runTime ?? DEFAULT_ANIMATION_RUN_TIME;
    this.rateFunc = config.rateFunc ?? smooth;
    this.lagRatio = config.lagRatio ?? 0;
    this.name = config.name ?? this.constructor.name;
  }

  /**
   * Get the mobject being animated
   */
  getMobject(): Mobject {
    return this.mobject;
  }

  /**
   * Get the total run time
   */
  getRunTime(): number {
    return this.runTime;
  }

  /**
   * Called when the animation starts
   */
  begin(): void {
    this.startingMobject = this.mobject.clone();
    this.interpolate(0);
  }

  /**
   * Called when the animation finishes
   */
  finish(): void {
    this.interpolate(1);
    this._isFinished = true;
  }

  /**
   * Check if animation is finished
   */
  isFinished(): boolean {
    return this._isFinished;
  }

  /**
   * Update the animation at a given alpha (0-1)
   */
  update(alpha: number): void {
    const subAlpha = this.rateFunc(alpha);
    this.interpolate(subAlpha);
  }

  /**
   * Interpolate the mobject state
   * Subclasses must implement this
   */
  protected abstract interpolate(alpha: number): void;

  /**
   * Clean up after animation
   */
  cleanUp(): void {
    this.startingMobject = null;
  }
}

/**
 * Animation that waits for a duration without changing anything
 */
export class Wait extends Animation {
  constructor(duration: number = 1) {
    // Create a dummy mobject for Wait
    const dummyMobject = {
      getPoints: () => [],
      clone: () => dummyMobject,
    } as unknown as Mobject;

    super(dummyMobject, { runTime: duration });
  }

  protected interpolate(_alpha: number): void {
    // Do nothing - just wait
  }
}

/**
 * Animation group - plays multiple animations simultaneously
 */
export class AnimationGroup extends Animation {
  protected animations: Animation[];
  protected maxRunTime: number;

  constructor(
    ...animations: Animation[]
  ) {
    // Get the longest animation's mobject as the "main" mobject
    const mainMobject = animations[0]?.getMobject() || ({
      getPoints: () => [],
      clone: function() { return this; },
    } as unknown as Mobject);

    super(mainMobject);

    this.animations = animations;
    this.maxRunTime = Math.max(
      ...animations.map(a => a.getRunTime()),
      0
    );
    this.runTime = this.maxRunTime;
  }

  begin(): void {
    for (const animation of this.animations) {
      animation.begin();
    }
  }

  protected interpolate(alpha: number): void {
    for (const animation of this.animations) {
      const relativeRunTime = animation.getRunTime() / this.maxRunTime;
      if (alpha <= relativeRunTime) {
        const scaledAlpha = alpha / relativeRunTime;
        animation.update(scaledAlpha);
      } else {
        animation.update(1);
      }
    }
  }

  finish(): void {
    for (const animation of this.animations) {
      animation.finish();
    }
    this._isFinished = true;
  }

  cleanUp(): void {
    for (const animation of this.animations) {
      animation.cleanUp();
    }
  }
}

/**
 * Plays animations in sequence
 */
export class Succession extends Animation {
  protected animations: Animation[];
  protected totalRunTime: number;
  protected animationStartTimes: number[];

  constructor(...animations: Animation[]) {
    const mainMobject = animations[0]?.getMobject() || ({
      getPoints: () => [],
      clone: function() { return this; },
    } as unknown as Mobject);

    super(mainMobject);

    this.animations = animations;
    this.totalRunTime = animations.reduce((sum, a) => sum + a.getRunTime(), 0);
    this.runTime = this.totalRunTime;

    // Calculate start times
    this.animationStartTimes = [];
    let cumulative = 0;
    for (const anim of animations) {
      this.animationStartTimes.push(cumulative);
      cumulative += anim.getRunTime();
    }
  }

  begin(): void {
    // Only begin the first animation initially
    if (this.animations.length > 0) {
      this.animations[0].begin();
    }
  }

  protected interpolate(alpha: number): void {
    const currentTime = alpha * this.totalRunTime;

    for (let i = 0; i < this.animations.length; i++) {
      const startTime = this.animationStartTimes[i];
      const endTime = startTime + this.animations[i].getRunTime();

      if (currentTime >= startTime && currentTime < endTime) {
        // This animation is currently active
        const localAlpha = (currentTime - startTime) / this.animations[i].getRunTime();
        this.animations[i].update(localAlpha);
      } else if (currentTime >= endTime) {
        // This animation has completed
        if (!this.animations[i].isFinished()) {
          this.animations[i].finish();
        }
      }
    }
  }

  finish(): void {
    for (const animation of this.animations) {
      if (!animation.isFinished()) {
        animation.finish();
      }
    }
    this._isFinished = true;
  }
}

/**
 * Lag ratio animation - stagger animations based on submobjects
 */
export class LaggedStart extends AnimationGroup {
  constructor(
    animations: Animation[],
    lagRatio: number = 0.05
  ) {
    super(...animations);

    // Adjust each animation's effective start time based on lag ratio
    const baseDuration = animations[0]?.getRunTime() ?? 1;
    const totalLag = lagRatio * baseDuration * (animations.length - 1);
    this.runTime = this.maxRunTime + totalLag;
  }
}
