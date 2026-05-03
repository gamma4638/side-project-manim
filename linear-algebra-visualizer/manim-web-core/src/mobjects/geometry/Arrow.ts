/**
 * Arrow Mobject - A line with an arrowhead
 * Corresponds to ManimCE's Arrow class
 */

import * as THREE from "three";
import { Line, LineConfig } from "./Line";
import {
  ARROW_STROKE_WIDTH,
  ARROW_BUFF,
  MAX_TIP_LENGTH_TO_LENGTH_RATIO,
  MAX_STROKE_WIDTH_TO_LENGTH_RATIO,
  DEFAULT_ARROW_TIP_LENGTH,
} from "../../constants";

export interface ArrowConfig extends LineConfig {
  maxTipLengthToLengthRatio?: number;
  maxStrokeWidthToLengthRatio?: number;
  tipLength?: number;
  tipWidth?: number;
}

/**
 * An arrow - a line with a triangular tip
 */
export class Arrow extends Line {
  protected maxTipLengthToLengthRatio: number;
  protected maxStrokeWidthToLengthRatio: number;
  protected tipLength: number;
  protected tipWidth: number;
  protected tipMesh: THREE.Mesh | null = null;

  constructor(config: ArrowConfig = {}) {
    super({
      strokeWidth: ARROW_STROKE_WIDTH,
      buff: ARROW_BUFF,
      ...config,
    });

    this.maxTipLengthToLengthRatio = config.maxTipLengthToLengthRatio ?? MAX_TIP_LENGTH_TO_LENGTH_RATIO;
    this.maxStrokeWidthToLengthRatio = config.maxStrokeWidthToLengthRatio ?? MAX_STROKE_WIDTH_TO_LENGTH_RATIO;
    this.tipLength = config.tipLength ?? DEFAULT_ARROW_TIP_LENGTH;
    this.tipWidth = config.tipWidth ?? this.tipLength * 0.5;

    this.addTip();
  }

  /**
   * Calculate the actual tip length based on arrow length
   */
  protected getScaledTipLength(): number {
    const length = this.getLength();
    const maxTipLength = length * this.maxTipLengthToLengthRatio;
    return Math.min(this.tipLength, maxTipLength);
  }

  /**
   * Add the arrowhead tip
   */
  protected addTip(): void {
    // Remove existing tip
    if (this.tipMesh) {
      this.remove(this.tipMesh);
      this.tipMesh.geometry.dispose();
      (this.tipMesh.material as THREE.Material).dispose();
      this.tipMesh = null;
    }

    const tipLen = this.getScaledTipLength();
    const tipWid = tipLen * 0.5;

    // Create triangular tip geometry
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(-tipLen, tipWid / 2);
    shape.lineTo(-tipLen, -tipWid / 2);
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this._strokeColor),
      opacity: this._strokeOpacity,
      transparent: this._strokeOpacity < 1,
      side: THREE.DoubleSide,
    });

    this.tipMesh = new THREE.Mesh(geometry, material);

    // Position the tip at the end of the arrow
    const end = this.endPoint.clone();
    const angle = this.getAngle();

    this.tipMesh.position.copy(end);
    this.tipMesh.rotation.z = angle;

    this.add(this.tipMesh);

    // Shorten the line to not overlap with tip
    this.adjustLineForTip(tipLen);
  }

  /**
   * Adjust the line so it doesn't overlap with the tip
   */
  protected adjustLineForTip(tipLength: number): void {
    const direction = this.getDirection();
    const adjustedEnd = this.endPoint.clone().sub(
      direction.multiplyScalar(tipLength * 0.8)
    );

    // Regenerate line points with adjusted end
    const start = this.startPoint.clone();
    if (this.buff > 0) {
      const dir = adjustedEnd.clone().sub(start).normalize();
      start.add(dir.clone().multiplyScalar(this.buff));
    }

    this.setPoints([start, adjustedEnd]);
  }

  protected updateStyle(): void {
    super.updateStyle();

    if (this.tipMesh && this.tipMesh.material instanceof THREE.MeshBasicMaterial) {
      this.tipMesh.material.color.set(this._strokeColor);
      this.tipMesh.material.opacity = this._strokeOpacity;
      this.tipMesh.material.transparent = this._strokeOpacity < 1;
    }
  }

  /**
   * Rebuild the arrow when points change
   */
  putStartAndEndOn(start: THREE.Vector3, end: THREE.Vector3): this {
    super.putStartAndEndOn(start, end);
    this.addTip();
    return this;
  }
}

/**
 * Vector - An arrow that starts from the origin by default
 */
export interface VectorConfig extends ArrowConfig {
  direction?: THREE.Vector3;
}

export class Vector extends Arrow {
  constructor(config: VectorConfig = {}) {
    const direction = config.direction || new THREE.Vector3(1, 0, 0);
    super({
      start: new THREE.Vector3(0, 0, 0),
      end: direction,
      buff: 0,
      ...config,
    });
  }

  /**
   * Get the vector direction (from origin)
   */
  getVector(): THREE.Vector3 {
    return this.endPoint.clone();
  }

  /**
   * Set the vector by its components
   */
  setVector(x: number, y: number, z: number = 0): this {
    this.putStartAndEndOn(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(x, y, z)
    );
    return this;
  }

  /**
   * Get the magnitude of the vector
   */
  getMagnitude(): number {
    return this.endPoint.length();
  }
}

/**
 * DoubleArrow - An arrow with tips on both ends
 */
export class DoubleArrow extends Arrow {
  protected startTipMesh: THREE.Mesh | null = null;

  constructor(config: ArrowConfig = {}) {
    super(config);
    this.addStartTip();
  }

  protected addStartTip(): void {
    if (this.startTipMesh) {
      this.remove(this.startTipMesh);
      this.startTipMesh.geometry.dispose();
      (this.startTipMesh.material as THREE.Material).dispose();
      this.startTipMesh = null;
    }

    const tipLen = this.getScaledTipLength();
    const tipWid = tipLen * 0.5;

    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(tipLen, tipWid / 2);
    shape.lineTo(tipLen, -tipWid / 2);
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this._strokeColor),
      opacity: this._strokeOpacity,
      transparent: this._strokeOpacity < 1,
      side: THREE.DoubleSide,
    });

    this.startTipMesh = new THREE.Mesh(geometry, material);

    const start = this.startPoint.clone();
    const angle = this.getAngle();

    this.startTipMesh.position.copy(start);
    this.startTipMesh.rotation.z = angle;

    this.add(this.startTipMesh);
  }

  protected updateStyle(): void {
    super.updateStyle();

    if (this.startTipMesh && this.startTipMesh.material instanceof THREE.MeshBasicMaterial) {
      this.startTipMesh.material.color.set(this._strokeColor);
      this.startTipMesh.material.opacity = this._strokeOpacity;
      this.startTipMesh.material.transparent = this._strokeOpacity < 1;
    }
  }
}
