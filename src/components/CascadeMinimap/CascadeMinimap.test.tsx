import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { CascadeMinimap } from './CascadeMinimap';
import { tlsCascade } from '../../content/tls';

const branchGroup = (container: HTMLElement, id: string) => container.querySelector(`g[data-branch="${id}"]`)!;

describe('CascadeMinimap', () => {
  it('renders nothing when highlightedId is null (Scenes 0–2, per design spec §5.4)', () => {
    const { container } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('draws one lane per cascade branch when visible', () => {
    const { container } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId="K" />);
    expect(container.querySelectorAll('g[data-branch]')).toHaveLength(tlsCascade.branches.length);
  });

  it('marks every waypoint below the terminus, and gives a branch that ends at a terminus its own end node', () => {
    const { container } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId="full" />);
    const intermediate = tlsCascade.branches.reduce((n, b) => n + b.waypoints.filter((w) => w.t < 1).length, 0);
    expect(container.querySelectorAll('circle[data-waypoint]')).toHaveLength(intermediate);
    // K⁺ ends at the heart (its last waypoint is t = 1): lane + terminal dot, no bend toward the kidney.
    expect(branchGroup(container, 'K').querySelector('path')!.getAttribute('d')).not.toContain('C');
    expect(branchGroup(container, 'purines').querySelector('path')!.getAttribute('d')).toContain('C');
  });

  it('converging lanes meet at the same point above the kidney', () => {
    const { container } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId="full" />);
    const end = (id: string) => branchGroup(container, id).querySelector('path')!.getAttribute('d')!.trim().split(' ').slice(-2).join(' ');
    expect(end('PO4')).toBe(end('purines'));
  });

  it('gives the highlighted branch full opacity and dims the rest', () => {
    const { container } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId="K" />);
    for (const b of tlsCascade.branches) expect(branchGroup(container, b.id).getAttribute('opacity')).toBe(b.id === 'K' ? '1' : '0.4');
  });

  it('highlights every branch at full opacity when highlightedId is "full"', () => {
    const { container } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId="full" />);
    container.querySelectorAll('g[data-branch]').forEach((g) => expect(g.getAttribute('opacity')).toBe('1'));
  });

  it('with "kidney" lights the kidney, pulses it, and softly dims all lanes', () => {
    const { container, getByTestId } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId="kidney" />);
    expect(getByTestId('minimap-kidney')).toHaveAttribute('data-lit', 'true');
    expect(getByTestId('minimap-kidney').querySelector('ellipse')).not.toBeNull();
    container.querySelectorAll('g[data-branch]').forEach((g) => expect(g.getAttribute('opacity')).toBe('0.55'));
  });

  it('leaves the kidney unlit, and not pulsing, when a branch is in focus', () => {
    const { getByTestId } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId="PO4" />);
    expect(getByTestId('minimap-kidney')).toHaveAttribute('data-lit', 'false');
    expect(getByTestId('minimap-kidney').querySelector('ellipse')).toBeNull();
  });

  it('animates particles along every lane', () => {
    const { container } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId="full" />);
    const motions = container.querySelectorAll('animateMotion');
    expect(motions).toHaveLength(tlsCascade.branches.length * 3);
    motions.forEach((m) => {
      expect(m.getAttribute('repeatCount')).toBe('indefinite');
      expect(m.getAttribute('path')).toMatch(/^M /);
    });
  });

  it('says what it is: a titled map with a label on every lane and on the kidney', () => {
    const { container, getByText } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId="kidney" />);
    expect(getByText('The cascade')).toBeInTheDocument();
    for (const b of tlsCascade.branches) expect(container.querySelector(`g[data-branch="${b.id}"] text`)!.textContent).toBe(b.label);
    expect(getByText('Kidney')).toBeInTheDocument();
  });

  it('shows a "you are here" line and includes it in the accessible name', () => {
    const { getByText, getByRole } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId="kidney" locationLabel="You are here: kidney" />);
    expect(getByText('You are here: kidney')).toBeInTheDocument();
    expect(getByRole('img').getAttribute('aria-label')).toContain('You are here: kidney');
  });

  it('shows no location line when none is given', () => {
    const { container } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId="full" />);
    expect(container.querySelectorAll('p')).toHaveLength(1); // only the title
  });

  it('has no accessibility violations when visible', async () => {
    const { container } = render(<CascadeMinimap branches={tlsCascade.branches} highlightedId="purines" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
