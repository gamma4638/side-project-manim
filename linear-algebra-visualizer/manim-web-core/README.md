# manim-web-core

A Three.js library that accurately replicates **ManimCE's 3Blue1Brown visual style** for interactive web-based mathematical visualizations.

## Features

- **Exact ManimCE Colors**: All 3B1B color constants extracted from ManimCE source
- **Rate Functions**: Complete set of easing functions matching ManimCE exactly
- **Mobject System**: VMobject-based rendering with Three.js Line2 for proper line widths
- **Geometry Mobjects**: Line, Arrow, Vector, Circle, Rectangle, Polygon, and more
- **Coordinate Systems**: Axes, NumberPlane with grid styling
- **Animation System**: FadeIn, FadeOut, Create, Transform, ApplyMatrix, etc.
- **Scene Management**: Easy-to-use Scene class with play() and wait() methods

## Installation

```bash
npm install manim-web-core three gsap
```

## Quick Start

```typescript
import {
  Scene,
  NumberPlane,
  Arrow,
  FadeIn,
  ApplyMatrix,
  GREEN,
  RED,
} from 'manim-web-core';

// Create and mount scene
const container = document.getElementById('canvas');
const scene = new Scene();
scene.mount(container);

// Create mobjects
const plane = new NumberPlane();
const iHat = new Arrow({
  start: [0, 0, 0],
  end: [1, 0, 0],
  strokeColor: GREEN,
});
const jHat = new Arrow({
  start: [0, 0, 0],
  end: [0, 1, 0],
  strokeColor: RED,
});

// Add to scene
scene.add(plane, iHat, jHat);

// Play animations
await scene.play(new FadeIn(plane));
await scene.play(
  new ApplyMatrix(plane, [[2, 1], [0, 2]]),
  new ApplyMatrix(iHat, [[2, 1], [0, 2]]),
  new ApplyMatrix(jHat, [[2, 1], [0, 2]])
);
```

## Color Palette

All colors are extracted directly from ManimCE:

```typescript
import {
  BLUE, BLUE_A, BLUE_B, BLUE_C, BLUE_D, BLUE_E,
  RED, GREEN, YELLOW, TEAL, PURPLE,
  I_HAT_COLOR,  // Green - î basis vector
  J_HAT_COLOR,  // Red - ĵ basis vector
  EIGEN_COLOR_1, // Yellow - first eigenvector
  EIGEN_COLOR_2, // Blue - second eigenvector
  BACKGROUND_COLOR, // 3B1B background
} from 'manim-web-core';
```

## Rate Functions (Easing)

```typescript
import {
  smooth,
  linear,
  easeInOutCubic,
  thereAndBack,
  rushInto,
  rushFrom,
} from 'manim-web-core';

// Use in animations
new FadeIn(mobject, { rateFunc: smooth });
```

## Mobjects

### Geometry

```typescript
import {
  Line, DashedLine,
  Arrow, Vector, DoubleArrow,
  Circle, Arc, Dot, Ellipse,
  Rectangle, Square, Polygon, Triangle, Star,
} from 'manim-web-core';
```

### Coordinate Systems

```typescript
import {
  Axes, ThreeDAxes,
  NumberPlane, ComplexPlane,
} from 'manim-web-core';
```

## Animations

```typescript
import {
  // Creation
  FadeIn, FadeOut, Create, Uncreate, GrowFromCenter,

  // Transform
  Transform, ReplacementTransform,
  ApplyMatrix, MoveToTarget, Rotate, Scale,

  // Grouping
  AnimationGroup, Succession, LaggedStart,

  // Waiting
  Wait,
} from 'manim-web-core';
```

## API Reference

### Scene

```typescript
const scene = new Scene({
  backgroundColor: BACKGROUND_COLOR,
  width: 800,
  height: 450,
  frameWidth: 14.22,  // Manim default
  frameHeight: 8,     // Manim default
});

scene.mount(container);     // Attach to DOM
scene.add(mobject);         // Add mobject
scene.remove(mobject);      // Remove mobject
scene.clear();              // Remove all

await scene.play(animation);      // Play animation
await scene.wait(1);              // Wait 1 second
await scene.playSequence(a, b);   // Play in sequence

scene.use2DCamera();        // Orthographic (default)
scene.use3DCamera(60);      // Perspective with FOV

scene.dispose();            // Clean up resources
```

### Mobject Methods

```typescript
mobject
  .setColor('#FF0000')
  .setStrokeWidth(4)
  .setOpacity(0.5)
  .moveTo(new THREE.Vector3(1, 2, 0))
  .shift(new THREE.Vector3(1, 0, 0))
  .scaleBy(2)
  .rotateBy(Math.PI / 4)
  .nextTo(otherMobject, RIGHT, 0.25);
```

## With React

Use with `@react-three/fiber`:

```tsx
import { Canvas } from '@react-three/fiber';
import { NumberPlane, Arrow, GREEN } from 'manim-web-core';

function Scene() {
  return (
    <>
      <NumberPlane />
      <Arrow start={[0, 0, 0]} end={[2, 1, 0]} strokeColor={GREEN} />
    </>
  );
}

export default function App() {
  return (
    <Canvas orthographic camera={{ zoom: 50 }}>
      <Scene />
    </Canvas>
  );
}
```

## Source Accuracy

All parameters are extracted directly from ManimCE source:
- Colors: `manim/utils/color/manim_colors.py`
- Rate functions: `manim/utils/rate_functions.py`
- Constants: `manim/constants.py`
- Arrow defaults: `manim/mobject/geometry/line.py`
- NumberPlane: `manim/mobject/graphing/coordinate_systems.py`

## License

MIT
