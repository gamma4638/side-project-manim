import React from 'react';

interface Matrix {
  a: number;
  b: number;
  c: number;
  d: number;
}

interface MatrixInputProps {
  matrix: Matrix;
  onChange: (matrix: Matrix) => void;
  onRender: () => void;
  isLoading: boolean;
}

const PRESETS: { name: string; matrix: Matrix }[] = [
  { name: 'Rotation 45°', matrix: { a: 0.707, b: -0.707, c: 0.707, d: 0.707 } },
  { name: 'Scale 2x', matrix: { a: 2, b: 0, c: 0, d: 2 } },
  { name: 'Shear', matrix: { a: 1, b: 1, c: 0, d: 1 } },
  { name: 'Reflection X', matrix: { a: 1, b: 0, c: 0, d: -1 } },
  { name: 'Identity', matrix: { a: 1, b: 0, c: 0, d: 1 } },
  { name: 'Example [[2,1],[1,2]]', matrix: { a: 2, b: 1, c: 1, d: 2 } },
];

export default function MatrixInput({
  matrix,
  onChange,
  onRender,
  isLoading,
}: MatrixInputProps) {
  const handleChange = (key: keyof Matrix, value: number) => {
    onChange({ ...matrix, [key]: value });
  };

  const handlePreset = (preset: Matrix) => {
    onChange(preset);
  };

  return (
    <div className="control-panel">
      <h2>2x2 Matrix Input</h2>

      <div className="matrix-input">
        <div className="matrix-grid">
          {(['a', 'b', 'c', 'd'] as const).map((key, index) => (
            <div key={key} className="matrix-cell">
              <label>
                {key === 'a' && 'a (top-left)'}
                {key === 'b' && 'b (top-right)'}
                {key === 'c' && 'c (bottom-left)'}
                {key === 'd' && 'd (bottom-right)'}
              </label>
              <input
                type="number"
                step="0.1"
                value={matrix[key]}
                onChange={(e) => handleChange(key, parseFloat(e.target.value) || 0)}
              />
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={matrix[key]}
                onChange={(e) => handleChange(key, parseFloat(e.target.value))}
              />
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Matrix: [{matrix.a}, {matrix.b}] [{matrix.c}, {matrix.d}]
        </p>

        <button
          className="render-button"
          onClick={onRender}
          disabled={isLoading}
        >
          {isLoading ? 'Rendering...' : 'Apply Transform'}
        </button>
      </div>

      <div className="presets">
        <h3>Quick Presets</h3>
        <div className="preset-buttons">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              className="preset-button"
              onClick={() => handlePreset(preset.matrix)}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
