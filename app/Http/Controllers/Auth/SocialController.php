<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
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

    public function callback(string $provider): RedirectResponse
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

        $user = User::where($provider.'_id', $socialUser->getId())
            ->orWhere('email', $socialUser->getEmail())
            ->first();

        if ($user) {
            $user->update([
                $provider.'_id' => $socialUser->getId(),
                'avatar' => $socialUser->getAvatar(),
            ]);
        } else {
            $user = User::create([
                'name' => $socialUser->getName(),
                'email' => $socialUser->getEmail(),
                'password' => Hash::make(Str::random(24)),
                $provider.'_id' => $socialUser->getId(),
                'avatar' => $socialUser->getAvatar(),
                'email_verified_at' => now(), // Social accounts are usually verified
            ]);
        }

        Auth::login($user);

        return redirect()->intended('/');
    }
}
