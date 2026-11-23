<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Actions\DeleteLeadConversation;
use App\Leads\Actions\QueueLeadMessage;
use App\Leads\Enums\MessageChannel;
use App\Leads\Enums\MessageDirection;
use App\Leads\Enums\MessageStatus;
use App\Leads\Enums\MessageType;
use App\Leads\Jobs\SendOutboundMessage;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadConversation;
use App\Leads\Models\LeadMessage;
use App\Leads\Models\MessengerMessageTemplate;
use App\Leads\Models\WhatsAppMessageTemplate;
use App\Leads\Services\LeadAccess;
use App\Leads\Services\Messaging\OutboundEligibility;
use App\Models\Admin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Replying to a lead from its page: free-form replies (text, picture or
 * PDF), templates, resending a failed message, and — for managers —
 * hiding a sent message or deleting the whole conversation.
 */
class LeadMessageController extends Controller
{
    private const PER_ADMIN_PER_MINUTE = 30;

    private const TOTAL_PER_MINUTE = 100;

    public function __construct(
        private readonly LeadAccess $access,
        private readonly OutboundEligibility $eligibility,
    ) {}

    public function send(Request $request, Lead $lead, QueueLeadMessage $queue): RedirectResponse
    {
        $admin = $this->authorizeUpdate($lead);
        $conversation = $this->conversation($lead);
        $this->rateLimit($admin);

        $allowed = $this->eligibility->forReply($conversation);

        if (! $allowed->eligible) {
            return back()->with('error', $allowed->reason);
        }

        $channel = $conversation->channel;
        $file = $request->file('file');
        $type = null;

        if ($file !== null) {
            $isImage = str_starts_with((string) $file->getMimeType(), 'image/');
            $type = $isImage ? MessageType::Image : MessageType::Document;
            $mimes = $isImage ? $channel->imageMimeTypes() : $channel->documentMimeTypes();
            $max = $isImage ? $channel->imageMaxBytes() : $channel->documentMaxBytes();

            $request->validate([
                'file' => ['file', 'mimetypes:'.implode(',', $mimes), 'max:'.intdiv($max, 1024)],
                'body' => ['nullable', 'string', 'max:'.($channel->supportsMediaCaption() ? 1024 : 4096)],
            ], [
                'file.mimetypes' => 'This file type can\'t be sent on '.$channel->label().'. Send a '.($isImage ? implode(' / ', array_map(fn (string $m): string => strtoupper(explode('/', $m)[1]), $mimes)).' picture' : 'PDF').'.',
                'file.max' => 'This file is too big for '.$channel->label().' (largest: '.intdiv($max, 1024 * 1024).' MB).',
            ]);
        } else {
            $request->validate(['body' => ['required', 'string', 'max:4096']], ['body.required' => 'Write a message or attach a file.']);
        }

        $created = $queue->handle($conversation, $admin, $request->input('body'), $file, $type);

        return $created === null
            ? back()->with('error', 'This message is already being sent.')
            : back()->with('success', 'Message queued for sending.');
    }

    public function sendTemplate(Request $request, Lead $lead): RedirectResponse
    {
        $admin = $this->authorizeUpdate($lead);
        $conversation = $this->conversation($lead);
        $this->rateLimit($admin);

        $allowed = $this->eligibility->forTemplate($conversation);

        if (! $allowed->eligible) {
            return back()->with('error', $allowed->reason);
        }

        $template = $this->templateFor($conversation, (string) $request->input('template_id'));

        if ($template === null) {
            throw ValidationException::withMessages(['template_id' => 'Pick a template first.']);
        }

        $variables = $request->validate([
            'variables' => ['array', 'size:'.$template->variable_count],
            'variables.*' => ['required', 'string', 'max:255'],
        ], ['variables.*.required' => 'Fill in every blank in the template.'])['variables'] ?? [];

        $lock = 'outbound-template-message:'.$conversation->id.':'.$template->id.':'.md5(implode('|', $variables));

        $message = Cache::lock($lock, 10)->get(fn (): LeadMessage => LeadMessage::create([
            'conversation_id' => $conversation->id,
            'lead_id' => $conversation->lead_id,
            'channel' => $conversation->channel,
            'direction' => MessageDirection::Outbound,
            'message_type' => MessageType::Template,
            'template_name' => $template->name,
            'template_language' => $template->language,
            'template_variables' => array_values($variables),
            'status' => MessageStatus::Pending,
            'status_updated_at' => now(),
            'sent_by' => $admin->id,
            'sent_by_name' => $admin->name,
        ]));

        if (! $message instanceof LeadMessage) {
            return back()->with('error', 'This message is already being sent.');
        }

        SendOutboundMessage::dispatch($message);

        return back()->with('success', 'Template message queued for sending.');
    }

    public function resend(Lead $lead, LeadMessage $message): RedirectResponse
    {
        $admin = $this->authorizeUpdate($lead);
        $this->rateLimit($admin);

        $result = DB::transaction(function () use ($lead, $message, $admin): LeadMessage|string|null {
            $failed = LeadMessage::query()->lockForUpdate()
                ->whereKey($message->id)
                ->where('lead_id', $lead->id)
                ->where('direction', MessageDirection::Outbound)
                ->where('status', MessageStatus::Failed)
                ->first();

            if ($failed === null) {
                return null;
            }

            if ($failed->resend_message_id !== null) {
                return 'This message has already been resent.';
            }

            $conversation = $failed->conversation;
            $allowed = $failed->message_type === MessageType::Template
                ? $this->eligibility->forTemplate($conversation)
                : $this->eligibility->forReply($conversation);

            if (! $allowed->eligible) {
                return (string) $allowed->reason;
            }

            $isFile = in_array($failed->message_type, [MessageType::Image, MessageType::Document], true);

            if ($isFile && ($failed->attachment_path === null || ! Storage::disk('local')->exists($failed->attachment_path))) {
                return 'The attached file is no longer available, so this message cannot be resent.';
            }

            $resend = LeadMessage::create([
                ...$failed->only(['conversation_id', 'lead_id', 'channel', 'direction', 'message_type', 'body', 'attachment_path', 'attachment_mime', 'attachment_name', 'attachment_size', 'template_name', 'template_language', 'template_variables']),
                'status' => MessageStatus::Pending,
                'status_updated_at' => now(),
                'sent_by' => $admin->id,
                'sent_by_name' => $admin->name,
            ]);

            DB::table('lead_messages')->where('id', $failed->id)->update(['resend_message_id' => $resend->id, 'updated_at' => now()]);

            return $resend;
        });

        if (! $result instanceof LeadMessage) {
            return $result === null ? back() : back()->with('error', $result);
        }

        SendOutboundMessage::dispatch($result);

        return back()->with('success', 'Message re-queued for sending.');
    }

    /** Managers: hide a sent message from the "Messages sent" card. */
    public function hide(Lead $lead, LeadMessage $message): RedirectResponse
    {
        $this->authorizeManager($lead);
        abort_unless($message->lead_id === $lead->id && $message->direction === MessageDirection::Outbound, 404);

        DB::table('lead_messages')->where('id', $message->id)->update(['activity_log_hidden_at' => now()]);

        return back()->with('success', 'Message hidden.');
    }

    /** Managers: delete the lead's whole conversation. */
    public function destroyConversation(Lead $lead, DeleteLeadConversation $delete): RedirectResponse
    {
        $admin = $this->authorizeManager($lead);
        $delete->handle($lead, $admin);

        return back()->with('success', 'Conversation deleted.');
    }

    /** Opens a picture/PDF staff sent, for anyone who can see the lead. */
    public function attachment(LeadMessage $message): StreamedResponse
    {
        abort_unless($this->access->canView($this->admin(), $message->lead), 403);
        abort_unless($message->attachment_path !== null && Storage::disk('local')->exists($message->attachment_path), 404);

        return Storage::disk('local')->response($message->attachment_path, $message->attachment_name, [
            'Content-Type' => $message->attachment_mime ?? 'application/octet-stream',
            'X-Content-Type-Options' => 'nosniff',
        ], str_starts_with((string) $message->attachment_mime, 'image/') ? 'inline' : 'attachment');
    }

    private function templateFor(LeadConversation $conversation, string $id): WhatsAppMessageTemplate|MessengerMessageTemplate|null
    {
        $query = match ($conversation->channel) {
            MessageChannel::Whatsapp => WhatsAppMessageTemplate::query(),
            MessageChannel::Messenger => MessengerMessageTemplate::query(),
            MessageChannel::Instagram => null,
        };

        return $query?->where('lead_source_id', $conversation->lead_source_id)->where('is_active', true)->find($id);
    }

    private function conversation(Lead $lead): LeadConversation
    {
        $conversation = $lead->activeConversation();
        abort_if($conversation === null, 422, 'This lead has no conversation to reply to.');

        return $conversation;
    }

    private function rateLimit(Admin $admin): void
    {
        foreach (['outbound-per-admin:'.$admin->id => self::PER_ADMIN_PER_MINUTE, 'outbound-total' => self::TOTAL_PER_MINUTE] as $key => $limit) {
            if (RateLimiter::tooManyAttempts($key, $limit)) {
                throw ValidationException::withMessages(['body' => 'Too many messages sent recently — please wait a moment and try again.']);
            }
        }

        RateLimiter::hit('outbound-per-admin:'.$admin->id, 60);
        RateLimiter::hit('outbound-total', 60);
    }

    private function authorizeUpdate(Lead $lead): Admin
    {
        $admin = $this->admin();
        abort_unless($this->access->canUpdate($admin, $lead), 403);

        return $admin;
    }

    private function authorizeManager(Lead $lead): Admin
    {
        $admin = $this->admin();
        abort_unless($this->access->canDelete($admin) && $this->access->canView($admin, $lead), 403);

        return $admin;
    }

    private function admin(): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();

        return $admin;
    }
}
