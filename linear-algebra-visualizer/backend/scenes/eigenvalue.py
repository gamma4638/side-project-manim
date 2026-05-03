"""
Eigenvalue/Eigenvector Visualization Scene
3Blue1Brown style using ManimCE

Color palette from 3B1B:
- Background: #0c1b33 (dark blue)
- î-hat (basis): #83c167 (green)
- ĵ-hat (basis): #fc6255 (red)
- Eigenvector 1: #ffff00 (yellow)
- Eigenvector 2: #58c4dd (blue)
- Text: #ece6e2 (cream)
"""

import json
import os
import numpy as np
from manim import *

# 3B1B Color Palette
BACKGROUND_COLOR = "#0c1b33"
I_HAT_COLOR = "#83c167"      # Green - î basis vector
J_HAT_COLOR = "#fc6255"      # Red - ĵ basis vector
EIGEN_COLOR_1 = "#ffff00"    # Yellow - eigenvector 1
EIGEN_COLOR_2 = "#58c4dd"    # Blue - eigenvector 2
TEXT_COLOR = "#ece6e2"       # Cream text
GRID_COLOR = "#4a5568"       # Subtle grid
TEAL = "#5cd0b3"
PURPLE = "#9a72ac"


class EigenvalueScene(Scene):
    """
    Visualize eigenvalues and eigenvectors of a 2x2 matrix
    with 3Blue1Brown styling
    """

    def construct(self):
        # Set background color
        self.camera.background_color = BACKGROUND_COLOR

        # Get matrix from environment variable or use default
        params = json.loads(os.environ.get("SCENE_PARAMS", '{"matrix_2x2": [[2, 1], [1, 2]]}'))
        m = params["matrix_2x2"]
        matrix = np.array([[m[0][0], m[0][1]], [m[1][0], m[1][1]]])

        # Calculate eigenvalues and eigenvectors
        eigenvalues, eigenvectors = np.linalg.eig(matrix)

        # Create number plane with 3B1B styling
        plane = NumberPlane(
            x_range=[-5, 5, 1],
            y_range=[-5, 5, 1],
            x_length=10,
            y_length=10,
            background_line_style={
                "stroke_color": GRID_COLOR,
                "stroke_width": 1,
                "stroke_opacity": 0.5,
            },
            axis_config={
                "stroke_color": WHITE,
                "stroke_width": 2,
                "include_numbers": True,
                "numbers_to_include": range(-4, 5),
                "font_size": 24,
            },
        )

        # Basis vectors (î and ĵ)
        i_hat = Arrow(
            plane.c2p(0, 0),
            plane.c2p(1, 0),
            buff=0,
            color=I_HAT_COLOR,
            stroke_width=6,
            max_tip_length_to_length_ratio=0.2,
        )
        j_hat = Arrow(
            plane.c2p(0, 0),
            plane.c2p(0, 1),
            buff=0,
            color=J_HAT_COLOR,
            stroke_width=6,
            max_tip_length_to_length_ratio=0.2,
        )

        # Labels for basis vectors
        i_label = MathTex(r"\hat{\imath}", color=I_HAT_COLOR, font_size=36)
        i_label.next_to(i_hat.get_end(), DOWN + RIGHT, buff=0.1)

        j_label = MathTex(r"\hat{\jmath}", color=J_HAT_COLOR, font_size=36)
        j_label.next_to(j_hat.get_end(), UP + LEFT, buff=0.1)

        # Matrix display in top-left corner
        matrix_tex = MathTex(
            r"A = \begin{bmatrix}"
            + f"{matrix[0, 0]:.1f} & {matrix[0, 1]:.1f} \\\\"
            + f"{matrix[1, 0]:.1f} & {matrix[1, 1]:.1f}"
            + r"\end{bmatrix}",
            color=TEXT_COLOR,
            font_size=32,
        )
        matrix_tex.to_corner(UL, buff=0.5)
        matrix_bg = BackgroundRectangle(matrix_tex, fill_opacity=0.8, buff=0.2)

        # Create eigenvector arrows (before transformation)
        eigenvector_arrows = []
        eigenvector_labels = []
        eigen_colors = [EIGEN_COLOR_1, EIGEN_COLOR_2]

        for i, (eigenvalue, eigenvector) in enumerate(
            zip(eigenvalues, eigenvectors.T)
        ):
            # Normalize and scale eigenvector for visibility
            ev_normalized = eigenvector / np.linalg.norm(eigenvector)
            scale = 2.5

            arrow = Arrow(
                plane.c2p(0, 0),
                plane.c2p(ev_normalized[0] * scale, ev_normalized[1] * scale),
                buff=0,
                color=eigen_colors[i],
                stroke_width=5,
                max_tip_length_to_length_ratio=0.15,
            )
            eigenvector_arrows.append(arrow)

            # Eigenvalue label
            if np.isreal(eigenvalue):
                ev_text = f"\\lambda_{i + 1} = {eigenvalue.real:.2f}"
            else:
                ev_text = f"\\lambda_{i + 1} = {eigenvalue:.2f}"

            label = MathTex(ev_text, color=eigen_colors[i], font_size=28)
            label.next_to(arrow.get_end(), UR if i == 0 else DR, buff=0.2)
            eigenvector_labels.append(label)

        # Animation sequence

        # 1. Show plane and title
        title = Text("Eigenvalue Visualization", color=TEXT_COLOR, font_size=36)
        title.to_edge(UP)

        self.play(Create(plane), run_time=1.5)
        self.play(FadeIn(title))
        self.wait(0.5)

        # 2. Show basis vectors
        self.play(
            GrowArrow(i_hat),
            GrowArrow(j_hat),
            run_time=1,
        )
        self.play(Write(i_label), Write(j_label), run_time=0.5)
        self.wait(0.5)

        # 3. Show matrix
        self.play(FadeIn(matrix_bg), Write(matrix_tex), run_time=1)
        self.wait(0.5)

        # 4. Show eigenvectors
        self.play(FadeOut(title))

        eigen_title = Text("Eigenvectors", color=TEXT_COLOR, font_size=32)
        eigen_title.to_edge(UP)
        self.play(FadeIn(eigen_title))

        for arrow, label in zip(eigenvector_arrows, eigenvector_labels):
            self.play(GrowArrow(arrow), run_time=0.8)
            self.play(Write(label), run_time=0.5)

        self.wait(1)

        # 5. Apply linear transformation
        transform_title = Text(
            "Linear Transformation", color=TEXT_COLOR, font_size=32
        )
        transform_title.to_edge(UP)
        self.play(ReplacementTransform(eigen_title, transform_title))

        # Create transformed versions
        transformed_i = Arrow(
            plane.c2p(0, 0),
            plane.c2p(matrix[0, 0], matrix[1, 0]),
            buff=0,
            color=I_HAT_COLOR,
            stroke_width=6,
            max_tip_length_to_length_ratio=0.2,
        )
        transformed_j = Arrow(
            plane.c2p(0, 0),
            plane.c2p(matrix[0, 1], matrix[1, 1]),
            buff=0,
            color=J_HAT_COLOR,
            stroke_width=6,
            max_tip_length_to_length_ratio=0.2,
        )

        # Transform eigenvectors (they should just scale by eigenvalue)
        transformed_eigen_arrows = []
        for i, (eigenvalue, eigenvector) in enumerate(
            zip(eigenvalues, eigenvectors.T)
        ):
            ev_normalized = eigenvector / np.linalg.norm(eigenvector)
            # After transformation: A * v = λ * v
            transformed = matrix @ ev_normalized
            scale = 2.5

            arrow = Arrow(
                plane.c2p(0, 0),
                plane.c2p(
                    ev_normalized[0] * scale * eigenvalue.real,
                    ev_normalized[1] * scale * eigenvalue.real,
                ),
                buff=0,
                color=eigen_colors[i],
                stroke_width=5,
                max_tip_length_to_length_ratio=0.15,
            )
            transformed_eigen_arrows.append(arrow)

        # Apply transformation with ApplyMatrix
        self.play(
            ApplyMatrix(matrix, plane),
            Transform(i_hat, transformed_i),
            Transform(j_hat, transformed_j),
            *[
                Transform(orig, trans)
                for orig, trans in zip(eigenvector_arrows, transformed_eigen_arrows)
            ],
            run_time=2,
        )

        # Update labels position
        for i, (arrow, label) in enumerate(
            zip(eigenvector_arrows, eigenvector_labels)
        ):
            new_pos = arrow.get_end() + (UR if i == 0 else DR) * 0.3
            self.play(label.animate.move_to(new_pos), run_time=0.3)

        self.wait(1)

        # 6. Highlight that eigenvectors only scaled
        highlight_text = Text(
            "Eigenvectors only scale, direction preserved!",
            color=TEAL,
            font_size=28,
        )
        highlight_text.to_edge(DOWN)

        self.play(FadeIn(highlight_text))
        self.wait(2)

        # Final pause
        self.wait(1)
