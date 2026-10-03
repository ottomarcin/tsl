import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { tlsContent } from '../../content/tls';
import { TextOnlyView, textStepId } from './TextOnlyView';

const scene = tlsContent.scenes[2];
const show = (over = {}) =>
  render(<TextOnlyView scene={scene} metrics={tlsContent.metrics} labsFor={() => ({ K: 6.3, Ca: 7.0 })} timestampFor={() => 'T+24h'} {...over} />);

describe('TextOnlyView', () => {
  it('titles the scene and has a section per step, with its number and caption', () => {
    show();
    expect(screen.getByRole('heading', { level: 1, name: `Scene 2: ${scene.title}` })).toBeInTheDocument();
    expect(screen.getAllByRole('region')).toHaveLength(scene.steps.length);
    expect(screen.getByText(scene.steps[1].caption)).toBeInTheDocument();
  });
  it('gives each step an id the side navigation can scroll to', () => {
    show();
    expect(document.getElementById(textStepId(2, 1))).not.toBeNull();
  });
  it('shows every Learn more in full, with its sources, without opening anything', () => {
    show();
    for (const step of scene.steps.filter((s) => s.learnMore)) {
      expect(screen.getByText(step.learnMore!.heading)).toBeVisible();
      expect(screen.getByText(step.learnMore!.body)).toBeVisible();
    }
    expect(screen.getAllByText('Sources for this step').length).toBeGreaterThan(0);
  });
  it('lists the labs with their spoken names, units and flags, and the time', () => {
    show();
    const first = screen.getAllByRole('region')[0];
    expect(within(first).getByText('Lab values at T+24h')).toBeInTheDocument();
    expect(within(first).getByText('Potassium: 6.3 mmol/L (critical)')).toBeInTheDocument();
    expect(within(first).getByText('Calcium: 7.0 mg/dL (critical)')).toBeInTheDocument();
  });
  it('leaves the labs out of a step that has none', () => {
    show({ labsFor: () => ({}) });
    expect(screen.queryByText(/Lab values/)).not.toBeInTheDocument();
  });
  it('shows extra content under the step it is given for', () => {
    show({ extraFor: (i: number) => (i === 1 ? <p>extra panel</p> : null) });
    expect(within(screen.getAllByRole('region')[1]).getByText('extra panel')).toBeInTheDocument();
    expect(screen.getAllByText('extra panel')).toHaveLength(1);
  });
  it('has no accessibility violations', async () => {
    const { container } = show();
    expect(await axe(container)).toHaveNoViolations();
  });
});
