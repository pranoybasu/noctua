import re
from models import CodeDNA


def build_code_dna(code: str, author: str) -> CodeDNA:
    """Build a Code DNA fingerprint from the added code in a diff."""
    lines = code.splitlines()
    total = len(lines) or 1

    code_lines = [l for l in lines if l.strip() and not _is_comment(l)]
    code_count = len(code_lines) or 1

    avg_len = sum(len(l) for l in code_lines) / code_count

    comment_lines = sum(1 for l in lines if _is_comment(l))
    comment_ratio = comment_lines / total

    nesting = _compute_nesting_depth(code_lines)

    type_hints = _detect_type_hints(code)

    snake_score = _naming_score(code)

    return CodeDNA(
        avg_line_length=round(avg_len, 1),
        comment_ratio=round(comment_ratio, 2),
        avg_nesting_depth=round(nesting, 1),
        uses_type_hints=type_hints,
        snake_case_score=round(snake_score, 2),
    )


def _is_comment(line: str) -> bool:
    stripped = line.strip()
    return (
        stripped.startswith("#")
        or stripped.startswith("//")
        or stripped.startswith("/*")
        or stripped.startswith("*")
        or stripped.startswith("'''")
        or stripped.startswith('"""')
    )


def _compute_nesting_depth(lines: list[str]) -> float:
    """Compute average nesting depth via indentation analysis."""
    depths: list[int] = []
    for line in lines:
        stripped = line.lstrip()
        if not stripped:
            continue
        indent = len(line) - len(stripped)
        tab_adjusted = 0
        for ch in line:
            if ch == " ":
                tab_adjusted += 1
            elif ch == "\t":
                tab_adjusted += 4
            else:
                break
        depth = tab_adjusted // 4
        depths.append(depth)

    if not depths:
        return 0.0
    return sum(depths) / len(depths)


def _detect_type_hints(code: str) -> bool:
    """Check if the code uses type hints (Python or TypeScript patterns)."""
    py_hints = re.search(
        r":\s*(int|str|bool|float|list|dict|Optional|Union|tuple|set|Any|None)\b",
        code,
    )
    ts_hints = re.search(
        r":\s*(string|number|boolean|void|any|unknown|never|Record|Array)\b",
        code,
    )
    arrow_return = re.search(r"->\s*\w+", code)
    return bool(py_hints or ts_hints or arrow_return)


def _naming_score(code: str) -> float:
    """Score naming convention consistency (snake_case vs camelCase)."""
    identifiers = re.findall(r"\b([a-zA-Z_][a-zA-Z0-9_]{2,})\b", code)

    keywords = {
        "def", "class", "import", "from", "return", "if", "else", "elif",
        "for", "while", "try", "except", "finally", "with", "as", "pass",
        "break", "continue", "raise", "yield", "lambda", "and", "or", "not",
        "in", "is", "True", "False", "None", "self", "cls", "async", "await",
        "function", "const", "let", "var", "export", "default", "interface",
        "type", "enum", "extends", "implements", "new", "this", "super",
        "switch", "case", "throw", "catch", "typeof", "instanceof",
    }

    filtered = [i for i in identifiers if i.lower() not in keywords and not i.isupper()]
    if not filtered:
        return 1.0

    snake = sum(1 for i in filtered if re.fullmatch(r"[a-z][a-z0-9_]*", i))
    camel = sum(1 for i in filtered if re.fullmatch(r"[a-z][a-zA-Z0-9]*", i) and any(c.isupper() for c in i))

    total_styled = snake + camel
    if total_styled == 0:
        return 0.5

    dominant = max(snake, camel)
    return dominant / total_styled
