<?php

namespace App\Http\Controllers;

use App\Mail\ConfirmSubscriptionMail;
use App\Mail\ConfirmUnsubscribeMail;
use App\Mail\ManageSubscriptionFromProfileMail;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;

class SubscriptionController extends Controller
{
    private const CONFIRMATION_TTL_HOURS = 24;

    public function check(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        return response()->json([
            'subscribed' => Subscription::where('email', $request->email)->exists(),
        ]);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email', 'max:255']]);

        $this->sendConfirmation(strtolower(trim($request->email)), subscribing: true);

        return response()->json(['status' => 'pending']);
    }

    public function unsubscribe(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $this->sendConfirmation(strtolower(trim($request->email)), subscribing: false);

        return response()->json(['status' => 'pending']);
    }

    public function confirmSubscribe(Request $request): RedirectResponse
    {
        Subscription::firstOrCreate(['email' => $this->signedEmail($request)]);

        return redirect('/')->with('subscription', 'subscribed');
    }

    public function confirmUnsubscribe(Request $request): RedirectResponse
    {
        Subscription::where('email', $this->signedEmail($request))->first()?->delete();

        return redirect('/')->with('subscription', 'unsubscribed');
    }

    /**
     * Registered accounts manage their newsletter preference exclusively
     * from their (authenticated) profile page — never directly from this
     * public form. Everyone else gets a signed, single-use confirmation
     * link mailed to the address they typed in, so the public form can
     * never subscribe or unsubscribe an email its sender doesn't actually
     * control. The on-screen response is identical either way, so the form
     * itself can't be used to enumerate which emails have an account.
     */
    private function sendConfirmation(string $email, bool $subscribing): void
    {
        $user = User::where('email', $email)->first();

        if ($user) {
            Mail::to($email)->queue(new ManageSubscriptionFromProfileMail($user->name));

            return;
        }

        $url = URL::temporarySignedRoute(
            $subscribing ? 'subscription.confirm-subscribe' : 'subscription.confirm-unsubscribe',
            now()->addHours(self::CONFIRMATION_TTL_HOURS),
            ['email' => $email],
        );

        Mail::to($email)->queue(
            $subscribing ? new ConfirmSubscriptionMail($url) : new ConfirmUnsubscribeMail($url)
        );
    }

    private function signedEmail(Request $request): string
    {
        abort_unless($request->query('email'), 404);

        return strtolower(trim((string) $request->query('email')));
    }
}
