import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Begin →</Button>);
    expect(screen.getByRole('button', { name: 'Begin →' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Click me
      </Button>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is disabled and marked aria-busy while loading, and does not fire onClick', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} loading>
        Click me
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders leading and trailing icons alongside the label', () => {
    render(
      <Button iconLeading={<span data-testid="lead" />} iconTrailing={<span data-testid="trail" />}>
        Label
      </Button>,
    );
    expect(screen.getByTestId('lead')).toBeInTheDocument();
    expect(screen.getByTestId('trail')).toBeInTheDocument();
  });

  it('has no accessibility violations across variants and sizes', async () => {
    const { container } = render(
      <>
        <Button variant="primary" size="lg">
          Primary
        </Button>
        <Button variant="secondary" size="md">
          Secondary
        </Button>
        <Button variant="tertiary" size="sm">
          Tertiary
        </Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
