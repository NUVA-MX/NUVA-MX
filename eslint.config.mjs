import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// (a) Direct process.env reads are only allowed in the env module (NODE_ENV is always fine).
const processEnvRules = [
  {
    selector:
      "MemberExpression[object.object.name='process'][object.property.name='env'][computed=false]:not([property.name='NODE_ENV'])",
    message: 'Read env vars through @/server/env (getEnv / helpers), not process.env.',
  },
  {
    selector: "MemberExpression[object.object.name='process'][object.property.name='env'][computed=true]",
    message: 'Read env vars through @/server/env (getEnv / helpers), not process.env.',
  },
  {
    selector: "MemberExpression[object.name='process'][property.name='env']:not(MemberExpression > MemberExpression.object)",
    message: 'Do not pass or destructure process.env. Use @/server/env.',
  },
];

// (b) Outbound network calls only go through integrations/core/http-client.ts.
const fetchMessage = 'Outbound HTTP must go through the integrations http-client (src/server/integrations/core/http-client.ts).';

const fetchMemberRule = {
  selector: "MemberExpression[property.name='fetch'][object.name=/^(globalThis|global|window|self)$/]",
  message: fetchMessage,
};

const serverRestrictedImports = [
  {
    group: ['@/server/integrations/providers/*', '@/server/integrations/core/*'],
    message: 'Import the integrations layer only through @/server/integrations.',
  },
];

// (c) Client-side code must never import server modules.
const clientRestrictedImports = [
  ...serverRestrictedImports,
  {
    group: ['@/server', '@/server/*', '**/server/*', 'server-only'],
    message: 'Server modules must not be imported from client code.',
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'drizzle/**']),
  {
    files: ['**/*.{ts,tsx,mts,mjs,js}'],
    ignores: [
      'src/server/env/**',
      'next.config.ts',
      'instrumentation.ts',
      'src/instrumentation.ts',
      'scripts/**',
      'drizzle.config.ts',
      'vitest.config.mts',
    ],
    rules: { 'no-restricted-syntax': ['error', ...processEnvRules] },
  },
  {
    files: ['src/server/**/*.ts'],
    ignores: ['src/server/integrations/core/http-client.ts'],
    rules: { 'no-restricted-globals': ['error', { name: 'fetch', message: fetchMessage }] },
  },
  {
    files: ['src/server/**/*.ts'],
    ignores: ['src/server/integrations/core/http-client.ts', 'src/server/env/**'],
    rules: { 'no-restricted-syntax': ['error', ...processEnvRules, fetchMemberRule] },
  },
  {
    files: ['src/server/env/**/*.ts'],
    rules: { 'no-restricted-syntax': ['error', fetchMemberRule] },
  },
  {
    // Outside the integrations layer: no deep imports into providers/core.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/server/integrations/**'],
    rules: { 'no-restricted-imports': ['error', { patterns: serverRestrictedImports }] },
  },
  {
    // Client code (components, hooks, 'use client' modules): no server imports at all.
    files: [
      'src/components/**/*.{ts,tsx}',
      'src/lib/use*.{ts,tsx}',
      'src/lib/cart/**/*.{ts,tsx}',
      'src/app/dev/components/PatternsDemo.tsx',
    ],
    rules: { 'no-restricted-imports': ['error', { patterns: clientRestrictedImports }] },
  },
]);

export default eslintConfig;
