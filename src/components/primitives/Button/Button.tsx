import Link from 'next/link';
import type { MouseEventHandler, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { Icon, type IconName } from '../Icon';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost-inverse' | 'light';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconPosition?: 'start' | 'end';
  /** Icon-only buttons must pass ariaLabel. */
  ariaLabel?: string;
  block?: boolean;
  className?: string;
  children?: ReactNode;
};

type LinkProps = Common & {
  href: string;
  external?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  ariaCurrent?: 'page';
};

type ActionProps = Common & {
  href?: undefined;
  type?: 'button' | 'submit' | 'reset';
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
  ariaControls?: string;
  ariaHaspopup?: 'dialog';
};

export type ButtonProps = LinkProps | ActionProps;

function isInternal(href: string) {
  return href.startsWith('/') && !href.startsWith('//');
}

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', icon, iconPosition = 'start', ariaLabel, block, className, children } = props;
  const classes = cx(
    styles.root,
    styles[variant],
    styles[size],
    block && styles.block,
    !children && styles.iconOnly,
    className,
  );
  const content = (
    <>
      {icon && iconPosition === 'start' && <Icon name={icon} />}
      {children}
      {icon && iconPosition === 'end' && <Icon name={icon} />}
    </>
  );

  if (props.href !== undefined) {
    const { href, external, onClick, ariaCurrent } = props;
    if (isInternal(href) && !external) {
      return (
        <Link href={href} className={classes} aria-label={ariaLabel} onClick={onClick} aria-current={ariaCurrent}>
          {content}
        </Link>
      );
    }
    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        onClick={onClick}
        aria-current={ariaCurrent}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {content}
      </a>
    );
  }

  const { type = 'button', onClick, disabled, ariaPressed, ariaExpanded, ariaControls, ariaHaspopup } = props;
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-haspopup={ariaHaspopup}
    >
      {content}
    </button>
  );
}
