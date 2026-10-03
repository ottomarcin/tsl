import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { tlsInterventions } from '../../content/tls/interventions';
import { tlsMetrics } from '../../content/tls/metrics';
import { InterventionPanel, type InterventionPanelProps } from './InterventionPanel';

const baseline = { K: 6.3, Ca: 7.0, PO4: 7.8, UA: 11.4, Cr: 3.1 };
const props = (over: Partial<InterventionPanelProps> = {}): InterventionPanelProps => ({
  heading: 'Try interventions',
  hint: 'Adjust the slider and toggles.',
  interventions: tlsInterventions,
  metrics: tlsMetrics,
  baseline,
  state: {},
  onChange: vi.fn(),
  onReset: vi.fn(),
  resetLabel: 'Reset T+0',
  ...over,
});

const row = (label: string) => screen.getByRole('row', { name: new RegExp(label) });

describe('InterventionPanel', () => {
  it('shows the heading, the hint, one control per intervention and a reset button', () => {
    render(<InterventionPanel {...props()} />);
    expect(screen.getByRole('heading', { name: 'Try interventions' })).toBeInTheDocument();
    expect(screen.getByText('Adjust the slider and toggles.')).toBeInTheDocument();
    expect(screen.getAllByRole('switch')).toHaveLength(3);
    expect(screen.getByRole('slider', { name: 'IV hydration' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset T+0' })).toBeInTheDocument();
  });

  it('with nothing on, every lab is unchanged', () => {
    render(<InterventionPanel {...props()} />);
    expect(within(row('UA')).getAllByText(/11\.4/)).toHaveLength(2);
    expect(screen.queryByRole('img', { name: 'lower' })).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'higher' })).not.toBeInTheDocument();
  });

  it('computes the counterfactual from the interventions\' own effect functions', () => {
    render(<InterventionPanel {...props({ state: { rasburicase: true } })} />);
    const ua = row('UA');
    expect(within(ua).getByText('11.4')).toBeInTheDocument();
    expect(within(ua).getByText(/3\.4/)).toBeInTheDocument();
    expect(within(ua).getByRole('img', { name: 'lower' })).toBeInTheDocument();
  });

  it('shows calcium rising as phosphate falls, and marks an improvement', () => {
    render(<InterventionPanel {...props({ state: { dialysis: true } })} />);
    expect(within(row('Ca')).getByRole('img', { name: 'higher' })).toBeInTheDocument();
    expect(within(row('Ca')).getByRole('img', { name: 'higher' }).className).toMatch(/better/);
  });

  it('shows the slider in the units the viewer knows, not as 0–1', () => {
    render(<InterventionPanel {...props({ state: { hydration: 0.5 } })} />);
    expect(screen.getByText(/2\.0 L\/m²\/day/)).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'IV hydration' })).toHaveAttribute('aria-valuetext', '2.0 L/m²/day');
  });

  it('reports a toggle and the slider by id, and the reset', async () => {
    const onChange = vi.fn();
    const onReset = vi.fn();
    render(<InterventionPanel {...props({ onChange, onReset })} />);
    await userEvent.click(screen.getByRole('switch', { name: 'Dialysis (RRT)' }));
    expect(onChange).toHaveBeenCalledWith('dialysis', true);
    screen.getByRole('slider', { name: 'IV hydration' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('hydration', 0.025);
    await userEvent.click(screen.getByRole('button', { name: 'Reset T+0' }));
    expect(onReset).toHaveBeenCalled();
  });

  it('reflects the state in the switches', () => {
    render(<InterventionPanel {...props({ state: { allopurinol: true } })} />);
    expect(screen.getByRole('switch', { name: 'Allopurinol / Febuxostat' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Rasburicase' })).not.toBeChecked();
  });

  it('carries a caveat when given one', () => {
    render(<InterventionPanel {...props({ note: 'Illustrative only.' })} />);
    expect(screen.getByText('Illustrative only.')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<InterventionPanel {...props({ state: { rasburicase: true, hydration: 0.5 } })} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('InterventionPanel: what is shown is what the formula gives', () => {
  const cases: Record<string, number | boolean>[] = [
    {},
    { rasburicase: true },
    { allopurinol: true },
    { rasburicase: true, allopurinol: true },
    { hydration: 0.625 },
    { hydration: 1 },
    { dialysis: true },
    { rasburicase: true, hydration: 0.5, dialysis: true },
    { allopurinol: true, hydration: 1, dialysis: true },
  ];
  it.each(cases)('shows the folded counterfactual for %j', (state) => {
    const { unmount } = render(<InterventionPanel {...props({ state })} />);
    const treated = tlsInterventions.reduce<Record<string, number>>((acc, def) => def.applyEffect(acc, state), { ...baseline });
    for (const m of tlsMetrics) {
      const cells = within(row(m.label)).getAllByRole('cell');
      expect(cells[0]).toHaveTextContent(baseline[m.id as keyof typeof baseline].toFixed(m.decimalPlaces));
      expect(cells[1]).toHaveTextContent(treated[m.id].toFixed(m.decimalPlaces));
    }
    unmount();
  });
  it('gives an arrow only where the shown numbers differ', () => {
    render(<InterventionPanel {...props({ state: { hydration: 0.025 } })} />);
    // Creatinine 3.1 → 3.0768 shows as 3.1 → 3.1: no arrow.
    expect(within(row('Cr')).queryByRole('img')).not.toBeInTheDocument();
    expect(within(row('K')).getByRole('img', { name: 'lower' })).toBeInTheDocument();
  });
  it('names the moment the table describes', () => {
    render(<InterventionPanel {...props({ labsHeading: 'Counterfactual labs at T+48h' })} />);
    expect(screen.getByText('Counterfactual labs at T+48h')).toBeInTheDocument();
  });
});
