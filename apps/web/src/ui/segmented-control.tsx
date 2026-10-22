import { useId } from 'react';
import styles from './segmented-control.module.css';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  /** Accessible name of the group, e.g. "Input mode". */
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Two or three exclusive options in a soft pill (handwrite.html Draw / Describe). Built on native
 * radio inputs, so arrow keys move the selection and Tab enters and leaves the group.
 */
export function SegmentedControl<T extends string>(props: SegmentedControlProps<T>) {
  const { label, options, value, onChange } = props;
  const name = useId();
  return (
    <fieldset className={styles.group}>
      <legend className="visually-hidden">{label}</legend>
      {options.map((option) => (
        <label key={option.value} className={styles.option}>
          <input
            className={styles.input}
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
