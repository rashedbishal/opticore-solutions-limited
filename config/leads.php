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
];
