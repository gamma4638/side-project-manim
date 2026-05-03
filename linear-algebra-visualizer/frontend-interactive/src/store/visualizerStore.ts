/**
 * Zustand store for visualizer state
 */

import { create } from "zustand";

export interface Matrix2x2 {
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface EigenData {
  eigenvalues: [number, number] | null;
  eigenvectors: [[number, number], [number, number]] | null;
}

export interface VisualizerState {
  // Matrix
  matrix: Matrix2x2;
  setMatrix: (matrix: Partial<Matrix2x2>) => void;
  setMatrixPreset: (preset: MatrixPreset) => void;

  // Animation
  animationProgress: number;
  setAnimationProgress: (progress: number) => void;
  isAnimating: boolean;
  setIsAnimating: (isAnimating: boolean) => void;

  // View mode
  viewMode: "2D" | "3D";
  setViewMode: (mode: "2D" | "3D") => void;

  // Display options
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  showBasisVectors: boolean;
  setShowBasisVectors: (show: boolean) => void;
  showEigenvectors: boolean;
  setShowEigenvectors: (show: boolean) => void;

  // Computed eigen data
  eigenData: EigenData;
}

export type MatrixPreset =
  | "rotation45"
  | "rotation90"
  | "scale2x"
  | "shearX"
  | "shearY"
  | "reflection"
  | "identity"
  | "projection"
  | "example";

const MATRIX_PRESETS: Record<MatrixPreset, Matrix2x2> = {
  rotation45: {
    a: Math.cos(Math.PI / 4),
    b: -Math.sin(Math.PI / 4),
    c: Math.sin(Math.PI / 4),
    d: Math.cos(Math.PI / 4),
  },
  rotation90: { a: 0, b: -1, c: 1, d: 0 },
  scale2x: { a: 2, b: 0, c: 0, d: 2 },
  shearX: { a: 1, b: 1, c: 0, d: 1 },
  shearY: { a: 1, b: 0, c: 1, d: 1 },
  reflection: { a: 1, b: 0, c: 0, d: -1 },
  identity: { a: 1, b: 0, c: 0, d: 1 },
  projection: { a: 1, b: 0, c: 0, d: 0 },
  example: { a: 3, b: 1, c: 0, d: 2 },
};

function calculateEigen(matrix: Matrix2x2): EigenData {
  const { a, b, c, d } = matrix;

  // Eigenvalues from characteristic equation: det(A - λI) = 0
  // λ² - (a+d)λ + (ad-bc) = 0
  const trace = a + d;
  const det = a * d - b * c;
  const discriminant = trace * trace - 4 * det;

  if (discriminant < 0) {
    // Complex eigenvalues (no real eigenvectors)
    return { eigenvalues: null, eigenvectors: null };
  }

  const sqrtDisc = Math.sqrt(discriminant);
  const lambda1 = (trace + sqrtDisc) / 2;
  const lambda2 = (trace - sqrtDisc) / 2;

  // Calculate eigenvectors
  const getEigenvector = (lambda: number): [number, number] => {
    // (A - λI)v = 0
    // Find null space
    if (Math.abs(c) > 1e-10) {
      return [lambda - d, c];
    } else if (Math.abs(b) > 1e-10) {
      return [b, lambda - a];
    } else {
      // Diagonal matrix
      if (Math.abs(a - lambda) < 1e-10) {
        return [1, 0];
      } else {
        return [0, 1];
      }
    }
  };

  const v1 = getEigenvector(lambda1);
  const v2 = getEigenvector(lambda2);

  // Normalize
  const normalize = (v: [number, number]): [number, number] => {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    if (len < 1e-10) return [1, 0];
    return [v[0] / len, v[1] / len];
  };

  return {
    eigenvalues: [lambda1, lambda2],
    eigenvectors: [normalize(v1), normalize(v2)],
  };
}

export const useVisualizerStore = create<VisualizerState>((set) => ({
  // Matrix
  matrix: MATRIX_PRESETS.example,
  setMatrix: (partial) =>
    set((state) => {
      const newMatrix = { ...state.matrix, ...partial };
      return {
        matrix: newMatrix,
        eigenData: calculateEigen(newMatrix),
      };
    }),
  setMatrixPreset: (preset) =>
    set(() => {
      const matrix = MATRIX_PRESETS[preset];
      return {
        matrix,
        eigenData: calculateEigen(matrix),
      };
    }),

  // Animation
  animationProgress: 0,
  setAnimationProgress: (progress) => set({ animationProgress: progress }),
  isAnimating: false,
  setIsAnimating: (isAnimating) => set({ isAnimating }),

  // View mode
  viewMode: "2D",
  setViewMode: (mode) => set({ viewMode: mode }),

  // Display options
  showGrid: true,
  setShowGrid: (show) => set({ showGrid: show }),
  showBasisVectors: true,
  setShowBasisVectors: (show) => set({ showBasisVectors: show }),
  showEigenvectors: true,
  setShowEigenvectors: (show) => set({ showEigenvectors: show }),

  // Initial eigen data
  eigenData: calculateEigen(MATRIX_PRESETS.example),
}));
