<?php

namespace App\Http\Controllers\Admin\LeadSettings;

use App\Http\Controllers\Controller;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Enums\WebsiteFormFixedField;
use App\Leads\Models\LeadSource;
use App\Leads\Models\WebsiteForm;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Lead Settings → Website Forms (mother admin only, via the
 * `lead-settings` route key). A form's secret key is shown once, right
 * after it's created or regenerated; only its hash is stored.
 */
class WebsiteFormController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/LeadSettings/WebsiteForms', [
            'forms' => WebsiteForm::query()->with('fields')->orderBy('created_at')->get()->map(fn (WebsiteForm $form): array => [
                'id' => $form->id,
                'name' => $form->name,
                'is_active' => $form->is_active,
                'allowed_domains' => $form->allowed_domains ?? [],
                'fields' => $form->fields->pluck('fixed_field')->filter()->values(),
                'leads_count' => DB::table('leads')->where('source_data->website_form_id', $form->id)->count(),
            ]),
            'fieldOptions' => array_map(
                fn (WebsiteFormFixedField $field): array => ['value' => $field->value, 'label' => $field->label()],
                WebsiteFormFixedField::cases(),
            ),
            'submitUrlTemplate' => route('api.website-form.submit', ['token' => str_repeat('X', 40)]),
            // A key just created or regenerated, shown this one time only.
            'revealed' => session('website_form_revealed'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validated($request);
        $token = Str::random(40);

        $form = DB::transaction(function () use ($validated, $token): WebsiteForm {
            $source = LeadSource::query()->where('singleton_type', LeadSourceType::WebsiteForm->value)->first()
                ?? LeadSource::query()->createOrFirst(
                    ['singleton_type' => LeadSourceType::WebsiteForm->value],
                    ['type' => LeadSourceType::WebsiteForm, 'name' => 'Website Forms', 'is_active' => true],
                );

            $form = WebsiteForm::create([
                'lead_source_id' => $source->id,
                'name' => $validated['name'],
                'token_hash' => WebsiteForm::hashToken($token),
                'is_active' => $validated['is_active'],
                'allowed_domains' => $validated['allowed_domains'],
            ]);

            $this->syncFields($form, $validated['fields']);

            return $form;
        });

        return back()
            ->with('success', 'Website form created.')
            ->with('website_form_revealed', ['form_id' => $form->id, 'token' => $token]);
    }

    public function update(Request $request, WebsiteForm $form): RedirectResponse
    {
        $validated = $this->validated($request);

        DB::transaction(function () use ($form, $validated): void {
            $form->update([
                'name' => $validated['name'],
                'is_active' => $validated['is_active'],
                'allowed_domains' => $validated['allowed_domains'],
            ]);

            $this->syncFields($form, $validated['fields']);
        });

        return back()->with('success', 'Website form saved.');
    }

    public function toggle(WebsiteForm $form): RedirectResponse
    {
        $form->update(['is_active' => ! $form->is_active]);

        return back()->with('success', $form->is_active ? 'Form turned on.' : 'Form turned off.');
    }

    public function regenerate(WebsiteForm $form): RedirectResponse
    {
        $token = Str::random(40);
        $form->update(['token_hash' => WebsiteForm::hashToken($token)]);

        return back()
            ->with('success', 'New key created. The old key no longer works.')
            ->with('website_form_revealed', ['form_id' => $form->id, 'token' => $token]);
    }

    public function destroy(WebsiteForm $form): RedirectResponse
    {
        $form->delete();

        return back()->with('success', 'Website form deleted. Leads it already brought in are kept.');
    }

    /**
     * @return array{name: string, is_active: bool, fields: array<int, string>, allowed_domains: array<int, string>}
     */
    private function validated(Request $request): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['required', 'boolean'],
            'fields' => ['array'],
            'fields.*' => ['string', Rule::enum(WebsiteFormFixedField::class)],
            'allowed_domains' => ['array', 'max:20'],
            'allowed_domains.*' => ['string', 'max:255', 'regex:/^(https?:\/\/)?[A-Za-z0-9.-]+\.[A-Za-z]{2,}\/?$/'],
        ], [
            'allowed_domains.*.regex' => 'Write each website like opticoresolutionsltd.com.',
        ]);

        $domains = collect($validated['allowed_domains'] ?? [])
            ->map(fn (string $domain): string => strtolower((string) (str_contains($domain, '://') ? parse_url($domain, PHP_URL_HOST) : trim($domain, '/ '))))
            ->filter()
            ->unique()
            ->values()
            ->all();

        return [
            'name' => $validated['name'],
            'is_active' => (bool) $validated['is_active'],
            'fields' => array_values(array_unique($validated['fields'] ?? [])),
            'allowed_domains' => $domains,
        ];
    }

    /**
     * @param  array<int, string>  $fields
     */
    private function syncFields(WebsiteForm $form, array $fields): void
    {
        $form->fields()->delete();

        // Always in the standard order, whatever order they were ticked.
        $ordered = array_values(array_filter(
            array_map(fn (WebsiteFormFixedField $f): string => $f->value, WebsiteFormFixedField::cases()),
            fn (string $value): bool => in_array($value, $fields, true),
        ));

        foreach ($ordered as $index => $field) {
            $form->fields()->create(['field_type' => 'fixed', 'fixed_field' => $field, 'sort_order' => $index]);
        }
    }
}
