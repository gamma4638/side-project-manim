import pytest

from backend.scene_registry import SCENE_REGISTRY, SceneConfig

REQUIRED_TOPICS = {
    "eigenvalue", "linear_transform", "determinant", "basis_change",
    "taylor_series", "fourier", "derivative",
    "clt", "mle", "hypothesis_test", "standard_error",
}


def test_all_required_topics_present():
    assert REQUIRED_TOPICS == set(SCENE_REGISTRY.keys())


def test_each_config_has_required_fields():
    for topic_id, config in SCENE_REGISTRY.items():
        assert isinstance(config, SceneConfig), f"{topic_id} must be a SceneConfig"
        assert config.module, f"{topic_id} missing module"
        assert config.class_name, f"{topic_id} missing class_name"
        assert isinstance(config.defaults, dict), f"{topic_id} defaults must be a dict"


def test_matrix_topics_have_matrix_default():
    matrix_topics = ["eigenvalue", "linear_transform", "determinant", "basis_change"]
    for topic in matrix_topics:
        defaults = SCENE_REGISTRY[topic].defaults
        assert "matrix_2x2" in defaults, f"{topic} must have matrix_2x2 default"
        m = defaults["matrix_2x2"]
        assert len(m) == 2 and len(m[0]) == 2, f"{topic} matrix_2x2 must be 2x2"


def test_eigenvalue_scene_importable():
    pytest.importorskip("manim")
    from backend.scenes.eigenvalue import EigenvalueScene
    assert EigenvalueScene is not None


def test_linear_algebra_scenes_importable():
    pytest.importorskip("manim")
    from backend.scenes.linear_transform import LinearTransformScene
    from backend.scenes.determinant import DeterminantScene
    from backend.scenes.basis_change import BasisChangeScene
    assert LinearTransformScene and DeterminantScene and BasisChangeScene


def test_calculus_scenes_importable():
    pytest.importorskip("manim")
    from backend.scenes.taylor_series import TaylorSeriesScene
    from backend.scenes.fourier import FourierScene
    from backend.scenes.derivative import DerivativeScene
    assert TaylorSeriesScene and FourierScene and DerivativeScene


def test_stats_scenes_importable():
    pytest.importorskip("manim")
    from backend.scenes.clt import CLTScene
    from backend.scenes.standard_error import StandardErrorScene
    from backend.scenes.mle import MLEScene
    from backend.scenes.hypothesis_test import HypothesisTestScene
    assert CLTScene and StandardErrorScene and MLEScene and HypothesisTestScene
