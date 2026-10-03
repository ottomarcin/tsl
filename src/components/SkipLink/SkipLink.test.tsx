import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { SkipLink } from './SkipLink';

const page = () =>
  render(
    <>
      <SkipLink targetId="main">Skip to content</SkipLink>
      <button type="button">Menu</button>
      <main id="main" tabIndex={-1}>
        content
      </main>
    </>,
  );

describe('SkipLink', () => {
  it('is the first stop in the tab order', async () => {
    page();
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus();
  });
  it('moves focus to the content, past the navigation', async () => {
    page();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('main')).toHaveFocus();
  });
  it('points at its target', () => {
    page();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
  });
  it('has no accessibility violations', async () => {
    const { container } = page();
    expect(await axe(container)).toHaveNoViolations();
  });
});
