<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
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

        Subscription::firstOrCreate(['email' => strtolower(trim($request->email))]);

        return response()->json(['subscribed' => true]);
    }

    public function unsubscribe(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        Subscription::where('email', strtolower(trim($request->email)))->first()?->delete();

        return response()->json(['subscribed' => false]);
    }
}
