<?php

return [
    /*
    | The most chat messages one webhook delivery may carry. A delivery over
    | this limit is ignored (but still acknowledged), same as OptiFin.
    */
    'max_inbound_messages_per_request' => env('LEADS_MAX_INBOUND_MESSAGES_PER_REQUEST', 100),

    /*
    | Largest attachment kept per channel, in bytes (same as OptiFin).
    */
    'attachment_max_bytes' => [
        'facebook_messenger' => 25 * 1024 * 1024,
        'instagram' => 25 * 1024 * 1024,
        'whatsapp' => 100 * 1024 * 1024,
    ],

    /*
    | Email inbox health: after this many failed connections in a row (within
    | the window), the mother admin is alerted once (same as OptiFin).
    */
    'imap_failure_threshold' => env('LEADS_IMAP_FAILURE_THRESHOLD', 5),
    'imap_failure_window_minutes' => env('LEADS_IMAP_FAILURE_WINDOW_MINUTES', 1440),
];
