import { Fragment } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { fn } from 'storybook/test';

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

export const Primary: Story = { args: { variant: 'primary' } };

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
};

export const Loading: Story = { args: { loading: true, 'aria-label': 'Add item' } };

export const Disabled: Story = { args: { disabled: true } };

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
  { label: 'loading', props: { loading: true, 'aria-label': 'Loading' } },
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
  parameters: { layout: 'fullscreen', controls: { disable: true } },
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
