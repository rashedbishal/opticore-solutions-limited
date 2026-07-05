# Load testing the payment flow

k6 scripts targeting the checkout/SSLCommerz pipeline. These are plain files
under this directory — nothing here changes any application code, route, or
config. k6 is a standalone binary, not an npm package, so nothing was added
to `package.json` either.

## ⚠️ Never point this at production

Run these against **local or a disposable staging environment only**.
Reasons:

- `order-creation.js` and `callback-race.js` create real `orders`/
  `transactions` rows and, for `order-creation.js`, call the real SSLCommerz
  sandbox `makePayment()` API — this is junk data you don't want in a
  production database.
- The login (`throttle:login`, 5/min per email+IP) and payment-callback
  (`throttle:payment-callback`, 60/min per IP) rate limiters are real and
  active in every environment — running against production risks locking
  out real users sharing your test IP, or getting your own requests
  throttled mid-test.
- `callback-race.js` replays a captured gateway callback — replaying real
  payment gateway data anywhere but a sandbox/test environment is not
  something you want to do.

## Installing k6

Not an npm dependency of this project — install it once, separately:

```bash
# macOS
brew install k6

# Debian/Ubuntu
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Or via Docker, no local install:
docker run --rm -i --network=host grafana/k6 run - < load-testing/checkout-browse.js
```

## One-time setup: a test user

All scripts need a real, logged-in `User` account (not an `Admin`). Use an
existing local dev account, or create one however you normally would
(register form, `php artisan tinker`, a factory) — this repo intentionally
isn't shipping a seeded test-user credential.

## Scripts

### 1. `checkout-browse.js` — safe, read-only

Hits `GET /checkout` and `GET /checkout/exchange-rate` under concurrent
virtual users. No orders are created.

```bash
k6 run load-testing/checkout-browse.js \
  -e BASE_URL=http://localhost:8000 \
  -e TEST_USER_EMAIL=test@example.com \
  -e TEST_USER_PASSWORD=password \
  -e VUS=20 -e DURATION=30s
```

### 2. `order-creation.js` — creates real Pending orders

Hits `POST /pay-via-ajax` concurrently. **Every successful iteration
creates a real `orders`/`transactions` row and calls the real SSLCommerz
sandbox API** — keep VUs/duration modest, and clean up test data afterward
if it matters to you.

Needs a real `PortfolioSubCategory` id with a populated `plans` column.
Find one:

```bash
php artisan tinker --execute="dd(App\Models\PortfolioSubCategory::whereNotNull('plans')->first(['id', 'plans']))"
```

```bash
k6 run load-testing/order-creation.js \
  -e BASE_URL=http://localhost:8000 \
  -e TEST_USER_EMAIL=test@example.com \
  -e TEST_USER_PASSWORD=password \
  -e SUBCATEGORY_ID=21 -e PLAN=basic -e CURRENCY=USD \
  -e VUS=5 -e DURATION=20s
```

### 3. `callback-race.js` — the actual race-condition regression test

This is the one that directly re-tests the exact bug fixed in
`SslCommerzPaymentController::claimOrderForProcessing()`: SSLCommerz calling
`/success` (browser redirect) and `/ipn` (webhook) near-simultaneously for
the same transaction. It fires N truly concurrent `POST /ipn` requests
carrying the _same_ transaction's callback data and asserts **exactly one**
gets back `"IPN OK"` (won the claim) and every other one gets
`"ALREADY PROCESSED"` — with zero 5xx errors.

This needs a real, valid captured IPN payload — SSLCommerz's own
`orderValidate()` call rejects fabricated field values, so you can't just
make one up.

#### Capturing a real callback payload

1. On a local/sandbox environment, go through a real SSLCommerz **sandbox**
   test payment on `/checkout` (SSLCommerz publishes sandbox test card
   numbers in their docs — any of those work; no real money moves in
   sandbox mode).
2. After paying, open your browser's DevTools → Network tab (or your
   server's access/application log) and find the `POST /ipn` (or `/success`)
   request SSLCommerz's servers actually sent. Copy every form field from
   its request body.
3. Copy `load-testing/fixtures/sample-ipn-payload.example.json` to
   `load-testing/fixtures/sample-ipn-payload.json` (git-ignored — this file
   contains real captured gateway data, never commit it) and fill in every
   `REPLACE_...` value with what you captured.

#### Resetting state between runs

`claimOrderForProcessing()` only proceeds while the order's status is
`Pending`. After a run, the transaction this payload belongs to will be
`Processing`. Reset it before re-running:

```sql
UPDATE orders SET status = 'Pending' WHERE transaction_id = 'YOUR_CAPTURED_TRAN_ID';
UPDATE transactions SET status = 'Pending', invoice_number = NULL WHERE transaction_id = 'YOUR_CAPTURED_TRAN_ID';
```

#### Running it

```bash
k6 run load-testing/callback-race.js \
  -e BASE_URL=http://localhost:8000 \
  -e CONCURRENCY=10
```

Read the console output: it prints how many of the N concurrent requests
got `IPN OK` vs `ALREADY PROCESSED` vs a server error. The k6 `checks`
summary at the end should show 100% pass — if `IPN OK` ever shows up more
than once, or a 5xx appears, the atomic-claim guarantee has regressed.

## Interpreting general load results (scripts 1 & 2)

k6's summary reports `http_req_duration` (p95/p99 response times) and
`http_req_failed` (error rate) per script. There's no fixed pass/fail
threshold baked into these scripts — decide what's acceptable for your own
infrastructure and traffic expectations, then treat a regression against
your own baseline as the signal, not a specific arbitrary number.
