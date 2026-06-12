<?php

namespace App\Support;

use App\Models\Offer;
use App\Models\Transaction;
use App\Models\User;

/**
 * Derives "pending order" cards for the profile Orders tab: accepted custom
 * offers (and, for milestone offers, each individual milestone) that don't
 * yet have a matching successful transaction.
 */
class PendingOrderResolver
{
    /**
     * @return list<array{
     *     id: string,
     *     service: string,
     *     plan: string,
     *     amount: string,
     *     currency: string,
     *     date: string|null,
     *     checkout_url: string,
     * }>
     */
    public static function forUser(User $user): array
    {
        $conversation = $user->conversation;

        if (! $conversation) {
            return [];
        }

        $offers = $conversation->offers()
            ->where('status', 'accepted')
            ->with(['subCategory', 'milestones'])
            ->get();

        if ($offers->isEmpty()) {
            return [];
        }

        $paidCounts = Transaction::where('email', $user->email)
            ->whereIn('status', ['Processing', 'Complete'])
            ->get()
            ->groupBy(fn (Transaction $transaction) => self::matchKey(
                $transaction->category,
                $transaction->subcategory_id,
                self::transactionPrice($transaction),
            ))
            ->map(fn ($transactions) => $transactions->count())
            ->all();

        $pendingOrders = [];

        foreach ($offers as $offer) {
            if ($offer->payment_type === 'single') {
                $price = (float) $offer->price;
                $key = self::matchKey($offer->category_slug, $offer->sub_category_id, $price);

                if (($paidCounts[$key] ?? 0) > 0) {
                    continue;
                }

                $pendingOrders[] = self::buildEntry(
                    id: "offer-{$offer->id}",
                    offer: $offer,
                    price: $price,
                    plan: 'Full Payment',
                    deliveryDays: $offer->delivery_days,
                );

                continue;
            }

            $remaining = [];

            foreach ($offer->milestones as $milestone) {
                $price = (float) $milestone->price;
                $key = self::matchKey($offer->category_slug, $offer->sub_category_id, $price);

                if (! array_key_exists($key, $remaining)) {
                    $remaining[$key] = $paidCounts[$key] ?? 0;
                }

                if ($remaining[$key] > 0) {
                    $remaining[$key]--;

                    continue;
                }

                $pendingOrders[] = self::buildEntry(
                    id: "offer-{$offer->id}-milestone-{$milestone->id}",
                    offer: $offer,
                    price: $price,
                    plan: $milestone->name,
                    deliveryDays: $milestone->delivery_days,
                );
            }
        }

        return $pendingOrders;
    }

    private static function matchKey(?string $category, ?int $subcategoryId, float $amount): string
    {
        return sprintf('%s|%s|%.2f', $category ?? '', $subcategoryId ?? '', $amount);
    }

    /**
     * Payment gateways may charge the user in a converted currency (e.g. BDT),
     * so `amount` won't match an offer's USD price. The original USD price is
     * preserved in the `price` query parameter of `checkout_url`.
     */
    private static function transactionPrice(Transaction $transaction): float
    {
        if ($transaction->checkout_url) {
            parse_str((string) parse_url($transaction->checkout_url, PHP_URL_QUERY), $query);

            if (isset($query['price']) && is_string($query['price'])) {
                $price = preg_replace('/[^0-9.]/', '', $query['price']);

                if ($price !== '' && $price !== null) {
                    return (float) $price;
                }
            }
        }

        return (float) $transaction->amount;
    }

    /**
     * @return array{
     *     id: string,
     *     service: string,
     *     plan: string,
     *     amount: string,
     *     currency: string,
     *     date: string|null,
     *     checkout_url: string,
     * }
     */
    private static function buildEntry(string $id, Offer $offer, float $price, string $plan, ?int $deliveryDays): array
    {
        $serviceName = $offer->subCategory?->name
            ?? ($offer->category_slug ? ucwords(str_replace('-', ' ', $offer->category_slug)) : 'Custom Offer');

        return [
            'id' => $id,
            'service' => $serviceName,
            'plan' => $plan,
            'amount' => number_format($price, 2, '.', ''),
            'currency' => 'USD',
            'date' => $offer->updated_at?->format('Y-m-d'),
            'checkout_url' => route('checkout', [
                'service' => $serviceName,
                'plan' => $plan,
                'price' => '$'.number_format($price, 2),
                'delivery' => $deliveryDays ? "{$deliveryDays} Days" : '—',
                'category' => $offer->category_slug ?? '',
                'subcategory' => $offer->subCategory?->name ?? '',
                'subcategory_id' => $offer->sub_category_id ?? 0,
            ]),
        ];
    }
}
