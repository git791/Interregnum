import { z } from "zod";

export const PlaybookAction = z.enum(["read", "pay", "email", "calendar_note"]);
export type PlaybookAction = z.infer<typeof PlaybookAction>;

export const Playbook = z.object({
  id: z.string().min(1, "Playbook ID is required"),
  title: z.string().min(1, "Title is required"),
  intent: z.string().min(1, "Intent is required"),
  hosts: z.array(z.string().min(1)).min(1, "At least one host is required"),
  actions: z.array(PlaybookAction).min(1, "At least one action is required"),
  maxSpendMinor: z.number().int().nonnegative("Spend cap must be non-negative integer"),
  currency: z.string().length(3, "Currency must be a 3-letter ISO code"),
  expiresAt: z.string().datetime("ExpiresAt must be an ISO datetime string"),
  notify: z.array(z.string().email("Invalid notify email address")),
});
export type Playbook = z.infer<typeof Playbook>;

export const PlanStep = z.object({
  id: z.string().min(1),
  skill: z.string().min(1),
  summary: z.string().min(1),
  needsHumanApproval: z.boolean(),
});
export type PlanStep = z.infer<typeof PlanStep>;

export const HumanSummary = z.object({
  canReach: z.array(z.string()),
  cannotReach: z.string(),
  maxSpend: z.string(),
  expires: z.string(),
});
export type HumanSummary = z.infer<typeof HumanSummary>;

export const CompiledPlan = z.object({
  playbookId: z.string().min(1),
  steps: z.array(PlanStep),
  policyYaml: z.string().min(1),
  riskNotes: z.array(z.string()),
  humanSummary: HumanSummary,
});
export type CompiledPlan = z.infer<typeof CompiledPlan>;

export const ReceiptStatus = z.enum(["ALLOWED", "DENIED", "NEEDS_HUMAN"]);
export type ReceiptStatus = z.infer<typeof ReceiptStatus>;

export const ReceiptEvidence = z.object({
  url: z.string().optional(),
  response: z.string().optional(),
  sources: z.array(z.string()).optional(),
});
export type ReceiptEvidence = z.infer<typeof ReceiptEvidence>;

export const ReceiptModel = z.object({
  tier: z.string(),
  id: z.string(),
});
export type ReceiptModel = z.infer<typeof ReceiptModel>;

export const Receipt = z.object({
  id: z.string().min(1),
  playbookId: z.string().min(1),
  stepId: z.string().min(1),
  at: z.string().datetime(),
  action: PlaybookAction,
  status: ReceiptStatus,
  policyRule: z.string().optional(),
  amountMinor: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  evidence: ReceiptEvidence,
  model: ReceiptModel,
  prevHash: z.string().nullable().optional(),
  hash: z.string().min(64).max(64),
});
export type Receipt = z.infer<typeof Receipt>;
