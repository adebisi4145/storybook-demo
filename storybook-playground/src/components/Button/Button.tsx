import type { ComponentPropsWithRef, ReactNode } from 'react';

import './Button.css';

/**
 * Figma calls this property `type`. In React that name is taken by the native
 * `<button type>` attribute (button / submit / reset), which this component
 * forwards, so the prop is `variant` here.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

/**
 * The two sizes on the design sheet: 37px and 45px tall. They differ only in
 * block padding -- type scale, icon size, inline padding and radius are shared.
 */
export type ButtonSize = 'sm' | 'lg';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  /** Visual emphasis. Maps to Figma's `type`. */
  variant?: ButtonVariant;
  /** Control height. */
  size?: ButtonSize;
  /** Decorative icon before the label. Rendered `aria-hidden`. */
  startIcon?: ReactNode;
  /** Decorative icon after the label. Rendered `aria-hidden`. */
  endIcon?: ReactNode;
  /**
   * Collapses the button to a spinner-only circle and blocks activation.
   * Unlike `disabled`, the button stays focusable so keyboard focus is not
   * lost mid-action.
   */
  loading?: boolean;
  /** Screen-reader text announced while `loading`. */
  loadingLabel?: string;
  /** Stretch to fill the container's inline size. */
  fullWidth?: boolean;
}

// Not exported: a non-component export from a .tsx trips react-refresh.
const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

/**
 * The standard action control.
 *
 * An icon-only Button (icons but no `children`) has no text to announce, so
 * it needs an `aria-label` or `aria-labelledby`. Development builds warn when
 * one is missing.
 */
export function Button({
  variant = 'primary',
  size = 'sm',
  startIcon,
  endIcon,
  loading = false,
  loadingLabel = 'Loading',
  fullWidth = false,
  disabled = false,
  type = 'button',
  className,
  children,
  onClick,
  ...rest
}: ButtonProps) {
  const iconOnly = children == null && (startIcon != null || endIcon != null);

  if (
    import.meta.env.DEV &&
    (iconOnly || loading) &&
    rest['aria-label'] == null &&
    rest['aria-labelledby'] == null &&
    children == null
  ) {
    console.warn(
      '[Button] An icon-only Button has no accessible name. Pass `aria-label` (or `aria-labelledby`).',
    );
  }

  return (
    <button
      {...rest}
      type={type}
      className={cx(
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        fullWidth && 'btn--full-width',
        loading && 'btn--loading',
        iconOnly && 'btn--icon-only',
        className,
      )}
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={(event) => {
        if (loading) {
          // preventDefault also stops an implicit type="submit".
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onClick?.(event);
      }}
    >
      <span className="btn__content">
        {startIcon != null && (
          <span className="btn__icon" aria-hidden="true">
            {startIcon}
          </span>
        )}
        {children != null && <span className="btn__label">{children}</span>}
        {endIcon != null && (
          <span className="btn__icon" aria-hidden="true">
            {endIcon}
          </span>
        )}
      </span>
      {loading && (
        <>
          <span className="btn__spinner" aria-hidden="true" />
          <span className="sb-visually-hidden">{loadingLabel}</span>
        </>
      )}
    </button>
  );
}
