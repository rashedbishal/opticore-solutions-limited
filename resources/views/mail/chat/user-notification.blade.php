@component('mail::message')
# You have a new message from our Support Team

Hi **{{ $message->conversation->user->name }}**,

Our support team has sent you a new message. Here's what they said:

@component('mail::panel')
{{ $message->message ?? 'An attachment was shared.' }}
@endcomponent

@if($message->attachment_path)
> They also attached a file. Please log in to view it.
@endif

You can log in to reply to this message directly through your support chat.

@component('mail::button', ['url' => config('app.url'), 'color' => 'primary'])
Open Chat
@endcomponent

Thanks,<br>
{{ config('app.name') }} Support Team

---
*If you did not expect this message, you can ignore this email.*
@endcomponent
