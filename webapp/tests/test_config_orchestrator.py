import os
from repair import config


def test_max_tool_iterations_default():
    os.environ.pop("MAX_TOOL_ITERATIONS", None)
    assert config.max_tool_iterations() == 12


def test_max_tool_iterations_from_env():
    os.environ["MAX_TOOL_ITERATIONS"] = "5"
    assert config.max_tool_iterations() == 5
    os.environ.pop("MAX_TOOL_ITERATIONS", None)
