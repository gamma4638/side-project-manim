/**
 * Axes - Coordinate axes system
 * Corresponds to ManimCE's Axes class
 */

import * as THREE from "three";
import { Mobject, MobjectConfig } from "../Mobject";
import { Line } from "../geometry/Line";
import { Arrow } from "../geometry/Arrow";
import {
  FRAME_X_RADIUS,
  FRAME_Y_RADIUS,
  DEFAULT_STROKE_WIDTH,
} from "../../constants";
import { BLUE_D } from "../../colors";

export interface AxisConfig {
  xRange?: [number, number, number]; // [min, max, step]
  yRange?: [number, number, number];
  xLength?: number;
  yLength?: number;
  includeTicks?: boolean;
  includeTip?: boolean;
  includeNumbers?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  tipLength?: number;
}

export interface AxesConfig extends MobjectConfig, AxisConfig {
  center?: THREE.Vector3;
}

/**
 * Coordinate axes for plotting
 */
export class Axes extends Mobject {
  protected xRange: [number, number, number];
  protected yRange: [number, number, number];
  protected xLength: number;
  protected yLength: number;
  protected includeTicks: boolean;
  protected includeTip: boolean;
  protected includeNumbers: boolean;
  protected center: THREE.Vector3;
  protected tipLength: number;

  protected xAxis: Arrow | Line | null = null;
  protected yAxis: Arrow | Line | null = null;
  protected ticks: Line[] = [];

  constructor(config: AxesConfig = {}) {
    super({
      strokeColor: BLUE_D,
      strokeWidth: 2,
      ...config,
    });

    this.xRange = config.xRange ?? [-FRAME_X_RADIUS, FRAME_X_RADIUS, 1];
    this.yRange = config.yRange ?? [-FRAME_Y_RADIUS, FRAME_Y_RADIUS, 1];
    this.xLength = config.xLength ?? (this.xRange[1] - this.xRange[0]);
    this.yLength = config.yLength ?? (this.yRange[1] - this.yRange[0]);
    this.includeTicks = config.includeTicks ?? false;
    this.includeTip = config.includeTip ?? false;
    this.includeNumbers = config.includeNumbers ?? false;
    this.center = config.center?.clone() ?? new THREE.Vector3(0, 0, 0);
    this.tipLength = config.tipLength ?? 0.25;

    this.buildAxes();
  }

  /**
   * Build the axis lines
   */
  protected buildAxes(): void {
    // Calculate unit scaling
    const xUnitSize = this.xLength / (this.xRange[1] - this.xRange[0]);
    const yUnitSize = this.yLength / (this.yRange[1] - this.yRange[0]);

    // Calculate axis positions in scene coordinates
    const xStart = new THREE.Vector3(
      this.center.x + this.xRange[0] * xUnitSize,
      this.center.y,
      this.center.z
    );
    const xEnd = new THREE.Vector3(
      this.center.x + this.xRange[1] * xUnitSize,
      this.center.y,
      this.center.z
    );
    const yStart = new THREE.Vector3(
      this.center.x,
      this.center.y + this.yRange[0] * yUnitSize,
      this.center.z
    );
    const yEnd = new THREE.Vector3(
      this.center.x,
      this.center.y + this.yRange[1] * yUnitSize,
      this.center.z
    );

    // Create axes (with or without tips)
    if (this.includeTip) {
      this.xAxis = new Arrow({
        start: xStart,
        end: xEnd,
        strokeColor: this._strokeColor,
        strokeWidth: this._strokeWidth,
        tipLength: this.tipLength,
        buff: 0,
      });
      this.yAxis = new Arrow({
        start: yStart,
        end: yEnd,
        strokeColor: this._strokeColor,
        strokeWidth: this._strokeWidth,
        tipLength: this.tipLength,
        buff: 0,
      });
    } else {
      this.xAxis = new Line({
        start: xStart,
        end: xEnd,
        strokeColor: this._strokeColor,
        strokeWidth: this._strokeWidth,
      });
      this.yAxis = new Line({
        start: yStart,
        end: yEnd,
        strokeColor: this._strokeColor,
        strokeWidth: this._strokeWidth,
      });
    }

    this.add(this.xAxis);
    this.add(this.yAxis);

    // Add ticks if requested
    if (this.includeTicks) {
      this.addTicks(xUnitSize, yUnitSize);
    }
  }

  /**
   * Add tick marks to axes
   */
  protected addTicks(xUnitSize: number, yUnitSize: number): void {
    const tickLength = 0.1;

    // X-axis ticks
    const xStep = this.xRange[2];
    for (let x = this.xRange[0]; x <= this.xRange[1]; x += xStep) {
      if (Math.abs(x) < 0.001) continue; // Skip origin

      const tick = new Line({
        start: new THREE.Vector3(
          this.center.x + x * xUnitSize,
          this.center.y - tickLength / 2,
          this.center.z
        ),
        end: new THREE.Vector3(
          this.center.x + x * xUnitSize,
          this.center.y + tickLength / 2,
          this.center.z
        ),
        strokeColor: this._strokeColor,
        strokeWidth: this._strokeWidth,
      });
      this.ticks.push(tick);
      this.add(tick);
    }

    // Y-axis ticks
    const yStep = this.yRange[2];
    for (let y = this.yRange[0]; y <= this.yRange[1]; y += yStep) {
      if (Math.abs(y) < 0.001) continue; // Skip origin

      const tick = new Line({
        start: new THREE.Vector3(
          this.center.x - tickLength / 2,
          this.center.y + y * yUnitSize,
          this.center.z
        ),
        end: new THREE.Vector3(
          this.center.x + tickLength / 2,
          this.center.y + y * yUnitSize,
          this.center.z
        ),
        strokeColor: this._strokeColor,
        strokeWidth: this._strokeWidth,
      });
      this.ticks.push(tick);
      this.add(tick);
    }
  }

  getPoints(): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    if (this.xAxis) points.push(...this.xAxis.getPoints());
    if (this.yAxis) points.push(...this.yAxis.getPoints());
    return points;
  }

  protected updateStyle(): void {
    this.xAxis?.setStyle({
      strokeColor: this._strokeColor,
      strokeWidth: this._strokeWidth,
      strokeOpacity: this._strokeOpacity,
    });
    this.yAxis?.setStyle({
      strokeColor: this._strokeColor,
      strokeWidth: this._strokeWidth,
      strokeOpacity: this._strokeOpacity,
    });
    for (const tick of this.ticks) {
      tick.setStyle({
        strokeColor: this._strokeColor,
        strokeWidth: this._strokeWidth,
        strokeOpacity: this._strokeOpacity,
      });
    }
  }

  /**
   * Convert a point in coordinate space to scene space
   */
  coordsToPoint(x: number, y: number, z: number = 0): THREE.Vector3 {
    const xUnitSize = this.xLength / (this.xRange[1] - this.xRange[0]);
    const yUnitSize = this.yLength / (this.yRange[1] - this.yRange[0]);

    return new THREE.Vector3(
      this.center.x + x * xUnitSize,
      this.center.y + y * yUnitSize,
      this.center.z + z
    );
  }

  /**
   * Convert a scene point to coordinate space
   */
  pointToCoords(point: THREE.Vector3): THREE.Vector3 {
    const xUnitSize = this.xLength / (this.xRange[1] - this.xRange[0]);
    const yUnitSize = this.yLength / (this.yRange[1] - this.yRange[0]);

    return new THREE.Vector3(
      (point.x - this.center.x) / xUnitSize,
      (point.y - this.center.y) / yUnitSize,
      point.z - this.center.z
    );
  }

  /**
   * Get the x-axis object
   */
  getXAxis(): Arrow | Line | null {
    return this.xAxis;
  }

  /**
   * Get the y-axis object
   */
  getYAxis(): Arrow | Line | null {
    return this.yAxis;
  }
}

/**
 * 3D Axes
 */
export interface ThreeDAxesConfig extends AxesConfig {
  zRange?: [number, number, number];
  zLength?: number;
}

export class ThreeDAxes extends Axes {
  protected zRange: [number, number, number];
  protected zLength: number;
  protected zAxis: Arrow | Line | null = null;

  constructor(config: ThreeDAxesConfig = {}) {
    super(config);

    this.zRange = config.zRange ?? [-4, 4, 1];
    this.zLength = config.zLength ?? (this.zRange[1] - this.zRange[0]);

    this.buildZAxis();
  }

  protected buildZAxis(): void {
    const zUnitSize = this.zLength / (this.zRange[1] - this.zRange[0]);

    const zStart = new THREE.Vector3(
      this.center.x,
      this.center.y,
      this.center.z + this.zRange[0] * zUnitSize
    );
    const zEnd = new THREE.Vector3(
      this.center.x,
      this.center.y,
      this.center.z + this.zRange[1] * zUnitSize
    );

    if (this.includeTip) {
      this.zAxis = new Arrow({
        start: zStart,
        end: zEnd,
        strokeColor: this._strokeColor,
        strokeWidth: this._strokeWidth,
        tipLength: this.tipLength,
        buff: 0,
      });
    } else {
      this.zAxis = new Line({
        start: zStart,
        end: zEnd,
        strokeColor: this._strokeColor,
        strokeWidth: this._strokeWidth,
      });
    }

    this.add(this.zAxis);
  }

  coordsToPoint(x: number, y: number, z: number = 0): THREE.Vector3 {
    const basePoint = super.coordsToPoint(x, y, 0);
    const zUnitSize = this.zLength / (this.zRange[1] - this.zRange[0]);
    basePoint.z = this.center.z + z * zUnitSize;
    return basePoint;
  }

  getZAxis(): Arrow | Line | null {
    return this.zAxis;
  }
}
