<?php

namespace App\Http\Controllers\Admin;

use App\Events\OfferDeleted;
use App\Events\PendingPaymentDeleted;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Offer;
use App\Models\OfferMilestone;
use App\Support\PendingOrderResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class PendingPaymentController extends Controller
{
    public function index(Conversation $conversation): JsonResponse
    {
        return response()->json(PendingOrderResolver::forUser($conversation->user));
    }

    public function destroy(Request $request, Conversation $conversation, string $pendingPayment): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string'],
        ]);

        $admin = Auth::guard('admin')->user();

        if (! Hash::check($validated['password'], $admin->password)) {
            return response()->json(['message' => 'The password you entered is incorrect.'], 422);
        }

        if (! preg_match('/^offer-(\d+)(?:-milestone-(\d+))?$/', $pendingPayment, $matches)) {
            abort(404);
        }

        $offer = Offer::findOrFail((int) $matches[1]);
        abort_if($offer->conversation_id !== $conversation->id, 404);

        if (isset($matches[2])) {
            OfferMilestone::where('offer_id', $offer->id)->findOrFail((int) $matches[2])->delete();
        } else {
            $this->deleteOffer($offer, $conversation);
        }

        broadcast(new PendingPaymentDeleted($conversation->user_id));

        return response()->json(['deleted' => true]);
    }

    /**
     * Delete the whole offer, mirroring OfferController::destroy() so it
     * disappears from the chat too rather than only from pending payments.
     */
    private function deleteOffer(Offer $offer, Conversation $conversation): void
    {
        $message = Message::where('offer_id', $offer->id)->first();
        $offerId = $offer->id;

        if ($message) {
            $messageId = $message->id;
            $message->delete();
        }

        $offer->delete();

        if ($message) {
            broadcast(new OfferDeleted($messageId, $conversation->id, $offerId));
        }
    }
}
