import 'server-only';
import { PROVIDER_HOSTS } from '@/server/env';

export const EXAMPLE_ALLOWED_HOSTS: readonly string[] = PROVIDER_HOSTS.example;
export const SIGNATURE_HEADER = 'x-example-signature';
export const TIMESTAMP_HEADER = 'x-example-timestamp';
