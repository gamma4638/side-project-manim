/**
 * Main Three.js canvas component using @react-three/fiber
 * Renders the manim-style visualization
 */

import { useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import * as THREE from "three";
import { useVisualizerStore } from "../../store/visualizerStore";

// Manim colors
const COLORS = {
  BACKGROUND: "#0c1b33",
  GRID_MAIN: "#29ABCA",
  GRID_FADED: "#236B8E",
  I_HAT: "#83C167",
  J_HAT: "#FC6255",
  EIGEN_1: "#FFFF00",
  EIGEN_2: "#58C4DD",
  WHITE: "#FFFFFF",
};

interface GridProps {
  transform: THREE.Matrix4;
  progress: number;
}

function Grid({ transform, progress }: GridProps) {
  const showGrid = useVisualizerStore((state) => state.showGrid);

  // Generate grid lines
  const gridLines = useMemo(() => {
    const lines: { points: THREE.Vector3[]; color: string; opacity: number }[] = [];
    const range = 8;
    const step = 1;

    // Vertical lines
    for (let x = -range; x <= range; x += step) {
      const isAxis = x === 0;
      lines.push({
        points: [
          new THREE.Vector3(x, -range, 0),
          new THREE.Vector3(x, range, 0),
        ],
        color: isAxis ? COLORS.WHITE : COLORS.GRID_MAIN,
        opacity: isAxis ? 1 : 0.5,
      });
    }

    // Horizontal lines
    for (let y = -range; y <= range; y += step) {
      const isAxis = y === 0;
      lines.push({
        points: [
          new THREE.Vector3(-range, y, 0),
          new THREE.Vector3(range, y, 0),
        ],
        color: isAxis ? COLORS.WHITE : COLORS.GRID_MAIN,
        opacity: isAxis ? 1 : 0.5,
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

  if (!showGrid) return null;

  return (
    <group>
      {gridLines.map((line, index) => {
        // Transform points
        const transformedPoints = line.points.map((p) =>
          p.clone().applyMatrix4(interpolatedTransform)
        );

        return (
          <Line
            key={index}
            points={transformedPoints}
            color={line.color}
            lineWidth={line.opacity === 1 ? 2 : 1}
            opacity={line.opacity}
            transparent
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

  if (!showBasisVectors) return null;

  return (
    <group>
      {/* î vector */}
      <ArrowMesh
        start={iHat.start}
        end={iHat.end}
        color={COLORS.I_HAT}
      />
      {/* ĵ vector */}
      <ArrowMesh
        start={jHat.start}
        end={jHat.end}
        color={COLORS.J_HAT}
      />
    </group>
  );
}

interface ArrowMeshProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
}

function ArrowMesh({ start, end, color }: ArrowMeshProps) {
  const dir = end.clone().sub(start);
  const length = dir.length();

  if (length < 0.001) return null;

  dir.normalize();

  // Arrow shaft
  const shaftEnd = start.clone().add(dir.clone().multiplyScalar(length * 0.85));

  // Arrow tip geometry
  const tipLength = Math.min(length * 0.15, 0.3);
  const tipWidth = tipLength * 0.5;

  // Calculate tip vertices
  const perp = new THREE.Vector3(-dir.y, dir.x, 0);
  const tipBase = shaftEnd.clone();
  const tipLeft = tipBase.clone().add(perp.clone().multiplyScalar(tipWidth / 2));
  const tipRight = tipBase.clone().sub(perp.clone().multiplyScalar(tipWidth / 2));

  // Create triangle geometry for tip
  const tipGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      end.x, end.y, end.z,
      tipLeft.x, tipLeft.y, tipLeft.z,
      tipRight.x, tipRight.y, tipRight.z,
    ]);
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geom;
  }, [end.x, end.y, end.z, tipLeft.x, tipLeft.y, tipLeft.z, tipRight.x, tipRight.y, tipRight.z]);

  return (
    <group>
      {/* Shaft */}
      <Line
        points={[start, shaftEnd]}
        color={color}
        lineWidth={4}
      />
      {/* Tip */}
      <mesh geometry={tipGeometry}>
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
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
        const lineColor = i === 0 ? COLORS.EIGEN_1 : COLORS.EIGEN_2;

        return (
          <Line
            key={i}
            points={[start, end]}
            color={lineColor}
            lineWidth={3}
            opacity={opacity}
            transparent
            dashed
            dashSize={0.2}
            gapSize={0.1}
          />
        );
      })}
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
        gl={{ antialias: true }}
      >
        <color attach="background" args={[COLORS.BACKGROUND]} />
        <Scene />
      </Canvas>
    </div>
  );
}
