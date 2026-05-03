/**
 * Arc and Circle Mobjects
 * Corresponds to ManimCE's arc.py
 */

import * as THREE from "three";
import { VMobject, VMobjectConfig } from "../VMobject";
import { PI, TAU } from "../../constants";

export interface ArcConfig extends VMobjectConfig {
  radius?: number;
  startAngle?: number;
  angle?: number;
  numComponents?: number;
  arcCenter?: THREE.Vector3;
}

/**
 * An arc - a portion of a circle
 */
export class Arc extends VMobject {
  protected radius: number;
  protected startAngle: number;
  protected angle: number;
  protected numComponents: number;
  protected arcCenter: THREE.Vector3;

  constructor(config: ArcConfig = {}) {
    super(config);

    this.radius = config.radius ?? 1;
    this.startAngle = config.startAngle ?? 0;
    this.angle = config.angle ?? TAU / 4; // Quarter circle by default
    this.numComponents = config.numComponents ?? 50;
    this.arcCenter = config.arcCenter?.clone() ?? new THREE.Vector3(0, 0, 0);

    this.generateArcPoints();
  }

  protected generateArcPoints(): void {
    const points: THREE.Vector3[] = [];

    for (let i = 0; i <= this.numComponents; i++) {
      const t = i / this.numComponents;
      const theta = this.startAngle + t * this.angle;
      const x = this.arcCenter.x + this.radius * Math.cos(theta);
      const y = this.arcCenter.y + this.radius * Math.sin(theta);
      points.push(new THREE.Vector3(x, y, this.arcCenter.z));
    }

    this.setPoints(points);
  }

  getRadius(): number {
    return this.radius;
  }

  getStartAngle(): number {
    return this.startAngle;
  }

  getAngle(): number {
    return this.angle;
  }

  getArcCenter(): THREE.Vector3 {
    return this.arcCenter.clone();
  }

  /**
   * Get the start point of the arc
   */
  getStart(): THREE.Vector3 {
    return new THREE.Vector3(
      this.arcCenter.x + this.radius * Math.cos(this.startAngle),
      this.arcCenter.y + this.radius * Math.sin(this.startAngle),
      this.arcCenter.z
    );
  }

  /**
   * Get the end point of the arc
   */
  getEnd(): THREE.Vector3 {
    const endAngle = this.startAngle + this.angle;
    return new THREE.Vector3(
      this.arcCenter.x + this.radius * Math.cos(endAngle),
      this.arcCenter.y + this.radius * Math.sin(endAngle),
      this.arcCenter.z
    );
  }
}

/**
 * Circle - A full arc (360 degrees)
 */
export interface CircleConfig extends Omit<ArcConfig, "angle"> {
  radius?: number;
}

export class Circle extends Arc {
  constructor(config: CircleConfig = {}) {
    super({
      radius: 1,
      startAngle: 0,
      angle: TAU,
      ...config,
    });
  }
}

/**
 * Dot - A small filled circle
 */
export interface DotConfig extends CircleConfig {
  point?: THREE.Vector3;
  radius?: number;
}

export class Dot extends Circle {
  constructor(config: DotConfig = {}) {
    super({
      radius: 0.08,
      arcCenter: config.point,
      fillOpacity: 1,
      strokeOpacity: 0,
      ...config,
    });
  }

  /**
   * Move the dot to a new point
   */
  moveToPoint(point: THREE.Vector3): this {
    this.arcCenter = point.clone();
    this.generateArcPoints();
    return this;
  }
}

/**
 * SmallDot - An even smaller dot
 */
export class SmallDot extends Dot {
  constructor(config: DotConfig = {}) {
    super({
      radius: 0.04,
      ...config,
    });
  }
}

/**
 * Annulus - A ring (circle with a hole)
 */
export interface AnnulusConfig extends VMobjectConfig {
  innerRadius?: number;
  outerRadius?: number;
  arcCenter?: THREE.Vector3;
  numComponents?: number;
}

export class Annulus extends VMobject {
  protected innerRadius: number;
  protected outerRadius: number;
  protected arcCenter: THREE.Vector3;
  protected numComponents: number;
  protected innerCircle: Circle | null = null;
  protected outerCircle: Circle | null = null;

  constructor(config: AnnulusConfig = {}) {
    super(config);

    this.innerRadius = config.innerRadius ?? 0.5;
    this.outerRadius = config.outerRadius ?? 1;
    this.arcCenter = config.arcCenter?.clone() ?? new THREE.Vector3(0, 0, 0);
    this.numComponents = config.numComponents ?? 50;

    this.buildRing();
  }

  protected buildRing(): void {
    // Create outer circle
    this.outerCircle = new Circle({
      radius: this.outerRadius,
      arcCenter: this.arcCenter,
      strokeColor: this._strokeColor,
      strokeWidth: this._strokeWidth,
      strokeOpacity: this._strokeOpacity,
    });
    this.add(this.outerCircle);

    // Create inner circle
    this.innerCircle = new Circle({
      radius: this.innerRadius,
      arcCenter: this.arcCenter,
      strokeColor: this._strokeColor,
      strokeWidth: this._strokeWidth,
      strokeOpacity: this._strokeOpacity,
    });
    this.add(this.innerCircle);
  }

  getPoints(): THREE.Vector3[] {
    const outerPoints = this.outerCircle?.getPoints() || [];
    const innerPoints = this.innerCircle?.getPoints() || [];
    return [...outerPoints, ...innerPoints];
  }

  protected updateStyle(): void {
    this.outerCircle?.setStyle({
      strokeColor: this._strokeColor,
      strokeWidth: this._strokeWidth,
      strokeOpacity: this._strokeOpacity,
    });
    this.innerCircle?.setStyle({
      strokeColor: this._strokeColor,
      strokeWidth: this._strokeWidth,
      strokeOpacity: this._strokeOpacity,
    });
  }
}

/**
 * Ellipse - An elliptical arc
 */
export interface EllipseConfig extends VMobjectConfig {
  width?: number;
  height?: number;
  arcCenter?: THREE.Vector3;
  numComponents?: number;
}

export class Ellipse extends VMobject {
  protected width: number;
  protected height: number;
  protected arcCenter: THREE.Vector3;
  protected numComponents: number;

  constructor(config: EllipseConfig = {}) {
    super(config);

    this.width = config.width ?? 2;
    this.height = config.height ?? 1;
    this.arcCenter = config.arcCenter?.clone() ?? new THREE.Vector3(0, 0, 0);
    this.numComponents = config.numComponents ?? 50;

    this.generateEllipsePoints();
  }

  protected generateEllipsePoints(): void {
    const points: THREE.Vector3[] = [];
    const a = this.width / 2;
    const b = this.height / 2;

    for (let i = 0; i <= this.numComponents; i++) {
      const t = i / this.numComponents;
      const theta = t * TAU;
      const x = this.arcCenter.x + a * Math.cos(theta);
      const y = this.arcCenter.y + b * Math.sin(theta);
      points.push(new THREE.Vector3(x, y, this.arcCenter.z));
    }

    this.setPoints(points);
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }
}

/**
 * ArcBetweenPoints - An arc passing through two points
 */
export interface ArcBetweenPointsConfig extends ArcConfig {
  start?: THREE.Vector3;
  end?: THREE.Vector3;
  angle?: number;
}

export class ArcBetweenPoints extends Arc {
  protected startPoint: THREE.Vector3;
  protected endPoint: THREE.Vector3;

  constructor(config: ArcBetweenPointsConfig = {}) {
    const start = config.start?.clone() ?? new THREE.Vector3(-1, 0, 0);
    const end = config.end?.clone() ?? new THREE.Vector3(1, 0, 0);
    const angle = config.angle ?? PI / 2;

    // Calculate the arc center and radius
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const chordLength = start.distanceTo(end);
    const radius = chordLength / (2 * Math.sin(Math.abs(angle) / 2));

    // Calculate center point
    const chordDir = end.clone().sub(start).normalize();
    const perpDir = new THREE.Vector3(-chordDir.y, chordDir.x, 0);
    const signedAngle = angle > 0 ? 1 : -1;
    const centerDist = Math.sqrt(radius * radius - (chordLength / 2) ** 2) * signedAngle;
    const arcCenter = midpoint.clone().add(perpDir.multiplyScalar(-centerDist));

    // Calculate start angle
    const toStart = start.clone().sub(arcCenter);
    const startAngle = Math.atan2(toStart.y, toStart.x);

    super({
      radius,
      startAngle,
      angle,
      arcCenter,
      ...config,
    });

    this.startPoint = start;
    this.endPoint = end;
  }
}
