import type { Preview } from '@storybook/react-vite'

// Self-hosted so story snapshots render identically offline and in CI.
import '@fontsource-variable/work-sans'

// Design tokens only -- index.css also sets page-level font/layout rules that
// would distort story canvases.
import '../src/styles/tokens.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },

  // Brand is a token-layer swap, so it belongs in the toolbar rather than in
  // any component's args -- every component picks it up for free.
  globalTypes: {
    brand: {
      description: 'Brand palette',
      toolbar: {
        title: 'Brand',
        icon: 'paintbrush',
        items: [
          { value: 'default', title: 'Default (blue)' },
          { value: 'dispatch', title: 'Dispatch (green)' },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: { brand: 'default' },

  decorators: [
    (Story, context) => (
      // `[data-brand]` re-points the accent tokens; children inherit them.
      <div data-brand={context.globals.brand}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
