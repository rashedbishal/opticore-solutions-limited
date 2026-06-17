<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\CustomMail;
use App\Mail\OfferMail;
use App\Models\Subscription;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
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
            'image' => ['required', 'file', 'image', 'max:5120'],
        ]);

        $path = $request->file('image')->store('temp/offer-emails', 'local');
        $fullPath = Storage::disk('local')->path($path);

        $subscribers = Subscription::pluck('email')->toArray();
        $companyEmail = config('mail.from.address');

        Mail::to($companyEmail)
            ->bcc($subscribers)
            ->send(new OfferMail($fullPath, $request->file('image')->getClientOriginalName()));

        Storage::disk('local')->delete($path);

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
        $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'to' => ['required', 'string'],
            'cc' => ['nullable', 'string'],
            'bcc' => ['nullable', 'string'],
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

        Mail::to($to)
            ->cc($cc)
            ->bcc($bcc)
            ->send(new CustomMail(
                emailSubject: $request->subject,
                emailTitle: $request->title,
                body: $request->body,
                attachmentPaths: $attachmentPaths,
            ));

        foreach ($attachmentPaths as $att) {
            Storage::disk('local')->delete($att['path']);
        }

        return back()->with('success', 'Email sent successfully.');
    }
}
