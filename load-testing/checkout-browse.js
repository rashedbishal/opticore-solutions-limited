import http from 'k6/http';
import { check, sleep } from 'k6';
import { loginAsUser } from './lib/auth.js';

// Tier A: safe, read-heavy. No real orders/transactions are created — this
// only exercises the checkout page render and the exchange-rate endpoint
// (Redis-cached 6h, so only the first hit per cache window is a real
// upstream call to exchangerate-api.com).
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const TEST_USER_EMAIL = __ENV.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD;

export const options = {
    vus: Number(__ENV.VUS || 10),
    duration: __ENV.DURATION || '30s',
};

export function setup() {
    if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
        throw new Error('Set TEST_USER_EMAIL and TEST_USER_PASSWORD to a real, non-production test account — see README.md.');
    }

    return loginAsUser(BASE_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD);
}

export default function (data) {
    const headers = { Cookie: data.cookieHeader };

    const checkoutRes = http.get(
        `${BASE_URL}/checkout?` +
            'service=Web+Development&plan=Standard&price=%24100&delivery=3+Days' +
            '&category=video-editing&subcategory=wedding-video-editing&subcategory_id=21',
        { headers },
    );

    check(checkoutRes, { 'checkout page renders (200)': (r) => r.status === 200 });

    const rateRes = http.get(`${BASE_URL}/checkout/exchange-rate`, { headers });

    check(rateRes, {
        'exchange-rate endpoint responds (200)': (r) => r.status === 200,
        'exchange-rate returns a numeric rate': (r) => {
            try {
                return typeof JSON.parse(r.body).rate === 'number' || JSON.parse(r.body).rate === null;
            } catch {
                return false;
            }
        },
    });

    sleep(1);
}
