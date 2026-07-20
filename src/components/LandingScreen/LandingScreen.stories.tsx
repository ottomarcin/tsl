import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LandingScreen } from './LandingScreen';
import { tlsLanding } from '../../content/tls';

const meta: Meta<typeof LandingScreen> = {
  title: 'Organisms/LandingScreen',
  component: LandingScreen,
  args: {
    content: tlsLanding,
    theme: 'dark',
    webglSupported: true,
  },
  argTypes: {
    theme: { control: 'radio', options: ['dark', 'light'] },
    webglSupported: { control: 'boolean' },
    loading: { control: 'boolean' },
    showSlowLoadMessage: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof LandingScreen>;

/** Baseline args — the default landing state. */
export const Default: Story = {
  args: { onToggleTheme: () => {}, onBegin: () => {} },
};

/** Every state: default, loading, slow-load, WebGL-unsupported (tech arch §10.1). */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {[
        { label: 'Default', props: {} },
        { label: 'Loading', props: { loading: true } },
        { label: 'Slow load', props: { loading: true, showSlowLoadMessage: true } },
        { label: 'WebGL unsupported', props: { webglSupported: false } },
      ].map(({ label, props }) => (
        <div key={label} style={{ height: 420, position: 'relative', border: '1px solid var(--border-subtle)' }}>
          <span
            style={{
              position: 'absolute',
              top: 4,
              left: 4,
              zIndex: 1,
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {label}
          </span>
          <LandingScreen
            content={tlsLanding}
            theme="dark"
            webglSupported={true}
            onToggleTheme={() => {}}
            onBegin={() => {}}
            {...props}
          />
        </div>
      ))}
    </div>
  ),
};

/** Interactive — Begin actually flips to the loading state, live. */
export const Playground: Story = {
  render: function Render(args) {
    const [theme, setTheme] = useState(args.theme);
    const [loading, setLoading] = useState(false);
    return (
      <LandingScreen
        {...args}
        theme={theme}
        loading={loading}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onBegin={() => setLoading(true)}
      />
    );
  },
};
