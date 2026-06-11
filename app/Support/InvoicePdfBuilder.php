<?php

namespace App\Support;

use App\Models\PortfolioSubCategory;
use App\Models\Transaction;
use App\Models\User;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Support\Facades\Crypt;
use Spatie\LaravelPdf\Facades\Pdf;
use Spatie\LaravelPdf\PdfBuilder;

/**
 * Builds the "pdf.invoice" view with all data it needs: service/category
 * labels, the customer's country, and a QR code linking to the invoice
 * verification page.
 */
class InvoicePdfBuilder
{
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
