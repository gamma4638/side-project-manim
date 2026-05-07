from dataclasses import dataclass, field
from typing import Any, Dict


@dataclass
class SceneConfig:
    module: str
    class_name: str
    defaults: Dict[str, Any] = field(default_factory=dict)


SCENE_REGISTRY: Dict[str, SceneConfig] = {
    "eigenvalue": SceneConfig(
        module="backend.scenes.eigenvalue",
        class_name="EigenvalueScene",
        defaults={"matrix_2x2": [[2, 1], [1, 2]]},
    ),
    "linear_transform": SceneConfig(
        module="backend.scenes.linear_transform",
        class_name="LinearTransformScene",
        defaults={"matrix_2x2": [[2, 0], [0, 2]]},
    ),
    "determinant": SceneConfig(
        module="backend.scenes.determinant",
        class_name="DeterminantScene",
        defaults={"matrix_2x2": [[2, 1], [0, 2]]},
    ),
    "basis_change": SceneConfig(
        module="backend.scenes.basis_change",
        class_name="BasisChangeScene",
        defaults={"matrix_2x2": [[1, 1], [0, 1]]},
    ),
    "taylor_series": SceneConfig(
        module="backend.scenes.taylor_series",
        class_name="TaylorSeriesScene",
        defaults={"function": "sin", "center": 0, "degree": 5},
    ),
    "fourier": SceneConfig(
        module="backend.scenes.fourier",
        class_name="FourierScene",
        defaults={"num_terms": 5},
    ),
    "derivative": SceneConfig(
        module="backend.scenes.derivative",
        class_name="DerivativeScene",
        defaults={"function": "x^2"},
    ),
    "clt": SceneConfig(
        module="backend.scenes.clt",
        class_name="CLTScene",
        defaults={"sample_size": 30, "dist_type": "uniform"},
    ),
    "mle": SceneConfig(
        module="backend.scenes.mle",
        class_name="MLEScene",
        defaults={"dist_type": "normal"},
    ),
    "hypothesis_test": SceneConfig(
        module="backend.scenes.hypothesis_test",
        class_name="HypothesisTestScene",
        defaults={"alpha": 0.05, "test_type": "two-tailed"},
    ),
    "standard_error": SceneConfig(
        module="backend.scenes.standard_error",
        class_name="StandardErrorScene",
        defaults={"sample_size": 30},
    ),
}
