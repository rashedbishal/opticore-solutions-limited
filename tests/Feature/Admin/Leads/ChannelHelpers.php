<?php

use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\LeadSource;

function metaSource(LeadSourceType $type, array $config = [], string $name = 'Channel'): LeadSource
{
    $defaults = match ($type) {
        LeadSourceType::FacebookMessenger, LeadSourceType::FacebookLeadAds => ['page_id' => 'PAGE1', 'page_access_token' => 'page-token', 'verify_token' => 'verify-me'],
        LeadSourceType::Instagram => ['auth_mode' => 'facebook', 'instagram_account_id' => 'IG1', 'access_token' => 'ig-token', 'verify_token' => 'verify-me'],
        LeadSourceType::Whatsapp => ['phone_number_id' => 'PHONE1', 'access_token' => 'wa-token', 'verify_token' => 'verify-me'],
        default => [],
    };

    return LeadSource::create(['type' => $type, 'name' => $name, 'config' => [...$defaults, ...$config], 'is_active' => true]);
}

function signedPost(string $uri, array $payload, ?string $secret = null)
{
    $body = json_encode($payload);
    $headers = ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'];

    if ($secret !== null) {
        $headers['HTTP_X_HUB_SIGNATURE_256'] = 'sha256='.hash_hmac('sha256', $body, $secret);
    }

    return test()->call('POST', $uri, [], [], [], $headers, $body);
}
