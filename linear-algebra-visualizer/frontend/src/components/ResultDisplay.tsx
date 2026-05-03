import React from 'react';

interface RenderResult {
  video_url?: string;
  image_url?: string;
  eigenvalues: Array<{ re: number; im: number } | number>;
  eigenvectors: number[][];
  message: string;
}

interface ResultDisplayProps {
  result: RenderResult | null;
  isLoading: boolean;
  error: string | null;
}

export default function ResultDisplay({
  result,
  isLoading,
  error,
}: ResultDisplayProps) {
  const formatComplex = (value: { re: number; im: number } | number): string => {
    if (typeof value === 'number') {
      return value.toFixed(3);
    }
    const { re, im } = value;
    if (Math.abs(im) < 0.0001) {
      return re.toFixed(3);
    }
    const sign = im >= 0 ? '+' : '';
    return `${re.toFixed(3)}${sign}${im.toFixed(3)}i`;
  };

  const formatVector = (vec: number[]): string => {
    return `[${vec.map((v) => v.toFixed(3)).join(', ')}]`;
  };

  if (error) {
    return (
      <div className="result-display">
        <h2>Result</h2>
        <div className="error">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="result-display">
        <h2>Result</h2>
        <div className="loading">
          <div className="spinner"></div>
          <p>Rendering with Manim...</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.7 }}>
            This may take 10-30 seconds
          </p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="result-display">
        <h2>Result</h2>
        <div className="result-placeholder">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM8 15c0-1.66 1.34-3 3-3 .35 0 .69.07 1 .18V6h5v2h-3v7.03c-.02 1.64-1.35 2.97-3 2.97-1.66 0-3-1.34-3-3z" />
          </svg>
          <p>Enter matrix values and click "Apply Transform"</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.7 }}>
            Visualization will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="result-display">
      <h2>Result</h2>
      <div className="result-content">
        {result.video_url && (
          <video controls autoPlay loop muted>
            <source src={result.video_url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
        {result.image_url && !result.video_url && (
          <img src={result.image_url} alt="Rendered visualization" />
        )}

        <div className="eigen-info">
          <h3>Eigenvalue Analysis</h3>
          <ul>
            {result.eigenvalues.map((ev, i) => (
              <li key={i} className={`eigenvalue-${i + 1}`}>
                <strong>λ{i + 1}:</strong> {formatComplex(ev)}
                {result.eigenvectors[i] && (
                  <span style={{ marginLeft: '1rem', opacity: 0.8 }}>
                    v{i + 1} = {formatVector(result.eigenvectors[i])}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
