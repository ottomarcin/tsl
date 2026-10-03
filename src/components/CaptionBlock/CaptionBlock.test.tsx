import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { CaptionBlock } from './CaptionBlock';

const learnMore = {
  heading: 'Why this tumor',
  body: 'Body text.',
  citations: [
    { id: '1', text: 'Howard SC et al., NEJM 2011', url: 'https://example.org/1' },
    { id: '2', text: 'Cairo MS, BJH 2004' },
  ],
};

describe('CaptionBlock', () => {
  it('renders title and caption', () => {
    render(<CaptionBlock sceneTitle="The vulnerable tumor" caption="A bulky tumor." />);
    expect(screen.getByRole('heading', { name: 'The vulnerable tumor' })).toBeInTheDocument();
    expect(screen.getByText('A bulky tumor.')).toBeInTheDocument();
  });

  it('omits the trigger when there is no learn-more content', () => {
    render(<CaptionBlock sceneTitle="T" caption="C" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('collapses by default and toggles the panel with aria-expanded', async () => {
    render(<CaptionBlock sceneTitle="T" caption="C" learnMore={learnMore} />);
    const trigger = screen.getByRole('button', { name: /learn more/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Body text.')).not.toBeVisible();
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Body text.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Why this tumor' })).toBeVisible();
    await userEvent.click(trigger);
    expect(screen.queryByText('Body text.')).not.toBeVisible();
  });

  it('renders citations, linking only those with a url', async () => {
    render(<CaptionBlock sceneTitle="T" caption="C" learnMore={learnMore} />);
    await userEvent.click(screen.getByRole('button', { name: /learn more/i }));
    const link = screen.getByRole('link', { name: /Howard/ });
    expect(link).toHaveAttribute('href', 'https://example.org/1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByText(/Cairo MS/)).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('has no accessibility violations open or closed', async () => {
    const { container } = render(<CaptionBlock sceneTitle="T" caption="C" learnMore={learnMore} />);
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(screen.getByRole('button', { name: /learn more/i }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
