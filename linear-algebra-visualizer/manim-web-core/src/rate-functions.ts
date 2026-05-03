/**
 * ManimCE Rate Functions (Easing Functions)
 * Extracted from: https://github.com/ManimCommunity/manim/blob/main/manim/utils/rate_functions.py
 *
 * These functions map [0, 1] -> [0, 1] to control animation timing.
 * All implementations match ManimCE's mathematical formulas exactly.
 */

export type RateFunc = (t: number, ...args: number[]) => number;

// Sigmoid helper function
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Linear interpolation - constant speed
 */
export function linear(t: number): number {
  return t;
}

/**
 * Smooth easing using sigmoid function
 * @param t - Progress value [0, 1]
 * @param inflection - Controls the steepness (default: 10)
 */
export function smooth(t: number, inflection: number = 10): number {
  const error = sigmoid(-inflection / 2);
  return Math.min(
    Math.max((sigmoid(inflection * (t - 0.5)) - error) / (1 - 2 * error), 0),
    1
  );
}

/**
 * Smooth step: 3t² - 2t³
 */
export function smoothstep(t: number): number {
  return 3 * t ** 2 - 2 * t ** 3;
}

/**
 * Smoother step: 6t⁵ - 15t⁴ + 10t³
 */
export function smootherstep(t: number): number {
  return 6 * t ** 5 - 15 * t ** 4 + 10 * t ** 3;
}

/**
 * Smootherer step: 35t⁴ - 84t⁵ + 70t⁶ - 20t⁷
 */
export function smoothererstep(t: number): number {
  return -20 * t ** 7 + 70 * t ** 6 - 84 * t ** 5 + 35 * t ** 4;
}

/**
 * Rushes into the animation (slow start, fast finish)
 */
export function rushInto(t: number, inflection: number = 10): number {
  return 2 * smooth(t / 2, inflection);
}

/**
 * Rushes from the animation (fast start, slow finish)
 */
export function rushFrom(t: number, inflection: number = 10): number {
  return 2 * smooth(t / 2 + 0.5, inflection) - 1;
}

/**
 * Slow into the target position
 */
export function slowInto(t: number): number {
  return Math.sqrt(1 - (1 - t) ** 2);
}

/**
 * Double smooth - smooth in and smooth out
 */
export function doubleSmooth(t: number): number {
  if (t < 0.5) {
    return 0.5 * smooth(2 * t);
  }
  return 0.5 * (1 + smooth(2 * t - 1));
}

/**
 * There and back - goes from 0 to 1 and back to 0
 */
export function thereAndBack(t: number, inflection: number = 10): number {
  const newT = t < 0.5 ? 2 * t : 2 * (1 - t);
  return smooth(newT, inflection);
}

/**
 * There and back with pause in the middle
 */
export function thereAndBackWithPause(
  t: number,
  pauseRatio: number = 1 / 3
): number {
  const a = pauseRatio / 2;
  const b = 1 - a;
  if (t < a) {
    return smooth(t / a);
  } else if (t < b) {
    return 1;
  } else {
    return smooth((1 - t) / a);
  }
}

/**
 * Running start - backs up before moving forward
 */
export function runningStart(t: number, pullFactor: number = -0.5): number {
  return bezier([0, 0, pullFactor, pullFactor, 1, 1, 1])(t);
}

/**
 * Wiggle function - oscillates
 */
export function wiggle(t: number, wiggles: number = 2): number {
  return thereAndBack(t) * Math.sin(wiggles * Math.PI * t);
}

/**
 * Lingers at the start
 */
export function lingering(t: number): number {
  return squishRateFunc(linear, 0, 0.8)(t);
}

/**
 * Exponential decay
 */
export function exponentialDecay(t: number, halfLife: number = 0.1): number {
  return 1 - Math.exp(-t / halfLife);
}

// Sine easing functions
export function easeInSine(t: number): number {
  return 1 - Math.cos((t * Math.PI) / 2);
}

export function easeOutSine(t: number): number {
  return Math.sin((t * Math.PI) / 2);
}

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

// Quadratic easing functions
export function easeInQuad(t: number): number {
  return t ** 2;
}

export function easeOutQuad(t: number): number {
  return 1 - (1 - t) ** 2;
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t ** 2 : 1 - (-2 * t + 2) ** 2 / 2;
}

// Cubic easing functions
export function easeInCubic(t: number): number {
  return t ** 3;
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

// Quartic easing functions
export function easeInQuart(t: number): number {
  return t ** 4;
}

export function easeOutQuart(t: number): number {
  return 1 - (1 - t) ** 4;
}

export function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;
}

// Quintic easing functions
export function easeInQuint(t: number): number {
  return t ** 5;
}

export function easeOutQuint(t: number): number {
  return 1 - (1 - t) ** 5;
}

export function easeInOutQuint(t: number): number {
  return t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2;
}

// Exponential easing functions
export function easeInExpo(t: number): number {
  return t === 0 ? 0 : 2 ** (10 * t - 10);
}

export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - 2 ** (-10 * t);
}

export function easeInOutExpo(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5
    ? 2 ** (20 * t - 10) / 2
    : (2 - 2 ** (-20 * t + 10)) / 2;
}

// Circular easing functions
export function easeInCirc(t: number): number {
  return 1 - Math.sqrt(1 - t ** 2);
}

export function easeOutCirc(t: number): number {
  return Math.sqrt(1 - (t - 1) ** 2);
}

export function easeInOutCirc(t: number): number {
  return t < 0.5
    ? (1 - Math.sqrt(1 - (2 * t) ** 2)) / 2
    : (Math.sqrt(1 - (-2 * t + 2) ** 2) + 1) / 2;
}

// Back easing functions (overshoot)
const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;

export function easeInBack(t: number): number {
  return c3 * t ** 3 - c1 * t ** 2;
}

export function easeOutBack(t: number): number {
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

export function easeInOutBack(t: number): number {
  return t < 0.5
    ? ((2 * t) ** 2 * ((c2 + 1) * 2 * t - c2)) / 2
    : ((2 * t - 2) ** 2 * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
}

// Elastic easing functions
const c4 = (2 * Math.PI) / 3;
const c5 = (2 * Math.PI) / 4.5;

export function easeInElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return -(2 ** (10 * t - 10)) * Math.sin((t * 10 - 10.75) * c4);
}

export function easeOutElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export function easeInOutElastic(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5
    ? -(2 ** (20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
    : (2 ** (-20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
}

// Bounce easing functions
export function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

export function easeInBounce(t: number): number {
  return 1 - easeOutBounce(1 - t);
}

export function easeInOutBounce(t: number): number {
  return t < 0.5
    ? (1 - easeOutBounce(1 - 2 * t)) / 2
    : (1 + easeOutBounce(2 * t - 1)) / 2;
}

// Helper functions

/**
 * Not quite there - scales function output
 */
export function notQuiteThere(
  func: RateFunc,
  proportion: number = 0.7
): RateFunc {
  return (t: number) => proportion * func(t);
}

/**
 * Squish rate function into interval [a, b]
 */
export function squishRateFunc(
  func: RateFunc,
  a: number = 0.4,
  b: number = 0.6
): RateFunc {
  return (t: number) => {
    if (t < a) return 0;
    if (t > b) return 1;
    return func((t - a) / (b - a));
  };
}

/**
 * Bezier curve helper
 */
function bezier(points: number[]): RateFunc {
  const n = points.length - 1;
  return (t: number) => {
    let result = 0;
    for (let i = 0; i <= n; i++) {
      result +=
        binomial(n, i) * Math.pow(1 - t, n - i) * Math.pow(t, i) * points[i];
    }
    return result;
  };
}

function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result *= (n - i) / (i + 1);
  }
  return result;
}

/**
 * All rate functions as a single object
 */
export const RateFuncs = {
  // Standard
  linear,
  smooth,
  smoothstep,
  smootherstep,
  smoothererstep,
  rushInto,
  rushFrom,
  slowInto,
  doubleSmooth,
  thereAndBack,
  thereAndBackWithPause,
  runningStart,
  wiggle,
  lingering,
  exponentialDecay,

  // Sine
  easeInSine,
  easeOutSine,
  easeInOutSine,

  // Quad
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,

  // Cubic
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,

  // Quart
  easeInQuart,
  easeOutQuart,
  easeInOutQuart,

  // Quint
  easeInQuint,
  easeOutQuint,
  easeInOutQuint,

  // Expo
  easeInExpo,
  easeOutExpo,
  easeInOutExpo,

  // Circ
  easeInCirc,
  easeOutCirc,
  easeInOutCirc,

  // Back
  easeInBack,
  easeOutBack,
  easeInOutBack,

  // Elastic
  easeInElastic,
  easeOutElastic,
  easeInOutElastic,

  // Bounce
  easeInBounce,
  easeOutBounce,
  easeInOutBounce,

  // Helpers
  notQuiteThere,
  squishRateFunc,
} as const;
