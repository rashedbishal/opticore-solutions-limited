<?php

namespace App\Support;

use App\Models\PortfolioSubCategory;
use App\Models\Transaction;
use App\Models\User;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Spatie\LaravelPdf\Facades\Pdf;
use Spatie\LaravelPdf\PdfBuilder;

/**
 * Builds the "pdf.invoice" view with all data it needs: service/category
 * labels, the customer's country, and a QR code linking to the invoice
 * verification page.
 */
class InvoicePdfBuilder
{
    /**
     * Render the invoice PDF, caching the bytes on disk once an
     * invoice_number exists. Rendering spawns headless Chrome via
     * Browsershot per call, but a transaction's invoice_number is only
     * ever assigned once (during the SSLCommerz success/IPN transition)
     * and its fields never change afterward, so re-rendering on every
     * repeat view/download is pure waste. Transactions without an
     * invoice_number yet (e.g. an admin previewing a still-pending order)
     * are rendered fresh every time, since their data isn't final.
     */
    public static function cachedContent(Transaction $transaction): string
    {
        if (! $transaction->invoice_number) {
            return self::build($transaction)->generatePdfContent();
        }

        $path = self::cachePath($transaction);

        if (Storage::disk('local')->exists($path)) {
            return Storage::disk('local')->get($path);
        }

        $content = self::build($transaction)->generatePdfContent();

        Storage::disk('local')->put($path, $content);

        return $content;
    }

    private static function cachePath(Transaction $transaction): string
    {
        return 'invoices/'.$transaction->invoice_number.'.pdf';
    }

    public static function build(Transaction $transaction): PdfBuilder
    {
        $subcategory = $transaction->subcategory_id
            ? PortfolioSubCategory::find($transaction->subcategory_id)
            : null;

        $serviceName = $subcategory?->name;
        $categoryName = $transaction->category
            ? ucwords(str_replace('-', ' ', $transaction->category))
            : null;
        $country = User::where('email', $transaction->email)->value('country');

        $token = strtr(Crypt::encryptString((string) $transaction->id), '+/', '-_');
        $verifyUrl = route('orders.invoice.verify', ['token' => $token]);

        $qrDataUri = (new Builder)->build(
            writer: new PngWriter,
            data: $verifyUrl,
            errorCorrectionLevel: ErrorCorrectionLevel::High,
            size: 340,
            margin: 1,
        )->getDataUri();

        return Pdf::view('pdf.invoice', compact('transaction', 'serviceName', 'categoryName', 'country', 'qrDataUri'))
            ->format('a4')
            ->margins(0, 0, 0, 0);
    }
}
