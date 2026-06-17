<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { padding: 24px 32px; background: linear-gradient(135deg, #1e1b4b, #4338ca); text-align: center; }
    .header h1 { color: #fff; font-size: 18px; font-weight: 700; margin: 0; }
    .header p { color: rgba(255,255,255,0.75); font-size: 13px; margin: 6px 0 0; }
    .body { padding: 0; }
    .body img { display: block; width: 100%; height: auto; }
    .footer { background: #f8fafc; padding: 18px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="card">
    <div class="header">
        <h1>Special Offer from Opticore Solutions</h1>
        <p>An exclusive offer just for you</p>
    </div>
    <div class="body">
        <img src="{{ $message->embedData(file_get_contents($imagePath), $imageName) }}" alt="Special Offer" />
    </div>
    <div class="footer">
        Opticore Solutions Ltd. &mdash; Digital Agency, Bangladesh<br>
        To unsubscribe, visit our website and enter your email in the newsletter section.
    </div>
</div>
</body>
</html>
