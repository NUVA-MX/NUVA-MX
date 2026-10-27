# Plugging in a real provider

The integrations layer lives in `src/server/integrations/`. App code imports only from `@/server/integrations`
(ESLint blocks deep imports into `core/*` and `providers/*`). You never edit `core/*` to add a provider.
`providers/example` is a complete reference implementation.

## Steps

1. **Env schema** (`src/server/env/schema.ts`): add `INTEGRATION_<NAME>_ENABLED`, `_API_KEY`, `_WEBHOOK_SECRET`,
   `_BASE_URL` (same rules as `example`: key and secret required when enabled, secret min 32 chars, base URL https and
   on the allowlist). Add the host to `PROVIDER_HOSTS`. Add the secret names to `src/server/env/secrets.json`
   (this also feeds log redaction and the bundle scan). Extend `Env` and the unit tests.
2. **Provider folder** `src/server/integrations/providers/<name>/`:
   - `schemas.ts`: zod schemas for every request, response and webhook body.
   - `client.ts`: `create<Name>Client({ http, env })` returning typed methods. All calls go through
     `http.request({ provider, method, url, schema, ... })`. Never call `fetch` (lint forbids it outside `core/http-client.ts`).
     For money-moving POSTs always pass an `idempotencyKey`; without one the call is never retried.
   - `webhook.ts`: `verify(raw, headers, env)` using `verifyHmacSignature` (HMAC-SHA256 over `${timestamp}.${rawBody}`,
     5 minute tolerance). Throw `IntegrationError('signature' | 'replay' | 'parse')`.
   - `index.ts`: export a `ProviderDefinition` (`name`, `allowedHosts`, `isEnabled(env)`, `createClient`, `webhook`).
3. **Register** it in `src/server/integrations/providers/index.ts` (the only registration point).
4. **Use it** from server code: `getIntegrationClient<YourClient>('<name>')` (returns `null` when disabled or incomplete).
   Do not add public routes that trigger outbound calls; call the client from authenticated server actions or jobs.
5. **Tests**: inject `fetchImpl` into `createHttpClient` (no HTTP mocking library). Cover success, bad response shape,
   retry behavior and webhook verification (valid, bad signature, stale timestamp, replay).

## Environment variables (Vercel)

- Naming: `INTEGRATION_<NAME>_*`.
- Mark every non-public variable **Sensitive** in Vercel and use separate values for Development, Preview and Production.
- Never use `NEXT_PUBLIC_*` for secrets. Only `NEXT_PUBLIC_SITE_URL` is allowed (enforced by `parseEnv` and `check:bundle`).
- An invalid or incomplete configuration stops the server at boot (`src/instrumentation.ts`), naming variables, never values.

## Allowlist

`allowedHosts` are exact hostnames. The http-client requires https, no credentials in the URL, no IP literals,
port 443 (unless the entry is written `host:port`), no redirects, a 1 MB response cap and an 8 s default timeout.

## Key rotation

Both `INTEGRATION_<NAME>_API_KEY` and `_API_KEY_NEXT` (and `_WEBHOOK_SECRET` / `_WEBHOOK_SECRET_NEXT`) are supported.
1. Set `_NEXT` to the new value and deploy (webhook verification accepts either secret).
2. Switch the provider to the new key, then move the new value into the primary variable.
3. Remove `_NEXT` and revoke the old key at the provider.
Outbound calls use the primary key; your `client.ts` may fall back to `_NEXT` if the provider requires it.

## Webhook checklist

- [ ] Signature over timestamp + raw body, constant-time compare (`verifyHmacSignature`).
- [ ] Reject stale/future timestamps (> 300 s).
- [ ] Stable event id in the body (used for dedupe in `webhook_events`).
- [ ] Handler is quick and idempotent; throw to get a provider retry (the dedupe claim is released on failure).
- [ ] Generic 401 for every verification failure; no details leak.
- [ ] Route is `POST /api/webhooks/<name>`: 256 KB cap, JSON only, 120 requests/min/IP.
- [ ] Unknown or disabled providers return the same 404 as any missing route.

## Innovation Line catalog (supplier, read-only)

Pulls the supplier catalog into Postgres (`supplier_products`, `supplier_sync_runs`); visitors only ever read the
stored copy (`/api/catalog*`), never the supplier. Prices are not shown: the cost is kept server-side
(`cost_cents`) and `publicPrice()` in `src/server/catalog/public.ts` returns `null`.

- **Variables**: `INTEGRATION_INNOVATION_ENABLED`, `_API_KEY` (header `auth-token`), `_API_KEY_NEXT`, `_USER`,
  `_PASSWORD` (the supplier's Clave), `INTEGRATION_INNOVATION_CATALOG_PUBLIC`, `INTEGRATION_INNOVATION_IGNORE_WINDOW`
  (non-production only), and `CRON_SECRET` (min 32 chars, required in production when enabled). All secrets are
  Sensitive in Vercel and listed in `src/server/env/secrets.json` (redaction and bundle scan).
- **Query windows**: the supplier only allows queries 09:00-10:00, 13:00-14:00 and 17:00-18:00 Mexico City time.
  `vercel.json` runs one daily cron (`0 15 * * *` UTC = 09:00); on a Pro plan add `0 19 * * *` and `0 23 * * *`.
  The admin "Sincronizar ahora" button is window-guarded too. Limits: 60 calls/minute and 1000/hour.
- **Safety**: one run at a time (partial unique index; a run stuck for 10 minutes is recovered), a run that returns
  less than 80% of the previous active products (or fewer than 100) changes nothing and fails, and any failure keeps
  the previous snapshot. Rows are validated and sanitized one by one; images must come from the exact supplier host.
- **Pacing**: at least 5 minutes between runs (`cooldown`), a 50 s budget per run (the run fails and frees the lock itself), and the run aborts if the window closes mid-run.
- **Run time**: a full sync is about 17 calls: colors ~1 s, stock list ~7.6 s, 15 product pages ~2 s each, so ~39 s. Call starts are spaced at
  least 1.1 s apart (60/min limit) measured from the previous start, the budget is 52 s (about 25% slack) and `maxDuration` is 60. If the
  supplier gets slower, the run fails with `budget` (snapshot kept, lock released); the next step then is fetching the stock list and the
  pages concurrently (2-3 at once is still within 60/min).
- **Images and quota (known residual)**: stored and public image URLs have a single spelling (no query, fragment, percent-encoding or dot
  segments). `remotePatterns` in Next 16.3.6 does not look at the fragment and matches the path without decoding, so someone calling
  `/_next/image` directly with `#N` or encoded spellings can still create new optimizer cache keys for real supplier files (quota burn, not data
  exposure). Options, none applied: Vercel Spend Management / usage limits and alerts, a long `images.minimumCacheTTL` (already 31 days),
  or `images.unoptimized` (or a custom loader) which removes the optimizer but needs the supplier host added to CSP `img-src`.
- **Prices (off by default)**: the supplier price is the base cost plus 11.11% (base / 0.9); the customer price is 30% over the BASE cost, i.e. price x factor with default 1.17 = 1.30 x 0.9 (127.55 -> 149.23),
  one price per product, rounded to cents. To show prices: in Vercel set `INTEGRATION_INNOVATION_SHOW_PRICES=true` on Production (optionally
  `INTEGRATION_INNOVATION_PRICE_FACTOR`, 1 to 3) and redeploy. Set it back to `false` (or remove it) and redeploy to hide them. The cost never
  appears in any response; cart lines and the WhatsApp message still say "precio por confirmar".
- **Kill switches**: `INTEGRATION_INNOVATION_ENABLED=false` stops syncing (the stored catalog keeps being served);
  `INTEGRATION_INNOVATION_CATALOG_PUBLIC=false` hides the public section.
- **Rotation**: set `_API_KEY_NEXT`; on an auth failure the sync retries once with it. Then swap and remove `_NEXT`.
- **First sync**: run `npm run db:migrate`, set the variables, then call the cron route with
  `Authorization: Bearer $CRON_SECRET` (inside a window) or use the admin page `/admin/catalogo`. For local tests
  set `INTEGRATION_INNOVATION_IGNORE_WINDOW=true` (never in production).
- The GetAllColores URL path is not in the supplier manual; confirm it before the first real sync
  (`ENDPOINTS.colors` in `providers/innovation/constants.ts`).
