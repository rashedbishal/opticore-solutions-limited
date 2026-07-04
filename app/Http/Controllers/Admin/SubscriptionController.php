<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendCustomEmail;
use App\Jobs\SendSubscriptionOfferEmail;
use App\Models\Subscription;
use Illuminate\Bus\Batch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Subscription/Index', [
            'subscriptions' => Subscription::latest()->paginate(20),
        ]);
    }

    public function destroy(Subscription $subscription): RedirectResponse
    {
        $subscription->delete();

        return back()->with('success', 'Subscriber removed successfully.');
    }

    public function offerEmail(): Response
    {
        return Inertia::render('Admin/Subscription/OfferEmail');
    }

    public function sendOfferEmail(Request $request): RedirectResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:webp', 'max:5120'],
        ]);

        $path = $request->file('image')->store('temp/offer-emails', 'local');
        $fullPath = Storage::disk('local')->path($path);
        $imageName = $request->file('image')->getClientOriginalName();

        $companyEmail = config('mail.from.address');

        // Chunk the BCC list instead of one email with every subscriber on
        // it — mail providers commonly cap recipients per message — and run
        // each chunk on the queue so this request isn't blocked on the SMTP
        // round-trip. The temp upload is only deleted once every chunk has
        // been sent (or given up on), since each job reads it independently.
        $jobs = Subscription::pluck('email')
            ->chunk(50)
            ->map(fn ($chunk) => new SendSubscriptionOfferEmail($companyEmail, $chunk->values()->all(), $fullPath, $imageName))
            ->values()
            ->all();

        if (empty($jobs)) {
            $jobs[] = new SendSubscriptionOfferEmail($companyEmail, [], $fullPath, $imageName);
        }

        Bus::batch($jobs)
            ->finally(function (Batch $batch) use ($path) {
                Storage::disk('local')->delete($path);
            })
            ->dispatch();

        return back()->with('success', 'Offer email sent to all subscribers.');
    }

    public function customEmail(): Response
    {
        return Inertia::render('Admin/Subscription/CustomEmail', [
            'subscriberCount' => Subscription::count(),
        ]);
    }

    public function sendCustomEmail(Request $request): RedirectResponse
    {
        $emailList = function (string $attribute, mixed $value, \Closure $fail) {
            foreach (array_map('trim', explode(',', (string) $value)) as $email) {
                if ($email !== '' && ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $fail("The {$attribute} field must contain only valid, comma-separated email addresses.");
                }
            }
        };

        $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'to' => ['required', 'string', $emailList],
            'cc' => ['nullable', 'string', $emailList],
            'bcc' => ['nullable', 'string', $emailList],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'max:10240'],
        ]);

        $parseEmails = fn (?string $raw): array => array_values(
            array_filter(array_map('trim', explode(',', $raw ?? '')))
        );

        $to = $parseEmails($request->to);
        $cc = $parseEmails($request->cc);
        $bcc = $parseEmails($request->bcc);

        $attachmentPaths = [];
        foreach ($request->file('attachments', []) as $file) {
            $attachmentPaths[] = [
                'path' => $file->store('temp/custom-emails', 'local'),
                'name' => $file->getClientOriginalName(),
            ];
        }

        SendCustomEmail::dispatch(
            to: $to,
            cc: $cc,
            bcc: $bcc,
            emailSubject: $request->subject,
            emailTitle: $request->title,
            body: $request->body,
            attachmentPaths: $attachmentPaths,
        );

        return back()->with('success', 'Email sent successfully.');
    }
}
