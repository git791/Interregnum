import { describe, it, expect } from "vitest";
import {
  canonicalStringify,
  computeReceiptHash,
  buildReceipt,
  verifyReceipt,
  verifyChain,
} from "../src/receipts.js";
import { Receipt } from "../src/schemas.js";

describe("Receipts & Hash Chaining", () => {
  it("canonicalStringify sorts keys deeply and deterministically", () => {
    const objA = {
      z: 1,
      a: {
        d: 4,
        b: 2,
      },
      m: [3, 2, 1],
    };

    const objB = {
      a: {
        b: 2,
        d: 4,
      },
      m: [3, 2, 1],
      z: 1,
    };

    expect(canonicalStringify(objA)).toBe(canonicalStringify(objB));
    expect(canonicalStringify(objA)).toBe(
      '{"a":{"b":2,"d":4},"m":[3,2,1],"z":1}'
    );
  });

  it("builds a genesis receipt with prevHash: null and valid sha256 hash", () => {
    const genesis = buildReceipt(null, {
      playbookId: "pb_pay_electricity",
      stepId: "step_verify",
      action: "read",
      status: "ALLOWED",
      evidence: {
        url: "https://api.tavily.com/search",
        sources: ["https://mock.voltaic.interregnum.dev"],
      },
      model: {
        tier: "standard",
        id: "nvidia/nemotron-3-super-120b-a12b",
      },
    });

    expect(genesis.prevHash).toBeNull();
    expect(genesis.hash).toHaveLength(64);
    expect(verifyReceipt(genesis)).toBe(true);
  });

  it("builds a chained sequence of receipts and verifies the chain", () => {
    const genesis = buildReceipt(null, {
      playbookId: "pb_pay_electricity",
      stepId: "step_1",
      action: "read",
      status: "ALLOWED",
      evidence: {
        url: "https://mock.voltaic.interregnum.dev/accounts/1/balance",
      },
      model: {
        tier: "light",
        id: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
      },
    });

    const step2 = buildReceipt(genesis, {
      playbookId: "pb_pay_electricity",
      stepId: "step_2",
      action: "pay",
      status: "ALLOWED",
      amountMinor: 7500,
      currency: "GBP",
      policyRule: "pb_pay_electricity.endpoints[0].rules[1]",
      evidence: {
        url: "https://mock.voltaic.interregnum.dev/accounts/1/payments",
        response: '{"status":"success"}',
      },
      model: {
        tier: "standard",
        id: "nvidia/nemotron-3-super-120b-a12b",
      },
    });

    const step3 = buildReceipt(step2, {
      playbookId: "pb_pay_electricity",
      stepId: "step_3",
      action: "email",
      status: "ALLOWED",
      evidence: {
        response: "Message dispatched to ayaan@example.com",
      },
      model: {
        tier: "light",
        id: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
      },
    });

    expect(step2.prevHash).toBe(genesis.hash);
    expect(step3.prevHash).toBe(step2.hash);

    const chain = [genesis, step2, step3];
    const check = verifyChain(chain);
    expect(check.valid).toBe(true);
  });

  it("detects tampering of evidence in a receipt", () => {
    const genesis = buildReceipt(null, {
      playbookId: "pb_pay_electricity",
      stepId: "step_1",
      action: "pay",
      status: "ALLOWED",
      amountMinor: 5000,
      currency: "GBP",
      evidence: {
        response: "Paid 5000",
      },
      model: {
        tier: "standard",
        id: "nvidia/nemotron-3-super-120b-a12b",
      },
    });

    // Tamper with the amount without recomputing the hash
    const tampered: Receipt = {
      ...genesis,
      amountMinor: 99999,
    };

    expect(verifyReceipt(tampered)).toBe(false);

    const chainCheck = verifyChain([tampered]);
    expect(chainCheck.valid).toBe(false);
    expect(chainCheck.invalidIndex).toBe(0);
  });

  it("detects a broken hash chain link", () => {
    const genesis = buildReceipt(null, {
      playbookId: "pb_1",
      stepId: "step_1",
      action: "read",
      status: "ALLOWED",
      evidence: {},
      model: { tier: "light", id: "model-1" },
    });

    const step2 = buildReceipt(genesis, {
      playbookId: "pb_1",
      stepId: "step_2",
      action: "read",
      status: "ALLOWED",
      evidence: {},
      model: { tier: "light", id: "model-1" },
    });

    // Replace step2's prevHash with a fake hash
    const brokenStep2 = {
      ...step2,
      prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
    };

    const chainCheck = verifyChain([genesis, brokenStep2]);
    expect(chainCheck.valid).toBe(false);
    expect(chainCheck.invalidIndex).toBe(1);
    expect(chainCheck.reason).toContain("prevHash mismatch");
  });
});
