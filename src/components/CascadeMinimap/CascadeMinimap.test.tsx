import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { CascadeMinimap } from './CascadeMinimap';
import { tlsCascade } from '../../content/tls';

describe('CascadeMinimap', () => {
  it('renders nothing when highlightedId is null (Scenes 0–2, per design spec §5.4)', () => {
    const { container } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one line per cascade branch when visible', () => {
    const { container } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId="K" />);
    expect(container.querySelectorAll('line')).toHaveLength(tlsCascade.branches.length);
  });

  it('renders a waypoint dot for every waypoint across all branches', () => {
    const { container } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId="full" />);
    const totalWaypoints = tlsCascade.branches.reduce((sum, b) => sum + b.waypoints.length, 0);
    expect(container.querySelectorAll('circle')).toHaveLength(totalWaypoints);
  });

  it('gives the highlighted branch full opacity and dims the rest', () => {
    const { container } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId="K" />);
    const groups = Array.from(container.querySelectorAll('g'));
    const kGroupIndex = tlsCascade.branches.findIndex((b) => b.id === 'K');
    groups.forEach((g, i) => {
      expect(g.getAttribute('opacity')).toBe(i === kGroupIndex ? '1' : '0.4');
    });
  });

  it('highlights every branch at full opacity when highlightedId is "full"', () => {
    const { container } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId="full" />);
    container.querySelectorAll('g').forEach((g) => expect(g.getAttribute('opacity')).toBe('1'));
  });

  it('has no accessibility violations when visible', async () => {
    const { container } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId="purines" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
