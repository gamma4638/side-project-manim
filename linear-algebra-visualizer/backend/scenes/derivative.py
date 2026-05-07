import json
import os

import numpy as np
from manim import *

BG = BLACK
TEXT = WHITE
FUNC_COLOR = "#58c4dd"
TANGENT_COLOR = "#fc6255"
POINT_COLOR = "#ffff00"

FUNCTIONS = {
    "sin":  (np.sin,             r"\sin(x)", np.cos,                [-3.0, 3.0]),
    "cos":  (np.cos,             r"\cos(x)", lambda x: -np.sin(x),  [-3.0, 3.0]),
    "x^2":  (lambda x: x ** 2,  r"x^2",     lambda x: 2 * x,       [-2.5, 2.5]),
    "x^3":  (lambda x: x ** 3,  r"x^3",     lambda x: 3 * x ** 2,  [-1.8, 1.8]),
}


class DerivativeScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"function": "x^2"}'))
        func_name = params.get("function", "x^2")
        if func_name not in FUNCTIONS:
            func_name = "x^2"

        func, label, deriv, x_range = FUNCTIONS[func_name]

        axes = Axes(
            x_range=[x_range[0] - 0.3, x_range[1] + 0.3, 1],
            y_range=[-3.5, 3.5, 1],
            x_length=10, y_length=6,
            axis_config={"color": WHITE, "stroke_width": 2},
        )

        graph = axes.plot(func, x_range=x_range, color=FUNC_COLOR, stroke_width=3)
        func_tex = MathTex(f"f(x) = {label}", color=FUNC_COLOR, font_size=32).to_corner(UL, buff=0.5)
        title = Text("Derivative as Tangent Line", color=TEXT, font_size=32).to_edge(UP)

        self.play(Create(axes), FadeIn(title))
        self.play(Create(graph), Write(func_tex))

        x_tracker = ValueTracker(x_range[0] + 0.5)

        def get_tangent():
            x0 = x_tracker.get_value()
            y0 = func(x0)
            slope = deriv(x0)
            dx = 1.5 / max(np.sqrt(1 + slope ** 2), 0.01)
            return Line(
                axes.c2p(x0 - dx, y0 - slope * dx),
                axes.c2p(x0 + dx, y0 + slope * dx),
                color=TANGENT_COLOR, stroke_width=3,
            )

        dot = always_redraw(lambda: Dot(axes.c2p(x_tracker.get_value(), func(x_tracker.get_value())), color=POINT_COLOR, radius=0.08))
        tangent = always_redraw(get_tangent)
        slope_label = always_redraw(lambda: MathTex(
            rf"f'({x_tracker.get_value():.1f}) = {deriv(x_tracker.get_value()):.2f}",
            color=TANGENT_COLOR, font_size=28,
        ).to_corner(UR, buff=0.5))

        self.play(FadeIn(dot), Create(tangent), Write(slope_label))
        self.play(x_tracker.animate.set_value(x_range[1] - 0.5), run_time=4, rate_func=linear)
        self.wait(1)
