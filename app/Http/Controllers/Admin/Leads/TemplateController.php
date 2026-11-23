<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Actions\ManageMessengerTemplate;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\LeadSource;
use App\Leads\Models\MessengerMessageTemplate;
use App\Leads\Models\WhatsAppMessageTemplate;
use App\Models\Admin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Leads → Templates (managers and the mother admin): WhatsApp templates
 * are registered after Meta approved them in WhatsApp Manager; Messenger
 * templates are created with Meta from here.
 */
class TemplateController extends Controller
{
    public const EXAMPLE_MESSENGER_BODY = "Hi {{1}}, this is an update on your inquiry about {{2}}. Your request is still open on our end — reply here if you'd like us to continue assisting you.";

    public function index(): Response
    {
        $this->manager();

        $sources = fn (LeadSourceType $type) => LeadSource::query()->where('type', $type)->orderBy('name')->get(['id', 'name'])->map(fn (LeadSource $s): array => ['id' => $s->id, 'name' => $s->name]);

        return Inertia::render('Admin/Leads/Templates', [
            'whatsappSources' => $sources(LeadSourceType::Whatsapp),
            'messengerSources' => $sources(LeadSourceType::FacebookMessenger),
            'whatsappTemplates' => WhatsAppMessageTemplate::query()->with('leadSource:id,name')->orderBy('name')->get()->map(fn (WhatsAppMessageTemplate $t): array => [
                'id' => $t->id, 'name' => $t->name, 'language' => $t->language, 'variable_count' => $t->variable_count,
                'is_active' => $t->is_active, 'source_id' => $t->lead_source_id, 'source_name' => $t->leadSource->name,
            ]),
            'messengerTemplates' => MessengerMessageTemplate::query()->with('leadSource:id,name')->orderBy('name')->get()->map(fn (MessengerMessageTemplate $t): array => [
                'id' => $t->id, 'name' => $t->name, 'language' => $t->language, 'variable_count' => $t->variable_count,
                'body_text' => $t->body_text, 'source_id' => $t->lead_source_id, 'source_name' => $t->leadSource->name,
            ]),
            'exampleMessengerBody' => self::EXAMPLE_MESSENGER_BODY,
        ]);
    }

    public function storeWhatsapp(Request $request): RedirectResponse
    {
        $this->manager();
        WhatsAppMessageTemplate::create([...$this->whatsappData($request), 'is_active' => true]);

        return back()->with('success', 'WhatsApp template added.');
    }

    public function updateWhatsapp(Request $request, WhatsAppMessageTemplate $template): RedirectResponse
    {
        $this->manager();
        $template->update($this->whatsappData($request, $template));

        return back()->with('success', 'WhatsApp template saved.');
    }

    public function toggleWhatsapp(WhatsAppMessageTemplate $template): RedirectResponse
    {
        $this->manager();
        $template->update(['is_active' => ! $template->is_active]);

        return back()->with('success', $template->is_active ? 'Template turned on.' : 'Template turned off.');
    }

    public function destroyWhatsapp(WhatsAppMessageTemplate $template): RedirectResponse
    {
        $this->manager();
        $template->delete();

        return back()->with('success', 'WhatsApp template removed. Messages already sent with it are kept.');
    }

    public function storeMessenger(Request $request, ManageMessengerTemplate $manage): RedirectResponse
    {
        $admin = $this->manager();

        $validated = $request->validate([
            'source_id' => ['required', 'string', Rule::exists('lead_sources', 'id')->where('type', LeadSourceType::FacebookMessenger->value)],
            'name' => ['required', 'string', 'max:512', 'regex:/^[a-z0-9_]+$/'],
            'language' => ['required', 'string', 'max:35'],
            'body_text' => ['required', 'string', 'max:1024'],
        ], ['name.regex' => 'Lowercase letters, numbers and underscores only.']);

        $result = $manage->create($admin, LeadSource::query()->findOrFail($validated['source_id']), $validated['name'], $validated['language'], $validated['body_text']);

        return back()->with($result['ok'] ? 'success' : 'error', $result['message']);
    }

    public function destroyMessenger(MessengerMessageTemplate $template, ManageMessengerTemplate $manage): RedirectResponse
    {
        $result = $manage->delete($this->manager(), $template);

        return back()->with($result['ok'] ? 'success' : 'error', $result['message']);
    }

    /**
     * @return array{lead_source_id: string, name: string, language: string, variable_count: int}
     */
    private function whatsappData(Request $request, ?WhatsAppMessageTemplate $ignore = null): array
    {
        $validated = $request->validate([
            'source_id' => ['required', 'string', Rule::exists('lead_sources', 'id')->where('type', LeadSourceType::Whatsapp->value)],
            'name' => ['required', 'string', 'max:512', 'regex:/^[a-z0-9_]+$/'],
            'language' => ['required', 'string', 'max:35'],
            'variable_count' => ['required', 'integer', 'min:0', 'max:10'],
        ], ['name.regex' => "Must match the exact template name in Meta's WhatsApp Manager — lowercase letters, numbers and underscores only."]);

        $taken = WhatsAppMessageTemplate::query()
            ->where('lead_source_id', $validated['source_id'])
            ->where('name', $validated['name'])
            ->where('language', $validated['language'])
            ->when($ignore, fn ($q) => $q->whereKeyNot($ignore->id))
            ->exists();

        if ($taken) {
            throw ValidationException::withMessages(['name' => 'This number already has a template with this exact name and language.']);
        }

        return [
            'lead_source_id' => $validated['source_id'],
            'name' => $validated['name'],
            'language' => $validated['language'],
            'variable_count' => (int) $validated['variable_count'],
        ];
    }

    private function manager(): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();
        abort_unless($admin->isLeadManager(), 403);

        return $admin;
    }
}
