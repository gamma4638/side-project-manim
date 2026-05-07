import json
import os

import numpy as np
from manim import *

BG = BLACK
TEXT = WHITE
GRID = BLUE_E
STD_COLOR = "#83c167"
NEW_COLOR = "#fc6255"


class BasisChangeScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"matrix_2x2": [[1, 1], [0, 1]]}'))
        m = params["matrix_2x2"]
        matrix = np.array([[m[0][0], m[0][1]], [m[1][0], m[1][1]]])

        plane = NumberPlane(
            x_range=[-5, 5, 1], y_range=[-5, 5, 1],
            background_line_style={"stroke_color": GRID, "stroke_width": 1, "stroke_opacity": 0.4},
        )

        e1 = Arrow(ORIGIN, RIGHT, buff=0, color=STD_COLOR, stroke_width=6)
        e2 = Arrow(ORIGIN, UP, buff=0, color=STD_COLOR, stroke_width=6)
        e1_lbl = MathTex(r"\mathbf{e}_1", color=STD_COLOR, font_size=30).next_to(e1.get_end(), DR, buff=0.1)
        e2_lbl = MathTex(r"\mathbf{e}_2", color=STD_COLOR, font_size=30).next_to(e2.get_end(), UL, buff=0.1)

        b1 = Arrow(ORIGIN, plane.c2p(matrix[0, 0], matrix[1, 0]), buff=0, color=NEW_COLOR, stroke_width=6)
        b2 = Arrow(ORIGIN, plane.c2p(matrix[0, 1], matrix[1, 1]), buff=0, color=NEW_COLOR, stroke_width=6)
        b1_lbl = MathTex(r"\mathbf{b}_1", color=NEW_COLOR, font_size=30).next_to(b1.get_end(), DR, buff=0.1)
        b2_lbl = MathTex(r"\mathbf{b}_2", color=NEW_COLOR, font_size=30).next_to(b2.get_end(), UL, buff=0.1)

        title = Text("Change of Basis", color=TEXT, font_size=36).to_edge(UP)
        new_basis_label = Text("New basis vectors:", color=TEXT, font_size=26).to_corner(UL, buff=0.5)

        self.play(Create(plane), FadeIn(title))
        self.play(GrowArrow(e1), GrowArrow(e2), Write(e1_lbl), Write(e2_lbl))
        self.wait(0.5)
        self.play(FadeIn(new_basis_label), GrowArrow(b1), GrowArrow(b2), Write(b1_lbl), Write(b2_lbl))
        self.wait(1)

        self.play(
            ApplyMatrix(matrix, plane),
            ApplyMatrix(matrix, e1),
            ApplyMatrix(matrix, e2),
            run_time=2,
        )
        self.wait(2)
