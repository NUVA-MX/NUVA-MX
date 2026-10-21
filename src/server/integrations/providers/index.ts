import 'server-only';
import type { AnyProvider } from '../core/registry';
import { exampleProvider } from './example';

/** Register new providers here (and nowhere else). */
export const providers: readonly AnyProvider[] = [exampleProvider];
