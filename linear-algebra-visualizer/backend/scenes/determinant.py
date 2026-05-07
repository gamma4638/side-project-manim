import json
import os

import numpy as np
from manim import *

BG = BLACK
TEXT = WHITE
GRID = BLUE_E
FILL = "#ffff00"


class DeterminantScene(Scene):
    def construct(self):
        self.camera.background_color = BG
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"matrix_2x2": [[2, 1], [0, 2]]}'))
        m = params["matrix_2x2"]
        matrix = np.array([[m[0][0], m[0][1]], [m[1][0], m[1][1]]])
        det = float(np.linalg.det(matrix))

        plane = NumberPlane(
            x_range=[-5, 5, 1], y_range=[-5, 5, 1],
            background_line_style={"stroke_color": GRID, "stroke_width": 1, "stroke_opacity": 0.4},
        )

        unit_sq = Polygon(
            plane.c2p(0, 0), plane.c2p(1, 0), plane.c2p(1, 1), plane.c2p(0, 1),
            color=FILL, fill_opacity=0.35, stroke_width=2,
        )
        area_label = MathTex(r"\text{Area} = 1", color=TEXT, font_size=28).to_corner(UR, buff=0.5)
        title = Text("Determinant = Area Scale Factor", color=TEXT, font_size=30).to_edge(UP)
        mat_tex = MathTex(
            r"M = \begin{bmatrix}" + f"{matrix[0,0]} & {matrix[0,1]}\\\\ {matrix[1,0]} & {matrix[1,1]}" + r"\end{bmatrix}",
            color=TEXT, font_size=28,
        ).to_corner(UL, buff=0.5)
        bg = BackgroundRectangle(mat_tex, fill_opacity=0.8, buff=0.2)

        self.play(Create(plane), FadeIn(title))
        self.play(Create(unit_sq), Write(area_label))
        self.play(FadeIn(bg), Write(mat_tex))
        self.wait(0.5)

        transformed_sq = Polygon(
            plane.c2p(0, 0),
            plane.c2p(matrix[0, 0], matrix[1, 0]),
            plane.c2p(matrix[0, 0] + matrix[0, 1], matrix[1, 0] + matrix[1, 1]),
            plane.c2p(matrix[0, 1], matrix[1, 1]),
            color=FILL, fill_opacity=0.35, stroke_width=2,
        )
        new_area = MathTex(rf"\text{{Area}} = |\det M| = {abs(det):.2f}", color=TEXT, font_size=28).to_corner(UR, buff=0.5)

        self.play(
            ApplyMatrix(matrix, plane),
            Transform(unit_sq, transformed_sq),
            Transform(area_label, new_area),
            run_time=2,
        )
        self.wait(2)
