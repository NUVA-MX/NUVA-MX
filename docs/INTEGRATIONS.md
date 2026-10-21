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
