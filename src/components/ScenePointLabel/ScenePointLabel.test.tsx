import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { axe } from 'jest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The label is a drei <Html> inside a canvas. Here Html is a plain div and the frame loop is driven by hand.
let frame: (() => void) | null = null;
vi.mock('@react-three/fiber', () => ({
  useFrame: (cb: () => void) => {
    frame = cb;
  },
  useThree: (select: (state: unknown) => unknown) => select({ gl: { domElement: { parentElement: document.body } } }),
}));
vi.mock('@react-three/drei', () => ({
  Html: ({ children, style }: { children: ReactNode; style?: object }) => <div data-testid="html" style={style}>{children}</div>,
}));

const { ScenePointLabel } = await import('./ScenePointLabel');
beforeEach(() => {
  frame = null;
});

describe('ScenePointLabel', () => {
  it('shows its text in the colour given', () => {
    render(<ScenePointLabel position={[0, 0, 0]} text="Kidney" color="var(--text-secondary)" />);
    const label = screen.getByText('Kidney');
    expect(label).toHaveStyle({ color: 'var(--text-secondary)' });
  });
  it('never takes pointer events', () => {
    render(<ScenePointLabel position={[0, 0, 0]} text="Kidney" />);
    expect(screen.getByTestId('html')).toHaveStyle({ pointerEvents: 'none' });
  });
  it('has a fixed opacity, or follows the scene through getOpacity every frame', () => {
    const { unmount } = render(<ScenePointLabel position={[0, 0, 0]} text="A" opacity={0.4} />);
    expect(screen.getByText('A')).toHaveStyle({ opacity: '0.4' });
    unmount();
    let value = 0.2;
    render(<ScenePointLabel position={[0, 0, 0]} text="B" getOpacity={() => value} />);
    expect(screen.getByText('B')).toHaveStyle({ opacity: '0' });
    frame!();
    expect(screen.getByText('B').style.opacity).toBe('0.2');
    value = 0.9;
    frame!();
    expect(screen.getByText('B').style.opacity).toBe('0.9');
  });
  it('writes changing words straight into the element each frame', () => {
    let words = 'one';
    render(<ScenePointLabel position={[0, 0, 0]} text="ignored" getText={() => words} />);
    frame!();
    expect(screen.getByText('one')).toBeInTheDocument();
    words = 'two';
    frame!();
    expect(screen.getByText('two')).toBeInTheDocument();
    expect(screen.queryByText('ignored')).not.toBeInTheDocument();
  });
  it('sets which edge of the text sits at its point', () => {
    const { rerender } = render(<ScenePointLabel position={[0, 0, 0]} text="X" align="start" />);
    expect(screen.getByText('X').style.transform).toBe('translateX(50%)');
    rerender(<ScenePointLabel position={[0, 0, 0]} text="X" align="end" />);
    expect(screen.getByText('X').style.transform).toBe('translateX(-50%)');
    rerender(<ScenePointLabel position={[0, 0, 0]} text="X" />);
    expect(screen.getByText('X').style.transform).toBe('');
  });
  it('has no accessibility violations', async () => {
    const { container } = render(<ScenePointLabel position={[0, 0, 0]} text="Kidney" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
