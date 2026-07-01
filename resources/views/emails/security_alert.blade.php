<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { padding: 32px 32px 24px; text-align: center; }
    .header.login    { background: linear-gradient(135deg, #1e1b4b, #4338ca); }
    .header.password { background: linear-gradient(135deg, #7c2d12, #ea580c); }
    .header .icon { font-size: 40px; margin-bottom: 12px; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; margin: 0; }
    .header p  { color: rgba(255,255,255,0.85); font-size: 14px; margin: 6px 0 0; }
    .body { padding: 28px 32px; }
    .greeting { font-size: 15px; color: #374151; margin-bottom: 16px; }
    .message { font-size: 14px; color: #4b5563; line-height: 1.7; }
    .detail-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 16px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; padding: 10px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
    .detail-row:last-child { border-bottom: none; }
    .detail-row span:first-child { color: #6b7280; flex-shrink: 0; min-width: 110px; }
    .detail-row span:last-child { font-weight: 600; color: #1e293b; word-break: break-all; text-align: right; }
    .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px 16px; margin: 20px 0; font-size: 13px; color: #991b1b; line-height: 1.7; }
    .note { font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px; line-height: 1.7; }
    .footer { background: #f8fafc; padding: 18px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="card">

    @php
        $isLogin     = $type === 'login';
        $headerClass = $isLogin ? 'login' : 'password';
        $icon        = $isLogin ? '🔐' : '🔑';
        $headline    = $isLogin ? 'New Login Detected' : 'Password Changed';
        $subline     = $isLogin ? 'A new sign-in to your account was detected.' : 'Your account password was recently changed.';
        $eventLabel  = $isLogin ? 'Account Login' : 'Password Changed';
        $contactEmail = 'osl@opticoresolutionsltd.com';
    @endphp

    <div class="header {{ $headerClass }}">
        <div class="icon">{{ $icon }}</div>
        <h1>{{ $headline }}</h1>
        <p>{{ $subline }}</p>
    </div>

    <div class="body">
        <p class="greeting">Hi <strong>{{ $recipientName }}</strong>,</p>

        <p class="message">
            @if($isLogin)
                We detected a new login to your <strong>Opticore Solutions</strong> account. If this was you, no action is needed. If you don't recognise this activity, please change your password immediately.
            @else
                Your <strong>Opticore Solutions</strong> account password was recently changed. If you made this change, you can safely ignore this email. If you did not change your password, please contact us immediately.
            @endif
        </p>

        <div class="detail-box">
            <div class="detail-row">
                <span>Event</span>
                <span>{{ $eventLabel }}</span>
            </div>
            <div class="detail-row">
                <span>Date &amp; Time</span>
                <span>{{ $time }}</span>
            </div>
            <div class="detail-row">
                <span>IP Address</span>
                <span>{{ $ip }}</span>
            </div>
            <div class="detail-row">
                <span>Browser / Device</span>
                <span>{{ Str::limit($userAgent, 60) }}</span>
            </div>
        </div>

        <div class="alert-box">
            @if($isLogin)
                ⚠️ If you did not sign in, your account may be compromised. Change your password immediately and contact our support team at <strong>{{ $contactEmail }}</strong>.
            @else
                ⚠️ If you did not change your password, please contact our support team immediately at <strong>{{ $contactEmail }}</strong>.
            @endif
        </div>

        <p class="note">
            You can manage your notification preferences from your profile page.<br>
            For any queries, contact us at {{ $contactEmail }}
        </p>
    </div>

    <div class="footer">
        Opticore Solutions Limited &mdash; Digital Agency, Bangladesh<br>
        This is an automated security alert. Please do not reply directly.
    </div>
</div>
</body>
</html>
