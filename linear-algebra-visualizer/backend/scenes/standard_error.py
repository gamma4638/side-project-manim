import json
import os

import numpy as np
from manim import *

BG = BLACK
TEXT = WHITE
CURVE_COLOR = "#58c4dd"
DOT_COLOR = "#ffff00"


class StandardErrorScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"sample_size": 30}'))
        max_n = max(10, min(int(params.get("sample_size", 30)), 100))

        title = Text("Standard Error", color=TEXT, font_size=36).to_edge(UP)
        self.play(FadeIn(title))

        axes = Axes(
            x_range=[0, max_n + 5, max(max_n // 5, 1)],
            y_range=[0, 1.6, 0.4],
            x_length=10, y_length=5,
            axis_config={"color": WHITE, "stroke_width": 2},
        ).shift(DOWN * 0.3)
        x_lbl = axes.get_x_axis_label(MathTex("n"), edge=RIGHT, direction=RIGHT)
        y_lbl = axes.get_y_axis_label(MathTex(r"SE"), edge=UP, direction=UP)

        se_curve = axes.plot(
            lambda n: 1 / np.sqrt(n) if n > 0 else 1.5,
            x_range=[1, max_n + 4, 0.2],
            color=CURVE_COLOR, stroke_width=3,
        )
        formula = MathTex(r"SE = \frac{\sigma}{\sqrt{n}}", color=CURVE_COLOR, font_size=34).to_corner(UR, buff=0.5)

        self.play(Create(axes), Write(x_lbl), Write(y_lbl))
        self.play(Create(se_curve), Write(formula))

        x_tracker = ValueTracker(1.0)
        dot = always_redraw(lambda: Dot(
            axes.c2p(x_tracker.get_value(), 1 / np.sqrt(x_tracker.get_value())),
            color=DOT_COLOR, radius=0.1,
        ))
        n_label = always_redraw(lambda: MathTex(
            rf"n={int(x_tracker.get_value())},\; SE={1/np.sqrt(x_tracker.get_value()):.3f}",
            color=DOT_COLOR, font_size=26,
        ).to_corner(UL, buff=0.5))

        self.play(FadeIn(dot), Write(n_label))
        self.play(x_tracker.animate.set_value(float(max_n)), run_time=4, rate_func=linear)
        self.wait(2)
