<?php

namespace App\Http\Controllers;

use App\Events\OrderCreated;
use App\Models\Offer;
use App\Models\PortfolioSubCategory;
use App\Models\Transaction;
use App\Models\User;
use App\Support\GooglePaySslCommerz;
use App\Support\IdGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

/**
 * Google Pay checkout, via SSLCommerz's "Merchant Hosted Payment API".
 *
 * Deliberately independent of SslCommerzPaymentController and
 * App\Library\SslCommerz\* (the classic Easy Checkout integration) — a
 * different SSLCommerz API surface, isolated on purpose. The only thing it
 * shares with the existing flow is the destination of the success/fail/
 * cancel/ipn redirects: those routes are gateway-agnostic (keyed purely by
 * tran_id), so pointing this flow's transactions at them gets correct
 * fulfillment (invoice email, workflow task, login) for free.
 */
class GooglePayCheckoutController extends Controller
{
    private const CONFIG_CACHE_KEY = 'sslcommerz_googlepay_config';

    private const CONFIG_CALL_COUNT_KEY_PREFIX = 'sslcommerz_googlepay_config_calls_';

    private const DAILY_CALL_LIMIT = 3;

    public function __construct(private readonly GooglePaySslCommerz $client) {}

    /**
     * Google Pay button configuration (gateway, merchant info, allowed card
     * networks). SSLCommerz caps this at 3 requests/day, so the result is
     * cached aggressively and only refreshed while under that budget.
     */
    public function config(): JsonResponse
    {
        $cached = Cache::get(self::CONFIG_CACHE_KEY);

        if ($cached !== null && ! $this->canRefreshConfigToday()) {
            return response()->json(['available' => true, 'config' => $cached]);
        }

        $response = $this->client->fetchConfig();
        $this->recordConfigCall();

        if (($response['APIConnect'] ?? null) !== 'SUCCESS' || empty($response['data'])) {
            return $cached !== null
                ? response()->json(['available' => true, 'config' => $cached])
                : response()->json(['available' => false]);
        }

        $config = [
            ...$response['data'],
            'environment' => config('sslcommerz_googlepay.environment'),
        ];

        Cache::put(self::CONFIG_CACHE_KEY, $config, now()->addDays(7));

        return response()->json(['available' => true, 'config' => $config]);
    }

    /**
     * Resolve the order, charge it in BDT via the Google Pay token, and
     * report back how the frontend should complete the flow.
     */
    public function charge(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'googlepay_token' => ['required', 'string'],
            'offer_token' => ['nullable', 'string'],
            'milestone_id' => ['nullable', 'integer'],
            'subcategory_id' => ['nullable', 'integer'],
            'plan' => ['nullable', 'string'],
            'category_id' => ['nullable', 'string'],
            'service' => ['nullable', 'string'],
            'delivery' => ['nullable', 'string'],
            'subcategory' => ['nullable', 'string'],
        ]);

        $user = $request->user();

        [$usdAmount, $categorySlug, $subcategoryId, $checkoutUrl] = $this->resolveOrder($validated, $user->id);

        $rate = Cache::remember('exchange_rate_usd_bdt', now()->addHours(6), function () {
            $response = Http::get('https://v6.exchangerate-api.com/v6/'.config('services.exchangerate.key').'/pair/USD/BDT');

            return $response->json('conversion_rate');
        });

        abort_if(! $rate, 422, 'Unable to resolve the current exchange rate.');

        $totalAmount = (string) round($usdAmount * $rate);
        $tranId = IdGenerator::transactionId();

        $this->createPendingRecords($tranId, $user, $totalAmount, $categorySlug, $subcategoryId, $checkoutUrl);

        OrderCreated::dispatch();

        $initiateResponse = $this->client->initiateTransaction([
            'total_amount' => $totalAmount,
            'currency' => 'BDT',
            'tran_id' => $tranId,
            'success_url' => url('/success'),
            'fail_url' => url('/fail'),
            'cancel_url' => url('/cancel'),
            'ipn_url' => url('/ipn'),
            'cus_name' => $user->name,
            'cus_email' => $user->email,
            'cus_add1' => $user->address,
            'cus_city' => '',
            'cus_postcode' => '',
            'cus_country' => $user->country,
            'cus_phone' => $user->phone_number,
            'shipping_method' => 'NO',
            'product_name' => 'Service',
            'product_category' => 'Virtual',
            'product_profile' => 'non-physical-goods',
            'value_a' => $categorySlug,
            'value_b' => $subcategoryId,
            'enable_cus_googlepay' => 1,
        ]);

        $sessionKey = $initiateResponse['data']['googlepay']['session_key'] ?? null;
        $actionUrl = $initiateResponse['data']['googlepay']['actionurl'] ?? null;

        if (($initiateResponse['APIConnect'] ?? null) !== 'SUCCESS' || ! $sessionKey || ! $actionUrl) {
            $this->markFailed($tranId);

            return response()->json([
                'status' => 'failed',
                'message' => $initiateResponse['failed_reason'] ?? 'Unable to initiate the Google Pay transaction.',
            ]);
        }

        $tokenResponse = $this->client->submitToken($actionUrl, $sessionKey, $validated['googlepay_token']);

        if (($tokenResponse['status'] ?? null) !== 'SUCCESS') {
            $this->markFailed($tranId);

            return response()->json([
                'status' => 'failed',
                'message' => $tokenResponse['message'] ?? 'Google Pay payment could not be processed.',
            ]);
        }

        return response()->json([
            'status' => 'success',
            'type' => $tokenResponse['data']['type'] ?? 'regular',
            'html' => $tokenResponse['data']['data'] ?? null,
            'return_url' => $tokenResponse['data']['return_url'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $cart
     * @return array{0: float, 1: string|null, 2: int|null, 3: string}
     */
    private function resolveOrder(array $cart, int $userId): array
    {
        if (! empty($cart['offer_token'])) {
            $offer = Offer::where('offer_token', $cart['offer_token'])
                ->with(['conversation', 'milestones'])
                ->firstOrFail();

            abort_if($offer->conversation->user_id !== $userId, 403);
            abort_if($offer->status !== 'accepted', 422);

            if (! empty($cart['milestone_id'])) {
                $milestone = $offer->milestones->firstWhere('id', (int) $cart['milestone_id']);
                abort_if(! $milestone, 422);
                $usdAmount = (float) $milestone->price;
                $checkoutUrl = '/checkout?offer_token='.urlencode($cart['offer_token']).'&milestone_id='.urlencode((string) $cart['milestone_id']);
            } else {
                $usdAmount = $offer->payment_type === 'single'
                    ? (float) $offer->price
                    : (float) $offer->milestones->sum('price');
                $checkoutUrl = '/checkout?offer_token='.urlencode($cart['offer_token']);
            }

            abort_if($usdAmount <= 0, 422);

            return [$usdAmount, $offer->category_slug, $offer->sub_category_id, $checkoutUrl];
        }

        $subCategory = PortfolioSubCategory::find((int) ($cart['subcategory_id'] ?? 0));
        abort_if(! $subCategory || empty($subCategory->plans), 422);

        $planKey = strtolower((string) ($cart['plan'] ?? ''));
        abort_if(! isset($subCategory->plans[$planKey]), 422);

        $rawPrice = $subCategory->plans[$planKey]['price'] ?? '';
        $usdAmount = (float) preg_replace('/[^0-9.]/', '', $rawPrice);
        abort_if($usdAmount <= 0, 422);

        $subcategoryId = (int) ($cart['subcategory_id'] ?? 0) ?: null;
        $checkoutUrl = '/checkout?'.http_build_query([
            'service' => $cart['service'] ?? '',
            'plan' => $cart['plan'] ?? '',
            'price' => '$'.number_format($usdAmount, 2),
            'delivery' => $cart['delivery'] ?? '',
            'category' => $cart['category_id'] ?? '',
            'subcategory' => $cart['subcategory'] ?? '',
            'subcategory_id' => $cart['subcategory_id'] ?? '',
        ]);

        return [$usdAmount, $cart['category_id'] ?? null, $subcategoryId, $checkoutUrl];
    }

    private function createPendingRecords(string $tranId, User $user, string $totalAmount, ?string $categorySlug, ?int $subcategoryId, string $checkoutUrl): void
    {
        DB::table('orders')
            ->where('transaction_id', $tranId)
            ->updateOrInsert([
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone_number,
                'amount' => $totalAmount,
                'status' => 'Pending',
                'address' => $user->address,
                'transaction_id' => $tranId,
                'currency' => 'BDT',
                'category' => $categorySlug,
                'subcategory_id' => $subcategoryId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

        Transaction::create([
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone_number,
            'address' => $user->address,
            'category' => $categorySlug,
            'subcategory_id' => $subcategoryId,
            'checkout_url' => $checkoutUrl,
            'transaction_id' => $tranId,
            'amount' => $totalAmount,
            'currency' => 'BDT',
            'status' => 'Pending',
        ]);
    }

    private function markFailed(string $tranId): void
    {
        DB::table('orders')->where('transaction_id', $tranId)->update(['status' => 'Failed']);
        Transaction::where('transaction_id', $tranId)->update(['status' => 'Failed']);
    }

    private function todayCallCountKey(): string
    {
        return self::CONFIG_CALL_COUNT_KEY_PREFIX.now()->format('Y-m-d');
    }

    private function canRefreshConfigToday(): bool
    {
        return (int) Cache::get($this->todayCallCountKey(), 0) < self::DAILY_CALL_LIMIT;
    }

    private function recordConfigCall(): void
    {
        $key = $this->todayCallCountKey();
        Cache::put($key, (int) Cache::get($key, 0) + 1, now()->endOfDay());
    }
}
