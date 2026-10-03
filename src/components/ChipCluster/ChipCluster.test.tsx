import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { ChipCluster, chipAnchor, chipColumnAnchor } from './ChipCluster';
import { tlsContent } from '../../content/tls';

const chips = tlsContent.scenes[0].chips!;

describe('chipAnchor', () => {
  it('gives distinct positions inside the layer', () => {
    const pts = chips.map((_, i) => chipAnchor(i, chips.length));
    expect(new Set(pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)).size).toBe(chips.length);
    pts.forEach((p) => {
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(100);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(100);
    });
  });
});

describe('chipColumnAnchor', () => {
  it('stacks chips down one centred column, top to bottom', () => {
    const pts = chips.map((_, i) => chipColumnAnchor(i, chips.length));
    expect(new Set(pts.map((p) => p.x))).toEqual(new Set([50]));
    for (let i = 1; i < pts.length; i++) expect(pts[i].y).toBeGreaterThan(pts[i - 1].y);
    expect(chipColumnAnchor(0, 1).y).toBe(6);
  });
});

describe('ChipCluster', () => {
  it('uses the column layout and the shifted layer when asked', () => {
    render(<ChipCluster chips={chips} phase="shown" layout="column" shifted />);
    const slot = screen.getByTestId('chip-slot-ldh');
    expect(slot.style.left).toBe('50%');
    expect(slot.parentElement).toHaveAttribute('data-layout', 'column');
    expect(slot.parentElement).toHaveAttribute('data-shifted', 'true');
  });

  it('renders all seven chips', () => {
    render(<ChipCluster chips={chips} phase="shown" />);
    expect(screen.getAllByRole('button')).toHaveLength(7);
  });

  it('staggers entrance delays by 150ms per chip when shown', () => {
    render(<ChipCluster chips={chips} phase="shown" />);
    expect(screen.getByTestId('chip-slot-tumor-burden').style.transitionDelay).toBe('0ms');
    expect(screen.getByTestId('chip-slot-ckd').style.transitionDelay).toBe('300ms');
    expect(screen.getByTestId('chip-slot-nephrotoxins').style.transitionDelay).toBe('900ms');
  });

  it('removes the stagger under reduced motion', () => {
    render(<ChipCluster chips={chips} phase="shown" reducedMotion />);
    expect(screen.getByTestId('chip-slot-nephrotoxins').style.transitionDelay).toBe('0ms');
  });

  it('hides chips from assistive tech and inerts them while hidden or merged', () => {
    const { rerender } = render(<ChipCluster chips={chips} phase="hidden" />);
    expect(screen.getByTestId('chip-slot-ldh')).toHaveAttribute('aria-hidden', 'true');
    rerender(<ChipCluster chips={chips} phase="merged" />);
    expect(screen.getByTestId('chip-slot-ldh')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('chip-slot-ldh').querySelector('button')).toBeDisabled();
  });

  it('moves every chip to the same centre point when merged', () => {
    render(<ChipCluster chips={chips} phase="merged" />);
    const lefts = new Set(chips.map((c) => screen.getByTestId(`chip-slot-${c.id}`).style.left));
    expect(lefts.size).toBe(1);
  });

  it('has no accessibility violations when shown', async () => {
    const { container } = render(<ChipCluster chips={chips} phase="shown" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
