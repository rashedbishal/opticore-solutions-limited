<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #4c1d95, #7c3aed); }
    .header .icon { font-size: 40px; margin-bottom: 12px; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; margin: 0; }
    .header p  { color: rgba(255,255,255,0.85); font-size: 14px; margin: 6px 0 0; }
    .body { padding: 28px 32px; text-align: center; }
    .message { font-size: 14px; color: #4b5563; line-height: 1.7; margin: 0 0 24px; }
    .button { display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 10px; }
    .note { font-size: 12px; color: #9ca3af; margin-top: 24px; line-height: 1.7; }
    .footer { background: #f8fafc; padding: 18px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="card">
    <div class="header">
        <div class="icon">📩</div>
        <h1>Confirm Your Subscription</h1>
        <p>One click and you're on the list.</p>
    </div>
    <div class="body">
        <p class="message">
            Someone (hopefully you!) asked to subscribe this email address to the <strong>Opticore Solutions</strong> newsletter. Confirm below to start receiving updates &amp; exclusive offers.
        </p>
        <a class="button" href="{{ $confirmUrl }}">Confirm Subscription</a>
        <p class="note">
            This link expires in 24 hours. If you didn't request this, just ignore this email — you won't be subscribed.
        </p>
    </div>
    <div class="footer">
        Opticore Solutions Limited &mdash; Digital Agency, Bangladesh
    </div>
</div>
</body>
</html>
