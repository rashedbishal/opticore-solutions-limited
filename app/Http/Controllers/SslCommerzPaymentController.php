<?php

namespace App\Http\Controllers;

use App\Events\OrderCreated;
use App\Events\OrderUpdated;
use App\Events\PaymentReceived;
use App\Events\TaskCreated;
use App\Events\TransactionUpdated;
use App\Library\SslCommerz\SslCommerzNotification;
use App\Mail\PaymentSuccessMail;
use App\Models\Offer;
use App\Models\PortfolioSubCategory;
use App\Models\Transaction;
use App\Models\User;
use App\Support\IdGenerator;
use App\Support\InvoicePdfBuilder;
use App\Support\PaymentReturnToken;
use App\Support\TaskGenerator;
use DB;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

class SslCommerzPaymentController extends Controller
{
    public function payViaAjax(Request $request)
    {
        $user = $request->user();
        $cartData = json_decode($request->cart_json);
        $currency = in_array($cartData->currency ?? 'USD', ['USD', 'BDT'])
            ? ($cartData->currency ?? 'USD')
            : 'USD';

        // Resolve the canonical price and service context from the database.
        // The frontend-submitted amount is never used.
        if (! empty($cartData->offer_token)) {
            // Custom plan: price comes from the accepted offer record
            $offer = Offer::where('offer_token', $cartData->offer_token)
                ->with(['conversation', 'milestones'])
                ->firstOrFail();

            abort_if($offer->conversation->user_id !== $user->id, 403);
            abort_if($offer->status !== 'accepted', 422);

            if (! empty($cartData->milestone_id)) {
                $milestone = $offer->milestones->firstWhere('id', (int) $cartData->milestone_id);
                abort_if(! $milestone, 422);
                $usdAmount = (float) $milestone->price;
                $checkoutUrl = '/checkout?offer_token='.urlencode($cartData->offer_token).'&milestone_id='.urlencode((string) $cartData->milestone_id);
            } else {
                $usdAmount = $offer->payment_type === 'single'
                    ? (float) $offer->price
                    : (float) $offer->milestones->sum('price');
                $checkoutUrl = '/checkout?offer_token='.urlencode($cartData->offer_token);
            }

            abort_if($usdAmount <= 0, 422);
            $categorySlug = $offer->category_slug;
            $subcategoryId = $offer->sub_category_id;
        } else {
            // Standard plan: price comes from the sub-category's plans JSON
            $subCategory = PortfolioSubCategory::find((int) ($cartData->subcategory_id ?? 0));
            abort_if(! $subCategory || empty($subCategory->plans), 422);

            $planKey = strtolower((string) ($cartData->plan ?? ''));
            abort_if(! isset($subCategory->plans[$planKey]), 422);

            $rawPrice = $subCategory->plans[$planKey]['price'] ?? '';
            $usdAmount = (float) preg_replace('/[^0-9.]/', '', $rawPrice);
            abort_if($usdAmount <= 0, 422);
            $categorySlug = $cartData->category_id ?? null;
            $subcategoryId = (int) ($cartData->subcategory_id ?? 0) ?: null;
            $checkoutUrl = '/checkout?'.http_build_query([
                'service' => $cartData->service ?? '',
                'plan' => $cartData->plan ?? '',
                'price' => '$'.number_format($usdAmount, 2),
                'delivery' => $cartData->delivery ?? '',
                'category' => $cartData->category_id ?? '',
                'subcategory' => $cartData->subcategory ?? '',
                'subcategory_id' => $cartData->subcategory_id ?? '',
            ]);
        }

        // Apply BDT conversion server-side using the same cached exchange rate
        // as the checkout page, so the user always sees a consistent rate.
        if ($currency === 'BDT') {
            $rate = Cache::remember('exchange_rate_usd_bdt', now()->addHours(6), function () {
                try {
                    $response = Http::get('https://v6.exchangerate-api.com/v6/'.config('services.exchangerate.key').'/pair/USD/BDT');
                } catch (ConnectionException) {
                    return null;
                }

                return $response->json('conversion_rate');
            });
            abort_if(! $rate, 422);
            $totalAmount = (string) round($usdAmount * $rate);
        } else {
            $totalAmount = (string) $usdAmount;
        }

        $post_data = [];
        $post_data['total_amount'] = $totalAmount;
        $post_data['currency'] = $currency;
        $post_data['tran_id'] = IdGenerator::transactionId();
        $post_data['value_c'] = PaymentReturnToken::generate($post_data['tran_id']);

        // CUSTOMER INFORMATION
        $post_data['cus_name'] = $user->name;
        $post_data['cus_email'] = $user->email;
        $post_data['cus_add1'] = $user->address;
        $post_data['cus_add2'] = '';
        $post_data['cus_city'] = '';
        $post_data['cus_state'] = '';
        $post_data['cus_postcode'] = '';
        $post_data['cus_country'] = $user->country;
        $post_data['cus_phone'] = $user->phone_number;
        $post_data['cus_fax'] = '';

        $post_data['shipping_method'] = 'NO';
        $post_data['product_name'] = 'Service';
        $post_data['product_category'] = 'Virtual';
        $post_data['product_profile'] = 'Virtual';

        // Service identifiers passed through SSLCommerz and available in success/IPN callbacks
        $post_data['value_a'] = $categorySlug;
        $post_data['value_b'] = $subcategoryId;
        $post_data['value_d'] = '';

        // Pending order record (SSLCommerz convention)
        DB::table('orders')
            ->where('transaction_id', $post_data['tran_id'])
            ->updateOrInsert([
                'name' => $post_data['cus_name'],
                'email' => $post_data['cus_email'],
                'phone' => $post_data['cus_phone'],
                'amount' => $totalAmount,
                'status' => 'Pending',
                'address' => $post_data['cus_add1'],
                'transaction_id' => $post_data['tran_id'],
                'currency' => $currency,
                'category' => $categorySlug,
                'subcategory_id' => $subcategoryId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

        // Full transaction record
        Transaction::create([
            'name' => $post_data['cus_name'],
            'email' => $post_data['cus_email'],
            'phone' => $post_data['cus_phone'],
            'address' => $post_data['cus_add1'],
            'category' => $categorySlug,
            'subcategory_id' => $subcategoryId,
            'checkout_url' => $checkoutUrl,
            'transaction_id' => $post_data['tran_id'],
            'amount' => $totalAmount,
            'currency' => $currency,
            'status' => 'Pending',
        ]);

        OrderCreated::dispatch();

        $sslc = new SslCommerzNotification;
        $payment_options = $sslc->makePayment($post_data, 'checkout', 'json');

        if (! is_array($payment_options)) {
            print_r($payment_options);
            $payment_options = [];
        }
    }

    public function success(Request $request)
    {
        $tran_id = $request->input('tran_id');

        $sslc = new SslCommerzNotification;

        $order_details = DB::table('orders')
            ->where('transaction_id', $tran_id)
            ->select('transaction_id', 'status', 'currency', 'amount')
            ->first();

        if ($order_details && $order_details->status === 'Pending') {
            $validation = $sslc->orderValidate($request->all(), $tran_id, $order_details->amount, $order_details->currency);

            if ($validation) {
                DB::table('orders')
                    ->where('transaction_id', $tran_id)
                    ->update(['status' => 'Processing']);

                $invoiceNumber = IdGenerator::invoiceNumber();

                $transaction = Transaction::where('transaction_id', $tran_id)->first();

                if ($transaction) {
                    $transaction->update([
                        'status' => 'Processing',
                        'invoice_number' => $invoiceNumber,
                        'val_id' => $request->input('val_id'),
                        'card_type' => $request->input('card_type'),
                        'store_amount' => $request->input('store_amount'),
                        'card_no' => $request->input('card_no'),
                        'bank_tran_id' => $request->input('bank_tran_id'),
                        'tran_date' => $request->input('tran_date'),
                        'error' => $request->input('error'),
                        'card_issuer' => $request->input('card_issuer'),
                        'card_brand' => $request->input('card_brand'),
                        'card_sub_brand' => $request->input('card_sub_brand'),
                        'card_issuer_country' => $request->input('card_issuer_country'),
                        'card_issuer_country_code' => $request->input('card_issuer_country_code'),
                        'store_id' => $request->input('store_id'),
                        'verify_sign' => $request->input('verify_sign'),
                        'verify_sign_sha2' => $request->input('verify_sign_sha2'),
                        'currency_type' => $request->input('currency_type'),
                        'currency_amount' => $request->input('currency_amount'),
                        'currency_rate' => $request->input('currency_rate'),
                        'base_fair' => $request->input('base_fair'),
                        'subscription_id' => $request->input('subscription_id'),
                        'risk_level' => $request->input('risk_level'),
                        'risk_title' => $request->input('risk_title'),
                    ]);

                    $this->sendInvoiceEmail($transaction);
                    $this->provisionWorkflowTask($transaction);

                    PaymentReceived::dispatch($transaction);
                }

                TransactionUpdated::dispatch();
                OrderUpdated::dispatch();

                if (PaymentReturnToken::consume($tran_id, $request->input('value_c'))) {
                    $this->loginUserFromTransaction($request, $tran_id);
                }

                return redirect()->route('profile')->with('payment_success', [
                    'invoice_number' => $invoiceNumber,
                    'amount' => (string) $transaction?->amount,
                    'currency' => $transaction?->currency,
                    'tran_id' => $tran_id,
                ]);
            }
        } elseif ($order_details && ($order_details->status === 'Processing' || $order_details->status === 'Complete')) {
            $existing = Transaction::where('transaction_id', $tran_id)->first();

            if (PaymentReturnToken::consume($tran_id, $request->input('value_c'))) {
                $this->loginUserFromTransaction($request, $tran_id);
            }

            return redirect()->route('profile')->with('payment_success', [
                'invoice_number' => $existing?->invoice_number,
                'amount' => (string) $existing?->amount,
                'currency' => $existing?->currency,
                'tran_id' => $tran_id,
            ]);
        }

        return redirect()->route('home')->with('payment_error', 'Payment validation failed. Please contact support.');
    }

    public function fail(Request $request)
    {
        $tran_id = $request->input('tran_id');
        $signatureValid = $this->verifySSLCommerzSignature($request);

        $order_details = DB::table('orders')
            ->where('transaction_id', $tran_id)
            ->select('transaction_id', 'status')
            ->first();

        if ($signatureValid && $order_details && $order_details->status === 'Pending') {
            DB::table('orders')->where('transaction_id', $tran_id)->update(['status' => 'Failed']);
            Transaction::where('transaction_id', $tran_id)->update(['status' => 'Failed']);
            OrderUpdated::dispatch();
        }

        TransactionUpdated::dispatch();

        $checkoutUrl = Transaction::where('transaction_id', $tran_id)->value('checkout_url');

        if ($signatureValid && PaymentReturnToken::consume($tran_id, $request->input('value_c'))) {
            $this->loginUserFromTransaction($request, $tran_id);
        }

        return redirect()->route('home')
            ->with('payment_error', 'Payment failed. Please try again.')
            ->with('checkout_url', $checkoutUrl);
    }

    public function cancel(Request $request)
    {
        $tran_id = $request->input('tran_id');
        $signatureValid = $this->verifySSLCommerzSignature($request);

        $order_details = DB::table('orders')
            ->where('transaction_id', $tran_id)
            ->select('transaction_id', 'status')
            ->first();

        if ($signatureValid && $order_details && $order_details->status === 'Pending') {
            DB::table('orders')->where('transaction_id', $tran_id)->update(['status' => 'Cancelled']);
            Transaction::where('transaction_id', $tran_id)->update(['status' => 'Cancelled']);
            OrderUpdated::dispatch();
        }

        TransactionUpdated::dispatch();

        $checkoutUrl = Transaction::where('transaction_id', $tran_id)->value('checkout_url');

        if ($signatureValid && PaymentReturnToken::consume($tran_id, $request->input('value_c'))) {
            $this->loginUserFromTransaction($request, $tran_id);
        }

        return redirect()->route('home')
            ->with('payment_error', 'Payment was cancelled.')
            ->with('checkout_url', $checkoutUrl);
    }

    public function ipn(Request $request)
    {
        if (! $request->input('tran_id')) {
            return response('INVALID DATA', 400);
        }

        $tran_id = $request->input('tran_id');

        $order_details = DB::table('orders')
            ->where('transaction_id', $tran_id)
            ->select('transaction_id', 'status', 'currency', 'amount')
            ->first();

        if (! $order_details) {
            return response('INVALID TRANSACTION', 400);
        }

        if ($order_details->status === 'Pending') {
            $sslc = new SslCommerzNotification;
            $validation = $sslc->orderValidate($request->all(), $tran_id, $order_details->amount, $order_details->currency);

            if ($validation) {
                DB::table('orders')->where('transaction_id', $tran_id)->update(['status' => 'Processing']);

                $invoiceNumber = IdGenerator::invoiceNumber();

                $transaction = Transaction::where('transaction_id', $tran_id)->first();

                if ($transaction) {
                    $transaction->update([
                        'status' => 'Processing',
                        'invoice_number' => $invoiceNumber,
                        'val_id' => $request->input('val_id'),
                        'card_type' => $request->input('card_type'),
                        'store_amount' => $request->input('store_amount'),
                        'card_no' => $request->input('card_no'),
                        'bank_tran_id' => $request->input('bank_tran_id'),
                        'tran_date' => $request->input('tran_date'),
                        'error' => $request->input('error'),
                        'card_issuer' => $request->input('card_issuer'),
                        'card_brand' => $request->input('card_brand'),
                        'card_sub_brand' => $request->input('card_sub_brand'),
                        'card_issuer_country' => $request->input('card_issuer_country'),
                        'card_issuer_country_code' => $request->input('card_issuer_country_code'),
                        'store_id' => $request->input('store_id'),
                        'verify_sign' => $request->input('verify_sign'),
                        'verify_sign_sha2' => $request->input('verify_sign_sha2'),
                        'currency_type' => $request->input('currency_type'),
                        'currency_amount' => $request->input('currency_amount'),
                        'currency_rate' => $request->input('currency_rate'),
                        'base_fair' => $request->input('base_fair'),
                        'subscription_id' => $request->input('subscription_id'),
                        'risk_level' => $request->input('risk_level'),
                        'risk_title' => $request->input('risk_title'),
                    ]);

                    $this->sendInvoiceEmail($transaction);
                    $this->provisionWorkflowTask($transaction);
                }

                OrderUpdated::dispatch();

                return response('IPN OK', 200);
            }

            return response('SIGNATURE MISMATCH', 400);

        } elseif ($order_details->status === 'Processing' || $order_details->status === 'Complete') {
            return response('ALREADY PROCESSED', 200);
        }

        return response('INVALID TRANSACTION', 400);
    }

    private function verifySSLCommerzSignature(Request $request): bool
    {
        $postData = $request->all();

        if (empty($postData['verify_sign']) || empty($postData['verify_key'])) {
            return false;
        }

        $keys = explode(',', $postData['verify_key']);
        $hashData = [];

        foreach ($keys as $key) {
            $hashData[$key] = $postData[$key] ?? '';
        }

        $hashData['store_passwd'] = md5(config('sslcommerz.apiCredentials.store_password'));

        ksort($hashData);

        $hashString = '';
        foreach ($hashData as $key => $value) {
            $hashString .= $key.'='.$value.'&';
        }

        return md5(rtrim($hashString, '&')) === $postData['verify_sign'];
    }

    private function loginUserFromTransaction(Request $request, string $tran_id): void
    {
        $transaction = Transaction::where('transaction_id', $tran_id)->first();

        if ($transaction && $transaction->email) {
            $user = User::where('email', $transaction->email)->first();

            if ($user) {
                Auth::login($user);
                $request->session()->regenerate();
            }
        }
    }

    private function sendInvoiceEmail(Transaction $transaction): void
    {
        if (! $transaction->email) {
            return;
        }

        $subcategory = $transaction->subcategory_id
            ? PortfolioSubCategory::find($transaction->subcategory_id)
            : null;

        $serviceName = $subcategory?->name;
        $categoryName = $transaction->category
            ? ucwords(str_replace('-', ' ', $transaction->category))
            : null;

        $pdfContent = InvoicePdfBuilder::build($transaction)->generatePdfContent();

        Mail::to($transaction->email)->send(
            new PaymentSuccessMail($transaction, $pdfContent, $serviceName, $categoryName)
        );
    }

    private function provisionWorkflowTask(Transaction $transaction): void
    {
        $task = TaskGenerator::createFromTransaction($transaction);

        if ($task) {
            TaskCreated::dispatch();
        }
    }
}
