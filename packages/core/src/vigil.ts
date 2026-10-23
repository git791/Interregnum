export type State =
  | "WATCHING"
  | "CONCERNED"
  | "AWAITING_CONTACT"
  | "ACTIVE"
  | "RETURNED"
  | "PAUSED";

export interface VigilStateParams {
  state: State;
  lastCheckIn: Date;
  cadenceH: number;
  graceH: number;
  missedThreshold: number;
  contactConfirmedAt?: Date | null;
  contactDeclinedAt?: Date | null;
  now: Date;
}

export interface VigilMetrics {
  hoursSince: number;
  missed: number;
  hoursUntilDue: number;
  isDue: boolean;
  isOverdue: boolean;
}

export function calculateVigilMetrics(params: VigilStateParams): VigilMetrics {
  const hoursSince = Math.max(
    0,
    (params.now.getTime() - params.lastCheckIn.getTime()) / 36e5
  );
  const missed = Math.floor(
    Math.max(0, hoursSince - params.graceH) / Math.max(1, params.cadenceH)
  );
  const hoursUntilDue = Math.max(0, params.cadenceH - hoursSince);
  const isDue = hoursSince >= params.cadenceH;
  const isOverdue = hoursSince >= params.cadenceH + params.graceH;

  return {
    hoursSince,
    missed,
    hoursUntilDue,
    isDue,
    isOverdue,
  };
}

/**
 * Deterministic Vigil state machine transition function.
 * Pure function with no side effects.
 */
export function nextState(params: VigilStateParams): State {
  if (params.state === "PAUSED") {
    return "PAUSED";
  }

  const hoursSince = (params.now.getTime() - params.lastCheckIn.getTime()) / 36e5;
  const cadence = Math.max(1, params.cadenceH);
  const missed = Math.floor(
    Math.max(0, hoursSince - params.graceH) / cadence
  );

  // If the agent is ACTIVE and the owner checks in (hoursSince < cadence), return to RETURNED
  if (params.state === "ACTIVE") {
    if (hoursSince < cadence) {
      return "RETURNED";
    }
    return "ACTIVE";
  }

  // Two-person rule confirmation or decline during AWAITING_CONTACT
  if (params.state === "AWAITING_CONTACT") {
    // Owner check-in supersedes emergency
    if (hoursSince < cadence) {
      return "WATCHING";
    }
    if (params.contactDeclinedAt) {
      return "WATCHING";
    }
    if (params.contactConfirmedAt) {
      return "ACTIVE";
    }
    return "AWAITING_CONTACT";
  }

  // CONCERNED state transitions
  if (params.state === "CONCERNED") {
    if (hoursSince < cadence) {
      return "WATCHING";
    }
    if (missed >= params.missedThreshold) {
      return "AWAITING_CONTACT";
    }
    return "CONCERNED";
  }

  // WATCHING state transitions
  if (params.state === "WATCHING") {
    if (missed >= params.missedThreshold) {
      return "AWAITING_CONTACT";
    }
    if (missed >= 1) {
      return "CONCERNED";
    }
    return "WATCHING";
  }

  // RETURNED state transitions
  if (params.state === "RETURNED") {
    if (hoursSince < cadence) {
      return "WATCHING";
    }
    if (missed >= params.missedThreshold) {
      return "AWAITING_CONTACT";
    }
    if (missed >= 1) {
      return "CONCERNED";
    }
    return "RETURNED";
  }

  // Default fallback check
  if (hoursSince < cadence) {
    return "WATCHING";
  }

  return params.state;
}
