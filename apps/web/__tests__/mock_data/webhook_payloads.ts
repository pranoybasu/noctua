export const WEBHOOK_SECRET = "test-webhook-secret-noctua";

export const PR_OPENED_PAYLOAD = {
  action: "opened",
  pull_request: {
    number: 42,
    title: "feat: add Code DNA fingerprinting",
    diff_url: "https://github.com/pranoy-basu/noctua-demo/pull/42.diff",
    html_url: "https://github.com/pranoy-basu/noctua-demo/pull/42",
    user: {
      login: "pranoy-basu",
      avatar_url: "https://avatars.githubusercontent.com/u/12345",
    },
    base: { ref: "main" },
    head: {
      ref: "feat/code-dna",
      repo: { owner: { type: "User" } },
    },
  },
  repository: {
    full_name: "pranoy-basu/noctua-demo",
    id: 123456789,
  },
};

export const PR_SYNCHRONIZE_PAYLOAD = {
  ...PR_OPENED_PAYLOAD,
  action: "synchronize",
};

export const PR_CLOSED_PAYLOAD = {
  ...PR_OPENED_PAYLOAD,
  action: "closed",
};

export const PING_PAYLOAD = {
  zen: "Speak like a human.",
  hook_id: 12345,
};

export function computeSignature(payload: string, secret: string): string {
  const crypto = require("crypto");
  return (
    "sha256=" +
    crypto.createHmac("sha256", secret).update(payload).digest("hex")
  );
}
