import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cx } from './cx.ts';
import { ArrowIcon } from './icons.tsx';
import styles from './pill-button.module.css';

export type PillVariant = 'primary' | 'secondary' | 'text';

interface PillLook {
  /** primary: the filled next step · secondary: tonal · text: accent text, no fill. */
  variant?: PillVariant | undefined;
  /** The "Begin reading" style: label left, an arrow right (today.html). */
  arrow?: boolean | undefined;
  /** Full width of the container. */
  block?: boolean | undefined;
  /** Flex grow inside an `ActionRow`, e.g. 1.4 for the main action (compose.html). */
  grow?: number | undefined;
}

function pillClass({ variant = 'primary', arrow, block }: PillLook, className?: string) {
  return cx(
    styles.pill,
    styles[variant],
    arrow && styles.arrowed,
    block && styles.block,
    className,
  );
}

function Content({ arrow, children }: { arrow: boolean | undefined; children: ReactNode }) {
  return (
    <>
      {children}
      {arrow && (
        <span className={styles.arrow}>
          <ArrowIcon />
        </span>
      )}
    </>
  );
}

export type PillButtonProps = PillLook & ButtonHTMLAttributes<HTMLButtonElement>;

/** The 52px pill action (read.html "Next sentence", compose.html "Rewrite"). */
export function PillButton({ variant, arrow, block, grow, className, ...rest }: PillButtonProps) {
  const { children, type = 'button', style, ...props } = rest;
  const look = pillClass({ variant, arrow, block }, className);
  const flex = grow === undefined ? style : { ...style, flexGrow: grow };
  return (
    <button type={type} className={look} style={flex} {...props}>
      <Content arrow={arrow}>{children}</Content>
    </button>
  );
}

export type PillLinkProps = PillLook & LinkProps;

/** A pill that navigates (today.html "Begin reading", capture.html "Add to …"). */
export function PillLink(props: PillLinkProps) {
  const { variant, arrow, block, grow, className, children, style, ...rest } = props;
  const flex = grow === undefined ? style : { ...style, flexGrow: grow };
  return (
    <Link className={pillClass({ variant, arrow, block }, className)} style={flex} {...rest}>
      <Content arrow={arrow}>{children}</Content>
    </Link>
  );
}
