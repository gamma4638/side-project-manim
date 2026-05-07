import json
import math
import os

import numpy as np
from manim import *
from scipy.special import erfinv as _erfinv

BG = BLACK
TEXT = WHITE
DIST_COLOR = "#58c4dd"
REJECT_COLOR = "#fc6255"
ACCEPT_COLOR = "#83c167"
PVAL_COLOR = "#ffff00"


def norm_ppf(p: float) -> float:
    return math.sqrt(2) * float(_erfinv(2 * p - 1))


def norm_cdf(x: float) -> float:
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


class HypothesisTestScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"alpha": 0.05, "test_type": "two-tailed"}'))
        alpha = float(params.get("alpha", 0.05))
        test_type = params.get("test_type", "two-tailed")

        title = Text("Hypothesis Testing & p-value", color=TEXT, font_size=30).to_edge(UP)
        self.play(FadeIn(title))

        axes = Axes(
            x_range=[-4, 4, 1], y_range=[0, 0.48, 0.1],
            x_length=10, y_length=4.8,
            axis_config={"color": WHITE, "stroke_width": 2},
        ).shift(DOWN * 0.3)

        normal = axes.plot(
            lambda x: np.exp(-x ** 2 / 2) / np.sqrt(2 * np.pi),
            x_range=[-4, 4, 0.05], color=DIST_COLOR, stroke_width=3,
        )
        h0_label = MathTex(r"H_0: \mu = 0", color=TEXT, font_size=28).to_corner(UL, buff=0.5)

        self.play(Create(axes), Create(normal), Write(h0_label))
        self.wait(0.5)

        if test_type == "two-tailed":
            z_crit = norm_ppf(1 - alpha / 2)
            left_area = axes.get_area(normal, x_range=[-4, -z_crit], color=REJECT_COLOR, opacity=0.4)
            right_area = axes.get_area(normal, x_range=[z_crit, 4], color=REJECT_COLOR, opacity=0.4)
            crit_label = MathTex(rf"z_{{crit}} = \pm {z_crit:.2f}", color=REJECT_COLOR, font_size=26).to_corner(UR, buff=0.5)
            alpha_lbl = MathTex(rf"\alpha = {alpha}", color=REJECT_COLOR, font_size=24).next_to(crit_label, DOWN)
            self.play(Create(left_area), Create(right_area), Write(crit_label), Write(alpha_lbl))
            z_obs = 2.1
            p_val = 2 * (1 - norm_cdf(abs(z_obs)))
        else:
            z_crit = norm_ppf(1 - alpha)
            right_area = axes.get_area(normal, x_range=[z_crit, 4], color=REJECT_COLOR, opacity=0.4)
            crit_label = MathTex(rf"z_{{crit}} = {z_crit:.2f}", color=REJECT_COLOR, font_size=26).to_corner(UR, buff=0.5)
            self.play(Create(right_area), Write(crit_label))
            z_obs = 2.1
            p_val = 1 - norm_cdf(z_obs)

        z_line = axes.get_vertical_line(axes.c2p(z_obs, 0.43), color=PVAL_COLOR, stroke_width=3)
        z_label = MathTex(rf"z_{{obs}} = {z_obs}", color=PVAL_COLOR, font_size=26).next_to(axes.c2p(z_obs, 0.43), RIGHT, buff=0.1)
        p_label = MathTex(rf"p\text{{-value}} = {p_val:.4f}", color=PVAL_COLOR, font_size=28).to_corner(DR, buff=0.5)
        decision = Text(
            "Reject H₀" if p_val < alpha else "Fail to Reject H₀",
            color=REJECT_COLOR if p_val < alpha else ACCEPT_COLOR,
            font_size=26,
        ).next_to(p_label, UP)

        self.play(Create(z_line), Write(z_label))
        self.play(Write(p_label), FadeIn(decision))
        self.wait(2)
