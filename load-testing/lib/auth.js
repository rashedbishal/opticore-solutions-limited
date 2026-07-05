import http from 'k6/http';
import { check } from 'k6';

function extractCsrfToken(html) {
    const match = html.match(/<meta name="csrf-token" content="([^"]+)"/);

    return match ? match[1] : null;
}

/**
 * Logs in once and returns a session cookie header + CSRF token for every VU
 * to reuse. Do NOT call this per-VU/per-iteration: /login is throttled to
 * 5/min per email+IP and 10/hour per account (see
 * AppServiceProvider::configureRateLimiters()), so anything beyond a single
 * shared login trips the rate limiter almost immediately under load.
 *
 * k6 gives setup() its own cookie jar that isn't shared with the VUs running
 * the default function, so the raw Set-Cookie values are extracted here and
 * must be attached manually as a `Cookie` header in every subsequent
 * request each VU makes.
 */
export function loginAsUser(baseUrl, email, password) {
    const loginPage = http.get(`${baseUrl}/login`);
    const csrfToken = extractCsrfToken(loginPage.body);

    if (!csrfToken) {
        throw new Error(
            `Could not find the CSRF meta tag on ${baseUrl}/login — is the app reachable and is BASE_URL correct?`,
        );
    }

    const loginRes = http.post(
        `${baseUrl}/login`,
        { email, password, _token: csrfToken },
        { redirects: 0 },
    );

    check(loginRes, {
        'login redirected (session established)': (r) => r.status === 302 || r.status === 303,
    });

    if (loginRes.status !== 302 && loginRes.status !== 303) {
        throw new Error(
            `Login did not redirect (got ${loginRes.status}) — check TEST_USER_EMAIL/TEST_USER_PASSWORD are correct and the account exists.`,
        );
    }

    const cookies = loginRes.cookies;
    const cookieHeader = Object.keys(cookies)
        .map((name) => `${name}=${cookies[name][0].value}`)
        .join('; ');

    // Re-fetch a page as the now-authenticated session to get a CSRF token
    // tied to it, rather than reusing the pre-login one.
    const authedPage = http.get(`${baseUrl}/dashboard`, { headers: { Cookie: cookieHeader } });
    const freshCsrf = extractCsrfToken(authedPage.body) ?? csrfToken;

    return { cookieHeader, csrfToken: freshCsrf };
}
