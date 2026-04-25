<?php

namespace App\Http\Controllers\Admin;

use App\Events\MessageSent;
use App\Events\OfferDeleted;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class OfferController extends Controller
{
    public function store(Conversation $conversation, Request $request): JsonResponse
    {
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

        $admin = Auth::guard('admin')->user();

        $offer = $conversation->offers()->create([
            'sub_category_id' => null,
            'category_slug' => $validated['category_slug'] ?? null,
            'payment_type' => $validated['payment_type'],
            'description' => $validated['description'],
            'request_requirements' => $validated['request_requirements'] ?? true,
            'price' => $validated['payment_type'] === 'single' ? $validated['price'] : null,
            'delivery_days' => $validated['payment_type'] === 'single' ? $validated['delivery_days'] : null,
            'revisions' => $validated['revisions'] ?? null,
            'expires_at' => $validated['expires_at'] ?? null,
            'offer_token' => Str::random(40),
        ]);

        if ($validated['payment_type'] === 'milestone') {
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
        }

        $message = $conversation->messages()->create([
            'sender_type' => 'admin',
            'sender_id' => $admin->id,
            'message' => 'Sent an offer',
            'offer_id' => $offer->id,
            'delivered_at' => Cache::has("user_chat_online_{$conversation->user_id}") ? now() : null,
        ]);

        $conversation->update([
            'last_message' => 'Sent an offer',
            'last_message_at' => now(),
        ]);

        $message->load(['conversation.user', 'offer.subCategory', 'offer.milestones']);

        broadcast(new MessageSent($message))->toOthers();

        return response()->json($message);
    }

    public function destroy(Conversation $conversation, Message $message): JsonResponse
    {
        abort_if($message->conversation_id !== $conversation->id, 404);
        abort_if(! $message->offer_id, 422, 'This message is not an offer.');

        $messageId = $message->id;
        $offerId = $message->offer_id;
        $conversationId = $conversation->id;

        // Delete the message first (before offer, since FK is nullOnDelete).
        $message->delete();

        // Delete the offer and its milestones.
        $conversation->offers()->where('id', $offerId)->delete();

        broadcast(new OfferDeleted($messageId, $conversationId, $offerId));

        return response()->json(['message_id' => $messageId]);
    }
}
