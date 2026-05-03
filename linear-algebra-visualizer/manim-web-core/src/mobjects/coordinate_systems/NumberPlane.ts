/**
 * NumberPlane - A 2D coordinate plane with grid lines
 * Corresponds to ManimCE's NumberPlane class
 */

import * as THREE from "three";
import { Axes, AxesConfig } from "./Axes";
import { Line } from "../geometry/Line";
import {
  FRAME_X_RADIUS,
  FRAME_Y_RADIUS,
  NUMBER_PLANE_STROKE_WIDTH,
  NUMBER_PLANE_FADED_LINE_RATIO,
} from "../../constants";
import { BLUE_D, BLUE_E, WHITE } from "../../colors";

export interface NumberPlaneBackgroundLineStyle {
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
}

export interface NumberPlaneConfig extends AxesConfig {
  backgroundLineStyle?: NumberPlaneBackgroundLineStyle;
  fadedLineStyle?: NumberPlaneBackgroundLineStyle;
  fadedLineRatio?: number;
}

/**
 * A 2D number plane with grid lines
 * The standard coordinate system used in 3Blue1Brown videos
 */
export class NumberPlane extends Axes {
  protected backgroundLineStyle: NumberPlaneBackgroundLineStyle;
  protected fadedLineStyle: NumberPlaneBackgroundLineStyle;
  protected fadedLineRatio: number;

  protected backgroundLines: Line[] = [];
  protected fadedLines: Line[] = [];

  constructor(config: NumberPlaneConfig = {}) {
    // Default config matching ManimCE
    super({
      xRange: [-FRAME_X_RADIUS, FRAME_X_RADIUS, 1],
      yRange: [-FRAME_Y_RADIUS, FRAME_Y_RADIUS, 1],
      strokeColor: WHITE,
      strokeWidth: NUMBER_PLANE_STROKE_WIDTH,
      includeTicks: false,
      includeTip: false,
      ...config,
    });

    this.backgroundLineStyle = {
      strokeColor: BLUE_D,
      strokeWidth: NUMBER_PLANE_STROKE_WIDTH,
      strokeOpacity: 1,
      ...config.backgroundLineStyle,
    };

    this.fadedLineStyle = config.fadedLineStyle ?? {
      strokeColor: BLUE_E,
      strokeWidth: NUMBER_PLANE_STROKE_WIDTH * 0.5,
      strokeOpacity: 0.5,
    };

    this.fadedLineRatio = config.fadedLineRatio ?? NUMBER_PLANE_FADED_LINE_RATIO;

    this.buildGrid();
  }

  /**
   * Build the grid lines
   */
  protected buildGrid(): void {
    const xUnitSize = this.xLength / (this.xRange[1] - this.xRange[0]);
    const yUnitSize = this.yLength / (this.yRange[1] - this.yRange[0]);

    // Vertical lines (parallel to y-axis)
    const xStep = this.xRange[2];
    for (let x = this.xRange[0]; x <= this.xRange[1]; x += xStep) {
      // Skip the y-axis (we draw it separately)
      if (Math.abs(x) < 0.001) continue;

      const line = new Line({
        start: new THREE.Vector3(
          this.center.x + x * xUnitSize,
          this.center.y + this.yRange[0] * yUnitSize,
          this.center.z - 0.001 // Slightly behind axes
        ),
        end: new THREE.Vector3(
          this.center.x + x * xUnitSize,
          this.center.y + this.yRange[1] * yUnitSize,
          this.center.z - 0.001
        ),
        strokeColor: this.backgroundLineStyle.strokeColor,
        strokeWidth: this.backgroundLineStyle.strokeWidth,
        strokeOpacity: this.backgroundLineStyle.strokeOpacity,
      });
      this.backgroundLines.push(line);
      this.add(line);
    }

    // Horizontal lines (parallel to x-axis)
    const yStep = this.yRange[2];
    for (let y = this.yRange[0]; y <= this.yRange[1]; y += yStep) {
      // Skip the x-axis (we draw it separately)
      if (Math.abs(y) < 0.001) continue;

      const line = new Line({
        start: new THREE.Vector3(
          this.center.x + this.xRange[0] * xUnitSize,
          this.center.y + y * yUnitSize,
          this.center.z - 0.001
        ),
        end: new THREE.Vector3(
          this.center.x + this.xRange[1] * xUnitSize,
          this.center.y + y * yUnitSize,
          this.center.z - 0.001
        ),
        strokeColor: this.backgroundLineStyle.strokeColor,
        strokeWidth: this.backgroundLineStyle.strokeWidth,
        strokeOpacity: this.backgroundLineStyle.strokeOpacity,
      });
      this.backgroundLines.push(line);
      this.add(line);
    }

    // Add faded subdivision lines if ratio > 1
    if (this.fadedLineRatio > 1) {
      this.buildFadedLines(xUnitSize, yUnitSize);
    }
  }

  /**
   * Build faded subdivision grid lines
   */
  protected buildFadedLines(xUnitSize: number, yUnitSize: number): void {
    const xSubStep = this.xRange[2] / this.fadedLineRatio;
    const ySubStep = this.yRange[2] / this.fadedLineRatio;

    // Vertical faded lines
    for (let x = this.xRange[0]; x <= this.xRange[1]; x += xSubStep) {
      // Skip main grid lines
      const isMainLine = Math.abs(x % this.xRange[2]) < 0.001;
      if (isMainLine) continue;

      const line = new Line({
        start: new THREE.Vector3(
          this.center.x + x * xUnitSize,
          this.center.y + this.yRange[0] * yUnitSize,
          this.center.z - 0.002
        ),
        end: new THREE.Vector3(
          this.center.x + x * xUnitSize,
          this.center.y + this.yRange[1] * yUnitSize,
          this.center.z - 0.002
        ),
        strokeColor: this.fadedLineStyle.strokeColor,
        strokeWidth: this.fadedLineStyle.strokeWidth,
        strokeOpacity: this.fadedLineStyle.strokeOpacity,
      });
      this.fadedLines.push(line);
      this.add(line);
    }

    // Horizontal faded lines
    for (let y = this.yRange[0]; y <= this.yRange[1]; y += ySubStep) {
      // Skip main grid lines
      const isMainLine = Math.abs(y % this.yRange[2]) < 0.001;
      if (isMainLine) continue;

      const line = new Line({
        start: new THREE.Vector3(
          this.center.x + this.xRange[0] * xUnitSize,
          this.center.y + y * yUnitSize,
          this.center.z - 0.002
        ),
        end: new THREE.Vector3(
          this.center.x + this.xRange[1] * xUnitSize,
          this.center.y + y * yUnitSize,
          this.center.z - 0.002
        ),
        strokeColor: this.fadedLineStyle.strokeColor,
        strokeWidth: this.fadedLineStyle.strokeWidth,
        strokeOpacity: this.fadedLineStyle.strokeOpacity,
      });
      this.fadedLines.push(line);
      this.add(line);
    }
  }

  /**
   * Get all grid lines (for transformation)
   */
  getGridLines(): Line[] {
    return [...this.backgroundLines, ...this.fadedLines];
  }

  /**
   * Get only the main grid lines
   */
  getBackgroundLines(): Line[] {
    return this.backgroundLines;
  }

  /**
   * Get only the faded grid lines
   */
  getFadedLines(): Line[] {
    return this.fadedLines;
  }

  /**
   * Apply a 2x2 linear transformation to the entire plane
   */
  applyMatrixTransformation(matrix: number[][]): this {
    const transformMatrix = new THREE.Matrix4();
    transformMatrix.set(
      matrix[0][0], matrix[0][1], 0, 0,
      matrix[1][0], matrix[1][1], 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );

    // Transform all grid lines
    for (const line of this.backgroundLines) {
      const points = line.getPoints();
      const newPoints = points.map(p => p.clone().applyMatrix4(transformMatrix));
      line.setPoints(newPoints);
    }

    for (const line of this.fadedLines) {
      const points = line.getPoints();
      const newPoints = points.map(p => p.clone().applyMatrix4(transformMatrix));
      line.setPoints(newPoints);
    }

    // Transform axes
    if (this.xAxis) {
      const points = this.xAxis.getPoints();
      const newPoints = points.map(p => p.clone().applyMatrix4(transformMatrix));
      if (this.xAxis instanceof Line) {
        this.xAxis.setPoints(newPoints);
      }
    }

    if (this.yAxis) {
      const points = this.yAxis.getPoints();
      const newPoints = points.map(p => p.clone().applyMatrix4(transformMatrix));
      if (this.yAxis instanceof Line) {
        this.yAxis.setPoints(newPoints);
      }
    }

    return this;
  }

  getPoints(): THREE.Vector3[] {
    const points = super.getPoints();
    for (const line of this.backgroundLines) {
      points.push(...line.getPoints());
    }
    for (const line of this.fadedLines) {
      points.push(...line.getPoints());
    }
    return points;
  }

  protected updateStyle(): void {
    super.updateStyle();

    for (const line of this.backgroundLines) {
      line.setStyle({
        strokeColor: this.backgroundLineStyle.strokeColor,
        strokeWidth: this.backgroundLineStyle.strokeWidth,
        strokeOpacity: this.backgroundLineStyle.strokeOpacity,
      });
    }

    for (const line of this.fadedLines) {
      line.setStyle({
        strokeColor: this.fadedLineStyle.strokeColor,
        strokeWidth: this.fadedLineStyle.strokeWidth,
        strokeOpacity: this.fadedLineStyle.strokeOpacity,
      });
    }
  }
}

/**
 * Complex Plane - A number plane labeled for complex numbers
 */
export class ComplexPlane extends NumberPlane {
  constructor(config: NumberPlaneConfig = {}) {
    super(config);
    // In a full implementation, we would add Re/Im labels
  }

  /**
   * Convert a complex number to a point
   */
  numberToPoint(z: { re: number; im: number }): THREE.Vector3 {
    return this.coordsToPoint(z.re, z.im);
  }

  /**
   * Convert a point to a complex number
   */
  pointToNumber(point: THREE.Vector3): { re: number; im: number } {
    const coords = this.pointToCoords(point);
    return { re: coords.x, im: coords.y };
  }
}
