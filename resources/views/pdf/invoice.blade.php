<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; }
    body {
        font-family: 'Helvetica Neue', Arial, 'DejaVu Sans', sans-serif;
        font-size: 12px;
        color: #1e1b3a;
        min-height: 297mm;
        display: flex;
        flex-direction: column;
    }

    /* ===== Header ===== */
    .header {
        position: relative;
        overflow: hidden;
        flex: 0 0 auto;
        padding: 14px 40px 12px;
        background: linear-gradient(135deg, #181830 0%, #2a1c4d 55%, #3a2566 100%);
        border-top: 7px solid #f5841f;
        color: #fff;
    }
    .header-decor { position: absolute; border-radius: 50%; opacity: .12; }
    .header-decor.one { width: 280px; height: 280px; top: -140px; right: -70px; background: #f5841f; }
    .header-decor.two { width: 200px; height: 200px; bottom: -120px; left: 30%; background: #06b6d4; }
    .header-row { position: relative; display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
    .brand .logo-wrap { width: 254px; height: 50px; overflow: hidden; margin-bottom: 10px; }
    .brand .logo-wrap img { display: block; height: 108px; margin-top: -26px; margin-left: -23px; }
    .brand-name { font-size: 22px; font-weight: 700; color: #fff; letter-spacing: 0.5px; margin-bottom: 10px; }
    .brand-contact { font-size: 11px; line-height: 1.9; color: #fff; }
    .header-right { text-align: right; }
    .invoice-title { font-size: 34px; font-weight: 700; letter-spacing: 3px; }
    .invoice-number { font-size: 13px; color: #fff; margin-top: 6px; }
    .invoice-meta { margin-top: 18px; font-size: 11px; color: #fff; line-height: 2; }
    .invoice-meta strong { font-weight: 600; }
    .status-pill {
        display: inline-block;
        margin-top: 10px;
        background: #f5841f;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1.5px;
        padding: 5px 16px;
        border-radius: 20px;
        text-transform: uppercase;
    }

    /* ===== Body ===== */
    .body { position: relative; overflow: hidden; flex: 1 0 auto; padding: 28px 40px; display: flex; flex-direction: column; }
    .watermark {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 520px;
        opacity: 0.05;
        z-index: 5;
        pointer-events: none;
    }

    .bill-to {
        position: relative;
        background: #eef1f8;
        border-radius: 14px;
        border-left: 5px solid #f5841f;
        padding: 18px 24px;
        margin-bottom: 26px;
    }
    .bill-to .label {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1.5px;
        color: #f5841f;
        text-transform: uppercase;
        margin-bottom: 6px;
    }
    .bill-to .name { font-size: 16px; font-weight: 700; color: #1e1b3a; margin-bottom: 10px; }
    .bill-to-grid { display: flex; gap: 40px; }
    .bill-to-grid .col { flex: 1; font-size: 11px; color: #374151; line-height: 2; }
    .bill-to-grid .col-label { display: inline-block; width: 56px; color: #374151; font-weight: 600; }

    /* ===== Items table ===== */
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    table.items thead th {
        background: #2a1c4d;
        color: #fff;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        padding: 12px 16px;
        text-align: left;
    }
    table.items thead th:first-child { width: 48px; text-align: center; border-radius: 8px 0 0 0; }
    table.items thead th:last-child { border-radius: 0 8px 0 0; }
    table.items thead th.text-right { text-align: right; }
    table.items tbody td { padding: 16px; font-size: 12px; color: #374151; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    table.items tbody td:first-child { text-align: center; color: #06b6d4; font-weight: 700; }
    table.items tbody .item-name { font-weight: 700; color: #2a1c4d; margin-bottom: 3px; }
    table.items tbody .item-desc { font-size: 10px; color: #374151; }
    table.items tbody .text-right { text-align: right; font-weight: 600; color: #1e1b3a; }

    /* ===== QR + Totals ===== */
    .verify-box { width: 200px; background: #f3f4f8; border-radius: 14px; padding: 16px; text-align: center; margin-top: auto; }
    .verify-box .label {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1.5px;
        color: #f5841f;
        text-transform: uppercase;
        margin-bottom: 12px;
    }
    .qr-code {
        width: 168px;
        height: 168px;
        margin: 0 auto;
    }
    .verify-box .caption { margin-top: 10px; font-size: 10px; color: #374151; }

    .totals-box { align-self: flex-end; width: 320px; margin-bottom: 24px; background: #f3f4f8; border-radius: 14px; padding: 20px 24px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; color: #374151; }
    .totals-row .value { color: #1e1b3a; font-weight: 600; }
    .grand-total { display: flex; justify-content: space-between; align-items: center; background: #f5841f; border-radius: 10px; padding: 14px 18px; margin-top: 14px; color: #fff; }
    .grand-total .label { font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }
    .grand-total .value { font-size: 18px; font-weight: 700; }

    /* ===== Footer ===== */
    .footer {
        position: relative;
        overflow: hidden;
        flex: 0 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        padding: 18px 40px;
        background: linear-gradient(135deg, #181830 0%, #2a1c4d 55%, #3a2566 100%);
        color: #fff;
        font-size: 10px;
        line-height: 1.8;
    }
    .footer-decor { position: absolute; border-radius: 50%; opacity: .12; background: #f5841f; width: 220px; height: 220px; bottom: -140px; right: -60px; }
    .footer-brand { position: relative; }
    .footer-brand img { height: 60px; display: block; }
    .footer-center { position: relative; flex: 1; text-align: center; }
    .footer-right { position: relative; text-align: right; }
</style>
</head>
<body>

@php
    $logoWhite = base64_encode(file_get_contents(public_path('images/logo/opticore-white.webp')));
    $logoBlue = base64_encode(file_get_contents(public_path('images/logo/opticore.png')));
@endphp

<div class="header">
    <div class="header-decor one"></div>
    <div class="header-decor two"></div>
    <div class="header-row">
        <div class="brand">
            <div class="logo-wrap">
                <img src="data:image/webp;base64,{{ $logoWhite }}" alt="Opticore Solutions Ltd">
            </div>
            <div class="brand-name">Opticore Solutions Limited</div>
            <div class="brand-contact">
                House # 1178, (1st Floor) Apt.- 2E, East Monipur, Mirpur, Dhaka-1216<br>
                +88-01896204400 &nbsp;|&nbsp; osl@opticoresolutionsltd.com<br>
                www.opticoresolutionsltd.com
            </div>
        </div>
        <div class="header-right">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number"># {{ $transaction->invoice_number }}</div>
            <div class="invoice-meta">
                Issue Date: <strong>{{ $transaction->created_at->format('d M, Y') }}</strong>
                @if($transaction->order_number)
                    <br>Order No: <strong>{{ $transaction->order_number }}</strong>
                @endif
            </div>
            <div><span class="status-pill">Paid</span></div>
        </div>
    </div>
</div>

<div class="body">

    <img class="watermark" src="data:image/png;base64,{{ $logoBlue }}" alt="">

    <div class="bill-to">
        <div class="label">Bill To</div>
        <div class="name">{{ $transaction->name }}</div>
        <div class="bill-to-grid">
            <div class="col">
                @if($transaction->email)
                    <div><span class="col-label">Email</span>{{ $transaction->email }}</div>
                @endif
                @if($transaction->phone)
                    <div><span class="col-label">Phone</span>{{ $transaction->phone }}</div>
                @endif
            </div>
            <div class="col">
                @if($transaction->address)
                    <div><span class="col-label">Address</span>{{ $transaction->address }}</div>
                @endif
                @if($country)
                    <div><span class="col-label">Country</span>{{ $country }}</div>
                @endif
            </div>
        </div>
    </div>

    <table class="items">
        <thead>
            <tr>
                <th>#</th>
                <th>Service / Description</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>01</td>
                <td>
                    <div class="item-name">{{ $serviceName ?? 'Digital Service' }}</div>
                    @if($categoryName)
                        <div class="item-desc">Category: {{ $categoryName }}</div>
                    @endif
                </td>
                <td class="text-right">{{ $transaction->currency }} {{ number_format($transaction->amount, 2) }}</td>
                <td class="text-right">1</td>
                <td class="text-right">{{ $transaction->currency }} {{ number_format($transaction->amount, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="totals-box">
        <div class="totals-row">
            <span>Subtotal</span>
            <span class="value">{{ $transaction->currency }} {{ number_format($transaction->amount, 2) }}</span>
        </div>
        <div class="grand-total">
            <span class="label">Total Paid</span>
            <span class="value">{{ $transaction->currency }} {{ number_format($transaction->amount, 2) }}</span>
        </div>
    </div>

    <div class="verify-box">
        <div class="label">Verify Invoice</div>
        <img class="qr-code" src="{{ $qrDataUri }}" alt="QR Code">
        <div class="caption">Scan to verify</div>
    </div>

</div>

<div class="footer">
    <div class="footer-decor"></div>
    <div class="footer-brand">
        <img src="data:image/webp;base64,{{ $logoWhite }}" alt="Opticore Solutions Ltd">
    </div>
    <div class="footer-center">
        Thank you for choosing Opticore Solutions Ltd!<br>
        This is a computer-generated invoice and does not require a physical signature.<br>
        Queries: osl@opticoresolutionsltd.com | +88-01896204400
    </div>
    <div class="footer-right">
        Page 1 of 1<br>
        &copy; {{ now()->year }} Opticore Solutions Ltd
    </div>
</div>

</body>
</html>
