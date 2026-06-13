@component('mail::message')
# New Client Message

Dear Administrator,

We would like to inform you that **{{ $message->conversation->user->name }}** ({{ $message->conversation->user->email }}) has sent you a message and is currently awaiting your response.

@component('mail::panel')
{{ $message->message ?? 'An attachment was shared.' }}
@endcomponent

@if($message->attachment_path)
> An attachment was also included with this message. Please log in to view it.
@endif

As no administrator is currently available, kindly log in to your panel at your earliest convenience to review and reply to this message.

@component('mail::button', ['url' => config('app.url') . '/admin/customer-conversations', 'color' => 'primary'])
Log In to Reply
@endcomponent

Regards,<br>
{{ config('app.name') }}

---
*This is an automated notification. Please do not reply to this email.*
@endcomponent
