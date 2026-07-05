import { check, sleep } from 'k6';
import http from 'k6/http';
import { loginAsUser } from './lib/auth.js';

// Tier A, but data-creating: every successful iteration inserts a real
// `orders` + `transactions` row (status Pending) and calls the real
// SSLCommerz sandbox makePayment() API. Keep VUs/duration modest and only
// ever point this at local/staging — never production, and never a live
// (non-sandbox) SSLCommerz store.
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const TEST_USER_EMAIL = __ENV.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD;

// Must be a real PortfolioSubCategory id whose `plans` JSON column is
// populated — see README.md for how to find one in your own database.
const SUBCATEGORY_ID = __ENV.SUBCATEGORY_ID;
const PLAN = __ENV.PLAN || 'basic';
const CURRENCY = __ENV.CURRENCY || 'USD';

export const options = {
    vus: Number(__ENV.VUS || 5),
    duration: __ENV.DURATION || '20s',
};

export function setup() {
    if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
        throw new Error(
            'Set TEST_USER_EMAIL and TEST_USER_PASSWORD to a real, non-production test account — see README.md.',
        );
    }

    if (!SUBCATEGORY_ID) {
        throw new Error(
            'Set SUBCATEGORY_ID to a real PortfolioSubCategory id with a populated `plans` column — see README.md.',
        );
    }

    return loginAsUser(BASE_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD);
}

export default function (data) {
    const headers = {
        Cookie: data.cookieHeader,
        'X-CSRF-TOKEN': data.csrfToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };

    const cartJson = JSON.stringify({
        subcategory_id: Number(SUBCATEGORY_ID),
        plan: PLAN,
        currency: CURRENCY,
        category_id: __ENV.CATEGORY_SLUG || '',
        service: __ENV.SERVICE_NAME || 'Load Test Service',
        subcategory: __ENV.SUBCATEGORY_NAME || '',
        delivery: '3 Days',
    });

    const res = http.post(
        `${BASE_URL}/pay-via-ajax`,
        JSON.stringify({ cart_json: cartJson }),
        { headers },
    );

    check(res, {
        'pay-via-ajax did not error (5xx)': (r) => r.status < 500,
        'pay-via-ajax was not rate-limited (429)': (r) => r.status !== 429,
        'pay-via-ajax was not rejected as invalid (422)': (r) =>
            r.status !== 422,
    });

    sleep(1);
}
