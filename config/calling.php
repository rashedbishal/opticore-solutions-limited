<?php

/*
| WhatsApp calling in the browser (Lead Management Phase 5). Timings are
| the ones OptiFin settled on, each tied to a Meta behaviour.
*/

return [
    // Meta allows ~30–60 s to answer before "Not Answered"; 60 is the top.
    'ring_ttl_seconds' => (int) env('CALLING_RING_TTL_SECONDS', 60),

    // The caller's (encrypted) offer and our answer stay cached a little
    // longer than the ring so answering never races their expiry.
    'offer_ttl_seconds' => (int) env('CALLING_OFFER_TTL_SECONDS', 120),
    'answer_ttl_seconds' => (int) env('CALLING_ANSWER_TTL_SECONDS', 120),

    // Meta sends no ordering guarantee: a "terminate" that beats its
    // "connect" is remembered this long so the late connect can't ring.
    'tombstone_ttl_seconds' => (int) env('CALLING_TOMBSTONE_TTL_SECONDS', 600),

    // Meta retries webhooks for up to 7 days; a call already handled is
    // remembered that long so a retry can't recreate a deleted lead.
    'seen_ttl_seconds' => (int) env('CALLING_SEEN_TTL_SECONDS', 604800),

    'graph_version' => env('CALLING_GRAPH_VERSION', 'v25.0'),
    'api_timeout_seconds' => (int) env('CALLING_API_TIMEOUT_SECONDS', 10),
    'api_connect_timeout_seconds' => (int) env('CALLING_API_CONNECT_TIMEOUT_SECONDS', 3),

    // A short per-call lock so two tabs can't send Meta the same step twice.
    'action_lock_seconds' => (int) env('CALLING_ACTION_LOCK_SECONDS', 20),

    // A connected call with no "terminate" is ended after this long.
    'active_window_minutes' => (int) env('CALLING_ACTIVE_WINDOW_MINUTES', 120),

    // Ringing/answering calls are left for Meta's own terminate this long
    // past the ring before the every-minute cleanup ends them.
    'stale_grace_seconds' => (int) env('CALLING_STALE_GRACE_SECONDS', 120),
    'reconcile_batch_limit' => (int) env('CALLING_RECONCILE_BATCH_LIMIT', 500),

    // The call box checks in every 15 s (5 s when live updates look stuck);
    // someone not seen for 45 s counts as away.
    'softphone_heartbeat_seconds' => (int) env('CALLING_SOFTPHONE_HEARTBEAT_SECONDS', 15),
    'softphone_poll_seconds' => (int) env('CALLING_SOFTPHONE_POLL_SECONDS', 5),
    'softphone_staleness_seconds' => (int) env('CALLING_SOFTPHONE_STALENESS_SECONDS', 20),
    'softphone_presence_stale_seconds' => (int) env('CALLING_SOFTPHONE_PRESENCE_STALE_SECONDS', 45),
];
