<?php

namespace App\Http\Controllers;

use App\Models\Offer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function index(Request $request): Response
    {
        if ($offerToken = $request->query('offer_token')) {
            $offer = Offer::where('offer_token', $offerToken)
                ->with(['subCategory', 'milestones', 'conversation'])
                ->firstOrFail();

            abort_if($offer->conversation->user_id !== $request->user()->id, 403);
            abort_if($offer->status !== 'accepted', 422);

            $milestoneId = $request->query('milestone_id') ? (int) $request->query('milestone_id') : null;

            if ($milestoneId !== null) {
                $milestone = $offer->milestones->firstWhere('id', $milestoneId);
                abort_if(! $milestone, 404);
                $totalPrice = (float) $milestone->price;
                $deliveryDays = $milestone->delivery_days;
                $plan = $milestone->name;
            } else {
                $totalPrice = $offer->payment_type === 'single'
                    ? (float) $offer->price
                    : (float) $offer->milestones->sum('price');
                $deliveryDays = $offer->payment_type === 'single'
                    ? ($offer->delivery_days ?? 0)
                    : $offer->milestones->sum('delivery_days');
                $plan = 'Custom';
            }

            $serviceName = $offer->subCategory?->name
                ?? ($offer->category_slug ? ucwords(str_replace('-', ' ', $offer->category_slug)) : 'Custom Service');

            return Inertia::render('Checkout', [
                'item' => [
                    'service' => $serviceName,
                    'plan' => $plan,
                    'price' => '$'.number_format($totalPrice, 2),
                    'delivery' => $deliveryDays.' Days',
                    'category' => $offer->category_slug ?? '',
                    'subcategory' => $offer->subCategory?->name ?? '',
                    'subcategory_id' => $offer->sub_category_id ?? 0,
                    'offer_token' => $offerToken,
                    'milestone_id' => $milestoneId,
                ],
            ]);
        }

        return Inertia::render('Checkout', [
            'item' => [
                'service' => $request->query('service', 'Service'),
                'plan' => $request->query('plan', 'Standard'),
                'price' => $request->query('price', '$10'),
                'delivery' => $request->query('delivery', '4 Days'),
                'category' => $request->query('category', ''),
                'subcategory' => $request->query('subcategory', ''),
                'subcategory_id' => (int) $request->query('subcategory_id', 0),
            ],
        ]);
    }

    public function exchangeRate(): JsonResponse
    {
        $rate = Cache::remember('exchange_rate_usd_bdt', now()->addHours(6), function () {
            $response = Http::get('https://v6.exchangerate-api.com/v6/'.config('services.exchangerate.key').'/pair/USD/BDT');

            return $response->json('conversion_rate');
        });

        return response()->json(['rate' => $rate]);
    }
}
