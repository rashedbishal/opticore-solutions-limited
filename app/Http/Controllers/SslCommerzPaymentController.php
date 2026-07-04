<?php

namespace App\Http\Controllers;

use App\Events\OrderCreated;
use App\Events\OrderUpdated;
use App\Events\PaymentReceived;
use App\Events\TaskCreated;
use App\Events\TransactionUpdated;
use App\Jobs\SendPaymentInvoiceEmail;
use App\Library\SslCommerz\SslCommerzNotification;
use App\Models\CheckoutMetadata;
use App\Models\Offer;
use App\Models\PortfolioSubCategory;
use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\Transaction;
use App\Models\User;
use App\Support\IdGenerator;
use App\Support\PaymentReturnToken;
use App\Support\TaskGenerator;
use DB;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

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
            // exchangerate-api.com encodes conversion_rate as a JSON string
            // (e.g. "123.3291"); cast explicitly rather than rely on PHP's
            // numeric-string coercion in the multiplication below.
            $totalAmount = (string) round($usdAmount * (float) $rate);
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

        // Link any client-provided notes and pre-uploaded files to this transaction.
        $this->storeCheckoutMetadata(
            $post_data['tran_id'],
            $user->id,
            $cartData->notes ?? null,
            $cartData->upload_token ?? null,
        );

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
                if (! $this->claimOrderForProcessing($tran_id)) {
                    // Lost the race: the IPN webhook (or a duplicate call)
                    // already claimed and is processing this transaction.
                    // Treat it the same as an already-processed order
                    // instead of repeating the invoice email/task creation.
                    return $this->alreadyProcessedSuccessRedirect($request, $tran_id);
                }

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

                    SendPaymentInvoiceEmail::dispatch($transaction);
                    $this->provisionWorkflowTask($transaction);

                    PaymentReceived::dispatch($transaction);
                }

                Cache::forget('admin.transactions.filter-options');
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
            console.log("IPN HIT!");
            return $this->alreadyProcessedSuccessRedirect($request, $tran_id);
        }

        return redirect()->route('home')->with('payment_error', 'Payment validation failed. Please contact support.');
    }

    /**
     * Shared response for the success() callback when the order was already
     * marked Processing/Complete by the time this call ran — either because
     * it was genuinely processed earlier, or because a concurrent callback
     * (the IPN webhook typically fires around the same time as the browser
     * redirect) won the claimOrderForProcessing() race for this transaction.
     */
    private function alreadyProcessedSuccessRedirect(Request $request, string $tran_id)
    {
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

    /**
     * Atomically flip the order from Pending to Processing. SSLCommerz fires
     * the browser-redirect success() callback and the server-to-server ipn()
     * webhook independently for the same transaction, often within
     * milliseconds of each other; both can reach this point having read
     * status "Pending". This conditional UPDATE ensures only one of them
     * actually wins the flip (the DB guarantees a single row-affecting
     * writer), so only the winner sends the invoice email and provisions
     * the workflow task.
     */
    private function claimOrderForProcessing(string $tran_id): bool
    {
        return DB::table('orders')
            ->where('transaction_id', $tran_id)
            ->where('status', 'Pending')
            ->update(['status' => 'Processing']) > 0;
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

        $this->cleanupCheckoutMetadata($tran_id);

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

        $this->cleanupCheckoutMetadata($tran_id);

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
                if (! $this->claimOrderForProcessing($tran_id)) {
                    // Lost the race: the browser-redirect success() callback
                    // (or a duplicate IPN retry) already claimed and is
                    // processing this transaction — acknowledge without
                    // repeating the invoice email/task creation.
                    return response('ALREADY PROCESSED', 200);
                }

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

                    SendPaymentInvoiceEmail::dispatch($transaction);
                    $this->provisionWorkflowTask($transaction);

                    PaymentReceived::dispatch($transaction);
                }

                Cache::forget('admin.transactions.filter-options');
                TransactionUpdated::dispatch();
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

    private function provisionWorkflowTask(Transaction $transaction): void
    {
        $task = TaskGenerator::createFromTransaction($transaction);

        if ($task) {
            $this->applyCheckoutMetadata($task, $transaction->transaction_id);
            TaskCreated::dispatch();
        }
    }

    /**
     * Store or update checkout metadata (notes + pre-uploaded files) keyed by
     * transaction_id. Called just after the orders/transactions records are
     * written, so it's always in place by the time success/ipn fires.
     */
    private function storeCheckoutMetadata(string $transactionId, int $userId, ?string $notes, ?string $uploadToken): void
    {
        if ($uploadToken) {
            // Associate the pre-uploaded files with this transaction.
            CheckoutMetadata::where('upload_token', $uploadToken)
                ->where('user_id', $userId)
                ->update([
                    'transaction_id' => $transactionId,
                    'notes' => $notes ?: null,
                ]);

            return;
        }

        if ($notes) {
            // Notes only — no file upload took place.
            CheckoutMetadata::create([
                'transaction_id' => $transactionId,
                'user_id' => $userId,
                'notes' => $notes,
            ]);
        }
    }

    /**
     * Move pre-uploaded temp files to their permanent location under the task
     * and create TaskAttachment records. The checkout_metadata row is removed
     * once consumed.
     */
    private function applyCheckoutMetadata(Task $task, string $transactionId): void
    {
        $metadata = CheckoutMetadata::where('transaction_id', $transactionId)->first();

        if (! $metadata) {
            return;
        }

        if ($metadata->notes) {
            $task->update(['notes' => $metadata->notes]);
        }

        if ($metadata->attachment_paths) {
            foreach ($metadata->attachment_paths as $file) {
                $destination = 'task_uploads/tasks/'.$task->id.'/'.basename($file['path']);
                Storage::disk('local')->move($file['path'], $destination);

                TaskAttachment::create([
                    'task_id' => $task->id,
                    'file_path' => $destination,
                    'original_name' => $file['original_name'],
                    'mime_type' => $file['mime_type'],
                    'size' => $file['size'],
                ]);
            }
        }

        $metadata->delete();
    }

    /**
     * Delete any temp files and the metadata row when a payment fails or is
     * cancelled, so orphaned uploads don't accumulate indefinitely.
     */
    private function cleanupCheckoutMetadata(string $transactionId): void
    {
        $metadata = CheckoutMetadata::where('transaction_id', $transactionId)->first();

        if (! $metadata) {
            return;
        }

        if ($metadata->attachment_paths) {
            foreach ($metadata->attachment_paths as $file) {
                Storage::disk('local')->delete($file['path']);
            }
        }

        $metadata->delete();
    }
}
