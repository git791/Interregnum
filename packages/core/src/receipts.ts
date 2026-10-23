import { createHash, randomUUID } from "node:crypto";
import { Receipt } from "./schemas.js";

export type ReceiptBody = Omit<Receipt, "hash" | "prevHash">;

export type CreateReceiptInput = Omit<Receipt, "hash" | "prevHash" | "id" | "at"> & {
  id?: string;
  at?: string;
};

/**
 * Deterministically stringifies an object by recursively sorting its keys.
 * Preserves array order and standard JSON value representations.
 */
export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([_, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));

  return `{${entries
    .map(([k, v]) => `${JSON.stringify(k)}:${canonicalStringify(v)}`)
    .join(",")}}`;
}

/**
 * Computes the SHA-256 hash of (prevHash + canonical JSON).
 */
export function computeReceiptHash(
  prevHash: string | null | undefined,
  body: ReceiptBody
): string {
  const normalizedPrevHash = prevHash ?? "";
  const canonicalBody = canonicalStringify(body);
  const payload = `${normalizedPrevHash}${canonicalBody}`;

  return createHash("sha256").update(payload, "utf8").digest("hex");
}

/**
 * Builds a valid, hash-chained Receipt from a previous receipt (if any) and input.
 */
export function buildReceipt(
  prevReceipt: Receipt | null | undefined,
  input: CreateReceiptInput
): Receipt {
  const id = input.id ?? randomUUID();
  const at = input.at ?? new Date().toISOString();
  const prevHash = prevReceipt ? prevReceipt.hash : null;

  const body: ReceiptBody = {
    id,
    playbookId: input.playbookId,
    stepId: input.stepId,
    at,
    action: input.action,
    status: input.status,
    evidence: input.evidence,
    model: input.model,
    ...(input.policyRule !== undefined ? { policyRule: input.policyRule } : {}),
    ...(input.amountMinor !== undefined ? { amountMinor: input.amountMinor } : {}),
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
  };

  const hash = computeReceiptHash(prevHash, body);

  const receipt: Receipt = {
    ...body,
    prevHash,
    hash,
  };

  // Validate output against schema
  return Receipt.parse(receipt);
}

/**
 * Verifies that a receipt's internal hash matches its contents and previous hash.
 */
export function verifyReceipt(
  receipt: Receipt,
  expectedPrevHash?: string | null
): boolean {
  if (expectedPrevHash !== undefined) {
    const normExpected = expectedPrevHash ?? null;
    const normActual = receipt.prevHash ?? null;
    if (normExpected !== normActual) {
      return false;
    }
  }

  const body: ReceiptBody = {
    id: receipt.id,
    playbookId: receipt.playbookId,
    stepId: receipt.stepId,
    at: receipt.at,
    action: receipt.action,
    status: receipt.status,
    evidence: receipt.evidence,
    model: receipt.model,
    ...(receipt.policyRule !== undefined ? { policyRule: receipt.policyRule } : {}),
    ...(receipt.amountMinor !== undefined ? { amountMinor: receipt.amountMinor } : {}),
    ...(receipt.currency !== undefined ? { currency: receipt.currency } : {}),
  };

  const expectedHash = computeReceiptHash(receipt.prevHash, body);
  return expectedHash === receipt.hash;
}

export interface ChainVerificationResult {
  valid: boolean;
  invalidIndex?: number;
  reason?: string;
}

/**
 * Verifies the integrity of an entire hash-chained sequence of receipts.
 */
export function verifyChain(chain: Receipt[]): ChainVerificationResult {
  if (!Array.isArray(chain) || chain.length === 0) {
    return { valid: true };
  }

  let expectedPrevHash: string | null = null;

  for (let i = 0; i < chain.length; i++) {
    const current = chain[i];

    // Genesis receipt must have null or empty prevHash
    if (i === 0) {
      if (current.prevHash !== null && current.prevHash !== undefined && current.prevHash !== "") {
        return {
          valid: false,
          invalidIndex: 0,
          reason: `Genesis receipt has non-null prevHash: ${current.prevHash}`,
        };
      }
    } else {
      if (current.prevHash !== expectedPrevHash) {
        return {
          valid: false,
          invalidIndex: i,
          reason: `prevHash mismatch at index ${i}: expected '${expectedPrevHash}', received '${current.prevHash}'`,
        };
      }
    }

    if (!verifyReceipt(current, current.prevHash)) {
      return {
        valid: false,
        invalidIndex: i,
        reason: `Receipt at index ${i} hash integrity check failed`,
      };
    }

    expectedPrevHash = current.hash;
  }

  return { valid: true };
}
