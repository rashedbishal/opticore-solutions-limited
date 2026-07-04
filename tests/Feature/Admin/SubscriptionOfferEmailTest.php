<?php

use App\Mail\OfferMail;
use App\Models\Admin;
use App\Models\Subscription;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');

    $this->admin = Admin::factory()->create();
});

it('sends one offer email chunk when there are no subscribers yet', function () {
    Mail::fake();

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.subscriptions.offer-email.send'), [
            'image' => UploadedFile::fake()->create('offer.webp', 100, 'image/webp'),
        ])
        ->assertRedirect();

    Mail::assertSent(OfferMail::class, 1);
});

it('chunks the subscriber bcc list across multiple emails instead of one unbounded bcc', function () {
    Mail::fake();

    foreach (range(1, 51) as $i) {
        Subscription::create(['email' => "subscriber{$i}@example.com"]);
    }

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.subscriptions.offer-email.send'), [
            'image' => UploadedFile::fake()->create('offer.webp', 100, 'image/webp'),
        ])
        ->assertRedirect();

    // 51 subscribers chunked by 50 => 2 separate emails, not 1 unbounded bcc.
    Mail::assertSent(OfferMail::class, 2);
});

it('deletes the temporary upload once every chunk has been sent', function () {
    Mail::fake();

    $this->actingAs($this->admin, 'admin')
        ->post(route('admin.subscriptions.offer-email.send'), [
            'image' => UploadedFile::fake()->create('offer.webp', 100, 'image/webp'),
        ])
        ->assertRedirect();

    Storage::disk('local')->assertDirectoryEmpty('temp/offer-emails');
});
