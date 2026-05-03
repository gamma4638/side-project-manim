/**
 * Linear Algebra Visualizer - Interactive 3B1B-Style Web App
 */

import { ManimCanvas, ControlPanel } from "./components/visualizer";
import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Linear Algebra Visualizer</h1>
        <p>Interactive 3Blue1Brown-style visualization</p>
      </header>

      <main className="app-main">
        <div className="canvas-container">
          <ManimCanvas />
        </div>

        <aside className="control-sidebar">
          <ControlPanel />
        </aside>
      </main>

      <footer className="app-footer">
        <p>
          Built with{" "}
          <a
            href="https://github.com/ManimCommunity/manim"
            target="_blank"
            rel="noopener noreferrer"
          >
            ManimCE
          </a>{" "}
          styling and Three.js
        </p>
      </footer>
    </div>
  );
}

export default App;
