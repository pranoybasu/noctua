# Sample Python code for Code DNA analysis testing
# This file has consistent snake_case, type hints, and moderate nesting

from typing import Optional, List
from dataclasses import dataclass


@dataclass
class UserProfile:
    """Represents a user profile with computed metrics."""
    username: str
    email: str
    score: float = 0.0
    active: bool = True


def calculate_user_score(
    contributions: List[int],
    bonus_multiplier: float = 1.0,
) -> float:
    """Calculate a weighted user score from contributions."""
    if not contributions:
        return 0.0

    total = sum(contributions)
    average = total / len(contributions)

    # Apply bonus for consistent contributors
    if len(contributions) > 10:
        if average > 50:
            bonus = bonus_multiplier * 1.2
        else:
            bonus = bonus_multiplier
    else:
        bonus = 1.0

    return round(average * bonus, 2)


def filter_active_users(
    users: List[UserProfile],
    min_score: Optional[float] = None,
) -> List[UserProfile]:
    """Filter users by active status and optional minimum score."""
    result = []
    for user in users:
        if not user.active:
            continue
        if min_score is not None and user.score < min_score:
            continue
        result.append(user)
    return result


def format_leaderboard(users: List[UserProfile]) -> str:
    """Format a leaderboard string from sorted users."""
    sorted_users = sorted(users, key=lambda u: u.score, reverse=True)
    lines = []
    for rank, user in enumerate(sorted_users, start=1):
        lines.append(f"#{rank} {user.username}: {user.score}")
    return "\n".join(lines)
