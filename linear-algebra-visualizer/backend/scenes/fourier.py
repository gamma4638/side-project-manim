import json
import os

import numpy as np
from manim import *

BG = "#0c1b33"
TEXT = "#ece6e2"
SQUARE_COLOR = "#58c4dd"
APPROX_COLOR = "#ffff00"


class FourierScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"num_terms": 5}'))
        num_terms = max(1, min(int(params.get("num_terms", 5)), 10))

        axes = Axes(
            x_range=[-np.pi - 0.3, np.pi + 0.3, 1],
            y_range=[-1.8, 1.8, 1],
            x_length=10, y_length=5.5,
            axis_config={"color": WHITE, "stroke_width": 2},
        )

        def square_wave(x):
            return 1.0 if np.sin(x) >= 0 else -1.0

        def fourier_approx(x, n):
            return sum((4 / (np.pi * k)) * np.sin(k * x) for k in range(1, 2 * n, 2))

        title = Text("Fourier Series", color=TEXT, font_size=36).to_edge(UP)
        square = axes.plot(square_wave, x_range=[-np.pi, np.pi, 0.005], color=SQUARE_COLOR, stroke_width=2, use_smoothing=False)
        sq_label = MathTex(r"\text{Square wave}", color=SQUARE_COLOR, font_size=28).to_corner(UL, buff=0.5)

        self.play(Create(axes), FadeIn(title))
        self.play(Create(square), Write(sq_label))
        self.wait(0.5)

        prev_approx = None
        prev_label = None
        for n in range(1, num_terms + 1):
            approx = axes.plot(
                lambda x, n=n: fourier_approx(x, n),
                x_range=[-np.pi, np.pi, 0.005],
                color=APPROX_COLOR, stroke_width=2, use_smoothing=False,
            )
            terms_label = MathTex(f"n = {n}", color=APPROX_COLOR, font_size=28).to_corner(UR, buff=0.5)

            if prev_approx is None:
                self.play(Create(approx), Write(terms_label))
            else:
                self.play(Transform(prev_approx, approx), Transform(prev_label, terms_label))

            prev_approx = approx
            prev_label = terms_label
            self.wait(0.8)

        self.wait(1.5)
