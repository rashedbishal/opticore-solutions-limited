<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Checkout', [
            'item' => [
                'service' => $request->query('service', 'Service'),
                'plan' => $request->query('plan', 'Standard'),
                'price' => $request->query('price', '$10'),
                'delivery' => $request->query('delivery', '4 Days'),
                'category' => $request->query('category', ''),
                'subcategory' => $request->query('subcategory', ''),
            ],
        ]);
    }

    public function process(Request $request): RedirectResponse
    {
        $request->validate([
            'payment_method' => ['required', 'string', 'in:bkash,nagad,card'],
        ]);

        $service = $request->input('service', 'Service');
        $plan = $request->input('plan', 'Standard');
        $price = $request->input('price', '$10');
        $delivery = $request->input('delivery', '4 Days');

        return redirect()->route('profile')->with('invoice', [
            'service' => $service,
            'plan' => $plan,
            'price' => $price,
            'delivery' => $delivery,
            'payment_method' => $request->input('payment_method'),
            'ordered_at' => now()->toIso8601String(),
            'invoice_id' => strtoupper(substr(md5(uniqid()), 0, 8)),
        ]);
    }
}
