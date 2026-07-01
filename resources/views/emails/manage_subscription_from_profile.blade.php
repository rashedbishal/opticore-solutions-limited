<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #1e1b4b, #4338ca); }
    .header .icon { font-size: 40px; margin-bottom: 12px; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; margin: 0; }
    .header p  { color: rgba(255,255,255,0.85); font-size: 14px; margin: 6px 0 0; }
    .body { padding: 28px 32px; text-align: center; }
    .greeting { font-size: 15px; color: #374151; margin-bottom: 16px; text-align: left; }
    .message { font-size: 14px; color: #4b5563; line-height: 1.7; margin: 0 0 24px; text-align: left; }
    .button { display: inline-block; background: linear-gradient(135deg, #4338ca, #1e1b4b); color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 10px; }
    .note { font-size: 12px; color: #9ca3af; margin-top: 24px; line-height: 1.7; }
    .footer { background: #f8fafc; padding: 18px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="card">
    <div class="header">
        <div class="icon">⚙️</div>
        <h1>Manage Your Newsletter Preference</h1>
        <p>This email is linked to your account.</p>
    </div>
    <div class="body">
        <p class="greeting">Hi <strong>{{ $recipientName }}</strong>,</p>
        <p class="message">
            We received a request to change the newsletter subscription for this email address. Since it's linked to your <strong>Opticore Solutions</strong> account, it can only be changed from your profile — not from the public newsletter form on our site. This keeps your account preferences safe from anyone who doesn't actually have access to your inbox.
        </p>
        <a class="button" href="{{ route('profile') }}">Go to Profile</a>
        <p class="note">
            If you didn't make this request, no action has been taken — your preference hasn't changed.
        </p>
    </div>
    <div class="footer">
        Opticore Solutions Limited &mdash; Digital Agency, Bangladesh
    </div>
</div>
</body>
</html>
