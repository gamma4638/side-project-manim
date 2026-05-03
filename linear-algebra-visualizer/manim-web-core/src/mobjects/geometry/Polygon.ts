/**
 * Polygon, Rectangle, Square, and related shapes
 * Corresponds to ManimCE's polygram.py
 */

import * as THREE from "three";
import { VMobject, VMobjectConfig } from "../VMobject";

export interface PolygonConfig extends VMobjectConfig {
  vertices?: THREE.Vector3[];
}

/**
 * A polygon defined by vertices
 */
export class Polygon extends VMobject {
  protected vertices: THREE.Vector3[];

  constructor(config: PolygonConfig = {}) {
    super(config);

    this.vertices = config.vertices?.map(v => v.clone()) ?? [
      new THREE.Vector3(-1, -1, 0),
      new THREE.Vector3(1, -1, 0),
      new THREE.Vector3(1, 1, 0),
      new THREE.Vector3(-1, 1, 0),
    ];

    this.generatePolygonPoints();
  }

  protected generatePolygonPoints(): void {
    if (this.vertices.length < 2) return;

    // Close the polygon by adding the first vertex at the end
    const points = [...this.vertices, this.vertices[0].clone()];
    this.setPoints(points);
  }

  getVertices(): THREE.Vector3[] {
    return this.vertices.map(v => v.clone());
  }

  setVertices(vertices: THREE.Vector3[]): this {
    this.vertices = vertices.map(v => v.clone());
    this.generatePolygonPoints();
    return this;
  }

  /**
   * Get a specific vertex
   */
  getVertex(index: number): THREE.Vector3 {
    return this.vertices[index % this.vertices.length].clone();
  }
}

/**
 * Regular polygon (all sides equal)
 */
export interface RegularPolygonConfig extends VMobjectConfig {
  n?: number; // Number of sides
  radius?: number;
  startAngle?: number;
  center?: THREE.Vector3;
}

export class RegularPolygon extends Polygon {
  protected n: number;
  protected radius: number;
  protected startAngle: number;
  protected center: THREE.Vector3;

  constructor(config: RegularPolygonConfig = {}) {
    const n = config.n ?? 6;
    const radius = config.radius ?? 1;
    const startAngle = config.startAngle ?? Math.PI / 2;
    const center = config.center ?? new THREE.Vector3(0, 0, 0);

    // Generate vertices
    const vertices: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const angle = startAngle + (i * 2 * Math.PI) / n;
      vertices.push(
        new THREE.Vector3(
          center.x + radius * Math.cos(angle),
          center.y + radius * Math.sin(angle),
          center.z
        )
      );
    }

    super({ vertices, ...config });

    this.n = n;
    this.radius = radius;
    this.startAngle = startAngle;
    this.center = center.clone();
  }

  getNumSides(): number {
    return this.n;
  }

  getRadius(): number {
    return this.radius;
  }
}

/**
 * Triangle - A 3-sided regular polygon
 */
export class Triangle extends RegularPolygon {
  constructor(config: Omit<RegularPolygonConfig, "n"> = {}) {
    super({ n: 3, ...config });
  }
}

/**
 * Rectangle
 */
export interface RectangleConfig extends VMobjectConfig {
  width?: number;
  height?: number;
  center?: THREE.Vector3;
}

export class Rectangle extends Polygon {
  protected rectWidth: number;
  protected rectHeight: number;
  protected center: THREE.Vector3;

  constructor(config: RectangleConfig = {}) {
    const width = config.width ?? 4;
    const height = config.height ?? 2;
    const center = config.center ?? new THREE.Vector3(0, 0, 0);

    const halfW = width / 2;
    const halfH = height / 2;

    const vertices = [
      new THREE.Vector3(center.x - halfW, center.y - halfH, center.z),
      new THREE.Vector3(center.x + halfW, center.y - halfH, center.z),
      new THREE.Vector3(center.x + halfW, center.y + halfH, center.z),
      new THREE.Vector3(center.x - halfW, center.y + halfH, center.z),
    ];

    super({ vertices, ...config });

    this.rectWidth = width;
    this.rectHeight = height;
    this.center = center.clone();
  }

  getRectWidth(): number {
    return this.rectWidth;
  }

  getRectHeight(): number {
    return this.rectHeight;
  }
}

/**
 * Square - A rectangle with equal sides
 */
export interface SquareConfig extends VMobjectConfig {
  sideLength?: number;
  center?: THREE.Vector3;
}

export class Square extends Rectangle {
  constructor(config: SquareConfig = {}) {
    const sideLength = config.sideLength ?? 2;
    super({
      width: sideLength,
      height: sideLength,
      ...config,
    });
  }

  getSideLength(): number {
    return this.rectWidth;
  }
}

/**
 * RoundedRectangle - A rectangle with rounded corners
 */
export interface RoundedRectangleConfig extends RectangleConfig {
  cornerRadius?: number;
  numCornerPoints?: number;
}

export class RoundedRectangle extends VMobject {
  protected rectWidth: number;
  protected rectHeight: number;
  protected center: THREE.Vector3;
  protected cornerRadius: number;
  protected numCornerPoints: number;

  constructor(config: RoundedRectangleConfig = {}) {
    super(config);

    this.rectWidth = config.width ?? 4;
    this.rectHeight = config.height ?? 2;
    this.center = config.center?.clone() ?? new THREE.Vector3(0, 0, 0);
    this.cornerRadius = config.cornerRadius ?? Math.min(this.rectWidth, this.rectHeight) * 0.25;
    this.numCornerPoints = config.numCornerPoints ?? 10;

    this.generateRoundedRectPoints();
  }

  protected generateRoundedRectPoints(): void {
    const points: THREE.Vector3[] = [];
    const hw = this.rectWidth / 2;
    const hh = this.rectHeight / 2;
    const r = Math.min(this.cornerRadius, hw, hh);
    const cx = this.center.x;
    const cy = this.center.y;
    const cz = this.center.z;

    // Generate points for each corner arc
    const corners = [
      { cx: hw - r, cy: hh - r, startAngle: 0, endAngle: Math.PI / 2 },           // Top-right
      { cx: -(hw - r), cy: hh - r, startAngle: Math.PI / 2, endAngle: Math.PI },  // Top-left
      { cx: -(hw - r), cy: -(hh - r), startAngle: Math.PI, endAngle: 1.5 * Math.PI },  // Bottom-left
      { cx: hw - r, cy: -(hh - r), startAngle: 1.5 * Math.PI, endAngle: 2 * Math.PI }, // Bottom-right
    ];

    for (const corner of corners) {
      for (let i = 0; i <= this.numCornerPoints; i++) {
        const t = i / this.numCornerPoints;
        const angle = corner.startAngle + t * (corner.endAngle - corner.startAngle);
        const x = cx + corner.cx + r * Math.cos(angle);
        const y = cy + corner.cy + r * Math.sin(angle);
        points.push(new THREE.Vector3(x, y, cz));
      }
    }

    // Close the shape
    points.push(points[0].clone());
    this.setPoints(points);
  }
}

/**
 * Star - A star shape
 */
export interface StarConfig extends VMobjectConfig {
  n?: number; // Number of points
  outerRadius?: number;
  innerRadius?: number;
  startAngle?: number;
  center?: THREE.Vector3;
}

export class Star extends Polygon {
  constructor(config: StarConfig = {}) {
    const n = config.n ?? 5;
    const outerRadius = config.outerRadius ?? 1;
    const innerRadius = config.innerRadius ?? outerRadius * 0.4;
    const startAngle = config.startAngle ?? Math.PI / 2;
    const center = config.center ?? new THREE.Vector3(0, 0, 0);

    const vertices: THREE.Vector3[] = [];
    for (let i = 0; i < 2 * n; i++) {
      const angle = startAngle + (i * Math.PI) / n;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      vertices.push(
        new THREE.Vector3(
          center.x + radius * Math.cos(angle),
          center.y + radius * Math.sin(angle),
          center.z
        )
      );
    }

    super({ vertices, ...config });
  }
}
