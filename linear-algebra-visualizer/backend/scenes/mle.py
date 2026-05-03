import json
import os

import numpy as np
from manim import *

BG = "#0c1b33"
TEXT = "#ece6e2"
DATA_COLOR = "#ffff00"
LIKE_COLOR = "#58c4dd"
MLE_COLOR = "#fc6255"


class MLEScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"dist_type": "normal"}'))

        title = Text("Maximum Likelihood Estimation", color=TEXT, font_size=30).to_edge(UP)
        self.play(FadeIn(title))

        np.random.seed(42)
        true_mu = 2.0
        data = np.random.normal(true_mu, 1.0, 20)
        x_bar = float(np.mean(data))

        axes = Axes(
            x_range=[-1, 5, 1], y_range=[0, 0.65, 0.1],
            x_length=10, y_length=5,
            axis_config={"color": WHITE, "stroke_width": 2},
        ).shift(DOWN * 0.3)

        data_dots = VGroup(*[
            Dot(axes.c2p(float(x), 0.02), color=DATA_COLOR, radius=0.05)
            for x in data
        ])
        data_label = Text("Observed data", color=DATA_COLOR, font_size=24).to_corner(UL, buff=0.5)

        self.play(Create(axes), Create(data_dots), Write(data_label))
        self.wait(0.5)

        mu_tracker = ValueTracker(-0.8)

        likelihood_curve = always_redraw(lambda: axes.plot(
            lambda x: np.exp(-0.5 * (x - mu_tracker.get_value()) ** 2) / np.sqrt(2 * np.pi),
            x_range=[-1, 5, 0.05], color=LIKE_COLOR, stroke_width=3,
        ))
        mu_label = always_redraw(lambda: MathTex(
            rf"\mu = {mu_tracker.get_value():.2f}", color=LIKE_COLOR, font_size=28,
        ).to_corner(UR, buff=0.5))

        self.play(Create(likelihood_curve), Write(mu_label))
        self.play(mu_tracker.animate.set_value(x_bar), run_time=3.5, rate_func=smooth)

        mle_result = MathTex(
            rf"\hat{{\mu}}_{{MLE}} = \bar{{x}} = {x_bar:.2f}", color=MLE_COLOR, font_size=30,
        ).to_corner(DR, buff=0.5)
        self.play(Write(mle_result))
        self.wait(2)
