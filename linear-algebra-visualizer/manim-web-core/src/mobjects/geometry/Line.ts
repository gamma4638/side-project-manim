/**
 * Line Mobject - A line between two points
 * Corresponds to ManimCE's Line class
 */

import * as THREE from "three";
import { VMobject, VMobjectConfig } from "../VMobject";
import { DEFAULT_STROKE_WIDTH, MED_SMALL_BUFF } from "../../constants";

export interface LineConfig extends VMobjectConfig {
  start?: THREE.Vector3;
  end?: THREE.Vector3;
  buff?: number;
  pathArc?: number;
}

/**
 * A line segment between two points
 */
export class Line extends VMobject {
  protected startPoint: THREE.Vector3;
  protected endPoint: THREE.Vector3;
  protected buff: number;
  protected pathArc: number;

  constructor(config: LineConfig = {}) {
    super({
      strokeWidth: DEFAULT_STROKE_WIDTH,
      ...config,
    });

    this.startPoint = config.start?.clone() || new THREE.Vector3(-1, 0, 0);
    this.endPoint = config.end?.clone() || new THREE.Vector3(1, 0, 0);
    this.buff = config.buff ?? 0;
    this.pathArc = config.pathArc ?? 0;

    this.generatePoints();
  }

  /**
   * Generate the line points
   */
  protected generatePoints(): void {
    const start = this.startPoint.clone();
    const end = this.endPoint.clone();

    // Apply buff
    if (this.buff > 0) {
      const direction = end.clone().sub(start).normalize();
      start.add(direction.clone().multiplyScalar(this.buff));
      end.sub(direction.clone().multiplyScalar(this.buff));
    }

    if (Math.abs(this.pathArc) < 0.001) {
      // Straight line
      this.setPoints([start, end]);
    } else {
      // Arc path
      this.generateArcPoints(start, end);
    }
  }

  /**
   * Generate arc points between start and end
   */
  protected generateArcPoints(start: THREE.Vector3, end: THREE.Vector3): void {
    const numPoints = 50;
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const diff = end.clone().sub(start);
    const length = diff.length();

    // Calculate the perpendicular direction (for 2D arc)
    const perp = new THREE.Vector3(-diff.y, diff.x, 0).normalize();

    // Arc height based on pathArc
    const arcHeight = (length / 2) * Math.tan(this.pathArc / 2);

    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const linearPoint = start.clone().lerp(end, t);

      // Add arc offset (quadratic bezier-like)
      const arcOffset = 4 * t * (1 - t) * arcHeight;
      linearPoint.add(perp.clone().multiplyScalar(arcOffset));

      points.push(linearPoint);
    }

    this.setPoints(points);
  }

  /**
   * Get the start point
   */
  getStart(): THREE.Vector3 {
    return this.startPoint.clone();
  }

  /**
   * Get the end point
   */
  getEnd(): THREE.Vector3 {
    return this.endPoint.clone();
  }

  /**
   * Get the direction vector (unit vector from start to end)
   */
  getDirection(): THREE.Vector3 {
    return this.endPoint.clone().sub(this.startPoint).normalize();
  }

  /**
   * Get the length of the line
   */
  getLength(): number {
    return this.startPoint.distanceTo(this.endPoint);
  }

  /**
   * Get angle of the line (in radians, relative to positive x-axis)
   */
  getAngle(): number {
    const direction = this.getDirection();
    return Math.atan2(direction.y, direction.x);
  }

  /**
   * Set the start point
   */
  putStartAndEndOn(start: THREE.Vector3, end: THREE.Vector3): this {
    this.startPoint = start.clone();
    this.endPoint = end.clone();
    this.generatePoints();
    return this;
  }

  /**
   * Scale the line length
   */
  scaleAboutPoint(factor: number, point?: THREE.Vector3): this {
    const aboutPoint = point || this.getCenter();
    this.startPoint.sub(aboutPoint).multiplyScalar(factor).add(aboutPoint);
    this.endPoint.sub(aboutPoint).multiplyScalar(factor).add(aboutPoint);
    this.generatePoints();
    return this;
  }
}

/**
 * A dashed line
 */
export interface DashedLineConfig extends LineConfig {
  dashLength?: number;
  dashRatio?: number;
}

export class DashedLine extends Line {
  protected dashLength: number;
  protected dashRatio: number;

  constructor(config: DashedLineConfig = {}) {
    super(config);
    this.dashLength = config.dashLength ?? 0.05;
    this.dashRatio = config.dashRatio ?? 0.5;
    this.generateDashedPoints();
  }

  protected generateDashedPoints(): void {
    // For dashed lines, we'll use multiple line segments
    const start = this.startPoint.clone();
    const end = this.endPoint.clone();
    const totalLength = start.distanceTo(end);
    const direction = end.clone().sub(start).normalize();

    const dashPlusGap = this.dashLength / this.dashRatio;
    const numDashes = Math.floor(totalLength / dashPlusGap);

    const points: THREE.Vector3[] = [];
    for (let i = 0; i < numDashes; i++) {
      const dashStart = start.clone().add(
        direction.clone().multiplyScalar(i * dashPlusGap)
      );
      const dashEnd = dashStart.clone().add(
        direction.clone().multiplyScalar(this.dashLength)
      );

      if (i > 0) {
        // Add a break (NaN creates a gap in Line2)
        points.push(new THREE.Vector3(NaN, NaN, NaN));
      }
      points.push(dashStart, dashEnd);
    }

    this.setPoints(points);
  }
}
