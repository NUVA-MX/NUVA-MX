import type { SectionKey } from './encargo-schema';

export type TextFieldSpec = {
  kind: 'text' | 'textarea' | 'date';
  name: string;
  label: string;
  /** What the input shows: the override, or the default when not overridden. */
  value: string;
  /** Default shown in the "Predeterminado" hint; null when there is no text default (promo fields). */
  defaultValue: string | null;
  overridden: boolean;
  /** Path for the restore action. */
  restore: string;
  maxLength: number;
  hint?: string;
};
export type CheckboxFieldSpec = { kind: 'checkbox'; name: string; label: string; checked: boolean; overridden: boolean; restore: string };
export type ImageFieldSpec = {
  kind: 'image';
  /** Prefix of the form fields: `<name>.url` and `<name>.alt`. */
  name: string;
  label: string;
  url: string;
  alt: string;
  overridden: boolean;
  restore: string;
  ratio: string;
  /** Decorative image: no alt field in the form, nothing but the url is stored. */
  decorative?: boolean;
};
export type HeadingSpec = { kind: 'heading'; label: string };
export type FieldSpec = TextFieldSpec | CheckboxFieldSpec | ImageFieldSpec | HeadingSpec;

export type SectionSpec = {
  key: SectionKey;
  title: string;
  fields: FieldSpec[];
  notes: string[];
  /** True when the section has any stored override (enables "Restaurar sección"). */
  overridden: boolean;
};
