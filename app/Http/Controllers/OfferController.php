<?php

namespace App\Http\Controllers;

use App\Events\OfferStatusChanged;
use App\Events\OfferUpdated;
use App\Models\Offer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class OfferController extends Controller
{
    public function show(string $token): Response
    {
        $offer = Offer::where('offer_token', $token)
            ->with(['subCategory', 'milestones', 'conversation.user'])
            ->firstOrFail();

        if ($offer->status === 'pending' && $offer->expires_at?->isPast()) {
            $offer->update(['status' => 'expired']);
            $offer->refresh();
        }

        $isAdmin = Auth::guard('admin')->check();
        $user = Auth::guard('web')->user();

        if ($isAdmin) {
            // This route isn't under the `admin.` name prefix, so the
            // EnsureAdminHasPermission middleware can't derive a section key
            // for it automatically — check the "Customer Support" permission
            // explicitly instead, since offers are part of that feature.
            abort_unless(Auth::guard('admin')->user()->canAccess('customer-conversations'), 403);
        } elseif (! $user || $offer->conversation->user_id !== $user->id) {
            abort(403);
        }

        $canRespond = ! $isAdmin
            && $user !== null
            && $offer->status === 'pending'
            && $offer->conversation->user_id === $user->id;

        return Inertia::render('Offer/Show', [
            'offer' => $offer,
            'canRespond' => $canRespond,
            'isAdmin' => $isAdmin,
        ]);
    }

    public function accept(string $token): JsonResponse
    {
        $offer = Offer::where('offer_token', $token)
            ->with('conversation')
            ->firstOrFail();

        abort_if($offer->conversation->user_id !== Auth::id(), 403);
        abort_if($offer->status !== 'pending', 422, 'This offer is no longer pending.');

        $offer->update(['status' => 'accepted']);
        broadcast(new OfferStatusChanged($offer));

        return response()->json(['status' => 'accepted', 'offer_id' => $offer->id]);
    }

    public function decline(string $token): JsonResponse
    {
        $offer = Offer::where('offer_token', $token)
            ->with('conversation')
            ->firstOrFail();

        abort_if($offer->conversation->user_id !== Auth::id(), 403);
        abort_if($offer->status !== 'pending', 422, 'This offer is no longer pending.');

        $offer->update(['status' => 'declined']);
        broadcast(new OfferStatusChanged($offer));

        return response()->json(['status' => 'declined', 'offer_id' => $offer->id]);
    }

    public function update(string $token, Request $request): JsonResponse
    {
        // This route isn't under the `admin.` name prefix, so the
        // EnsureAdminHasPermission middleware can't derive a section key for
        // it automatically — check the "Customer Support" permission
        // explicitly instead, since offers are part of that feature.
        abort_unless(Auth::guard('admin')->user()->canAccess('customer-conversations'), 403);

        $offer = Offer::where('offer_token', $token)
            ->with(['milestones', 'conversation'])
            ->firstOrFail();

        $validated = $request->validate([
            'category_slug' => 'nullable|string|in:graphic-design,digital-marketing,video-editing,3d-production,web-development',
            'payment_type' => 'required|in:single,milestone',
            'description' => 'required|string|max:5000',
            'request_requirements' => 'boolean',
            'price' => 'required_if:payment_type,single|nullable|numeric|min:0',
            'delivery_days' => 'required_if:payment_type,single|nullable|integer|min:1|max:365',
            'revisions' => 'nullable|integer|min:0|max:999',
            'expires_at' => 'nullable|date|after:today',
            'milestones' => 'required_if:payment_type,milestone|array|min:1|max:20',
            'milestones.*.name' => 'required|string|max:255',
            'milestones.*.description' => 'nullable|string|max:2000',
            'milestones.*.revisions' => 'nullable|integer|min:0|max:999',
            'milestones.*.delivery_days' => 'required|integer|min:1|max:365',
            'milestones.*.price' => 'required|numeric|min:0',
        ]);

        $offer->update([
            'category_slug' => $validated['category_slug'] ?? null,
            'payment_type' => $validated['payment_type'],
            'description' => $validated['description'],
            'request_requirements' => $validated['request_requirements'] ?? $offer->request_requirements,
            'price' => $validated['payment_type'] === 'single' ? $validated['price'] : null,
            'delivery_days' => $validated['payment_type'] === 'single' ? $validated['delivery_days'] : null,
            'revisions' => $validated['revisions'] ?? null,
            'expires_at' => $validated['expires_at'] ?? null,
            'status' => 'pending',
        ]);

        if ($validated['payment_type'] === 'milestone') {
            $offer->milestones()->delete();
            foreach ($validated['milestones'] as $index => $milestone) {
                $offer->milestones()->create([
                    'name' => $milestone['name'],
                    'description' => $milestone['description'] ?? null,
                    'revisions' => $milestone['revisions'] ?? 0,
                    'delivery_days' => $milestone['delivery_days'],
                    'price' => $milestone['price'],
                    'sort_order' => $index,
                ]);
            }
        } else {
            $offer->milestones()->delete();
        }

        $fresh = $offer->fresh()->load(['subCategory', 'milestones', 'conversation.user']);

        broadcast(new OfferUpdated($fresh));
        broadcast(new OfferStatusChanged($fresh));

        return response()->json($fresh);
    }
}
