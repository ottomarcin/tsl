import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * A stub story existing purely to prove the Storybook setup itself works:
 * boots, discovers stories, and the theme toolbar toggle visibly swaps
 * token values via the data-theme attribute (tech arch §10). Not a real
 * app component — delete once real component stories exist in Epic 1+.
 */
const SWATCHES = [
  '--bg-canvas',
  '--bg-surface',
  '--bg-elevated',
  '--text-primary',
  '--text-secondary',
  '--text-muted',
  '--mol-K',
  '--mol-PO4',
  '--mol-Ca',
  '--mol-purines',
  '--crystal',
  '--monitor-trace',
  '--flag-amber',
  '--flag-red',
];

function TokenSwatches() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 'var(--space-4)',
        padding: 'var(--space-6)',
        background: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {SWATCHES.map((token) => (
        <div key={token} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: 'var(--radius-pill)',
              background: `var(${token})`,
              border: '1px solid var(--border-subtle)',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 'var(--font-size-mono-sm)' }}>{token}</span>
        </div>
      ))}
    </div>
  );
}

const meta: Meta<typeof TokenSwatches> = {
  title: 'Foundations/Tokens',
  component: TokenSwatches,
};

export default meta;

export const AllTokens: StoryObj<typeof TokenSwatches> = {};
