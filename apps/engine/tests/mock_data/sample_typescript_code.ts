// Sample TypeScript code for Code DNA analysis testing
// This file uses camelCase, JSDoc, and TypeScript types

interface UserProfile {
  username: string;
  email: string;
  score: number;
  isActive: boolean;
}

interface LeaderboardEntry {
  rank: number;
  user: UserProfile;
  trend: "up" | "down" | "stable";
}

/**
 * Calculate the average score from a list of contributions.
 * Returns 0 if the list is empty.
 */
function calculateUserScore(
  contributions: number[],
  bonusMultiplier: number = 1.0
): number {
  if (contributions.length === 0) {
    return 0;
  }

  const total = contributions.reduce((sum, val) => sum + val, 0);
  const average = total / contributions.length;

  // Apply bonus for consistent contributors
  let bonus = 1.0;
  if (contributions.length > 10) {
    if (average > 50) {
      bonus = bonusMultiplier * 1.2;
    } else {
      bonus = bonusMultiplier;
    }
  }

  return Math.round(average * bonus * 100) / 100;
}

function filterActiveUsers(
  users: UserProfile[],
  minScore?: number
): UserProfile[] {
  return users.filter((user) => {
    if (!user.isActive) return false;
    if (minScore !== undefined && user.score < minScore) return false;
    return true;
  });
}

function buildLeaderboard(users: UserProfile[]): LeaderboardEntry[] {
  const sorted = [...users].sort((a, b) => b.score - a.score);
  return sorted.map((user, index) => ({
    rank: index + 1,
    user,
    trend: "stable" as const,
  }));
}

export { calculateUserScore, filterActiveUsers, buildLeaderboard };
export type { UserProfile, LeaderboardEntry };
