import json
import os

import numpy as np
from manim import *

BG = "#0c1b33"
TEXT = "#ece6e2"
HIST_COLOR = "#58c4dd"
NORMAL_COLOR = "#ffff00"


class CLTScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"sample_size": 30, "dist_type": "uniform"}'))
        n = max(5, min(int(params.get("sample_size", 30)), 100))
        dist_type = params.get("dist_type", "uniform")

        title = Text("Central Limit Theorem", color=TEXT, font_size=34).to_edge(UP)
        self.play(FadeIn(title))

        axes1 = Axes(x_range=[-0.2, 1.5, 0.5], y_range=[0, 2.5, 0.5], x_length=4.5, y_length=3.2).shift(LEFT * 3.2 + DOWN * 0.3)

        if dist_type == "uniform":
            orig = axes1.plot(lambda x: 1.0 if 0 <= x <= 1 else 0, x_range=[0, 1, 0.001], color=HIST_COLOR, stroke_width=3, use_smoothing=False)
            orig_lbl = Text("Uniform[0,1]", color=TEXT, font_size=20).next_to(axes1, DOWN, buff=0.15)
            mu, sigma = 0.5, 1 / np.sqrt(12 * n)
            np.random.seed(42)
            samples = np.random.uniform(0, 1, (2000, n)).mean(axis=1)
        else:
            orig = axes1.plot(lambda x: np.exp(-x) if x >= 0 else 0, x_range=[0, 4, 0.01], color=HIST_COLOR, stroke_width=3)
            orig_lbl = Text("Exponential(1)", color=TEXT, font_size=20).next_to(axes1, DOWN, buff=0.15)
            mu, sigma = 1.0, 1 / np.sqrt(n)
            np.random.seed(42)
            samples = np.random.exponential(1, (2000, n)).mean(axis=1)

        self.play(Create(axes1), Create(orig), Write(orig_lbl))
        self.wait(0.5)

        x_lo, x_hi = mu - 4 * sigma, mu + 4 * sigma
        axes2 = Axes(x_range=[x_lo, x_hi, sigma * 2], y_range=[0, 500, 100], x_length=4.5, y_length=3.2).shift(RIGHT * 2.8 + DOWN * 0.3)
        samp_lbl = Text(f"Sample means (n={n})", color=TEXT, font_size=20).next_to(axes2, DOWN, buff=0.15)

        hist_vals, bins = np.histogram(samples, bins=25, range=(x_lo, x_hi))
        bars = VGroup()
        for i, count in enumerate(hist_vals):
            bar = Rectangle(
                width=abs(axes2.c2p(bins[i + 1], 0)[0] - axes2.c2p(bins[i], 0)[0]),
                height=abs(axes2.c2p(0, count)[1] - axes2.c2p(0, 0)[1]),
                fill_color=HIST_COLOR, fill_opacity=0.65, stroke_width=0.5, stroke_color=WHITE,
            )
            bar.move_to(axes2.c2p((bins[i] + bins[i + 1]) / 2, count / 2))
            bars.add(bar)

        normal_curve = axes2.plot(
            lambda x: 2000 * (bins[1] - bins[0]) / (sigma * np.sqrt(2 * np.pi)) * np.exp(-0.5 * ((x - mu) / sigma) ** 2),
            x_range=[x_lo, x_hi, sigma * 0.05],
            color=NORMAL_COLOR, stroke_width=3,
        )
        clt_text = Text("→ Normal!", color=NORMAL_COLOR, font_size=26).to_corner(DR, buff=0.5)

        self.play(Create(axes2), Write(samp_lbl))
        self.play(Create(bars))
        self.play(Create(normal_curve))
        self.play(FadeIn(clt_text))
        self.wait(2)
