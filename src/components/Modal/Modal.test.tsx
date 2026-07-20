import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onOpenChange={vi.fn()} title="Sources">
        Body content
      </Modal>,
    );
    expect(screen.queryByText('Sources')).not.toBeInTheDocument();
  });

  it('renders the title and children when open', () => {
    render(
      <Modal open onOpenChange={vi.fn()} title="Sources">
        Body content
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Sources')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('calls onOpenChange(false) when the close button is clicked', async () => {
    const onOpenChange = vi.fn();
    render(
      <Modal open onOpenChange={onOpenChange} title="Sources">
        Body content
      </Modal>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) on Escape', async () => {
    const onOpenChange = vi.fn();
    render(
      <Modal open onOpenChange={onOpenChange} title="Sources">
        Body content
      </Modal>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('hides the close button when showCloseButton is false', () => {
    render(
      <Modal open onOpenChange={vi.fn()} title="Sources" showCloseButton={false}>
        Body content
      </Modal>,
    );
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('renders the sheet variant with a drag handle', () => {
    render(
      <Modal open onOpenChange={vi.fn()} title="Filters" variant="sheet">
        Body content
      </Modal>,
    );
    // Radix portals dialog content onto document.body, not the RTL container.
    expect(document.body.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('has no accessibility violations while open', async () => {
    render(
      <Modal open onOpenChange={vi.fn()} title="Sources">
        Body content
      </Modal>,
    );
    // Radix renders into a portal, so check the whole document, not just the container.
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
