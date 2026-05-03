/**
 * Transform animations - Transform, ApplyMatrix, etc.
 * Corresponds to ManimCE's transform.py and movement.py
 */

import * as THREE from "three";
import { Animation, AnimationConfig } from "./Animation";
import { Mobject } from "../mobjects/Mobject";
import { VMobject } from "../mobjects/VMobject";

/**
 * Transform one mobject into another
 */
export interface TransformConfig extends AnimationConfig {
  pathArc?: number;
  pathArcAxis?: THREE.Vector3;
  replaceMobject?: boolean;
}

export class Transform extends Animation {
  protected targetMobject: Mobject;
  protected pathArc: number;
  protected pathArcAxis: THREE.Vector3;
  protected replaceMobject: boolean;

  protected startPoints: THREE.Vector3[] = [];
  protected endPoints: THREE.Vector3[] = [];
  protected startPosition: THREE.Vector3 | null = null;
  protected endPosition: THREE.Vector3 | null = null;
  protected startScale: THREE.Vector3 | null = null;
  protected endScale: THREE.Vector3 | null = null;
  protected startRotation: THREE.Euler | null = null;
  protected endRotation: THREE.Euler | null = null;

  constructor(
    mobject: Mobject,
    targetMobject: Mobject,
    config: TransformConfig = {}
  ) {
    super(mobject, config);
    this.targetMobject = targetMobject;
    this.pathArc = config.pathArc ?? 0;
    this.pathArcAxis = config.pathArcAxis ?? new THREE.Vector3(0, 0, 1);
    this.replaceMobject = config.replaceMobject ?? true;
  }

  begin(): void {
    super.begin();

    // Store start states
    this.startPosition = this.mobject.position.clone();
    this.startScale = this.mobject.scale.clone();
    this.startRotation = this.mobject.rotation.clone();

    this.endPosition = this.targetMobject.position.clone();
    this.endScale = this.targetMobject.scale.clone();
    this.endRotation = this.targetMobject.rotation.clone();

    // For VMobjects, handle point interpolation
    if (this.mobject instanceof VMobject && this.targetMobject instanceof VMobject) {
      this.startPoints = this.mobject.getPoints().map(p => p.clone());
      this.endPoints = this.targetMobject.getPoints().map(p => p.clone());

      // Match point counts
      this.matchPointCounts();
    }

    // Match style
    this.startStrokeColor = this.mobject.getStrokeColor();
    this.startFillColor = this.mobject.getFillColor();
    this.startStrokeOpacity = this.mobject.getStrokeOpacity();
    this.startFillOpacity = this.mobject.getFillOpacity();
  }

  protected startStrokeColor: string = "#FFFFFF";
  protected startFillColor: string = "#FFFFFF";
  protected startStrokeOpacity: number = 1;
  protected startFillOpacity: number = 0;

  protected matchPointCounts(): void {
    const startLen = this.startPoints.length;
    const endLen = this.endPoints.length;

    if (startLen === endLen) return;

    // Resample the shorter array to match the longer
    const targetLen = Math.max(startLen, endLen);

    if (startLen < targetLen) {
      this.startPoints = this.resamplePoints(this.startPoints, targetLen);
    }
    if (endLen < targetLen) {
      this.endPoints = this.resamplePoints(this.endPoints, targetLen);
    }
  }

  protected resamplePoints(points: THREE.Vector3[], targetLen: number): THREE.Vector3[] {
    if (points.length === 0) return [];
    if (points.length === 1) {
      return Array(targetLen).fill(null).map(() => points[0].clone());
    }

    const result: THREE.Vector3[] = [];
    for (let i = 0; i < targetLen; i++) {
      const t = i / (targetLen - 1);
      const sourceIdx = t * (points.length - 1);
      const lower = Math.floor(sourceIdx);
      const upper = Math.min(lower + 1, points.length - 1);
      const localT = sourceIdx - lower;

      const p = points[lower].clone().lerp(points[upper], localT);
      result.push(p);
    }
    return result;
  }

  protected interpolate(alpha: number): void {
    // Interpolate position
    if (this.startPosition && this.endPosition) {
      if (Math.abs(this.pathArc) > 0.001) {
        // Arc interpolation
        const center = this.startPosition.clone().add(this.endPosition).multiplyScalar(0.5);
        const startOffset = this.startPosition.clone().sub(center);
        const angle = this.pathArc * alpha;

        const rotMatrix = new THREE.Matrix4().makeRotationAxis(this.pathArcAxis, angle);
        const currentOffset = startOffset.applyMatrix4(rotMatrix);
        const arcPos = center.clone().add(currentOffset);

        // Blend arc with linear for smoother results
        const linearPos = this.startPosition.clone().lerp(this.endPosition, alpha);
        this.mobject.position.copy(arcPos.lerp(linearPos, 0.3));
      } else {
        // Linear interpolation
        this.mobject.position.copy(
          this.startPosition.clone().lerp(this.endPosition, alpha)
        );
      }
    }

    // Interpolate scale
    if (this.startScale && this.endScale) {
      this.mobject.scale.copy(
        this.startScale.clone().lerp(this.endScale, alpha)
      );
    }

    // Interpolate rotation
    if (this.startRotation && this.endRotation) {
      const q1 = new THREE.Quaternion().setFromEuler(this.startRotation);
      const q2 = new THREE.Quaternion().setFromEuler(this.endRotation);
      const qResult = q1.slerp(q2, alpha);
      this.mobject.rotation.setFromQuaternion(qResult);
    }

    // Interpolate points for VMobjects
    if (this.mobject instanceof VMobject && this.startPoints.length > 0) {
      const currentPoints = this.startPoints.map((p, i) =>
        p.clone().lerp(this.endPoints[i], alpha)
      );
      this.mobject.setPoints(currentPoints);
    }

    // Interpolate colors
    const startColor = new THREE.Color(this.startStrokeColor);
    const endColor = new THREE.Color(this.targetMobject.getStrokeColor());
    const currentColor = startColor.lerp(endColor, alpha);
    this.mobject.setStrokeColor("#" + currentColor.getHexString());

    const startFill = new THREE.Color(this.startFillColor);
    const endFill = new THREE.Color(this.targetMobject.getFillColor());
    const currentFill = startFill.lerp(endFill, alpha);
    this.mobject.setFillColor("#" + currentFill.getHexString());

    // Interpolate opacities
    const strokeOpacity = this.startStrokeOpacity + (this.targetMobject.getStrokeOpacity() - this.startStrokeOpacity) * alpha;
    const fillOpacity = this.startFillOpacity + (this.targetMobject.getFillOpacity() - this.startFillOpacity) * alpha;
    this.mobject.setStrokeOpacity(strokeOpacity);
    this.mobject.setFillOpacity(fillOpacity);
  }

  finish(): void {
    // Final state matches target
    if (this.endPosition) {
      this.mobject.position.copy(this.endPosition);
    }
    if (this.endScale) {
      this.mobject.scale.copy(this.endScale);
    }
    if (this.endRotation) {
      this.mobject.rotation.copy(this.endRotation);
    }

    if (this.mobject instanceof VMobject && this.endPoints.length > 0) {
      this.mobject.setPoints(this.endPoints);
    }

    this.mobject.setStrokeColor(this.targetMobject.getStrokeColor());
    this.mobject.setFillColor(this.targetMobject.getFillColor());
    this.mobject.setStrokeOpacity(this.targetMobject.getStrokeOpacity());
    this.mobject.setFillOpacity(this.targetMobject.getFillOpacity());

    super.finish();
  }
}

/**
 * ReplacementTransform - Like Transform but replaces the mobject in the scene
 */
export class ReplacementTransform extends Transform {
  constructor(
    mobject: Mobject,
    targetMobject: Mobject,
    config: TransformConfig = {}
  ) {
    super(mobject, targetMobject, { replaceMobject: true, ...config });
  }
}

/**
 * Apply a matrix transformation to a mobject
 */
export interface ApplyMatrixConfig extends AnimationConfig {
  aboutPoint?: THREE.Vector3;
}

export class ApplyMatrix extends Animation {
  protected matrix: THREE.Matrix4;
  protected aboutPoint: THREE.Vector3;
  protected startPoints: THREE.Vector3[] = [];

  constructor(
    mobject: Mobject,
    matrix: number[][] | THREE.Matrix4,
    config: ApplyMatrixConfig = {}
  ) {
    super(mobject, { runTime: 3, ...config });

    if (matrix instanceof THREE.Matrix4) {
      this.matrix = matrix.clone();
    } else {
      // Convert 2D array to Matrix4
      this.matrix = new THREE.Matrix4();
      if (matrix.length === 2) {
        // 2x2 matrix for 2D transforms
        this.matrix.set(
          matrix[0][0], matrix[0][1], 0, 0,
          matrix[1][0], matrix[1][1], 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        );
      } else if (matrix.length === 3) {
        // 3x3 matrix
        this.matrix.set(
          matrix[0][0], matrix[0][1], matrix[0][2], 0,
          matrix[1][0], matrix[1][1], matrix[1][2], 0,
          matrix[2][0], matrix[2][1], matrix[2][2], 0,
          0, 0, 0, 1
        );
      }
    }

    this.aboutPoint = config.aboutPoint ?? new THREE.Vector3(0, 0, 0);
  }

  begin(): void {
    super.begin();

    if (this.mobject instanceof VMobject) {
      this.startPoints = this.mobject.getPoints().map(p => p.clone());
    }
  }

  protected interpolate(alpha: number): void {
    if (!(this.mobject instanceof VMobject)) return;

    // Create interpolated matrix
    const identity = new THREE.Matrix4();
    const interpMatrix = new THREE.Matrix4();

    // Interpolate between identity and target matrix
    for (let i = 0; i < 16; i++) {
      interpMatrix.elements[i] =
        identity.elements[i] * (1 - alpha) + this.matrix.elements[i] * alpha;
    }

    // Apply transformation about the specified point
    const translateToOrigin = new THREE.Matrix4().makeTranslation(
      -this.aboutPoint.x,
      -this.aboutPoint.y,
      -this.aboutPoint.z
    );
    const translateBack = new THREE.Matrix4().makeTranslation(
      this.aboutPoint.x,
      this.aboutPoint.y,
      this.aboutPoint.z
    );

    const fullMatrix = new THREE.Matrix4()
      .multiply(translateBack)
      .multiply(interpMatrix)
      .multiply(translateToOrigin);

    // Transform points
    const newPoints = this.startPoints.map(p =>
      p.clone().applyMatrix4(fullMatrix)
    );

    this.mobject.setPoints(newPoints);
  }

  finish(): void {
    if (this.mobject instanceof VMobject) {
      const newPoints = this.startPoints.map(p =>
        p.clone().applyMatrix4(this.matrix)
      );
      this.mobject.setPoints(newPoints);
    }
    super.finish();
  }
}

/**
 * Move a mobject to a target position
 */
export interface MoveToTargetConfig extends AnimationConfig {
  // Target position is set via mobject.target
}

export class MoveToTarget extends Animation {
  protected target: Mobject;
  protected startPosition: THREE.Vector3 | null = null;

  constructor(mobject: Mobject, target: Mobject, config: MoveToTargetConfig = {}) {
    super(mobject, config);
    this.target = target;
  }

  begin(): void {
    super.begin();
    this.startPosition = this.mobject.position.clone();
  }

  protected interpolate(alpha: number): void {
    if (this.startPosition) {
      this.mobject.position.copy(
        this.startPosition.clone().lerp(this.target.position, alpha)
      );
    }
  }
}

/**
 * Rotate a mobject
 */
export interface RotateConfig extends AnimationConfig {
  angle?: number;
  axis?: THREE.Vector3;
  aboutPoint?: THREE.Vector3;
}

export class Rotate extends Animation {
  protected angle: number;
  protected axis: THREE.Vector3;
  protected aboutPoint: THREE.Vector3 | null;
  protected startRotation: THREE.Euler | null = null;

  constructor(mobject: Mobject, config: RotateConfig = {}) {
    super(mobject, config);

    this.angle = config.angle ?? Math.PI;
    this.axis = config.axis ?? new THREE.Vector3(0, 0, 1);
    this.aboutPoint = config.aboutPoint ?? null;
  }

  begin(): void {
    super.begin();
    this.startRotation = this.mobject.rotation.clone();
  }

  protected interpolate(alpha: number): void {
    if (!this.startRotation) return;

    const currentAngle = this.angle * alpha;

    if (this.aboutPoint) {
      // Rotate about a specific point
      const q = new THREE.Quaternion().setFromAxisAngle(this.axis, currentAngle);
      const offset = this.mobject.position.clone().sub(this.aboutPoint);
      offset.applyQuaternion(q);
      this.mobject.position.copy(this.aboutPoint.clone().add(offset));
    }

    // Rotate the mobject itself
    const q = new THREE.Quaternion().setFromEuler(this.startRotation);
    const rotQ = new THREE.Quaternion().setFromAxisAngle(this.axis, currentAngle);
    q.multiply(rotQ);
    this.mobject.rotation.setFromQuaternion(q);
  }
}

/**
 * Scale a mobject
 */
export interface ScaleConfig extends AnimationConfig {
  scaleFactor?: number;
  aboutPoint?: THREE.Vector3;
}

export class Scale extends Animation {
  protected scaleFactor: number;
  protected aboutPoint: THREE.Vector3 | null;
  protected startScale: THREE.Vector3 | null = null;

  constructor(mobject: Mobject, config: ScaleConfig = {}) {
    super(mobject, config);

    this.scaleFactor = config.scaleFactor ?? 2;
    this.aboutPoint = config.aboutPoint ?? null;
  }

  begin(): void {
    super.begin();
    this.startScale = this.mobject.scale.clone();
  }

  protected interpolate(alpha: number): void {
    if (!this.startScale) return;

    const currentFactor = 1 + (this.scaleFactor - 1) * alpha;
    this.mobject.scale.copy(this.startScale.clone().multiplyScalar(currentFactor));
  }
}
