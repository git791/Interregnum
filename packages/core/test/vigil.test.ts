import { describe, it, expect } from "vitest";
import { nextState, calculateVigilMetrics, State } from "../src/vigil.js";

describe("Vigil State Machine", () => {
  const baseTime = new Date("2026-10-20T12:00:00.000Z");
  const cadenceH = 24; // 24 hours
  const graceH = 6; // 6 hours
  const missedThreshold = 2; // 2 missed periods

  // Helper to construct dates relative to baseTime
  const addHours = (d: Date, h: number) => new Date(d.getTime() + h * 36e5);

  it("Scenario 1: Stays WATCHING when owner is within cadence", () => {
    const now = addHours(baseTime, 12); // 12 hours since last check-in (cadence 24)
    const state = nextState({
      state: "WATCHING",
      lastCheckIn: baseTime,
      cadenceH,
      graceH,
      missedThreshold,
      now,
    });
    expect(state).toBe("WATCHING");
  });

  it("Scenario 2: Transitions WATCHING -> CONCERNED when 1 check-in missed past grace", () => {
    // 24 + 6 + 1 = 31 hours passed. (31 - 6) / 24 = 1 missed
    const now = addHours(baseTime, 31);
    const state = nextState({
      state: "WATCHING",
      lastCheckIn: baseTime,
      cadenceH,
      graceH,
      missedThreshold,
      now,
    });
    expect(state).toBe("CONCERNED");
  });

  it("Scenario 3: Transitions CONCERNED -> AWAITING_CONTACT when missedThreshold reached", () => {
    // For 2 missed: (hours - 6) / 24 >= 2 => hours >= 54
    const now = addHours(baseTime, 55);
    const state = nextState({
      state: "CONCERNED",
      lastCheckIn: baseTime,
      cadenceH,
      graceH,
      missedThreshold,
      now,
    });
    expect(state).toBe("AWAITING_CONTACT");
  });

  it("Scenario 4: Two-person rule - Contact confirms -> transitions AWAITING_CONTACT -> ACTIVE", () => {
    const now = addHours(baseTime, 60);
    const contactConfirmedAt = addHours(baseTime, 59);

    const state = nextState({
      state: "AWAITING_CONTACT",
      lastCheckIn: baseTime,
      cadenceH,
      graceH,
      missedThreshold,
      contactConfirmedAt,
      now,
    });
    expect(state).toBe("ACTIVE");
  });

  it("Scenario 5: Two-person rule - Contact declines -> returns AWAITING_CONTACT -> WATCHING", () => {
    const now = addHours(baseTime, 60);
    const contactDeclinedAt = addHours(baseTime, 59);

    const state = nextState({
      state: "AWAITING_CONTACT",
      lastCheckIn: baseTime,
      cadenceH,
      graceH,
      missedThreshold,
      contactDeclinedAt,
      now,
    });
    expect(state).toBe("WATCHING");
  });

  it("Scenario 6: Owner returns while agent is ACTIVE -> transitions ACTIVE -> RETURNED", () => {
    // Owner checked in recently: 2 hours ago
    const recentCheckIn = baseTime;
    const now = addHours(recentCheckIn, 2);

    const state = nextState({
      state: "ACTIVE",
      lastCheckIn: recentCheckIn,
      cadenceH,
      graceH,
      missedThreshold,
      now,
    });
    expect(state).toBe("RETURNED");
  });

  it("Scenario 7: Owner check-in during CONCERNED or AWAITING_CONTACT resets to WATCHING", () => {
    // Owner checked in 1 hour ago
    const recentCheckIn = baseTime;
    const now = addHours(recentCheckIn, 1);

    const stateFromConcerned = nextState({
      state: "CONCERNED",
      lastCheckIn: recentCheckIn,
      cadenceH,
      graceH,
      missedThreshold,
      now,
    });
    expect(stateFromConcerned).toBe("WATCHING");

    const stateFromAwaiting = nextState({
      state: "AWAITING_CONTACT",
      lastCheckIn: recentCheckIn,
      cadenceH,
      graceH,
      missedThreshold,
      now,
    });
    expect(stateFromAwaiting).toBe("WATCHING");
  });

  it("Scenario 8: PAUSED state remains PAUSED", () => {
    const now = addHours(baseTime, 100);
    const state = nextState({
      state: "PAUSED",
      lastCheckIn: baseTime,
      cadenceH,
      graceH,
      missedThreshold,
      now,
    });
    expect(state).toBe("PAUSED");
  });

  it("calculates vigil metrics accurately", () => {
    const now = addHours(baseTime, 28); // 28 hours since last check-in
    const metrics = calculateVigilMetrics({
      state: "WATCHING",
      lastCheckIn: baseTime,
      cadenceH,
      graceH,
      missedThreshold,
      now,
    });

    expect(metrics.hoursSince).toBe(28);
    expect(metrics.isDue).toBe(true); // 28 >= 24
    expect(metrics.isOverdue).toBe(false); // 28 < 30 (24 + 6)
    expect(metrics.missed).toBe(0); // (28 - 6) / 24 = 0.91 => 0
    expect(metrics.hoursUntilDue).toBe(0);
  });
});
