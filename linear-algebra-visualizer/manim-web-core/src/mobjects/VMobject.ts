/**
 * VMobject (Vectorized Mobject) - Base class for 2D shapes defined by paths
 * Corresponds to ManimCE's VMobject class
 */

import * as THREE from "three";
import { Mobject, MobjectConfig } from "./Mobject";
import { DEFAULT_STROKE_WIDTH } from "../constants";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";

export interface VMobjectConfig extends MobjectConfig {
  points?: THREE.Vector3[];
}

/**
 * Vectorized Mobject - renders as lines/paths using Three.js
 * Uses Line2 for proper line width support
 */
export class VMobject extends Mobject {
  protected points: THREE.Vector3[] = [];
  protected line: Line2 | null = null;
  protected fillMesh: THREE.Mesh | null = null;
  protected resolution: THREE.Vector2;

  constructor(config: VMobjectConfig = {}) {
    super({
      strokeWidth: DEFAULT_STROKE_WIDTH,
      ...config,
    });

    if (config.points) {
      this.points = config.points;
    }

    // Default resolution for line width (will be updated in Scene)
    this.resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);

    this.buildGeometry();
  }

  getPoints(): THREE.Vector3[] {
    return this.points;
  }

  setPoints(points: THREE.Vector3[]): this {
    this.points = points;
    this.buildGeometry();
    return this;
  }

  addPoint(point: THREE.Vector3): this {
    this.points.push(point);
    this.buildGeometry();
    return this;
  }

  /**
   * Update resolution for proper line width rendering
   */
  setResolution(width: number, height: number): this {
    this.resolution.set(width, height);
    if (this.line && this.line.material instanceof LineMaterial) {
      this.line.material.resolution.set(width, height);
    }
    return this;
  }

  /**
   * Build or rebuild the Three.js geometry from points
   */
  protected buildGeometry(): void {
    // Remove old geometry
    if (this.line) {
      this.remove(this.line);
      this.line.geometry.dispose();
      (this.line.material as LineMaterial).dispose();
      this.line = null;
    }

    if (this.fillMesh) {
      this.remove(this.fillMesh);
      this.fillMesh.geometry.dispose();
      (this.fillMesh.material as THREE.Material).dispose();
      this.fillMesh = null;
    }

    if (this.points.length < 2) return;

    // Create line geometry using Line2 for variable width
    const positions: number[] = [];
    for (const point of this.points) {
      positions.push(point.x, point.y, point.z);
    }

    const lineGeometry = new LineGeometry();
    lineGeometry.setPositions(positions);

    const lineMaterial = new LineMaterial({
      color: new THREE.Color(this._strokeColor).getHex(),
      linewidth: this._strokeWidth * 0.001, // Line2 uses different units
      opacity: this._strokeOpacity,
      transparent: this._strokeOpacity < 1,
      resolution: this.resolution,
    });

    this.line = new Line2(lineGeometry, lineMaterial);
    this.line.computeLineDistances();
    this.add(this.line);

    // Create fill mesh if fillOpacity > 0
    if (this._fillOpacity > 0 && this.points.length >= 3) {
      this.buildFillMesh();
    }
  }

  /**
   * Build fill mesh for closed shapes
   */
  protected buildFillMesh(): void {
    if (this.points.length < 3) return;

    // Create a shape from the points
    const shape = new THREE.Shape();
    shape.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      shape.lineTo(this.points[i].x, this.points[i].y);
    }
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this._fillColor),
      opacity: this._fillOpacity,
      transparent: this._fillOpacity < 1,
      side: THREE.DoubleSide,
    });

    this.fillMesh = new THREE.Mesh(geometry, material);
    this.fillMesh.position.z = -0.001; // Slightly behind the stroke
    this.add(this.fillMesh);
  }

  protected updateStyle(): void {
    if (this.line && this.line.material instanceof LineMaterial) {
      this.line.material.color.set(this._strokeColor);
      this.line.material.linewidth = this._strokeWidth * 0.001;
      this.line.material.opacity = this._strokeOpacity;
      this.line.material.transparent = this._strokeOpacity < 1;
    }

    if (this.fillMesh && this.fillMesh.material instanceof THREE.MeshBasicMaterial) {
      this.fillMesh.material.color.set(this._fillColor);
      this.fillMesh.material.opacity = this._fillOpacity;
      this.fillMesh.material.transparent = this._fillOpacity < 1;
    }
  }

  /**
   * Interpolate points for smooth animation
   */
  interpolateWith(other: VMobject, alpha: number): this {
    const maxLen = Math.max(this.points.length, other.points.length);
    const newPoints: THREE.Vector3[] = [];

    for (let i = 0; i < maxLen; i++) {
      const p1 = this.points[Math.min(i, this.points.length - 1)] || new THREE.Vector3();
      const p2 = other.points[Math.min(i, other.points.length - 1)] || new THREE.Vector3();
      newPoints.push(p1.clone().lerp(p2, alpha));
    }

    this.setPoints(newPoints);
    return this;
  }

  /**
   * Match the number of points with another VMobject
   */
  matchPoints(other: VMobject): this {
    const targetLen = other.points.length;
    if (this.points.length === targetLen) return this;

    const newPoints: THREE.Vector3[] = [];
    for (let i = 0; i < targetLen; i++) {
      const t = i / (targetLen - 1);
      const sourceIdx = t * (this.points.length - 1);
      const lower = Math.floor(sourceIdx);
      const upper = Math.min(lower + 1, this.points.length - 1);
      const alpha = sourceIdx - lower;

      const p = this.points[lower].clone().lerp(this.points[upper], alpha);
      newPoints.push(p);
    }

    this.setPoints(newPoints);
    return this;
  }
}
