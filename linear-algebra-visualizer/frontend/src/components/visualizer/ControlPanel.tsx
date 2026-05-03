/**
 * Control Panel for matrix input and visualization settings
 */

import { useCallback, useEffect, useRef } from "react";
import {
  useVisualizerStore,
  MatrixPreset,
} from "../../store/visualizerStore";

/**
 * Manim's smooth() easing function
 * Creates a smooth start and end animation (cubic smoothstep)
 * Formula: 3t² - 2t³
 */
const smooth = (t: number): number => {
  return 3 * t * t - 2 * t * t * t;
};

const PRESETS: { value: MatrixPreset; label: string }[] = [
  { value: "identity", label: "Identity" },
  { value: "rotation45", label: "Rotation 45°" },
  { value: "rotation90", label: "Rotation 90°" },
  { value: "scale2x", label: "Scale 2x" },
  { value: "shearX", label: "Shear X" },
  { value: "shearY", label: "Shear Y" },
  { value: "reflection", label: "Reflection (Y)" },
  { value: "projection", label: "Projection (X)" },
  { value: "example", label: "Example [[3,1],[0,2]]" },
];

export function ControlPanel() {
  const matrix = useVisualizerStore((state) => state.matrix);
  const setMatrix = useVisualizerStore((state) => state.setMatrix);
  const setMatrixPreset = useVisualizerStore((state) => state.setMatrixPreset);
  const eigenData = useVisualizerStore((state) => state.eigenData);
  const animationProgress = useVisualizerStore(
    (state) => state.animationProgress
  );
  const setAnimationProgress = useVisualizerStore(
    (state) => state.setAnimationProgress
  );
  const isAnimating = useVisualizerStore((state) => state.isAnimating);
  const setIsAnimating = useVisualizerStore((state) => state.setIsAnimating);
  const viewMode = useVisualizerStore((state) => state.viewMode);
  const setViewMode = useVisualizerStore((state) => state.setViewMode);
  const showGrid = useVisualizerStore((state) => state.showGrid);
  const setShowGrid = useVisualizerStore((state) => state.setShowGrid);
  const showBasisVectors = useVisualizerStore(
    (state) => state.showBasisVectors
  );
  const setShowBasisVectors = useVisualizerStore(
    (state) => state.setShowBasisVectors
  );
  const showEigenvectors = useVisualizerStore(
    (state) => state.showEigenvectors
  );
  const setShowEigenvectors = useVisualizerStore(
    (state) => state.setShowEigenvectors
  );

  const animationRef = useRef<number | null>(null);

  const handleMatrixChange = useCallback(
    (key: "a" | "b" | "c" | "d", value: string) => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setMatrix({ [key]: numValue });
      }
    },
    [setMatrix]
  );

  const handlePresetChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setMatrixPreset(e.target.value as MatrixPreset);
      setAnimationProgress(0);
    },
    [setMatrixPreset, setAnimationProgress]
  );

  const playAnimation = useCallback(() => {
    if (isAnimating) {
      // Stop animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    const duration = 2000; // 2 seconds
    const startTime = performance.now();
    const startProgress = animationProgress;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      // Calculate linear progress from current position to end
      const linearProgress = Math.min(elapsed / duration, 1);
      // Apply Manim's smooth() easing function
      const easedProgress = smooth(linearProgress);
      // Interpolate from start position
      const progress = startProgress + easedProgress * (1 - startProgress);

      setAnimationProgress(progress);

      if (linearProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setAnimationProgress(1);  // Ensure we end exactly at 1
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [isAnimating, animationProgress, setIsAnimating, setAnimationProgress]);

  const resetAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsAnimating(false);
    setAnimationProgress(0);
  }, [setIsAnimating, setAnimationProgress]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const formatNumber = (n: number) => {
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(4).replace(/\.?0+$/, "");
  };

  return (
    <div className="control-panel">
      {/* Matrix Input Section */}
      <section className="panel-section">
        <h3>Transformation Matrix</h3>

        <div className="preset-selector">
          <label>Preset:</label>
          <select onChange={handlePresetChange}>
            {PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        <div className="matrix-input">
          <div className="matrix-bracket">[</div>
          <div className="matrix-grid">
            <input
              type="number"
              step="0.1"
              value={matrix.a}
              onChange={(e) => handleMatrixChange("a", e.target.value)}
            />
            <input
              type="number"
              step="0.1"
              value={matrix.b}
              onChange={(e) => handleMatrixChange("b", e.target.value)}
            />
            <input
              type="number"
              step="0.1"
              value={matrix.c}
              onChange={(e) => handleMatrixChange("c", e.target.value)}
            />
            <input
              type="number"
              step="0.1"
              value={matrix.d}
              onChange={(e) => handleMatrixChange("d", e.target.value)}
            />
          </div>
          <div className="matrix-bracket">]</div>
        </div>
      </section>

      {/* Animation Controls */}
      <section className="panel-section">
        <h3>Animation</h3>

        <div className="animation-controls">
          <button
            className={`play-button ${isAnimating ? "playing" : ""}`}
            onClick={playAnimation}
          >
            {isAnimating ? "⏸ Pause" : "▶ Play"}
          </button>
          <button className="reset-button" onClick={resetAnimation}>
            ↺ Reset
          </button>
        </div>

        <div className="timeline">
          <label>Progress: {Math.round(animationProgress * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={animationProgress}
            onChange={(e) => setAnimationProgress(parseFloat(e.target.value))}
          />
        </div>
      </section>

      {/* Display Options */}
      <section className="panel-section">
        <h3>Display Options</h3>

        <div className="toggle-group">
          <label>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            Show Grid
          </label>

          <label>
            <input
              type="checkbox"
              checked={showBasisVectors}
              onChange={(e) => setShowBasisVectors(e.target.checked)}
            />
            Show Basis Vectors (î, ĵ)
          </label>

          <label>
            <input
              type="checkbox"
              checked={showEigenvectors}
              onChange={(e) => setShowEigenvectors(e.target.checked)}
            />
            Show Eigenvectors
          </label>
        </div>

        <div className="view-mode-selector">
          <label>View Mode:</label>
          <div className="button-group">
            <button
              className={viewMode === "2D" ? "active" : ""}
              onClick={() => setViewMode("2D")}
            >
              2D
            </button>
            <button
              className={viewMode === "3D" ? "active" : ""}
              onClick={() => setViewMode("3D")}
            >
              3D
            </button>
          </div>
        </div>
      </section>

      {/* Eigenvalue Info */}
      <section className="panel-section eigen-info">
        <h3>Eigenvalue Analysis</h3>

        {eigenData.eigenvalues ? (
          <>
            <div className="eigen-row">
              <span className="eigen-label" style={{ color: "#FFFF00" }}>
                λ₁ =
              </span>
              <span className="eigen-value">
                {formatNumber(eigenData.eigenvalues[0])}
              </span>
            </div>
            <div className="eigen-row">
              <span className="eigen-label" style={{ color: "#58C4DD" }}>
                λ₂ =
              </span>
              <span className="eigen-value">
                {formatNumber(eigenData.eigenvalues[1])}
              </span>
            </div>

            {eigenData.eigenvectors && (
              <>
                <div className="eigen-row">
                  <span className="eigen-label" style={{ color: "#FFFF00" }}>
                    v₁ =
                  </span>
                  <span className="eigen-value">
                    [{formatNumber(eigenData.eigenvectors[0][0])},{" "}
                    {formatNumber(eigenData.eigenvectors[0][1])}]
                  </span>
                </div>
                <div className="eigen-row">
                  <span className="eigen-label" style={{ color: "#58C4DD" }}>
                    v₂ =
                  </span>
                  <span className="eigen-value">
                    [{formatNumber(eigenData.eigenvectors[1][0])},{" "}
                    {formatNumber(eigenData.eigenvectors[1][1])}]
                  </span>
                </div>
              </>
            )}

            <div className="eigen-note">
              <small>
                Determinant: {formatNumber(matrix.a * matrix.d - matrix.b * matrix.c)}
                <br />
                Trace: {formatNumber(matrix.a + matrix.d)}
              </small>
            </div>
          </>
        ) : (
          <div className="eigen-complex">
            Complex eigenvalues (no real eigenvectors)
          </div>
        )}
      </section>
    </div>
  );
}
