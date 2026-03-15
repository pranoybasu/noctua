import pytest
from services.dna import build_code_dna


class TestCodeDNA:
    def test_avg_line_length(self):
        code = "short\na bit longer line here\nx"
        dna = build_code_dna(code, "test-author")
        assert dna.avg_line_length > 0

    def test_comment_ratio_python(self):
        code = "# comment\ncode_line\n# another comment\nmore_code"
        dna = build_code_dna(code, "test-author")
        assert dna.comment_ratio == 0.5

    def test_comment_ratio_no_comments(self):
        code = "x = 1\ny = 2\nz = 3"
        dna = build_code_dna(code, "test-author")
        assert dna.comment_ratio == 0.0

    def test_nesting_depth_flat(self):
        code = "x = 1\ny = 2\nz = x + y"
        dna = build_code_dna(code, "test-author")
        assert dna.avg_nesting_depth == 0.0

    def test_nesting_depth_indented(self):
        code = "if True:\n    x = 1\n    if True:\n        y = 2"
        dna = build_code_dna(code, "test-author")
        assert dna.avg_nesting_depth > 0

    def test_type_hints_python(self):
        code = "def foo(x: int, y: str) -> float:\n    return 1.0"
        dna = build_code_dna(code, "test-author")
        assert dna.uses_type_hints is True

    def test_type_hints_typescript(self):
        code = "function foo(x: number, y: string): void {}"
        dna = build_code_dna(code, "test-author")
        assert dna.uses_type_hints is True

    def test_no_type_hints(self):
        code = "def foo(x, y):\n    return x + y"
        dna = build_code_dna(code, "test-author")
        assert dna.uses_type_hints is False

    def test_snake_case_score_high(self):
        code = "user_name = 'test'\ndef get_user_data():\n    pass\nmax_retries = 3"
        dna = build_code_dna(code, "test-author")
        assert dna.snake_case_score >= 0.8

    def test_camel_case_detected(self):
        code = "userName = 'test'\ndef getUserData():\n    pass\nmaxRetries = 3"
        dna = build_code_dna(code, "test-author")
        assert dna.snake_case_score >= 0.5

    def test_sample_python(self, sample_python_code):
        dna = build_code_dna(sample_python_code, "pranoy")
        assert dna.uses_type_hints is True
        assert dna.comment_ratio > 0
        assert dna.avg_line_length > 10

    def test_sample_typescript(self, sample_typescript_code):
        dna = build_code_dna(sample_typescript_code, "pranoy")
        assert dna.uses_type_hints is True
        assert dna.avg_line_length > 10

    def test_empty_code(self):
        dna = build_code_dna("", "test-author")
        assert dna.avg_line_length == 0.0
        assert dna.comment_ratio == 0.0
