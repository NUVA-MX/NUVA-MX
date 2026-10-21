# Open questions for the in-stock supplier

Status: **on hold** — the client is the contact with the supplier and is unavailable for now (2026-09-30).
Ask these when the API key is handed over. The answers decide the remaining in-stock work.

| # | Question | Why it matters |
|---|---|---|
| 1 | **IP allowlisting:** must calls come from fixed IPs? | Vercel only offers static egress IPs as a paid add-on. Biggest possible cost surprise. |
| 2 | **Money flow:** does the shopper pay our client (who then pays the supplier), or does the supplier charge the shopper directly? | If our client collects payment, we also need a payment provider (Mercado Pago / Stripe) and its webhooks. |
| 3 | **Keys:** is there a sandbox key separate from production? Can keys be rotated? Do they support spending limits? | Sandbox lets us build and test without real orders. Rotation and limits cap the damage of a leak. |
| 4 | **Webhooks:** do they send order-status webhooks? How are they signed (HMAC? header names? timestamp?) | Our inbound webhook route verifies signatures and blocks replays; we need their exact scheme. |
| 5 | **Contract security terms:** required log retention, audits, breach-notification deadline, data they forbid us to store? | Sets audit-log retention, what we store, and our incident process. |

## Also useful to get with the key
- API docs (base URL/hostnames, auth header format, rate limits, error codes, idempotency support).
- Catalog access: do we pull products from them (and how often), or keep our own copy?
- Order lifecycle: statuses, cancellation/refund rules, shipping info returned.

## Work already ready for when answers arrive
The integrations layer (`src/server/integrations/`, see `docs/INTEGRATIONS.md`) already provides: server-only keys,
host allowlist, timeouts/retries/circuit breaker, idempotent calls, signed + replay-protected webhooks, rate limits and
audit trail. Still to build once the flow is known: server-side price/stock revalidation, checkout bot protection,
order caps + kill switch, orders table and statuses, and payments (depends on question 2).
