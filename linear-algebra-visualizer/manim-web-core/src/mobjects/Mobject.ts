/**
 * Base Mobject class - the fundamental building block for all visual objects
 * Corresponds to ManimCE's Mobject class
 */

import * as THREE from "three";
import { DEFAULT_STROKE_WIDTH } from "../constants";

export interface MobjectStyle {
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  fillColor?: string;
  fillOpacity?: number;
}

export interface MobjectConfig extends MobjectStyle {
  name?: string;
}

/**
 * Base class for all mathematical objects (Mobjects)
 * Extends THREE.Object3D to work seamlessly with Three.js
 */
export abstract class Mobject extends THREE.Object3D {
  protected _strokeColor: string = "#FFFFFF";
  protected _strokeWidth: number = DEFAULT_STROKE_WIDTH;
  protected _strokeOpacity: number = 1;
  protected _fillColor: string = "#FFFFFF";
  protected _fillOpacity: number = 0;

  constructor(config: MobjectConfig = {}) {
    super();

    if (config.name) this.name = config.name;
    if (config.strokeColor !== undefined) this._strokeColor = config.strokeColor;
    if (config.strokeWidth !== undefined) this._strokeWidth = config.strokeWidth;
    if (config.strokeOpacity !== undefined) this._strokeOpacity = config.strokeOpacity;
    if (config.fillColor !== undefined) this._fillColor = config.fillColor;
    if (config.fillOpacity !== undefined) this._fillOpacity = config.fillOpacity;
  }

  /**
   * Get the points that define this mobject (for VMobjects, this is the path)
   */
  abstract getPoints(): THREE.Vector3[];

  /**
   * Get the center of this mobject
   */
  getCenter(): THREE.Vector3 {
    const points = this.getPoints();
    if (points.length === 0) return new THREE.Vector3();

    const sum = points.reduce(
      (acc, p) => acc.add(p),
      new THREE.Vector3()
    );
    return sum.divideScalar(points.length);
  }

  /**
   * Get the bounding box of this mobject
   */
  getBoundingBox(): THREE.Box3 {
    const box = new THREE.Box3();
    const points = this.getPoints();
    for (const point of points) {
      box.expandByPoint(point);
    }
    return box;
  }

  /**
   * Get width (x-extent)
   */
  getWidth(): number {
    const box = this.getBoundingBox();
    return box.max.x - box.min.x;
  }

  /**
   * Get height (y-extent)
   */
  getHeight(): number {
    const box = this.getBoundingBox();
    return box.max.y - box.min.y;
  }

  /**
   * Get depth (z-extent)
   */
  getDepth(): number {
    const box = this.getBoundingBox();
    return box.max.z - box.min.z;
  }

  // Style setters (chainable)

  setColor(color: string): this {
    this._strokeColor = color;
    this._fillColor = color;
    this.updateStyle();
    return this;
  }

  setStrokeColor(color: string): this {
    this._strokeColor = color;
    this.updateStyle();
    return this;
  }

  setStrokeWidth(width: number): this {
    this._strokeWidth = width;
    this.updateStyle();
    return this;
  }

  setStrokeOpacity(opacity: number): this {
    this._strokeOpacity = opacity;
    this.updateStyle();
    return this;
  }

  setFillColor(color: string): this {
    this._fillColor = color;
    this.updateStyle();
    return this;
  }

  setFillOpacity(opacity: number): this {
    this._fillOpacity = opacity;
    this.updateStyle();
    return this;
  }

  setOpacity(opacity: number): this {
    this._strokeOpacity = opacity;
    this._fillOpacity = opacity;
    this.updateStyle();
    return this;
  }

  setStyle(style: MobjectStyle): this {
    if (style.strokeColor !== undefined) this._strokeColor = style.strokeColor;
    if (style.strokeWidth !== undefined) this._strokeWidth = style.strokeWidth;
    if (style.strokeOpacity !== undefined) this._strokeOpacity = style.strokeOpacity;
    if (style.fillColor !== undefined) this._fillColor = style.fillColor;
    if (style.fillOpacity !== undefined) this._fillOpacity = style.fillOpacity;
    this.updateStyle();
    return this;
  }

  // Style getters

  getStrokeColor(): string {
    return this._strokeColor;
  }

  getStrokeWidth(): number {
    return this._strokeWidth;
  }

  getStrokeOpacity(): number {
    return this._strokeOpacity;
  }

  getFillColor(): string {
    return this._fillColor;
  }

  getFillOpacity(): number {
    return this._fillOpacity;
  }

  /**
   * Update the visual representation after style changes
   * Subclasses should override this
   */
  protected abstract updateStyle(): void;

  // Transform methods (chainable)

  /**
   * Move to an absolute position
   */
  moveTo(point: THREE.Vector3): this {
    const center = this.getCenter();
    this.position.add(point.clone().sub(center));
    return this;
  }

  /**
   * Shift by a relative amount
   */
  shift(delta: THREE.Vector3): this {
    this.position.add(delta);
    return this;
  }

  /**
   * Scale the mobject
   */
  scaleBy(factor: number, aboutPoint?: THREE.Vector3): this {
    if (aboutPoint) {
      const offset = this.position.clone().sub(aboutPoint);
      offset.multiplyScalar(factor);
      this.position.copy(aboutPoint.clone().add(offset));
    }
    this.scale.multiplyScalar(factor);
    return this;
  }

  /**
   * Rotate around an axis
   */
  rotateBy(angle: number, axis: THREE.Vector3 = new THREE.Vector3(0, 0, 1)): this {
    this.rotateOnAxis(axis.normalize(), angle);
    return this;
  }

  /**
   * Rotate to face a specific angle (in radians)
   */
  rotateTo(angle: number, axis: THREE.Vector3 = new THREE.Vector3(0, 0, 1)): this {
    // Reset rotation and apply new angle
    this.rotation.set(0, 0, 0);
    this.rotateOnAxis(axis.normalize(), angle);
    return this;
  }

  /**
   * Align to another mobject's edge
   */
  nextTo(
    mobject: Mobject,
    direction: THREE.Vector3,
    buff: number = 0.25
  ): this {
    const myBox = this.getBoundingBox();
    const otherBox = mobject.getBoundingBox();

    // Calculate alignment point
    const targetPoint = new THREE.Vector3();
    const sourcePoint = new THREE.Vector3();

    // Use direction to determine which edges to align
    if (direction.x > 0) {
      targetPoint.x = otherBox.max.x;
      sourcePoint.x = myBox.min.x;
    } else if (direction.x < 0) {
      targetPoint.x = otherBox.min.x;
      sourcePoint.x = myBox.max.x;
    } else {
      targetPoint.x = (otherBox.min.x + otherBox.max.x) / 2;
      sourcePoint.x = (myBox.min.x + myBox.max.x) / 2;
    }

    if (direction.y > 0) {
      targetPoint.y = otherBox.max.y;
      sourcePoint.y = myBox.min.y;
    } else if (direction.y < 0) {
      targetPoint.y = otherBox.min.y;
      sourcePoint.y = myBox.max.y;
    } else {
      targetPoint.y = (otherBox.min.y + otherBox.max.y) / 2;
      sourcePoint.y = (myBox.min.y + myBox.max.y) / 2;
    }

    if (direction.z > 0) {
      targetPoint.z = otherBox.max.z;
      sourcePoint.z = myBox.min.z;
    } else if (direction.z < 0) {
      targetPoint.z = otherBox.min.z;
      sourcePoint.z = myBox.max.z;
    } else {
      targetPoint.z = (otherBox.min.z + otherBox.max.z) / 2;
      sourcePoint.z = (myBox.min.z + myBox.max.z) / 2;
    }

    // Apply the shift plus buffer
    const shift = targetPoint.sub(sourcePoint).add(
      direction.clone().normalize().multiplyScalar(buff)
    );
    this.shift(shift);

    return this;
  }

  /**
   * Create a copy of this mobject
   */
  copy(): this {
    return this.clone() as this;
  }

  /**
   * Apply a matrix transformation to all points
   */
  applyMatrix4Transform(matrix: THREE.Matrix4): this {
    this.applyMatrix4(matrix);
    return this;
  }

  /**
   * Apply a 2D linear transformation (2x2 matrix)
   */
  applyLinearTransform(matrix: number[][]): this {
    const m4 = new THREE.Matrix4();
    m4.set(
      matrix[0][0], matrix[0][1], 0, 0,
      matrix[1][0], matrix[1][1], 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );
    return this.applyMatrix4Transform(m4);
  }
}
