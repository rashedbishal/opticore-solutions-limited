@component('mail::message')
# New Support Message Received

Hi **Admin**,

A user has sent a new support message that requires your attention.

**From:** {{ $message->conversation->user->name }} ({{ $message->conversation->user->email }})

@component('mail::panel')
{{ $message->message ?? 'An attachment was shared.' }}
@endcomponent

@if($message->attachment_path)
> The user also attached a file. Log in to view it.
@endif

Please log in to the CMS to respond promptly.

@component('mail::button', ['url' => config('app.url') . '/admin/customer-conversations', 'color' => 'primary'])
Open Support Dashboard
@endcomponent

Thanks,<br>
{{ config('app.name') }} System

---
*This is an automated notification. Do not reply to this email.*
@endcomponent
