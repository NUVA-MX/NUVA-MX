// Validates the environment at build time (runs as `prebuild`), so a misconfigured Vercel deployment
// fails its build instead of going live and answering 500. Prints variable names only, never values.
// Run with `--conditions=react-server` so the schema's `server-only` import resolves outside Next.
import { loadEnvConfig } from '@next/env';
import { deployRequirements, parseEnv } from '../src/server/env/schema';

// Load .env* files exactly as `next build` will, so local builds check the same values.
loadEnvConfig(process.cwd(), false, { info: () => undefined, error: console.error });

const result = parseEnv(process.env);
if (!result.ok) {
  console.error('[check:env] Invalid environment configuration:');
  for (const e of result.errors) console.error(` - ${e}`);
  process.exit(1);
}

const { errors, warnings } = deployRequirements(result.env);
for (const w of warnings) console.warn(`[check:env] warning: ${w}`);
if (errors.length > 0) {
  console.error(`[check:env] Missing configuration for VERCEL_ENV=${result.env.vercelEnv}:`);
  for (const e of errors) console.error(` - ${e}`);
  process.exit(1);
}
console.log(`[check:env] OK (${result.env.vercelEnv ?? 'local'})`);
