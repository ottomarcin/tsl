import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { LiveAnnouncer } from './LiveAnnouncer';

describe('LiveAnnouncer', () => {
  it('is a polite live region carrying the message', () => {
    render(<LiveAnnouncer message="Scene 2: The cascade." />);
    const region = screen.getByTestId('live-announcer');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('Scene 2: The cascade.');
  });
  it('follows a change of message', () => {
    const { rerender } = render(<LiveAnnouncer message="one" />);
    rerender(<LiveAnnouncer message="two" />);
    expect(screen.getByTestId('live-announcer')).toHaveTextContent('two');
  });
  it('has no accessibility violations', async () => {
    const { container } = render(<LiveAnnouncer message="x" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
