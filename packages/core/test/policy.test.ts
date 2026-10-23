import { describe, it, expect } from "vitest";
import {
  assertHostsSubset,
  extractPolicyHosts,
  PolicyValidationError,
} from "../src/policy.js";

describe("Policy Guard (assertHostsSubset)", () => {
  const validPolicyYaml = `
version: 1
filesystem_policy:
  include_workdir: true
  read_only: [/usr, /lib, /etc]
  read_write: [/sandbox, /tmp]
landlock:
  compatibility: hard_requirement
process:
  run_as_user: sandbox
  run_as_group: sandbox

network_policies:
  pb_pay_electricity:
    name: pb-pay-electricity
    endpoints:
      - host: mock.voltaic.interregnum.dev
        port: 443
        protocol: rest
        enforcement: enforce
        rules:
          - allow: { method: GET, path: "/accounts/*/balance" }
          - allow: { method: POST, path: "/accounts/*/payments" }
        deny_rules:
          - { method: DELETE, path: "/**" }
  tavily:
    name: tavily
    endpoints:
      - host: api.tavily.com
        port: 443
        protocol: rest
        access: read-write
`;

  it("extracts all hosts from policy YAML", () => {
    const hosts = extractPolicyHosts(validPolicyYaml);
    expect(hosts).toEqual(
      expect.arrayContaining(["mock.voltaic.interregnum.dev", "api.tavily.com"])
    );
    expect(hosts).toHaveLength(2);
  });

  it("succeeds when all policy hosts are allowed", () => {
    const allowed = ["mock.voltaic.interregnum.dev", "api.tavily.com"];
    expect(() => assertHostsSubset(validPolicyYaml, allowed)).not.toThrow();
  });

  it("succeeds with wildcard subdomain in allowed hosts", () => {
    const allowed = ["*.interregnum.dev", "api.tavily.com"];
    expect(() => assertHostsSubset(validPolicyYaml, allowed)).not.toThrow();
  });

  it("throws PolicyValidationError when a host is not in allowed list", () => {
    const allowed = ["mock.voltaic.interregnum.dev"]; // api.tavily.com missing
    expect(() => assertHostsSubset(validPolicyYaml, allowed)).toThrow(
      PolicyValidationError
    );
    expect(() => assertHostsSubset(validPolicyYaml, allowed)).toThrow(
      /Disallowed host 'api\.tavily\.com'/
    );
  });

  it("throws PolicyValidationError when policy injects an unapproved external host", () => {
    const roguePolicy = `
version: 1
network_policies:
  pb_malicious:
    endpoints:
      - host: evil-exfiltration.com
        port: 443
`;
    const allowed = ["mock.voltaic.interregnum.dev", "api.tavily.com"];
    expect(() => assertHostsSubset(roguePolicy, allowed)).toThrow(
      PolicyValidationError
    );
  });

  it("throws PolicyValidationError when candidate host contains an unapproved wildcard", () => {
    const wildcardPolicy = `
version: 1
network_policies:
  pb_broad:
    endpoints:
      - host: "*"
        port: 443
`;
    const allowed = ["mock.voltaic.interregnum.dev", "api.tavily.com"];
    expect(() => assertHostsSubset(wildcardPolicy, allowed)).toThrow(
      PolicyValidationError
    );
  });

  it("throws PolicyValidationError on malformed YAML", () => {
    const malformedYaml = "version: 1\n  invalid: [unclosed";
    expect(() => assertHostsSubset(malformedYaml, ["api.com"])).toThrow(
      PolicyValidationError
    );
  });
});
