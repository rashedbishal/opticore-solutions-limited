<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\SecurityAlertMail;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SocialController extends Controller
{
    /**
     * @return array<int, string>
     */
    private function supportedProviders(): array
    {
        return ['google', 'facebook'];
    }

    public function redirect(string $provider): RedirectResponse
    {
        if (! in_array($provider, $this->supportedProviders(), true)) {
            throw new NotFoundHttpException;
        }

        return Socialite::driver($provider)->redirect();
    }

    public function callback(Request $request, string $provider): RedirectResponse
    {
        if (! in_array($provider, $this->supportedProviders(), true)) {
            throw new NotFoundHttpException;
        }

        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (\Exception $e) {
            Log::error('Social login callback failed.', [
                'provider' => $provider,
                'message' => $e->getMessage(),
                'exception' => get_class($e),
            ]);

            $message = App::isLocal()
                ? sprintf('%s login failed: %s', Str::headline($provider), $e->getMessage())
                : 'Social login failed. Please try again.';

            return redirect()->route('login')->withErrors(['social' => $message]);
        }

        // Registration lowercases the stored email (see RegisterController);
        // normalize the provider's email the same way so an account created
        // with e.g. "jane@example.com" is still found and linked when a
        // provider later returns "Jane@Example.com" for the same person,
        // instead of silently creating a second, disconnected account.
        $email = Str::lower($socialUser->getEmail());

        $user = User::withTrashed()
            ->where($provider.'_id', $socialUser->getId())
            ->first();

        if (! $user) {
            $emailMatch = User::withTrashed()
                ->where('email', $email)
                ->first();

            if ($emailMatch && ! $emailMatch->hasVerifiedEmail()) {
                Log::warning('Social login blocked: matched email is unverified.', [
                    'provider' => $provider,
                    'email' => $email,
                ]);

                return redirect()->route('login')->withErrors([
                    'social' => 'An account with this email already exists but has not been verified. Please log in with your password, or use "Forgot password" to reset it.',
                ]);
            }

            $user = $emailMatch;
        }

        if ($user) {
            $updates = [
                $provider.'_id' => $socialUser->getId(),
                'avatar' => $socialUser->getAvatar(),
            ];

            if ($user->trashed()) {
                $user->restore();

                // Self-deletion mangles the live `email` column and stashes
                // the real address in `original_email` (see
                // ProfileController::deleteAccount and the User::email()
                // accessor). That accessor only substitutes original_email
                // back in while the model is trashed, so once restored the
                // account would otherwise be permanently stuck behind the
                // mangled placeholder unless it's restored here too.
                // `original_email` isn't mass-assignable, so it needs
                // forceFill() rather than being merged into $updates below.
                if ($user->original_email) {
                    $updates['email'] = Str::lower($user->original_email);
                    $user->forceFill(['original_email' => null]);
                }
            }

            $user->update($updates);
        } else {
            $user = User::create([
                'name' => $socialUser->getName(),
                'email' => $email,
                'password' => Hash::make(Str::random(24)),
                $provider.'_id' => $socialUser->getId(),
                'avatar' => $socialUser->getAvatar(),
            ]);

            $user->markEmailAsVerified();
        }

        Auth::login($user);
        $request->session()->regenerate();

        if ($user->notify_security_alerts) {
            Mail::to($user->email)->queue(new SecurityAlertMail(
                recipientName: $user->name,
                type: 'login',
                ip: $request->ip(),
                userAgent: $request->userAgent() ?? 'Unknown',
                time: now()->format('d M Y, H:i T'),
            ));
        }

        return redirect()->intended('/');
    }
}
