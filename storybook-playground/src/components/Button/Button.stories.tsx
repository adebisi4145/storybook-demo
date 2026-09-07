import { Fragment } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { expect, fn, userEvent, within } from 'storybook/test';

import { Button } from './Button';
import type { ButtonSize, ButtonVariant } from './Button';

const PlusIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M8 3v10M3 8h10" />
  </svg>
);

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    // Scoped opt-in: the global preview stays on 'todo' so the Example/*
    // scaffold, which predates these tokens, is not gated.
    a11y: { test: 'error' },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
      description: "Figma calls this `type`; renamed to avoid `<button type>`.",
    },
    size: { control: 'inline-radio', options: ['sm', 'lg'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    startIcon: { control: false },
    endIcon: { control: false },
    children: { control: 'text' },
  },
  args: {
    children: 'Button',
    startIcon: <PlusIcon />,
    endIcon: <PlusIcon />,
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: 'primary' },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Button' });

    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/** Keyboard users must be able to reach and activate the button. */
export const KeyboardActivation: Story = {
  tags: ['!autodocs'],
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Button' });

    await userEvent.tab();
    await expect(button).toHaveFocus();
    // The ring is :focus-visible only, so keyboard focus must match it.
    await expect(button.matches(':focus-visible')).toBe(true);

    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const Secondary: Story = { args: { variant: 'secondary' } };

export const Ghost: Story = { args: { variant: 'ghost' } };

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button {...args} size="sm" />
      <Button {...args} size="lg" />
    </div>
  ),
};

export const NoIcons: Story = {
  args: { startIcon: undefined, endIcon: undefined },
};

export const LeadingIconOnly: Story = { args: { endIcon: undefined } };

export const IconOnly: Story = {
  args: {
    children: undefined,
    endIcon: undefined,
    'aria-label': 'Add item',
  },
  play: async ({ canvasElement }) => {
    // No visible text, so the name has to come from aria-label. Without one
    // this is the axe "Buttons must have discernible text" failure.
    const button = within(canvasElement).getByRole('button', { name: 'Add item' });
    await expect(button).toHaveAccessibleName('Add item');
  },
};

export const Loading: Story = {
  args: { loading: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    /*
     * Regression test. The loading state collapses the button to a circle;
     * an earlier implementation did that with `display: none`, which removed
     * the label from the accessibility tree and reduced the accessible name
     * to just "Loading" -- the user could no longer tell which action was in
     * flight. getByRole computes the accessible name, so this query fails if
     * the label is ever dropped again.
     */
    const button = canvas.getByRole('button', { name: /Button/ });
    await expect(button).toHaveAccessibleName('Button Loading');
    await expect(button).toHaveAttribute('aria-busy', 'true');

    // Busy, not unavailable: focus must survive so keyboard users are not
    // dumped back to the top of the document mid-request.
    await expect(button).not.toBeDisabled();
    button.focus();
    await expect(button).toHaveFocus();

    // Pointer events are blocked in CSS...
    await expect(button).toHaveStyle({ pointerEvents: 'none' });
    // ...and activation is blocked in the handler, covering keyboard too.
    button.click();
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Button' });

    // Genuinely disabled, unlike `loading` -- the real attribute is what
    // reliably blocks clicks, form submission and keyboard activation.
    await expect(button).toBeDisabled();
    button.click();
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

/** A long label truncates rather than wrapping and breaking the pill. */
export const LongLabel: Story = {
  args: { children: 'Deploy to the production environment immediately' },
  parameters: { layout: 'padded' },
  decorators: [
    (StoryFn) => (
      <div style={{ inlineSize: 260 }}>
        <StoryFn />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button');
    const label = canvasElement.querySelector('.btn__label')!;

    // Stays one line at its natural height rather than wrapping...
    await expect(button.getBoundingClientRect().height).toBe(37);
    // ...does not overflow its 260px container...
    await expect(button.getBoundingClientRect().width).toBeLessThanOrEqual(260);
    // ...and the overflowing text is clipped, not laid out.
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
  },
};

export const FullWidth: Story = {
  args: { fullWidth: true },
  parameters: { layout: 'padded' },
};

const VARIANTS = ['primary', 'secondary', 'ghost'] as const satisfies
  readonly ButtonVariant[];
const SIZES = ['sm', 'lg'] as const satisfies readonly ButtonSize[];

// Row order and names follow the Figma `state` property.
const ROWS = [
  { label: 'default', props: {} },
  { label: 'hover', props: { 'data-force-state': 'hover' } },
  { label: 'focused', props: { 'data-force-state': 'focused' } },
  { label: 'clicked', props: { 'data-force-state': 'clicked' } },
  { label: 'disabled', props: { disabled: true } },
  { label: 'loading', props: { loading: true } },
] as const;

const headingStyle = {
  font: '600 12px var(--font-sans)',
  color: 'var(--color-on-surface)',
} as const;

const Matrix = ({ args }: { args: Story['args'] }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `max-content repeat(${VARIANTS.length * SIZES.length}, max-content)`,
      gap: 16,
      alignItems: 'center',
      justifyContent: 'start',
    }}
  >
    <span />
    {VARIANTS.flatMap((variant) =>
      SIZES.map((size) => (
        <span key={`${variant}-${size}`} style={headingStyle}>
          {variant} / {size}
        </span>
      )),
    )}

    {ROWS.map((row) => (
      <Fragment key={row.label}>
        <span style={headingStyle}>{row.label}</span>
        {VARIANTS.flatMap((variant) =>
          SIZES.map((size) => (
            <Button
              key={`${row.label}-${variant}-${size}`}
              {...args}
              {...row.props}
              variant={variant}
              size={size}
            />
          )),
        )}
      </Fragment>
    ))}
  </div>
);

/**
 * The full matrix from the design sheet: every variant x size across every
 * state. hover / focused / clicked are forced via `data-force-state` so the
 * grid renders statically and snapshots deterministically.
 */
export const AllVariants: Story = {
  name: 'All variants (design sheet)',
  parameters: { layout: 'fullscreen', controls: { disable: true } },
  render: (args) => (
    <div style={{ padding: 32, background: 'var(--color-surface)' }}>
      <Matrix args={args} />
    </div>
  ),
};

/**
 * Both brands at once. Swapping brand re-points four accent tokens and nothing
 * else -- the component has no brand prop and no brand-specific CSS.
 * Use the Brand toolbar control to apply one across every other story.
 */
export const Brands: Story = {
  name: 'Brands (default / Dispatch)',
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    a11y: {
      /*
       * KNOWN DEFECT -- waived here, not fixed, because the green ramp is
       * owned by design rather than by this repo.
       *
       * The Dispatch palette fails WCAG AA contrast:
       *   green-500 #008E65 on white ............ 4.15:1  (needs 4.5:1)
       *   green-400 #33A584 on green-50 #E6F4F0 . 2.70:1  (hover / clicked)
       *
       * This is the only story that renders the Dispatch brand, so the
       * waiver is scoped to it. Every other axe rule still runs here, and
       * colour-contrast still runs on every other story -- a contrast
       * regression in the default brand will still fail the build.
       *
       * Remove this block once green-500 is darkened (~#00875F clears 4.5:1
       * on white) and the wash pairing is re-specified.
       */
      config: { rules: [{ id: 'color-contrast', enabled: false }] },
    },
  },
  globals: { brand: 'default' },
  render: (args) => (
    <div
      style={{
        display: 'grid',
        gap: 40,
        padding: 32,
        background: 'var(--color-surface)',
      }}
    >
      {(['default', 'dispatch'] as const).map((brand) => (
        <section key={brand} data-brand={brand} style={{ display: 'grid', gap: 16 }}>
          <h2 style={{ ...headingStyle, margin: 0, textTransform: 'capitalize' }}>
            {brand === 'default' ? 'Default (blue)' : 'Dispatch (green)'}
          </h2>
          <Matrix args={args} />
        </section>
      ))}
    </div>
  ),
};
