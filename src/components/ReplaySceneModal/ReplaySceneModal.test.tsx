import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ReplaySceneModal } from './ReplaySceneModal';

const scenes = Array.from({ length: 6 }, (_, i) => ({ index: i, title: `Scene title ${i}`, summary: `What scene ${i} shows` }));
const open = (over = {}) => {
  const props = { open: true, onOpenChange: vi.fn(), title: 'Replay a scene', scenes, onPick: vi.fn(), ...over };
  render(<ReplaySceneModal {...props} />);
  return props;
};

describe('ReplaySceneModal', () => {
  it('shows a card per scene with its title and summary', () => {
    open();
    const dialog = screen.getByRole('dialog', { name: 'Replay a scene' });
    expect(within(dialog).getAllByRole('button', { name: /Scene title/ })).toHaveLength(6);
    expect(within(dialog).getByText('What scene 3 shows')).toBeInTheDocument();
  });
  it('choosing a card closes the dialog and jumps to that scene', async () => {
    const props = open();
    await userEvent.click(screen.getByRole('button', { name: /Scene title 4/ }));
    expect(props.onPick).toHaveBeenCalledWith(4);
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });
  it('shows nothing while closed', () => {
    open({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('has no accessibility violations', async () => {
    open();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
