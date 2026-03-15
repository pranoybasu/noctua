import { describe, it, expect } from "vitest";
import { createHmac, timingSafeEqual } from "crypto";
import {
  WEBHOOK_SECRET,
  PR_OPENED_PAYLOAD,
  computeSignature,
} from "./mock_data/webhook_payloads";

function verifySignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  const expected =
    "sha256=" + createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

describe("Webhook HMAC Verification", () => {
  const payload = JSON.stringify(PR_OPENED_PAYLOAD);
  const validSig = computeSignature(payload, WEBHOOK_SECRET);

  it("accepts a valid signature", () => {
    expect(verifySignature(payload, validSig, WEBHOOK_SECRET)).toBe(true);
  });

  it("rejects a tampered payload", () => {
    const tampered = JSON.stringify({ ...PR_OPENED_PAYLOAD, action: "closed" });
    expect(verifySignature(tampered, validSig, WEBHOOK_SECRET)).toBe(false);
  });

  it("rejects a missing signature", () => {
    expect(verifySignature(payload, null, WEBHOOK_SECRET)).toBe(false);
  });

  it("rejects an empty signature", () => {
    expect(verifySignature(payload, "", WEBHOOK_SECRET)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    const wrongSig = computeSignature(payload, "wrong-secret");
    expect(verifySignature(payload, wrongSig, WEBHOOK_SECRET)).toBe(false);
  });

  it("signature is deterministic", () => {
    const sig1 = computeSignature(payload, WEBHOOK_SECRET);
    const sig2 = computeSignature(payload, WEBHOOK_SECRET);
    expect(sig1).toBe(sig2);
  });
});
