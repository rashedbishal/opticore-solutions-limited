import http from 'k6/http';
import { check } from 'k6';

// k6's `open()` reads the file at init time (this is the standard, version-
// safe way to load local fixture data in k6 — plain `import ... from
// './x.json'` support varies by k6 version, open()+JSON.parse() doesn't).
const payload = JSON.parse(open('./fixtures/sample-ipn-payload.json'));

// Tier B: this is the test that specifically re-creates the exact bug fixed
// in SslCommerzPaymentController — SSLCommerz's browser-redirect success()
// call and its server-to-server ipn() webhook firing near-simultaneously for
// the same transaction, both reading status "Pending" before either writes
// "Processing". claimOrderForProcessing() makes that transition a single
// atomic conditional UPDATE, so exactly one of any number of concurrent
// callers should ever "win" and process the payment.
//
// /ipn is the cleaner endpoint to test this against (vs. /success): the
// winner responds with body "IPN OK" and every loser with "ALREADY
// PROCESSED" — a directly assertable signal that /success's redirect-based
// response doesn't give you.
//
// This requires a REAL, valid IPN payload (see README.md: "Capturing a
// real callback payload") and the matching `orders`/`transactions` row
// reset to status "Pending" before every run — replaying stale/fabricated
// values will just fail SSLCommerz's own orderValidate() check and every
// request will get "SIGNATURE MISMATCH" instead of exercising the race.
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const CONCURRENCY = Number(__ENV.CONCURRENCY || 10);

export const options = { vus: 1, iterations: 1 };

export default function () {
    const requests = Array.from({ length: CONCURRENCY }, () => ({
        method: 'POST',
        url: `${BASE_URL}/ipn`,
        body: payload,
        params: { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    }));

    // http.batch fires every request concurrently from this single
    // iteration and waits for all responses — the closest k6 gets to
    // literally simultaneous requests, which is what this race depends on.
    const responses = http.batch(requests);

    const wonClaim = responses.filter((r) => r.body === 'IPN OK').length;
    const alreadyProcessed = responses.filter((r) => r.body === 'ALREADY PROCESSED').length;
    const serverErrors = responses.filter((r) => r.status >= 500).length;
    const other = responses.filter(
        (r) => r.body !== 'IPN OK' && r.body !== 'ALREADY PROCESSED' && r.status < 500,
    );

    console.log(
        `Fired ${CONCURRENCY} concurrent /ipn calls for the same transaction — ` +
            `IPN OK: ${wonClaim}, ALREADY PROCESSED: ${alreadyProcessed}, 5xx: ${serverErrors}, other: ${other.length}`,
    );

    if (other.length > 0) {
        console.log(`Unexpected response bodies: ${other.map((r) => `${r.status} ${r.body}`).join(' | ')}`);
    }

    check(null, {
        'exactly one request won the processing claim': () => wonClaim === 1,
        'every other request was told it was already processed': () => alreadyProcessed === CONCURRENCY - 1,
        'no server errors under concurrency': () => serverErrors === 0,
    });
}
