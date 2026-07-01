<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { padding: 28px 32px 22px; background: linear-gradient(135deg, #1e1b4b, #4338ca); text-align: center; }
    .header h1 { color: #fff; font-size: 20px; font-weight: 700; margin: 0; }
    .body { padding: 28px 32px; font-size: 14px; color: #374151; line-height: 1.8; white-space: pre-wrap; }
    .footer { background: #f8fafc; padding: 18px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="card">
    <div class="header">
        <h1>{{ $emailTitle }}</h1>
    </div>
    <div class="body">{{ $body }}</div>
    <div class="footer">
        Opticore Solutions Limited &mdash; Digital Agency, Bangladesh<br>
        osl@opticoresolutionsltd.com
    </div>
</div>
</body>
</html>
