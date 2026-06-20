<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #7c2d12, #ea580c); }
    .header .icon { font-size: 40px; margin-bottom: 12px; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; margin: 0; }
    .header p  { color: rgba(255,255,255,0.85); font-size: 14px; margin: 6px 0 0; }
    .body { padding: 28px 32px; text-align: center; }
    .message { font-size: 14px; color: #4b5563; line-height: 1.7; margin: 0 0 24px; }
    .button { display: inline-block; background: linear-gradient(135deg, #ea580c, #dc2626); color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 10px; }
    .note { font-size: 12px; color: #9ca3af; margin-top: 24px; line-height: 1.7; }
    .footer { background: #f8fafc; padding: 18px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="card">
    <div class="header">
        <div class="icon">📭</div>
        <h1>Confirm Unsubscribe</h1>
        <p>Sorry to see you go.</p>
    </div>
    <div class="body">
        <p class="message">
            Someone (hopefully you!) asked to unsubscribe this email address from the <strong>Opticore Solutions</strong> newsletter. Confirm below to stop receiving updates &amp; offers.
        </p>
        <a class="button" href="{{ $confirmUrl }}">Confirm Unsubscribe</a>
        <p class="note">
            This link expires in 24 hours. If you didn't request this, just ignore this email — you'll stay subscribed.
        </p>
    </div>
    <div class="footer">
        Opticore Solutions Ltd. &mdash; Digital Agency, Bangladesh
    </div>
</div>
</body>
</html>
