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
