import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type ButtonSize = 'lg' | 'md' | 'sm';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeading?: ReactNode;
  iconTrailing?: ReactNode;
  children: ReactNode;
}

/** Design spec §6.12. */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeading,
  iconTrailing,
  children,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={[styles.button, styles[variant], styles[size], loading ? styles.loading : '', className]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      <span className={styles.content}>
        {iconLeading}
        {children}
        {iconTrailing}
      </span>
      {loading && (
        // Decorative only — aria-busy on the button already communicates the
        // loading state; a separate label here would concatenate into the
        // button's accessible name alongside its (visually hidden) text.
        <span className={styles.spinner} aria-hidden="true">
          <span className={styles.spinnerRing} />
        </span>
      )}
    </button>
  );
}
