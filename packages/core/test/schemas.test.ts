import { describe, it, expect } from "vitest";
import {
  Playbook,
  CompiledPlan,
  Receipt,
  PlaybookAction,
} from "../src/schemas.js";

describe("Core Schemas", () => {
  describe("Playbook", () => {
    it("validates a well-formed playbook", () => {
      const validPlaybook = {
        id: "pb_pay_electricity",
        title: "Pay Electricity Bill",
        intent: "Pay electricity bill up to £120 at Voltaic Energy",
        hosts: ["mock.voltaic.interregnum.dev"],
        actions: ["pay", "read"],
        maxSpendMinor: 12000,
        currency: "GBP",
        expiresAt: "2026-11-01T00:00:00.000Z",
        notify: ["ayaan@example.com"],
      };

      const result = Playbook.safeParse(validPlaybook);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("pb_pay_electricity");
        expect(result.data.maxSpendMinor).toBe(12000);
      }
    });

    it("rejects playbooks missing required fields", () => {
      const invalid = {
        title: "Missing fields",
      };
      const result = Playbook.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects invalid currency code or negative spend", () => {
      const invalid = {
        id: "pb_1",
        title: "Test",
        intent: "Test intent",
        hosts: ["example.com"],
        actions: ["pay"],
        maxSpendMinor: -50,
        currency: "USDD", // must be length 3
        expiresAt: "2026-11-01T00:00:00.000Z",
        notify: ["user@example.com"],
      };
      const result = Playbook.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects invalid email in notify list", () => {
      const invalid = {
        id: "pb_1",
        title: "Test",
        intent: "Test intent",
        hosts: ["example.com"],
        actions: ["read"],
        maxSpendMinor: 0,
        currency: "GBP",
        expiresAt: "2026-11-01T00:00:00.000Z",
        notify: ["not-an-email"],
      };
      const result = Playbook.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("CompiledPlan", () => {
    it("validates a compiled plan", () => {
      const plan = {
        playbookId: "pb_pay_electricity",
        steps: [
          {
            id: "step_1",
            skill: "vendor-verify",
            summary: "Verify vendor with Tavily",
            needsHumanApproval: false,
          },
          {
            id: "step_2",
            skill: "pay-bill",
            summary: "Pay electricity bill",
            needsHumanApproval: false,
          },
        ],
        policyYaml: "version: 1\nnetwork_policies:\n",
        riskNotes: ["Spend capped at £120.00"],
        humanSummary: {
          canReach: ["mock.voltaic.interregnum.dev"],
          cannotReach: "All other hosts and paths",
          maxSpend: "£120.00",
          expires: "2026-11-01T00:00:00.000Z",
        },
      };

      const result = CompiledPlan.safeParse(plan);
      expect(result.success).toBe(true);
    });
  });

  describe("Receipt", () => {
    it("validates a valid receipt with hash", () => {
      const receipt = {
        id: "rec_1",
        playbookId: "pb_pay_electricity",
        stepId: "step_1",
        at: "2026-10-23T22:00:00.000Z",
        action: "pay",
        status: "ALLOWED",
        amountMinor: 8500,
        currency: "GBP",
        evidence: {
          url: "https://mock.voltaic.interregnum.dev/accounts/1/payments",
          response: '{"status":"paid"}',
        },
        model: {
          tier: "standard",
          id: "nvidia/nemotron-3-super-120b-a12b",
        },
        prevHash: null,
        hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      };

      const result = Receipt.safeParse(receipt);
      expect(result.success).toBe(true);
    });
  });
});
