<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { padding: 32px 32px 24px; text-align: center; }
    .header.pending     { background: linear-gradient(135deg, #d97706, #f59e0b); }
    .header.in-progress { background: linear-gradient(135deg, #1d4ed8, #3b82f6); }
    .header.delivered   { background: linear-gradient(135deg, #065f46, #10b981); }
    .header .icon { font-size: 40px; margin-bottom: 12px; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; margin: 0; }
    .header p  { color: rgba(255,255,255,0.85); font-size: 14px; margin: 6px 0 0; }
    .body { padding: 28px 32px; }
    .greeting { font-size: 15px; color: #374151; margin-bottom: 16px; }
    .detail-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
    .detail-row:last-child { border-bottom: none; }
    .detail-row span:first-child { color: #6b7280; }
    .detail-row span:last-child  { font-weight: 600; color: #1e293b; }
    .badge-pending     { display:inline-block; background:#fef3c7; color:#92400e; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; }
    .badge-in-progress { display:inline-block; background:#dbeafe; color:#1e40af; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; }
    .badge-delivered   { display:inline-block; background:#d1fae5; color:#065f46; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; }
    .message { font-size:14px; color:#4b5563; line-height:1.7; }
    .note { font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px; line-height: 1.7; }
    .footer { background: #f8fafc; padding: 18px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="card">

    @php
        $stateClass = match($task->state) {
            'in progress' => 'in-progress',
            default       => $task->state,
        };
        $icon = match($task->state) {
            'pending'     => '📋',
            'in progress' => '⚙️',
            'delivered'   => '🎉',
            default       => '📦',
        };
        $headline = match($task->state) {
            'pending'     => 'Order Received',
            'in progress' => 'Work In Progress',
            'delivered'   => 'Order Delivered',
            default       => 'Order Update',
        };
        $subline = match($task->state) {
            'pending'     => 'We\'ve received your order and will begin shortly.',
            'in progress' => 'Your order is currently being worked on.',
            'delivered'   => 'Your order has been completed and delivered.',
            default       => 'There\'s an update on your order.',
        };
    @endphp

    <div class="header {{ $stateClass }}">
        <div class="icon">{{ $icon }}</div>
        <h1>{{ $headline }}</h1>
        <p>{{ $subline }}</p>
    </div>

    <div class="body">
        <p class="greeting">Hi <strong>{{ $recipientName }}</strong>,</p>

        <p class="message">
            @if($task->state === 'pending')
                Thank you for your order! We have successfully received <strong>{{ $task->task_name }}</strong> and it is now in our queue. We will start working on it soon.
            @elseif($task->state === 'in progress')
                Great news! We have started working on your order <strong>{{ $task->task_name }}</strong>. Our team is actively processing it and will keep you updated.
            @elseif($task->state === 'delivered')
                Your order <strong>{{ $task->task_name }}</strong> has been completed and delivered! We hope you are satisfied with the result. You can log in to your profile to view the delivery.
            @endif
        </p>

        <div class="detail-box">
            <div class="detail-row">
                <span>Task</span>
                <span>{{ $task->task_name }}</span>
            </div>
            @if($task->category)
            <div class="detail-row">
                <span>Category</span>
                <span>{{ ucwords(str_replace('-', ' ', $task->category)) }}</span>
            </div>
            @endif
            @if($task->date)
            <div class="detail-row">
                <span>Date</span>
                <span>{{ $task->date->format('M d, Y') }}</span>
            </div>
            @endif
            <div class="detail-row">
                <span>Status</span>
                <span>
                    @if($task->state === 'pending')
                        <span class="badge-pending">Pending</span>
                    @elseif($task->state === 'in progress')
                        <span class="badge-in-progress">In Progress</span>
                    @elseif($task->state === 'delivered')
                        <span class="badge-delivered">Delivered</span>
                    @endif
                </span>
            </div>
        </div>

        <p class="note">
            You can manage your notification preferences from your profile page.<br>
            For any queries, contact us at osl@opticoresolutionsltd.com
        </p>
    </div>

    <div class="footer">
        Opticore Solutions Limited &mdash; Digital Agency, Bangladesh<br>
        This is an automated email. Please do not reply directly.
    </div>
</div>
</body>
</html>
