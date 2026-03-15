import pytest
from services.scanner import scan_code


class TestSecurityScanner:
    def test_detects_hardcoded_api_key(self):
        code = 'api_key = "sk-prod-abc123def456ghi789"'
        issues = scan_code(code)
        assert len(issues) >= 1
        critical = [i for i in issues if i.severity.value == "critical"]
        assert len(critical) >= 1
        assert any(i.rule == "hardcoded-secret" for i in critical)

    def test_detects_eval_usage(self):
        code = "result = eval(user_input)"
        issues = scan_code(code)
        critical = [i for i in issues if i.severity.value == "critical"]
        assert any(i.rule == "eval-usage" for i in critical)

    def test_detects_exec_usage(self):
        code = "exec(command_string)"
        issues = scan_code(code)
        critical = [i for i in issues if i.severity.value == "critical"]
        assert any(i.rule == "exec-usage" for i in critical)

    def test_detects_leaked_aws_key(self):
        code = 'key = "AKIAIOSFODNN7EXAMPLE"'
        issues = scan_code(code)
        critical = [i for i in issues if i.severity.value == "critical"]
        assert any(i.rule == "leaked-api-key" for i in critical)

    def test_detects_sql_injection(self):
        code = 'db.execute("SELECT * FROM users WHERE id = %s" % user_id)'
        issues = scan_code(code)
        high = [i for i in issues if i.severity.value == "high"]
        assert any(i.rule == "sql-injection" for i in high)

    def test_detects_debug_leak(self):
        code = 'print(f"User password: {password}")'
        issues = scan_code(code)
        medium = [i for i in issues if i.severity.value == "medium"]
        assert any(i.rule == "debug-leak" for i in medium)

    def test_clean_code_has_no_issues(self):
        code = """
def calculate_average(values):
    if not values:
        return 0.0
    return sum(values) / len(values)
"""
        issues = scan_code(code)
        assert len(issues) == 0

    def test_skips_comments(self):
        code = '# api_key = "sk-prod-test123456789"'
        issues = scan_code(code)
        assert len(issues) == 0

    def test_correct_line_numbers(self):
        code = "line1\nline2\napi_key = \"sk-secret-abcdef123456\"\nline4"
        issues = scan_code(code)
        assert len(issues) >= 1
        assert issues[0].line == 3

    def test_deduplicates_same_rule_same_line(self):
        code = 'secret_key = "sk-prod-longkeyvalue1234567890"'
        issues = scan_code(code)
        rules_at_line = [(i.rule, i.line) for i in issues]
        assert len(rules_at_line) == len(set(rules_at_line))

    def test_sample_diff_with_secrets(self, sample_diff_with_secrets):
        lines = []
        for line in sample_diff_with_secrets.splitlines():
            if line.startswith("+") and not line.startswith("+++"):
                lines.append(line[1:])
        code = "\n".join(lines)
        issues = scan_code(code)
        critical = [i for i in issues if i.severity.value == "critical"]
        assert len(critical) >= 2  # at least api_key and eval
