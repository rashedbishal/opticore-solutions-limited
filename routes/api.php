<?php

use App\Http\Controllers\Api\LeadWebhookController;
use App\Http\Controllers\Api\WebsiteFormController;
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
| Website Form Builder submissions (forms placed on other websites). Rate
| limited per form and per visitor, same limits as OptiFin.
*/
Route::post('forms/{token}', [WebsiteFormController::class, 'submit'])
    ->name('api.website-form.submit')
    ->where('token', '[A-Za-z0-9]{40}')
    ->middleware(['throttle:website-form-per-form', 'throttle:website-form-per-ip']);
