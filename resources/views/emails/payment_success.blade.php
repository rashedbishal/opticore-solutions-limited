<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0e7490, #06b6d4); padding: 32px 32px 24px; text-align: center; }
    .header .icon { font-size: 40px; margin-bottom: 12px; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; margin: 0; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin: 6px 0 0; }
    .body { padding: 28px 32px; }
    .greeting { font-size: 15px; color: #374151; margin-bottom: 16px; }
    .detail-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
    .detail-row:last-child { border-bottom: none; }
    .detail-row span:first-child { color: #6b7280; }
    .detail-row span:last-child { font-weight: 600; color: #1e293b; }
    .amount { font-size: 22px; font-weight: 800; color: #0e7490; text-align: center; margin: 16px 0; }
    .note { font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px; line-height: 1.7; }
    .footer { background: #f8fafc; padding: 18px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e2e8f0; }
    .badge { display: inline-block; background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
</style>
</head>
<body>
<div class="card">
    <div class="header">
        <div class="icon">✅</div>
        <h1>Payment Successful</h1>
        <p>Your payment has been confirmed</p>
    </div>
    <div class="body">
        <p class="greeting">Hi <strong>{{ $transaction->name }}</strong>,</p>
        <p style="font-size:14px;color:#4b5563;line-height:1.7;">
            Your payment to <strong>Opticore Solutions Ltd.</strong> has been successfully processed.
            Your invoice is attached to this email. Please keep it for your records.
        </p>

        <div class="amount">{{ $transaction->currency }} {{ number_format($transaction->amount, 2) }}</div>

        <div class="detail-box">
            <div class="detail-row">
                <span>Invoice Number</span>
                <span>#{{ $transaction->invoice_number }}</span>
            </div>
            <div class="detail-row">
                <span>Service</span>
                <span>{{ $serviceName ?? 'Digital Service' }}</span>
            </div>
            <div class="detail-row">
                <span>Transaction ID</span>
                <span>{{ $transaction->transaction_id }}</span>
            </div>
            @if($transaction->tran_date)
            <div class="detail-row">
                <span>Date</span>
                <span>{{ $transaction->tran_date }}</span>
            </div>
            @endif
            <div class="detail-row">
                <span>Status</span>
                <span><span class="badge">Paid</span></span>
            </div>
        </div>

        <p class="note">
            Please find your invoice attached as a PDF.<br>
            For any queries, reply to this email or contact us at {{ config('mail.from.address') }}
        </p>
    </div>
    <div class="footer">
        Opticore Solutions Ltd. &mdash; Digital Agency, Bangladesh<br>
        This is an automated email. Please do not reply directly.
    </div>
</div>
</body>
</html>
