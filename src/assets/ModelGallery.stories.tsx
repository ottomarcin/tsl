import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { tlsModels } from '../content/tls/models';
import type { ModelQuality, ModelUsage } from '../content/schema';
import { useAppStore } from '../store/useAppStore';
import { ModelBoundary } from './ModelBoundary';
import { resolveModelUrl } from './resolveModel';
import { useModel } from './useModel';

function Model({ id, usage, x }: { id: string; usage: ModelUsage; x: number }) {
  const gltf = useModel(tlsModels, id, usage);
  return <primitive object={gltf.scene.clone()} position={[x, 0, 0]} />;
}

function Gallery({ quality }: { quality: ModelQuality }) {
  const setQuality = useAppStore((s) => s.setModelQuality);
  useEffect(() => setQuality(quality), [quality, setQuality]);
  const ids = Object.keys(tlsModels.models);
  const rows = ids.flatMap((id) => (['single', 'instanced'] as ModelUsage[]).map((usage) => ({ id, usage })));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', height: 520, gap: 'var(--space-4)' }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 40 }} data-testid="gallery-canvas">
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 3, 3]} intensity={1.2} />
        <ModelBoundary errorFallback={null}>
          {rows.map((r, i) => (
            <Model key={`${r.id}-${r.usage}`} id={r.id} usage={r.usage} x={(i - (rows.length - 1) / 2) * 1.6} />
          ))}
        </ModelBoundary>
        <OrbitControls />
      </Canvas>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-mono-sm)', color: 'var(--text-secondary)' }}>
        {rows.map((r) => (
          <li key={`${r.id}-${r.usage}`}>
            {r.id} ({r.usage}) → {resolveModelUrl(tlsModels, r.id, { quality, usage: r.usage }).replace(/^.*\/models\//, '')}
          </li>
        ))}
      </ul>
    </div>
  );
}

const meta: Meta<{ quality: ModelQuality }> = {
  title: 'Assets/ModelGallery',
  args: { quality: 'high' },
  argTypes: { quality: { control: 'inline-radio', options: ['high', 'standard'] } },
  render: (args) => <Gallery quality={args.quality} />,
  // The canvas is WebGL; axe can't inspect it, and the list beside it is plain text.
  parameters: { a11y: { test: 'todo' } },
};
export default meta;
type Story = StoryObj<{ quality: ModelQuality }>;

/** Loads every manifest model through the real loader (Draco + WebP). Left of each pair = close-up rule, right = instanced rule. */
export const Default: Story = {};

/** Both tiers one under the other. They share the store's tier setting, so the second gallery re-applies its own on mount. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      <Gallery quality="high" />
      <Gallery quality="standard" />
    </div>
  ),
};

export const Playground: Story = {};
