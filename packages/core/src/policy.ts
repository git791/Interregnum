import { parse } from "yaml";

export class PolicyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicyValidationError";
  }
}

/**
 * Normalizes hostnames for safe comparison (lowercase, trimmed).
 */
function normalizeHost(host: string): string {
  return host.trim().toLowerCase();
}

/**
 * Checks whether a candidate host is covered by an allowed host pattern.
 * Wildcard hosts in allowed list (e.g. "*.example.com") can match subdomains ("api.example.com").
 * Wildcards in candidate endpoints are only permitted if explicitly in the allowed list.
 */
function isHostAllowed(candidate: string, allowedList: string[]): boolean {
  const normCandidate = normalizeHost(candidate);

  // If candidate itself contains wildcards, it must strictly match an allowed pattern
  if (normCandidate.includes("*")) {
    return allowedList.some((allowed) => normalizeHost(allowed) === normCandidate);
  }

  return allowedList.some((allowed) => {
    const normAllowed = normalizeHost(allowed);

    // Exact match
    if (normCandidate === normAllowed) {
      return true;
    }

    // Subdomain wildcard match (e.g. "*.example.com" matches "sub.example.com")
    if (normAllowed.startsWith("*.")) {
      const baseDomain = normAllowed.slice(2);
      if (
        normCandidate.endsWith(`.${baseDomain}`) &&
        normCandidate.length > baseDomain.length + 1
      ) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Extracts all endpoint hosts defined in an OpenShell policy YAML string.
 */
export function extractPolicyHosts(policyYaml: string): string[] {
  let doc: Record<string, unknown>;

  try {
    doc = parse(policyYaml);
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new PolicyValidationError(`Failed to parse policy YAML: ${reason}`);
  }

  if (!doc || typeof doc !== "object") {
    throw new PolicyValidationError("Policy YAML must be an object");
  }

  const hostsSet = new Set<string>();

  const networkPolicies = doc.network_policies;
  if (networkPolicies && typeof networkPolicies === "object") {
    for (const [policyKey, policyVal] of Object.entries(
      networkPolicies as Record<string, unknown>
    )) {
      if (!policyVal || typeof policyVal !== "object") continue;

      const endpoints = (policyVal as Record<string, unknown>).endpoints;
      if (Array.isArray(endpoints)) {
        for (const ep of endpoints) {
          if (ep && typeof ep === "object" && typeof ep.host === "string") {
            const h = ep.host.trim();
            if (h) {
              hostsSet.add(h);
            }
          }
        }
      }
    }
  }

  return Array.from(hostsSet);
}

/**
 * Deterministic safety gate: asserts that every host present in the OpenShell
 * policy YAML is a subset of the owner-approved allowedHosts list.
 * Throws PolicyValidationError if any disallowed host is present.
 */
export function assertHostsSubset(
  policyYaml: string,
  allowedHosts: string[]
): void {
  if (!policyYaml || typeof policyYaml !== "string") {
    throw new PolicyValidationError("policyYaml must be a non-empty string");
  }

  if (!Array.isArray(allowedHosts)) {
    throw new PolicyValidationError("allowedHosts must be an array");
  }

  const hosts = extractPolicyHosts(policyYaml);

  for (const host of hosts) {
    if (!isHostAllowed(host, allowedHosts)) {
      throw new PolicyValidationError(
        `Disallowed host '${host}' found in OpenShell policy. Host is not in the owner-approved list: [${allowedHosts.join(
          ", "
        )}]`
      );
    }
  }
}
