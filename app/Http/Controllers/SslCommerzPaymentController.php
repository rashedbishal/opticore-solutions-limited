<?php

namespace App\Http\Controllers;

use App\Events\OrderCreated;
use App\Events\OrderUpdated;
use App\Events\TaskCreated;
use App\Events\TransactionUpdated;
use App\Library\SslCommerz\SslCommerzNotification;
use App\Mail\PaymentSuccessMail;
use App\Models\PortfolioSubCategory;
use App\Models\Transaction;
use App\Models\User;
use App\Support\TaskGenerator;
use DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Spatie\LaravelPdf\Facades\Pdf;

class SslCommerzPaymentController extends Controller
{
    public function exampleEasyCheckout()
    {
        return view('exampleEasycheckout');
    }

    public function exampleHostedCheckout()
    {
        return view('exampleHosted');
    }

    public function index(Request $request)
    {
        $post_data = [];
        $post_data['total_amount'] = '10';
        $post_data['currency'] = 'BDT';
        $post_data['tran_id'] = uniqid();

        $post_data['cus_name'] = 'Customer Name';
        $post_data['cus_email'] = 'customer@mail.com';
        $post_data['cus_add1'] = 'Customer Address';
        $post_data['cus_add2'] = '';
        $post_data['cus_city'] = '';
        $post_data['cus_state'] = '';
        $post_data['cus_postcode'] = '';
        $post_data['cus_country'] = 'Bangladesh';
        $post_data['cus_phone'] = '8801XXXXXXXXX';
        $post_data['cus_fax'] = '';

        $post_data['ship_name'] = 'Store Test';
        $post_data['ship_add1'] = 'Dhaka';
        $post_data['ship_add2'] = 'Dhaka';
        $post_data['ship_city'] = 'Dhaka';
        $post_data['ship_state'] = 'Dhaka';
        $post_data['ship_postcode'] = '1000';
        $post_data['ship_phone'] = '';
        $post_data['ship_country'] = 'Bangladesh';

        $post_data['shipping_method'] = 'NO';
        $post_data['product_name'] = 'Computer';
        $post_data['product_category'] = 'Goods';
        $post_data['product_profile'] = 'physical-goods';

        $post_data['value_a'] = 'ref001';
        $post_data['value_b'] = 'ref002';
        $post_data['value_c'] = 'ref003';
        $post_data['value_d'] = 'ref004';

        DB::table('orders')
            ->where('transaction_id', $post_data['tran_id'])
            ->updateOrInsert([
                'name' => $post_data['cus_name'],
                'email' => $post_data['cus_email'],
                'phone' => $post_data['cus_phone'],
                'amount' => $post_data['total_amount'],
                'status' => 'Pending',
                'address' => $post_data['cus_add1'],
                'transaction_id' => $post_data['tran_id'],
                'currency' => $post_data['currency'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

        $sslc = new SslCommerzNotification;
        $payment_options = $sslc->makePayment($post_data, 'hosted');

        if (! is_array($payment_options)) {
            print_r($payment_options);
            $payment_options = [];
        }
    }

    public function payViaAjax(Request $request)
    {
        $user = $request->user();
        $cartData = json_decode($request->cart_json);

        $post_data = [];
        $post_data['total_amount'] = $cartData->total_amount;
        $post_data['currency'] = $cartData->currency;
        $post_data['tran_id'] = uniqid();

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

        // Service identifiers — retrieved in success/ipn via value_a and value_b
        $post_data['value_a'] = $cartData->category_id;
        $post_data['value_b'] = $cartData->subcategory_id;
        $post_data['value_c'] = '';
        $post_data['value_d'] = '';

        // Pending order record (SSLCommerz convention)
        DB::table('orders')
            ->where('transaction_id', $post_data['tran_id'])
            ->updateOrInsert([
                'name' => $post_data['cus_name'],
                'email' => $post_data['cus_email'],
                'phone' => $post_data['cus_phone'],
                'amount' => $post_data['total_amount'],
                'status' => 'Pending',
                'address' => $post_data['cus_add1'],
                'transaction_id' => $post_data['tran_id'],
                'currency' => $post_data['currency'],
                'category' => $post_data['value_a'],
                'subcategory_id' => $post_data['value_b'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

        $checkoutUrl = '/checkout?'.http_build_query([
            'service' => $cartData->service ?? '',
            'plan' => $cartData->plan ?? '',
            'price' => $cartData->price ?? '',
            'delivery' => $cartData->delivery ?? '',
            'category' => $cartData->category_id ?? '',
            'subcategory' => $cartData->subcategory ?? '',
            'subcategory_id' => $cartData->subcategory_id ?? '',
        ]);

        // Full transaction record
        Transaction::create([
            'name' => $post_data['cus_name'],
            'email' => $post_data['cus_email'],
            'phone' => $post_data['cus_phone'],
            'address' => $post_data['cus_add1'],
            'category' => $post_data['value_a'],
            'subcategory_id' => $post_data['value_b'] ?: null,
            'checkout_url' => $checkoutUrl,
            'transaction_id' => $post_data['tran_id'],
            'amount' => $post_data['total_amount'],
            'currency' => $post_data['currency'],
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

        if ($order_details->status === 'Pending') {
            $validation = $sslc->orderValidate($request->all(), $tran_id, $order_details->amount, $order_details->currency);

            if ($validation) {
                DB::table('orders')
                    ->where('transaction_id', $tran_id)
                    ->update(['status' => 'Processing']);

                $invoiceNumber = 'INV-'.strtoupper(Str::random(8));

                $transaction = Transaction::where('transaction_id', $tran_id)->first();

                // Capture original amount/currency before overwriting with SSLCommerz callback values
                $originalAmount = $transaction?->amount;
                $originalCurrency = $transaction?->currency;

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
                        'currency' => $request->input('currency'),
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

                TransactionUpdated::dispatch();
                OrderUpdated::dispatch();

                $this->loginUserFromTransaction($tran_id);

                return redirect()->route('profile')->with('payment_success', [
                    'invoice_number' => $invoiceNumber,
                    'amount' => (string) $originalAmount,
                    'currency' => $originalCurrency,
                    'tran_id' => $tran_id,
                ]);
            }
        } elseif ($order_details->status === 'Processing' || $order_details->status === 'Complete') {
            $existing = Transaction::where('transaction_id', $tran_id)->first();

            $this->loginUserFromTransaction($tran_id);

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

        $order_details = DB::table('orders')
            ->where('transaction_id', $tran_id)
            ->select('transaction_id', 'status')
            ->first();

        if ($order_details && $order_details->status === 'Pending') {
            DB::table('orders')->where('transaction_id', $tran_id)->update(['status' => 'Failed']);
            Transaction::where('transaction_id', $tran_id)->update(['status' => 'Failed']);
            OrderUpdated::dispatch();
        }

        TransactionUpdated::dispatch();

        $this->loginUserFromTransaction($tran_id);

        $checkoutUrl = Transaction::where('transaction_id', $tran_id)->value('checkout_url');

        return redirect()->route('home')
            ->with('payment_error', 'Payment failed. Please try again.')
            ->with('checkout_url', $checkoutUrl);
    }

    public function cancel(Request $request)
    {
        $tran_id = $request->input('tran_id');

        $order_details = DB::table('orders')
            ->where('transaction_id', $tran_id)
            ->select('transaction_id', 'status')
            ->first();

        if ($order_details && $order_details->status === 'Pending') {
            DB::table('orders')->where('transaction_id', $tran_id)->update(['status' => 'Cancelled']);
            Transaction::where('transaction_id', $tran_id)->update(['status' => 'Cancelled']);
            OrderUpdated::dispatch();
        }

        TransactionUpdated::dispatch();

        $this->loginUserFromTransaction($tran_id);

        $checkoutUrl = Transaction::where('transaction_id', $tran_id)->value('checkout_url');

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

        if ($order_details->status === 'Pending') {
            $sslc = new SslCommerzNotification;
            $validation = $sslc->orderValidate($request->all(), $tran_id, $order_details->amount, $order_details->currency);

            if ($validation) {
                DB::table('orders')->where('transaction_id', $tran_id)->update(['status' => 'Processing']);

                $invoiceNumber = 'INV-'.strtoupper(Str::random(8));

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
                        'currency' => $request->input('currency'),
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

    private function loginUserFromTransaction(string $tran_id): void
    {
        $transaction = Transaction::where('transaction_id', $tran_id)->first();

        if ($transaction && $transaction->email) {
            $user = User::where('email', $transaction->email)->first();

            if ($user) {
                Auth::login($user);
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

        $pdfContent = Pdf::view('pdf.invoice', compact('transaction', 'serviceName', 'categoryName'))
            ->generatePdfContent();

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
