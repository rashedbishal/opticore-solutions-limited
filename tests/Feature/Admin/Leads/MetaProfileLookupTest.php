<?php

use App\Leads\Services\Meta\MetaGraph;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

it("records Meta's reason when a Messenger name can't be looked up, never the token", function () {
    Log::spy();
    Http::fake(['graph.facebook.com/*' => Http::response(['error' => ['message' => 'Unsupported get request.', 'type' => 'GraphMethodException', 'code' => 100, 'error_subcode' => 33]], 400)]);

    expect(app(MetaGraph::class)->facebookProfile('PSID9', 'secret-page-token'))->toBe(['name' => null, 'profile_pic' => null]);

    Log::shouldHaveReceived('warning')->withArgs(fn (string $message, array $context) => str_contains($message, 'HTTP 400')
        && $context === ['code' => 100, 'subcode' => 33, 'type' => 'GraphMethodException', 'message' => 'Unsupported get request.']
        && ! str_contains($message.json_encode($context), 'secret-page-token'))->once();
});
