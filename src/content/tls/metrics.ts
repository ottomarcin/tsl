import type { DiseaseMetric } from '../schema';

// Thresholds transcribed from tls_asset_specification.md §8 (shared_lab_strip flag logic).
export const tlsMetrics: DiseaseMetric[] = [
  {
    id: 'K',
    name: 'Potassium',
    label: 'K⁺',
    unit: 'mmol/L',
    decimalPlaces: 1,
    thresholds: {
      direction: 'higherIsWorse',
      normal: [3.5, 5.0],
      amber: [5.0, 6.0],
      redBoundary: 6.0,
    },
  },
  {
    id: 'Ca',
    name: 'Calcium',
    label: 'Ca²⁺',
    unit: 'mg/dL',
    decimalPlaces: 1,
    thresholds: {
      direction: 'lowerIsWorse',
      normal: [8.5, 10.5],
      amber: [7.0, 8.5],
      redBoundary: 7.0,
    },
  },
  {
    id: 'PO4',
    name: 'Phosphate',
    label: 'PO₄',
    unit: 'mmol/L',
    decimalPlaces: 1,
    thresholds: {
      direction: 'higherIsWorse',
      normal: [2.5, 4.5],
      amber: [4.5, 6.0],
      redBoundary: 6.0,
    },
  },
  {
    id: 'UA',
    name: 'Uric acid',
    label: 'UA',
    unit: 'mg/dL',
    decimalPlaces: 1,
    thresholds: {
      direction: 'higherIsWorse',
      normal: [3.0, 7.0],
      amber: [7.0, 9.0],
      redBoundary: 9.0,
    },
  },
  {
    id: 'Cr',
    name: 'Creatinine',
    label: 'Cr',
    unit: 'mg/dL',
    decimalPlaces: 1,
    thresholds: {
      direction: 'higherIsWorse',
      normal: [0.6, 1.2],
      amber: [1.2, 2.0],
      redBoundary: 2.0,
    },
  },
];
