import json
import os

import numpy as np
from manim import *

BG = BLACK
TEXT = WHITE
FUNC_COLOR = "#58c4dd"
APPROX_COLORS = ["#ffff00", "#fc6255", "#83c167", "#9a72ac", "#5cd0b3", "#ff8c00", "#ff69b4"]

FUNCTIONS = {
    "sin":  (np.sin,            r"\sin(x)",  [-3.5, 3.5]),
    "cos":  (np.cos,            r"\cos(x)",  [-3.5, 3.5]),
    "exp":  (np.exp,            r"e^x",      [-2.0, 2.0]),
    "x^2":  (lambda x: x ** 2, r"x^2",      [-2.5, 2.5]),
}

TAYLOR_COEFFS = {
    "sin":  [0, 1, 0, -1/6, 0, 1/120, 0, -1/5040],
    "cos":  [1, 0, -0.5, 0, 1/24, 0, -1/720],
    "exp":  [1, 1, 0.5, 1/6, 1/24, 1/120, 1/720],
    "x^2":  [0, 0, 1],
}


class TaylorSeriesScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"function": "sin", "center": 0, "degree": 5}'))

        func_name = params.get("function", "sin")
        if func_name not in FUNCTIONS:
            func_name = "sin"
        center = float(params.get("center", 0))
        max_degree = min(int(params.get("degree", 5)), 7)

        func, func_label, x_range = FUNCTIONS[func_name]
        coeffs = TAYLOR_COEFFS[func_name]

        axes = Axes(
            x_range=[x_range[0] - 0.3, x_range[1] + 0.3, 1],
            y_range=[-2.5, 2.5, 1],
            x_length=10, y_length=6,
            axis_config={"color": WHITE, "stroke_width": 2},
        )

        true_graph = axes.plot(func, x_range=x_range, color=FUNC_COLOR, stroke_width=3)
        func_tex = MathTex(f"f(x) = {func_label}", color=FUNC_COLOR, font_size=30).to_corner(UL, buff=0.5)
        title = Text("Taylor Series", color=TEXT, font_size=36).to_edge(UP)

        self.play(Create(axes), FadeIn(title))
        self.play(Create(true_graph), Write(func_tex))
        self.wait(0.5)

        prev_approx = None
        prev_label = None
        for n in range(1, max_degree + 1):
            c = coeffs[: n + 1] if n + 1 <= len(coeffs) else coeffs

            def make_poly(c_=c, center_=center):
                return lambda x: sum(ci * (x - center_) ** i for i, ci in enumerate(c_))

            color = APPROX_COLORS[(n - 1) % len(APPROX_COLORS)]
            approx = axes.plot(make_poly(), x_range=x_range, color=color, stroke_width=2)
            degree_label = MathTex(f"n = {n}", color=color, font_size=28).to_corner(UR, buff=0.5)

            if prev_approx is None:
                self.play(Create(approx), Write(degree_label))
            else:
                self.play(Transform(prev_approx, approx), Transform(prev_label, degree_label))

            prev_approx = approx
            prev_label = degree_label
            self.wait(0.6)

        self.wait(1.5)
