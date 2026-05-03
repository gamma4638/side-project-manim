/**
 * Main Three.js canvas component using @react-three/fiber
 * Renders the manim-style visualization with accurate 3B1B styling
 */

import { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { useVisualizerStore } from "../../store/visualizerStore";

// Extend Three.js with Line2 components
extend({ Line2, LineGeometry, LineMaterial });

// Manim colors - exact values from ManimCE
const COLORS = {
  BACKGROUND: "#0c1b33",
  GRID_BACKGROUND: "#29ABCA",  // BLUE_D - main grid lines
  GRID_FADED: "#236B8E",       // BLUE_E - secondary grid lines
  AXIS: "#FFFFFF",             // White for axes
  I_HAT: "#83C167",            // GREEN - î basis vector
  J_HAT: "#FC6255",            // RED - ĵ basis vector
  EIGEN_1: "#FFFF00",          // YELLOW - first eigenvector
  EIGEN_2: "#58C4DD",          // BLUE - second eigenvector
  TEXT: "#ece6e2",             // Cream text color
};

// Manim stroke widths
const STROKE_WIDTH = {
  GRID_MAIN: 2,
  GRID_FADED: 1,
  AXIS: 2,
  BASIS_VECTOR: 4,
  EIGENVECTOR: 3,
};

// Manim arrow parameters
const ARROW_TIP_LENGTH = 0.35;  // Fixed tip length in Manim units
const MAX_STROKE_WIDTH_TO_LENGTH_RATIO = 5;

/**
 * Custom Line component using Line2 for proper line width support
 * WebGL's native lineWidth is limited to 1px on most browsers
 */
interface ManimLineProps {
  points: THREE.Vector3[];
  color: string;
  lineWidth: number;
  opacity?: number;
  dashed?: boolean;
  dashScale?: number;
  dashSize?: number;
  gapSize?: number;
}

function ManimLine({
  points,
  color,
  lineWidth,
  opacity = 1,
  dashed = false,
  dashScale = 1,
  dashSize = 0.2,
  gapSize = 0.1,
}: ManimLineProps) {
  const ref = useRef<Line2>(null);
  const { size } = useThree();

  const geometry = useMemo(() => {
    const geo = new LineGeometry();
    const positions = points.flatMap(p => [p.x, p.y, p.z]);
    geo.setPositions(positions);
    return geo;
  }, [points]);

  const material = useMemo(() => {
    const mat = new LineMaterial({
      color: new THREE.Color(color).getHex(),
      linewidth: lineWidth * 0.001,  // LineMaterial uses different scale
      opacity: opacity,
      transparent: opacity < 1,
      resolution: new THREE.Vector2(size.width, size.height),
      dashed: dashed,
      dashScale: dashScale,
      dashSize: dashSize,
      gapSize: gapSize,
    });
    return mat;
  }, [color, lineWidth, opacity, size.width, size.height, dashed, dashScale, dashSize, gapSize]);

  // Update resolution on resize
  useEffect(() => {
    if (material) {
      material.resolution.set(size.width, size.height);
    }
  }, [size, material]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <primitive ref={ref} object={new Line2(geometry, material)} />;
}

interface GridProps {
  transform: THREE.Matrix4;
  progress: number;
}

function Grid({ transform, progress }: GridProps) {
  const showGrid = useVisualizerStore((state) => state.showGrid);

  if (!showGrid) return null;

  // Generate grid lines - 2-level system like Manim NumberPlane
  const gridLines = useMemo(() => {
    const lines: {
      points: THREE.Vector3[];
      color: string;
      lineWidth: number;
      opacity: number;
      isAxis: boolean;
    }[] = [];
    const range = 8;

    // Level 1: Main grid lines (integer coordinates)
    for (let i = -range; i <= range; i++) {
      const isAxis = i === 0;

      // Vertical line
      lines.push({
        points: [
          new THREE.Vector3(i, -range, 0),
          new THREE.Vector3(i, range, 0),
        ],
        color: isAxis ? COLORS.AXIS : COLORS.GRID_BACKGROUND,
        lineWidth: isAxis ? STROKE_WIDTH.AXIS : STROKE_WIDTH.GRID_MAIN,
        opacity: isAxis ? 0.8 : 1,
        isAxis,
      });

      // Horizontal line
      lines.push({
        points: [
          new THREE.Vector3(-range, i, 0),
          new THREE.Vector3(range, i, 0),
        ],
        color: isAxis ? COLORS.AXIS : COLORS.GRID_BACKGROUND,
        lineWidth: isAxis ? STROKE_WIDTH.AXIS : STROKE_WIDTH.GRID_MAIN,
        opacity: isAxis ? 0.8 : 1,
        isAxis,
      });
    }

    // Level 2: Faded grid lines (0.5 intervals)
    for (let i = -range; i <= range; i += 0.5) {
      if (Number.isInteger(i)) continue;  // Skip integers (already drawn)

      // Vertical line
      lines.push({
        points: [
          new THREE.Vector3(i, -range, 0),
          new THREE.Vector3(i, range, 0),
        ],
        color: COLORS.GRID_FADED,
        lineWidth: STROKE_WIDTH.GRID_FADED,
        opacity: 0.5,
        isAxis: false,
      });

      // Horizontal line
      lines.push({
        points: [
          new THREE.Vector3(-range, i, 0),
          new THREE.Vector3(range, i, 0),
        ],
        color: COLORS.GRID_FADED,
        lineWidth: STROKE_WIDTH.GRID_FADED,
        opacity: 0.5,
        isAxis: false,
      });
    }

    return lines;
  }, []);

  // Create interpolated transform matrix
  const interpolatedTransform = useMemo(() => {
    const identity = new THREE.Matrix4();
    const result = new THREE.Matrix4();

    // Lerp each element
    for (let i = 0; i < 16; i++) {
      result.elements[i] =
        identity.elements[i] * (1 - progress) +
        transform.elements[i] * progress;
    }

    return result;
  }, [transform, progress]);

  return (
    <group>
      {gridLines.map((line, index) => {
        // Transform points
        const transformedPoints = line.points.map((p) =>
          p.clone().applyMatrix4(interpolatedTransform)
        );

        return (
          <ManimLine
            key={index}
            points={transformedPoints}
            color={line.color}
            lineWidth={line.lineWidth}
            opacity={line.opacity}
          />
        );
      })}
    </group>
  );
}

interface BasisVectorsProps {
  transform: THREE.Matrix4;
  progress: number;
}

function BasisVectors({ transform, progress }: BasisVectorsProps) {
  const showBasisVectors = useVisualizerStore(
    (state) => state.showBasisVectors
  );

  if (!showBasisVectors) return null;

  // Interpolated transform
  const interpolatedTransform = useMemo(() => {
    const identity = new THREE.Matrix4();
    const result = new THREE.Matrix4();

    for (let i = 0; i < 16; i++) {
      result.elements[i] =
        identity.elements[i] * (1 - progress) +
        transform.elements[i] * progress;
    }

    return result;
  }, [transform, progress]);

  // î vector (green)
  const iHat = useMemo(() => {
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(1, 0, 0).applyMatrix4(interpolatedTransform);
    return { start, end };
  }, [interpolatedTransform]);

  // ĵ vector (red)
  const jHat = useMemo(() => {
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(0, 1, 0).applyMatrix4(interpolatedTransform);
    return { start, end };
  }, [interpolatedTransform]);

  return (
    <group>
      {/* î vector */}
      <ArrowMesh
        start={iHat.start}
        end={iHat.end}
        color={COLORS.I_HAT}
        lineWidth={STROKE_WIDTH.BASIS_VECTOR}
        label="î"
      />
      {/* ĵ vector */}
      <ArrowMesh
        start={jHat.start}
        end={jHat.end}
        color={COLORS.J_HAT}
        lineWidth={STROKE_WIDTH.BASIS_VECTOR}
        label="ĵ"
      />
    </group>
  );
}

interface ArrowMeshProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  lineWidth: number;
  label?: string;
}

function ArrowMesh({ start, end, color, lineWidth, label }: ArrowMeshProps) {
  const dir = end.clone().sub(start);
  const length = dir.length();

  if (length < 0.001) return null;

  dir.normalize();

  // Manim arrow geometry: fixed tip_length with max ratio
  const tipLength = Math.min(ARROW_TIP_LENGTH, length * 0.25);
  const tipWidth = tipLength;  // Manim: tip_width === tip_length (isoceles triangle)

  // Effective stroke width based on length (short arrows are thinner)
  const effectiveLineWidth = Math.min(
    lineWidth,
    MAX_STROKE_WIDTH_TO_LENGTH_RATIO * length
  );

  // Arrow shaft ends where tip begins
  const shaftEnd = start.clone().add(dir.clone().multiplyScalar(length - tipLength));

  // Calculate tip vertices
  const perp = new THREE.Vector3(-dir.y, dir.x, 0);
  const tipBase = shaftEnd.clone();
  const tipLeft = tipBase.clone().add(perp.clone().multiplyScalar(tipWidth / 2));
  const tipRight = tipBase.clone().sub(perp.clone().multiplyScalar(tipWidth / 2));

  return (
    <group>
      {/* Shaft using ManimLine for proper width */}
      <ManimLine
        points={[start, shaftEnd]}
        color={color}
        lineWidth={effectiveLineWidth}
      />
      {/* Tip as filled triangle */}
      <mesh>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={3}
            array={
              new Float32Array([
                end.x, end.y, end.z,
                tipLeft.x, tipLeft.y, tipLeft.z,
                tipRight.x, tipRight.y, tipRight.z,
              ])
            }
            itemSize={3}
          />
        </bufferGeometry>
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {/* Vector label */}
      {label && (
        <Html
          position={[end.x + 0.2, end.y + 0.2, 0]}
          style={{
            color: color,
            fontFamily: "'CMU Serif', 'Times New Roman', serif",
            fontStyle: "italic",
            fontSize: "16px",
            fontWeight: "bold",
            pointerEvents: "none",
            userSelect: "none",
            textShadow: "0 0 4px rgba(0,0,0,0.8)",
          }}
        >
          {label}
        </Html>
      )}
    </group>
  );
}

interface EigenvectorsProps {
  progress: number;
}

function Eigenvectors({ progress }: EigenvectorsProps) {
  const showEigenvectors = useVisualizerStore(
    (state) => state.showEigenvectors
  );
  const eigenData = useVisualizerStore((state) => state.eigenData);

  if (!showEigenvectors || !eigenData.eigenvectors || progress < 0.5) {
    return null;
  }

  // Fade in after transformation is 50% complete
  const opacity = Math.min((progress - 0.5) * 2, 1);

  const scale = 3; // Scale eigenvectors for visibility

  return (
    <group>
      {eigenData.eigenvectors.map((v, i) => {
        const start = new THREE.Vector3(-v[0] * scale, -v[1] * scale, 0.01);
        const end = new THREE.Vector3(v[0] * scale, v[1] * scale, 0.01);
        const color = i === 0 ? COLORS.EIGEN_1 : COLORS.EIGEN_2;

        return (
          <ManimLine
            key={i}
            points={[start, end]}
            color={color}
            lineWidth={STROKE_WIDTH.EIGENVECTOR}
            opacity={opacity}
            dashed={true}
            dashSize={0.2}
            gapSize={0.1}
          />
        );
      })}
    </group>
  );
}

/**
 * Axis labels component - renders numbers on axes using HTML overlay
 */
function AxisLabels() {
  const showGrid = useVisualizerStore((state) => state.showGrid);
  const animationProgress = useVisualizerStore((state) => state.animationProgress);

  if (!showGrid) return null;

  // Only show labels when not animating (progress is 0 or 1)
  const showLabels = animationProgress < 0.01 || animationProgress > 0.99;
  if (!showLabels) return null;

  const labels = [-4, -3, -2, -1, 1, 2, 3, 4];

  return (
    <group>
      {/* X-axis labels */}
      {labels.map((n) => (
        <Html
          key={`x-${n}`}
          position={[n, -0.35, 0]}
          style={{
            color: COLORS.TEXT,
            fontFamily: "'CMU Serif', 'Times New Roman', serif",
            fontSize: "12px",
            pointerEvents: "none",
            userSelect: "none",
            opacity: 0.8,
          }}
          center
        >
          {n}
        </Html>
      ))}
      {/* Y-axis labels */}
      {labels.map((n) => (
        <Html
          key={`y-${n}`}
          position={[-0.35, n, 0]}
          style={{
            color: COLORS.TEXT,
            fontFamily: "'CMU Serif', 'Times New Roman', serif",
            fontSize: "12px",
            pointerEvents: "none",
            userSelect: "none",
            opacity: 0.8,
          }}
          center
        >
          {n}
        </Html>
      ))}
    </group>
  );
}

function CameraController() {
  const viewMode = useVisualizerStore((state) => state.viewMode);
  const { camera } = useThree();

  useEffect(() => {
    if (viewMode === "2D") {
      camera.position.set(0, 0, 10);
      camera.rotation.set(0, 0, 0);
    } else {
      camera.position.set(5, 5, 10);
      camera.lookAt(0, 0, 0);
    }
  }, [viewMode, camera]);

  return viewMode === "3D" ? <OrbitControls enableDamping /> : null;
}

function Scene() {
  const matrix = useVisualizerStore((state) => state.matrix);
  const animationProgress = useVisualizerStore(
    (state) => state.animationProgress
  );

  // Create transformation matrix from 2x2 input
  const transformMatrix = useMemo(() => {
    const m = new THREE.Matrix4();
    m.set(
      matrix.a, matrix.b, 0, 0,
      matrix.c, matrix.d, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );
    return m;
  }, [matrix]);

  return (
    <>
      <CameraController />
      <Grid transform={transformMatrix} progress={animationProgress} />
      <AxisLabels />
      <BasisVectors transform={transformMatrix} progress={animationProgress} />
      <Eigenvectors progress={animationProgress} />
    </>
  );
}

export function ManimCanvas() {
  return (
    <div style={{ width: "100%", height: "100%", background: COLORS.BACKGROUND }}>
      <Canvas
        orthographic
        camera={{
          position: [0, 0, 10],
          zoom: 50,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}  // Responsive pixel ratio for better quality
      >
        <color attach="background" args={[COLORS.BACKGROUND]} />
        <Scene />
      </Canvas>
    </div>
  );
}
