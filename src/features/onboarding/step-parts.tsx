import { type ReactNode, useId } from 'react';
import styles from './wizard.module.css';

/** A step's title; the wizard moves focus to it when the step opens. */
export function StepHeading({ children }: { children: ReactNode }) {
  return (
    <h1 className={styles.heading} tabIndex={-1} data-step-heading="">
      {children}
    </h1>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className={styles.lead}>{children}</p>;
}

export function Note({ children, alert }: { children: ReactNode; alert?: boolean }) {
  return (
    <p className={styles.note} role={alert ? 'alert' : undefined}>
      {children}
    </p>
  );
}

export interface CardOption<T extends string> {
  value: T;
  title: ReactNode;
  hint?: ReactNode;
}

interface CardsProps<T extends string> {
  /** The group's name, read out with each card. */
  label: string;
  options: readonly CardOption<T>[];
  value: T;
  /** Only selects: moving on is the Next button's job (P5). */
  onChange: (value: T) => void;
}

/** Exclusive options as tall cards on native radios (arrow keys move, Tab leaves). */
export function ChoiceCards<T extends string>({ label, options, value, onChange }: CardsProps<T>) {
  const name = useId();
  return (
    <fieldset className={styles.cards}>
      <legend className="visually-hidden">{label}</legend>
      {options.map((option) => (
        <label key={option.value} className={styles.card}>
          <input
            className={styles.radio}
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
          />
          <span className={styles.cardTitle}>{option.title}</span>
          {option.hint !== undefined && <span className={styles.cardHint}>{option.hint}</span>}
        </label>
      ))}
    </fieldset>
  );
}
