@component('mail::message')
# New Contact Message

Dear Administrator,

**{{ $contact->name }}** ({{ $contact->email }}{{ $contact->phone ? ', '.$contact->phone : '' }}) submitted the contact form on the website.

@if($contact->subject)
**Subject:** {{ $contact->subject }}
@endif

@component('mail::panel')
{{ $contact->message }}
@endcomponent

@component('mail::button', ['url' => config('app.url') . '/admin/contacts', 'color' => 'primary'])
View in Admin Panel
@endcomponent

Regards,<br>
{{ config('app.name') }}

---
*This is an automated notification. Please do not reply to this email.*
@endcomponent
