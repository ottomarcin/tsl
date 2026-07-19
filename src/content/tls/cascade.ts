import type { CascadeTopology } from '../schema';

// 3-branch topology transcribed from tls_asset_specification.md §4.2 (Scene 2 — The Cascade).
export const tlsCascade: CascadeTopology = {
  branches: [
    {
      id: 'K',
      colorToken: '--mol-K',
      // Short, direct path straight to cardiac myocytes — no intermediate waypoints.
      waypoints: [{ t: 1.0, label: 'Cardiac myocytes' }],
    },
    {
      id: 'PO4',
      colorToken: '--mol-PO4',
      // Midway, the stream intersects and depletes the calcium reservoir.
      waypoints: [{ t: 0.5, label: 'Calcium pool' }],
    },
    {
      id: 'purines',
      colorToken: '--mol-purines',
      // Hypoxanthine → XO → Xanthine → XO → Uric acid, per asset spec §4.2's waypoint schema.
      waypoints: [
        { t: 0.25, label: 'Hypoxanthine' },
        { t: 0.45, label: 'XO' },
        { t: 0.55, label: 'Xanthine' },
        { t: 0.75, label: 'XO' },
        { t: 0.85, label: 'Uric acid' },
      ],
    },
  ],
  convergencePointId: 'kidney',
};
