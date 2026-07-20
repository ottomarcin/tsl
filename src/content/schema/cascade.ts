export interface CascadeWaypoint {
  /** Normalized position along the branch, 0–1. */
  t: number;
  label: string;
}

export interface CascadeBranch {
  /** Generic id, e.g. 'K' for TLS. */
  id: string;
  /** Display label, e.g. 'K⁺' — for legends/minimaps, not used for lookups. */
  label: string;
  /** CSS custom property name, e.g. '--mol-K' — a token reference, never a raw hex. */
  colorToken: string;
  waypoints: CascadeWaypoint[];
}

export interface CascadeTopology {
  branches: CascadeBranch[];
  convergencePointId: string;
}
