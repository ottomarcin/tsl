import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { SideNav } from './SideNav';

const scenes = [
  { index: 0, title: 'Risk', subSteps: ['0.1 Profile', '0.2 Factors', '0.3 Risk'] },
  { index: 1, title: 'Cytolysis' },
  { index: 2, title: 'Cascade' },
];

describe('SideNav', () => {
  it('renders landing, every scene, and the end card as nav items when expanded', () => {
    render(
      <SideNav
        scenes={scenes}
        currentSceneIndex={0}
        expanded
        onToggleExpanded={vi.fn()}
        onJumpToScene={vi.fn()}
        onJumpToLanding={vi.fn()}
        onJumpToEnd={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Landing/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Risk/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cytolysis/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /End card/ })).toBeInTheDocument();
  });

  it('does not render the nav item list when collapsed', () => {
    render(
      <SideNav
        scenes={scenes}
        currentSceneIndex={0}
        expanded={false}
        onToggleExpanded={vi.fn()}
        onJumpToScene={vi.fn()}
        onJumpToLanding={vi.fn()}
        onJumpToEnd={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /Risk/ })).not.toBeInTheDocument();
  });

  it('marks only the current scene as aria-current and shows its sub-steps', () => {
    render(
      <SideNav
        scenes={scenes}
        currentSceneIndex={0}
        expanded
        onToggleExpanded={vi.fn()}
        onJumpToScene={vi.fn()}
        onJumpToLanding={vi.fn()}
        onJumpToEnd={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Risk/ })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: /Cytolysis/ })).not.toHaveAttribute('aria-current');
    expect(screen.getByText('0.2 Factors')).toBeInTheDocument();
  });

  it('does not show sub-steps for a scene that is not current', () => {
    render(
      <SideNav
        scenes={scenes}
        currentSceneIndex={1}
        expanded
        onToggleExpanded={vi.fn()}
        onJumpToScene={vi.fn()}
        onJumpToLanding={vi.fn()}
        onJumpToEnd={vi.fn()}
      />,
    );
    expect(screen.queryByText('0.2 Factors')).not.toBeInTheDocument();
  });

  it('calls onJumpToScene/onJumpToLanding/onJumpToEnd when the corresponding item is clicked', async () => {
    const onJumpToScene = vi.fn();
    const onJumpToLanding = vi.fn();
    const onJumpToEnd = vi.fn();
    render(
      <SideNav
        scenes={scenes}
        currentSceneIndex={0}
        expanded
        onToggleExpanded={vi.fn()}
        onJumpToScene={onJumpToScene}
        onJumpToLanding={onJumpToLanding}
        onJumpToEnd={onJumpToEnd}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Cascade/ }));
    expect(onJumpToScene).toHaveBeenCalledWith(2);
    await userEvent.click(screen.getByRole('button', { name: /Landing/ }));
    expect(onJumpToLanding).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: /End card/ }));
    expect(onJumpToEnd).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleExpanded when the collapse button is clicked', async () => {
    const onToggleExpanded = vi.fn();
    render(
      <SideNav
        scenes={scenes}
        currentSceneIndex={0}
        expanded
        onToggleExpanded={onToggleExpanded}
        onJumpToScene={vi.fn()}
        onJumpToLanding={vi.fn()}
        onJumpToEnd={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Collapse navigation' }));
    expect(onToggleExpanded).toHaveBeenCalledTimes(1);
  });

  it('renders as a bottom sheet when variant is "sheet" and sheetOpen is true', () => {
    render(
      <SideNav
        scenes={scenes}
        currentSceneIndex={0}
        expanded
        onToggleExpanded={vi.fn()}
        onJumpToScene={vi.fn()}
        onJumpToLanding={vi.fn()}
        onJumpToEnd={vi.fn()}
        variant="sheet"
        sheetOpen
        onSheetOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Risk/ })).toBeInTheDocument();
  });

  it('has no accessibility violations when expanded', async () => {
    const { container } = render(
      <SideNav
        scenes={scenes}
        currentSceneIndex={0}
        expanded
        onToggleExpanded={vi.fn()}
        onJumpToScene={vi.fn()}
        onJumpToLanding={vi.fn()}
        onJumpToEnd={vi.fn()}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
