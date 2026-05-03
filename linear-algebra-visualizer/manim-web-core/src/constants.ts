/**
 * ManimCE Constants
 * Extracted from: https://github.com/ManimCommunity/manim/blob/main/manim/constants.py
 *
 * These are the exact values used by ManimCE for spacing, directions, and defaults.
 */

import * as THREE from "three";

// Buffer sizes (padding)
export const SMALL_BUFF = 0.1;
export const MED_SMALL_BUFF = 0.25;
export const MED_LARGE_BUFF = 0.5;
export const LARGE_BUFF = 1;
export const DEFAULT_MOBJECT_TO_EDGE_BUFFER = 0.5;
export const DEFAULT_MOBJECT_TO_MOBJECT_BUFFER = 0.25;

// Direction vectors
export const ORIGIN = new THREE.Vector3(0, 0, 0);
export const UP = new THREE.Vector3(0, 1, 0);
export const DOWN = new THREE.Vector3(0, -1, 0);
export const RIGHT = new THREE.Vector3(1, 0, 0);
export const LEFT = new THREE.Vector3(-1, 0, 0);
export const IN = new THREE.Vector3(0, 0, -1);
export const OUT = new THREE.Vector3(0, 0, 1);

// Axis vectors
export const X_AXIS = new THREE.Vector3(1, 0, 0);
export const Y_AXIS = new THREE.Vector3(0, 1, 0);
export const Z_AXIS = new THREE.Vector3(0, 0, 1);

// Diagonal directions
export const UL = new THREE.Vector3(-1, 1, 0);   // up-left
export const UR = new THREE.Vector3(1, 1, 0);    // up-right
export const DL = new THREE.Vector3(-1, -1, 0);  // down-left
export const DR = new THREE.Vector3(1, -1, 0);   // down-right

// Geometric defaults
export const DEFAULT_DOT_RADIUS = 0.08;
export const DEFAULT_SMALL_DOT_RADIUS = 0.04;
export const DEFAULT_DASH_LENGTH = 0.05;
export const DEFAULT_ARROW_TIP_LENGTH = 0.35;
export const DEFAULT_STROKE_WIDTH = 4;
export const DEFAULT_FONT_SIZE = 48;

// Arrow-specific defaults (from line.py)
export const ARROW_STROKE_WIDTH = 6;
export const ARROW_BUFF = MED_SMALL_BUFF;
export const MAX_TIP_LENGTH_TO_LENGTH_RATIO = 0.25;
export const MAX_STROKE_WIDTH_TO_LENGTH_RATIO = 5;

// NumberPlane defaults (from coordinate_systems.py)
export const NUMBER_PLANE_STROKE_WIDTH = 2;
export const NUMBER_PLANE_FADED_LINE_RATIO = 1;

// Point density
export const DEFAULT_POINT_DENSITY_2D = 25;
export const DEFAULT_POINT_DENSITY_1D = 10;

// Timing (in seconds)
export const DEFAULT_ANIMATION_RUN_TIME = 1.0;
export const DEFAULT_WAIT_TIME = 1.0;
export const DEFAULT_POINTWISE_FUNCTION_RUN_TIME = 3.0;

// Mathematical constants
export const PI = Math.PI;
export const TAU = 2 * Math.PI;
export const DEGREES = TAU / 360;

// Frame dimensions (default Manim config)
export const FRAME_WIDTH = 14.222222222222221;  // 16:9 aspect ratio
export const FRAME_HEIGHT = 8;
export const FRAME_X_RADIUS = FRAME_WIDTH / 2;
export const FRAME_Y_RADIUS = FRAME_HEIGHT / 2;

/**
 * All constants as a single object
 */
export const Constants = {
  // Buffers
  SMALL_BUFF,
  MED_SMALL_BUFF,
  MED_LARGE_BUFF,
  LARGE_BUFF,
  DEFAULT_MOBJECT_TO_EDGE_BUFFER,
  DEFAULT_MOBJECT_TO_MOBJECT_BUFFER,

  // Directions
  ORIGIN,
  UP, DOWN, RIGHT, LEFT, IN, OUT,
  X_AXIS, Y_AXIS, Z_AXIS,
  UL, UR, DL, DR,

  // Geometric defaults
  DEFAULT_DOT_RADIUS,
  DEFAULT_SMALL_DOT_RADIUS,
  DEFAULT_DASH_LENGTH,
  DEFAULT_ARROW_TIP_LENGTH,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_FONT_SIZE,

  // Arrow defaults
  ARROW_STROKE_WIDTH,
  ARROW_BUFF,
  MAX_TIP_LENGTH_TO_LENGTH_RATIO,
  MAX_STROKE_WIDTH_TO_LENGTH_RATIO,

  // NumberPlane defaults
  NUMBER_PLANE_STROKE_WIDTH,
  NUMBER_PLANE_FADED_LINE_RATIO,

  // Point density
  DEFAULT_POINT_DENSITY_2D,
  DEFAULT_POINT_DENSITY_1D,

  // Timing
  DEFAULT_ANIMATION_RUN_TIME,
  DEFAULT_WAIT_TIME,
  DEFAULT_POINTWISE_FUNCTION_RUN_TIME,

  // Math
  PI, TAU, DEGREES,

  // Frame
  FRAME_WIDTH,
  FRAME_HEIGHT,
  FRAME_X_RADIUS,
  FRAME_Y_RADIUS,
} as const;
