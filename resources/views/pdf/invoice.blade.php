<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 13px; color: #1a1a2e; background: #fff; }
    .page { padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #06b6d4; padding-bottom: 24px; margin-bottom: 28px; }
    .brand { font-size: 22px; font-weight: 700; color: #06b6d4; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .invoice-meta { text-align: right; }
    .invoice-meta .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .invoice-meta .value { font-size: 14px; font-weight: 600; color: #1a1a2e; }
    .invoice-meta .invoice-num { font-size: 18px; font-weight: 700; color: #06b6d4; }
    .status-badge { display: inline-block; background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px; }
    .section-title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
    .info-grid { display: flex; gap: 40px; margin-bottom: 28px; }
    .info-block { flex: 1; }
    .info-block p { font-size: 13px; color: #374151; line-height: 1.7; }
    .info-block strong { color: #1a1a2e; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead { background: #0e7490; color: #fff; }
    thead th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    tbody tr:nth-child(even) { background: #f0fdff; }
    tbody td { padding: 11px 14px; font-size: 13px; color: #374151; border-bottom: 1px solid #e5e7eb; }
    .amount-cell { font-weight: 700; color: #1a1a2e; }
    .total-row { background: #ecfeff !important; }
    .total-row td { font-weight: 700; font-size: 14px; color: #0e7490; border-bottom: none; border-top: 2px solid #06b6d4; }
    .footer { margin-top: 36px; border-top: 1px solid #e5e7eb; padding-top: 18px; text-align: center; color: #9ca3af; font-size: 11px; line-height: 1.8; }
    .footer strong { color: #374151; }
    .txn-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px; }
    .txn-box .row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; }
    .txn-box .row span:first-child { color: #6b7280; }
    .txn-box .row span:last-child { font-weight: 600; color: #1a1a2e; }
</style>
</head>
<body>
<div class="page">

    <div class="header">
        <div>
            <div class="brand">Opticore Solutions Ltd.</div>
            <div class="brand-sub">Digital Agency — Bangladesh</div>
        </div>
        <div class="invoice-meta">
            <div class="label">Invoice</div>
            <div class="invoice-num">#{{ $transaction->invoice_number }}</div>
            @if($transaction->order_number)
            <div class="label" style="margin-top:6px;">Order Number</div>
            <div class="value">{{ $transaction->order_number }}</div>
            @endif
            <div class="label" style="margin-top:6px;">Date</div>
            <div class="value">{{ now()->format('d M Y') }}</div>
            <div><span class="status-badge">Paid</span></div>
        </div>
    </div>

    <div class="info-grid">
        <div class="info-block">
            <div class="section-title">Billed To</div>
            <p><strong>{{ $transaction->name }}</strong></p>
            @if($transaction->email)
            <p>{{ $transaction->email }}</p>
            @endif
            @if($transaction->phone)
            <p>{{ $transaction->phone }}</p>
            @endif
            @if($transaction->address)
            <p>{{ $transaction->address }}</p>
            @endif
        </div>
        <div class="info-block">
            <div class="section-title">Service Details</div>
            <p><strong>{{ $serviceName ?? 'Digital Service' }}</strong></p>
            @if($categoryName)
            <p>Category: {{ $categoryName }}</p>
            @endif
            <p>Status: <strong>Completed</strong></p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Currency</th>
                <th style="text-align:right">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $serviceName ?? 'Digital Service' }}</td>
                <td>{{ $transaction->currency }}</td>
                <td class="amount-cell" style="text-align:right">{{ number_format($transaction->amount, 2) }}</td>
            </tr>
            <tr class="total-row">
                <td colspan="2">Total Paid</td>
                <td style="text-align:right">{{ $transaction->currency }} {{ number_format($transaction->amount, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="txn-box">
        <div class="section-title" style="margin-bottom:10px;">Transaction Details</div>
        <div class="row"><span>Transaction ID</span><span>{{ $transaction->transaction_id }}</span></div>
        @if($transaction->bank_tran_id)
        <div class="row"><span>Bank Transaction ID</span><span>{{ $transaction->bank_tran_id }}</span></div>
        @endif
        @if($transaction->card_type)
        <div class="row"><span>Payment Method</span><span>{{ $transaction->card_type }}</span></div>
        @endif
        @if($transaction->card_brand)
        <div class="row"><span>Card Brand</span><span>{{ $transaction->card_brand }}</span></div>
        @endif
        <div class="row"><span>Payment Date</span><span>{{ $transaction->tran_date ?? now()->format('Y-m-d H:i:s') }}</span></div>
    </div>

    <div class="footer">
        <strong>Opticore Solutions Ltd.</strong><br>
        Thank you for your payment. This is a computer-generated invoice and does not require a signature.<br>
        For queries, contact us at {{ config('mail.from.address') }}
    </div>

</div>
</body>
</html>
