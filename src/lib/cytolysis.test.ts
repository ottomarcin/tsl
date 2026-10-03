import { describe, expect, it } from 'vitest';
import {
  CELL_TIMING,
  PARTICLES,
  WAVE,
  arrivalProgress,
  buildParticleVelocities,
  cellState,
  fillParticleBuffers,
  particleBrightness,
  ruptureProgress,
  waveOpacity,
  waveCoordinate,
  waveX,
} from './cytolysis';
import { generateMassLayout } from './massLayout';

describe('wave', () => {
  it('sweeps left to right over [pStart, pEnd] and clamps outside', () => {
    expect(waveX(0)).toBe(WAVE.xMin);
    expect(waveX(WAVE.pStart)).toBeCloseTo(WAVE.xMin, 9);
    expect(waveX((WAVE.pStart + WAVE.pEnd) / 2)).toBeCloseTo(0, 9);
    expect(waveX(WAVE.pEnd)).toBeCloseTo(WAVE.xMax, 9);
    expect(waveX(1)).toBe(WAVE.xMax);
  });
  it('is invisible before and after the sweep, visible during it', () => {
    expect(waveOpacity(0)).toBe(0);
    expect(waveOpacity(0.4)).toBe(1);
    expect(waveOpacity(1)).toBe(0);
  });
  it('arrival is the inverse of waveX', () => {
    for (const x of [-5, -1, 0, 3, 6]) expect(waveX(arrivalProgress(x))).toBeCloseTo(x, 6);
  });
  it('ruptures cells to the left earlier than cells to the right', () => {
    expect(ruptureProgress(-4)).toBeLessThan(ruptureProgress(4));
    expect(ruptureProgress(0) - arrivalProgress(0)).toBeCloseTo(CELL_TIMING.burstDelay, 9);
  });
});

describe('waveCoordinate', () => {
  it('is the raw x for a cell on the bar plane', () => {
    expect(waveCoordinate([3, 1, 0.5], 12)).toBeCloseTo(3, 9);
  });
  it('makes the bar wait for a cell nearer the camera: it looks farther from the centre line, so the flat bar reaches it later', () => {
    expect(waveCoordinate([4, 0, 4], 12)).toBeGreaterThan(4);
    expect(waveCoordinate([-4, 0, 4], 12)).toBeLessThan(-4);
  });
  it('reaches a cell farther from the camera sooner (it looks closer to the centre line)', () => {
    expect(waveCoordinate([4, 0, -4], 12)).toBeLessThan(4);
  });
  it('is zero on the centre line and survives a cell at the camera', () => {
    expect(waveCoordinate([0, 2, 3], 12)).toBe(0);
    expect(Number.isFinite(waveCoordinate([2, 0, 12], 12))).toBe(true);
  });
  it('a front cell appears hit exactly when the bar reaches its on-screen position', () => {
    const D = 12;
    const cell: [number, number, number] = [4, 0, 4];
    const barWorldX = waveCoordinate(cell, D);
    // On-screen x of the bar edge (plane z=0.5) vs the cell (z=4), both projected from a camera at distance D.
    const barScreen = (barWorldX * D) / (D - 0.5);
    const cellScreen = (cell[0] * D) / (D - cell[2]);
    expect(barScreen).toBeCloseTo(cellScreen, 9);
  });
});

describe('cellState', () => {
  const x = 0;
  const t0 = arrivalProgress(x);
  it('is intact before the wave arrives', () => {
    expect(cellState(t0 - CELL_TIMING.lead - 0.01, x)).toEqual({ deform: 0, rupture: 0, alive: 1 });
  });
  it('starts straining just before the bar arrives, and is fully deformed when it bursts', () => {
    expect(cellState(t0 - CELL_TIMING.lead - 0.01, x).deform).toBe(0);
    const s = cellState(t0 - CELL_TIMING.lead / 2, x);
    expect(s.deform).toBeGreaterThan(0.3);
    expect(s.deform).toBeLessThan(1);
    expect(s.rupture).toBe(0);
    expect(s.alive).toBe(1);
    expect(cellState(ruptureProgress(x), x).deform).toBe(1);
  });

  it('tears fully within about a world unit behind the bar edge, not trailing far behind it', () => {
    const tornX = waveX(ruptureProgress(x) + CELL_TIMING.ruptureSnap);
    expect(tornX - x).toBeGreaterThanOrEqual(0);
    expect(tornX - x).toBeLessThan(1);
  });
  it('ruptures then fades to nothing', () => {
    const burst = ruptureProgress(x);
    expect(cellState(burst, x).rupture).toBe(0);
    expect(cellState(burst + CELL_TIMING.ruptureSnap, x).rupture).toBe(1);
    expect(cellState(burst + CELL_TIMING.fade, x).alive).toBe(0);
    expect(cellState(burst + CELL_TIMING.fade / 2, x).alive).toBeCloseTo(0.5, 6);
  });
  it('is reversible: a pure function of progress', () => {
    expect(cellState(0.4, 1)).toEqual(cellState(0.4, 1));
  });
});

describe('particles', () => {
  it('brightness holds for 70% of life then fades, and is zero outside [0,1]', () => {
    expect(particleBrightness(-0.1)).toBe(0);
    expect(particleBrightness(0.5)).toBe(1);
    expect(particleBrightness(0.85)).toBeCloseTo(0.5, 9);
    expect(particleBrightness(1)).toBeCloseTo(0, 9);
    expect(particleBrightness(1.1)).toBe(0);
  });

  it('builds a deterministic velocity per particle with roughly the spec speed', () => {
    const a = buildParticleVelocities(3, 7);
    expect(a).toHaveLength(3 * PARTICLES.perCellPerSystem * 3);
    expect(buildParticleVelocities(3, 7)).toEqual(a);
    expect(buildParticleVelocities(3, 8)).not.toEqual(a);
    let mean = 0;
    const n = a.length / 3;
    for (let i = 0; i < n; i++) mean += Math.hypot(a[i * 3], a[i * 3 + 1], a[i * 3 + 2]);
    mean /= n;
    expect(mean).toBeGreaterThan(0.6);
    expect(mean).toBeLessThan(1.2);
  });

  const cells = generateMassLayout({ count: 4, sigma: 1.5, minSpacing: 0.7, seed: 3 });
  const vel = buildParticleVelocities(cells.length, 11);
  const coords = cells.map((c) => waveCoordinate(c.position, 11));
  const make = () => ({
    positions: new Float32Array(cells.length * PARTICLES.perCellPerSystem * 3),
    colors: new Float32Array(cells.length * PARTICLES.perCellPerSystem * 3),
  });

  it('keeps unborn particles dark and at their cell', () => {
    const { positions, colors } = make();
    fillParticleBuffers(positions, colors, cells, coords, vel, [1, 0.5, 0.2], 0);
    expect(Math.max(...colors)).toBe(0);
    expect(positions[0]).toBeCloseTo(cells[0].position[0], 6);
  });

  it('lights particles and moves them away from the cell after rupture', () => {
    const { positions, colors } = make();
    const r = ruptureProgress(coords[0]);
    fillParticleBuffers(positions, colors, cells, coords, vel, [1, 0.5, 0.2], r + 0.2);
    expect(colors[0]).toBeGreaterThan(0);
    const d = Math.hypot(positions[0] - cells[0].position[0], positions[1] - cells[0].position[1], positions[2] - cells[0].position[2]);
    expect(d).toBeGreaterThan(0.2);
  });

  it('in normal-blending mode keeps full colour and carries the fade in alpha', () => {
    const positions = new Float32Array(cells.length * PARTICLES.perCellPerSystem * 3);
    const colors = new Float32Array(cells.length * PARTICLES.perCellPerSystem * 4);
    const r = ruptureProgress(coords[0]);
    fillParticleBuffers(positions, colors, cells, coords, vel, [1, 0.5, 0.2], r + 0.3, 4);
    expect(Array.from(colors.slice(0, 3))).toEqual([1, 0.5, expect.closeTo(0.2, 5)]);
    expect(colors[3]).toBe(1);
    fillParticleBuffers(positions, colors, cells, coords, vel, [1, 0.5, 0.2], r + PARTICLES.lifeProgress * 0.85, 4);
    expect(colors[3]).toBeCloseTo(0.5, 2);
    expect(colors[0]).toBe(1);
  });

  it('kills particles after their lifetime', () => {
    const { positions, colors } = make();
    const r = ruptureProgress(coords[0]);
    fillParticleBuffers(positions, colors, cells, coords, vel, [1, 1, 1], r + PARTICLES.lifeProgress + 0.01);
    for (let k = 0; k < PARTICLES.perCellPerSystem; k++) expect(colors[k * 3]).toBe(0);
  });

  it('applies gravity: with zero velocity the particle sinks over time', () => {
    const { positions, colors } = make();
    vel.fill(0);
    const r = ruptureProgress(coords[0]);
    fillParticleBuffers(positions, colors, cells, coords, vel, [1, 1, 1], r + 0.3);
    expect(positions[1]).toBeLessThan(cells[0].position[1]);
  });
});
