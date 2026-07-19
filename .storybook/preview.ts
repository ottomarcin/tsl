import type { Preview } from '@storybook/react-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import '../src/styles/fonts.css';
import '../src/styles/tokens.css';
import '../src/styles/global.css';

const preview: Preview = {
  parameters: {
    a11y: { test: 'error' },
  },
  decorators: [
    withThemeByDataAttribute({
      themes: { dark: 'dark', light: 'light' },
      defaultTheme: 'dark',
      attributeName: 'data-theme',
    }),
  ],
};

export default preview;
