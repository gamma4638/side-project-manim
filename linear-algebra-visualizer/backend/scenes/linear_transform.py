import json
import os

import numpy as np
from manim import *

BG = "#0c1b33"
I_COLOR = "#83c167"
J_COLOR = "#fc6255"
TEXT = "#ece6e2"
GRID = "#4a5568"


class LinearTransformScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"matrix_2x2": [[2, 0], [0, 2]]}'))
        m = params["matrix_2x2"]
        matrix = np.array([[m[0][0], m[0][1]], [m[1][0], m[1][1]]])

        plane = NumberPlane(
            x_range=[-6, 6, 1], y_range=[-6, 6, 1],
            background_line_style={"stroke_color": GRID, "stroke_width": 1, "stroke_opacity": 0.4},
        )
        i_hat = Arrow(ORIGIN, RIGHT, buff=0, color=I_COLOR, stroke_width=6)
        j_hat = Arrow(ORIGIN, UP, buff=0, color=J_COLOR, stroke_width=6)
        i_label = MathTex(r"\hat{\imath}", color=I_COLOR, font_size=32).next_to(RIGHT, DR, buff=0.1)
        j_label = MathTex(r"\hat{\jmath}", color=J_COLOR, font_size=32).next_to(UP, UL, buff=0.1)

        title = Text("Linear Transformation", color=TEXT, font_size=34).to_edge(UP)
        mat_tex = MathTex(
            r"M = \begin{bmatrix}" + f"{matrix[0,0]} & {matrix[0,1]}\\\\ {matrix[1,0]} & {matrix[1,1]}" + r"\end{bmatrix}",
            color=TEXT, font_size=30,
        ).to_corner(UL, buff=0.5)
        bg = BackgroundRectangle(mat_tex, fill_opacity=0.8, buff=0.2)

        self.play(Create(plane), FadeIn(title))
        self.play(GrowArrow(i_hat), GrowArrow(j_hat), Write(i_label), Write(j_label))
        self.play(FadeIn(bg), Write(mat_tex))
        self.wait(0.5)

        self.play(
            ApplyMatrix(matrix, plane),
            ApplyMatrix(matrix, i_hat),
            ApplyMatrix(matrix, j_hat),
            run_time=2,
        )
        self.wait(2)
