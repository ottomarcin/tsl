import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SideNav } from './SideNav';

const scenes = [
  { index: 0, title: 'Risk', subSteps: ['0.1 Profile', '0.2 Factors', '0.3 Risk'] },
  { index: 1, title: 'Cytolysis' },
  { index: 2, title: 'Cascade' },
  { index: 3, title: 'Renal' },
  { index: 4, title: 'Systemic' },
  { index: 5, title: 'Intervene' },
];

const meta: Meta<typeof SideNav> = {
  title: 'Organisms/SideNav',
  component: SideNav,
  args: {
    scenes,
    currentSceneIndex: 0,
    expanded: true,
  },
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof SideNav>;

const wrapperStyle = { height: 500 };

/** Baseline args — expanded rail, Scene 0 current. */
export const Default: Story = {
  args: { onToggleExpanded: () => {}, onJumpToScene: () => {}, onJumpToLanding: () => {}, onJumpToEnd: () => {} },
  decorators: [(Story) => <div style={wrapperStyle}><Story /></div>],
};

/** Expanded, collapsed, and mobile-sheet variants (tech arch §10.1). */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
      <div style={wrapperStyle}>
        <SideNav
          scenes={scenes}
          currentSceneIndex={2}
          expanded
          onToggleExpanded={() => {}}
          onJumpToScene={() => {}}
          onJumpToLanding={() => {}}
          onJumpToEnd={() => {}}
        />
      </div>
      <div style={wrapperStyle}>
        <SideNav
          scenes={scenes}
          currentSceneIndex={2}
          expanded={false}
          onToggleExpanded={() => {}}
          onJumpToScene={() => {}}
          onJumpToLanding={() => {}}
          onJumpToEnd={() => {}}
        />
      </div>
    </div>
  ),
};

/** Interactive — collapse toggle and scene jumps actually update state. */
export const Playground: Story = {
  render: function Render(args) {
    const [expanded, setExpanded] = useState(args.expanded);
    const [currentSceneIndex, setCurrentSceneIndex] = useState(args.currentSceneIndex);
    return (
      <div style={wrapperStyle}>
        <SideNav
          scenes={scenes}
          currentSceneIndex={currentSceneIndex}
          expanded={expanded}
          onToggleExpanded={() => setExpanded((e) => !e)}
          onJumpToScene={setCurrentSceneIndex}
          onJumpToLanding={() => setCurrentSceneIndex(-1)}
          onJumpToEnd={() => setCurrentSceneIndex(scenes.length)}
        />
      </div>
    );
  },
};
