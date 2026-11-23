<?php

use App\Http\Controllers\Admin\Leads\LeadCallController;
use App\Http\Controllers\Api\CallingAppController;
use App\Http\Controllers\Api\LeadWebhookController;
use Illuminate\Support\Facades\Route;

/*
| Lead Management webhooks from Meta. Stateless (no session/CSRF); POSTs
| are signature-checked and rate limited per source IP.
*/
Route::prefix('webhook')->name('api.webhook.')->middleware('throttle:lead-webhooks')->group(function () {
    Route::get('facebook', [LeadWebhookController::class, 'verifyFacebook'])->name('facebook.verify');
    Route::post('facebook', [LeadWebhookController::class, 'facebook'])->name('facebook')
        ->middleware('verify.meta.signature:facebook_messenger,facebook_lead_ads');

    Route::get('instagram', [LeadWebhookController::class, 'verifyInstagram'])->name('instagram.verify');
    Route::post('instagram', [LeadWebhookController::class, 'instagram'])->name('instagram')
        ->middleware('verify.meta.signature:instagram');

    Route::get('whatsapp', [LeadWebhookController::class, 'verifyWhatsapp'])->name('whatsapp.verify');
    Route::post('whatsapp', [LeadWebhookController::class, 'whatsapp'])->name('whatsapp')
        ->middleware('verify.meta.signature:whatsapp');
});

/*
| The "Opticore WhatsApp Calling" phone app. Same paths and shapes as
| OptiFin's, so one app works with both. After pairing, the app's token is
| bridged onto the `admin` guard and every call action runs the browser's
| own controller.
*/
Route::prefix('calling-app')->name('api.calling-app.')->group(function () {
    Route::post('pair', [CallingAppController::class, 'pair'])->middleware('throttle:calling-app-pair')->name('pair');

    Route::middleware(['auth:sanctum', 'calling-app.device'])->group(function () {
        Route::get('me', [CallingAppController::class, 'me'])->name('me');
        Route::post('heartbeat', [CallingAppController::class, 'heartbeat'])->name('heartbeat');
        Route::post('unpair', [CallingAppController::class, 'unpair'])->name('unpair');
        Route::post('push-token', [CallingAppController::class, 'pushToken'])->name('push-token');
        Route::get('latest-version', [CallingAppController::class, 'latestVersion'])->name('latest-version');

        Route::middleware('throttle:lead-call-actions')->group(function () {
            Route::get('calls/active', [LeadCallController::class, 'activeForApp'])->name('calls.active');
            Route::post('leads/{lead}/calls/outbound', [LeadCallController::class, 'call'])->whereUlid('lead')->name('calls.outbound');

            Route::prefix('calls/{call}')->name('calls.')->whereUlid('call')->group(function () {
                Route::post('claim', [LeadCallController::class, 'claim'])->name('claim');
                Route::post('answer', [LeadCallController::class, 'answer'])->name('answer');
                Route::post('accept', [LeadCallController::class, 'accept'])->name('accept');
                Route::post('reject', [LeadCallController::class, 'reject'])->name('reject');
                Route::post('hangup', [LeadCallController::class, 'hangup'])->name('hangup');
                Route::post('cancel-outbound', [LeadCallController::class, 'cancel'])->name('cancel-outbound');
                Route::get('outbound-answer', [LeadCallController::class, 'outboundAnswer'])->name('outbound-answer');
                Route::post('outbound-connected', [LeadCallController::class, 'outboundConnected'])->name('outbound-connected');
            });
        });
    });
});
