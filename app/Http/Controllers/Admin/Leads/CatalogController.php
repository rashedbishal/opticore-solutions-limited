<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Enums\LeadCustomFieldType;
use App\Leads\Models\LeadCustomFieldDefinition;
use App\Leads\Models\LeadTag;
use App\Models\Admin;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Leads → Tags and Leads → Custom Fields (managers and the mother admin).
 */
class CatalogController extends Controller
{
    public function tags(): Response
    {
        $this->manager();

        return Inertia::render('Admin/Leads/Tags', [
            'tags' => LeadTag::query()->withCount('leads')->orderBy('name')->get()->toBase()->map(fn (LeadTag $t): array => [
                'id' => $t->id, 'name' => $t->name, 'color' => $t->color, 'leads_count' => (int) $t->getAttribute('leads_count'),
            ]),
            'colorOptions' => LeadTag::availableColors(),
        ]);
    }

    public function storeTag(Request $request): RedirectResponse
    {
        $this->manager();
        $data = $this->tagData($request);
        $this->unique(fn () => LeadTag::create($data), 'name', 'A tag with this name already exists.');

        return back()->with('success', 'Tag added.');
    }

    public function updateTag(Request $request, LeadTag $tag): RedirectResponse
    {
        $this->manager();
        $data = $this->tagData($request, $tag);
        $this->unique(fn () => $tag->update($data), 'name', 'A tag with this name already exists.');

        return back()->with('success', 'Tag saved.');
    }

    /** Deleting a tag removes it from every lead. */
    public function destroyTag(LeadTag $tag): RedirectResponse
    {
        $this->manager();
        $tag->delete();

        return back()->with('success', 'Tag deleted.');
    }

    public function fields(): Response
    {
        $this->manager();

        return Inertia::render('Admin/Leads/CustomFields', [
            'fields' => LeadCustomFieldDefinition::query()->withCount('values')->orderBy('sort_order')->orderBy('created_at')->get()->toBase()->map(fn (LeadCustomFieldDefinition $d): array => [
                'id' => $d->id, 'name' => $d->name, 'type' => $d->type->value, 'type_label' => $d->type->label(),
                'options' => $d->options ?? [], 'is_required' => $d->is_required, 'is_active' => $d->is_active,
                'sort_order' => $d->sort_order, 'values_count' => (int) $d->getAttribute('values_count'),
            ]),
            'typeOptions' => array_map(fn (LeadCustomFieldType $t): array => ['value' => $t->value, 'label' => $t->label()], LeadCustomFieldType::cases()),
        ]);
    }

    public function storeField(Request $request): RedirectResponse
    {
        $this->manager();
        $data = $this->fieldData($request);
        $this->unique(fn () => LeadCustomFieldDefinition::create($data), 'name', 'A custom field with this name already exists.');

        return back()->with('success', 'Custom field added.');
    }

    /**
     * Once any lead has a value, the field's type and choices are locked.
     */
    public function updateField(Request $request, LeadCustomFieldDefinition $field): RedirectResponse
    {
        $this->manager();
        $data = $this->fieldData($request, $field);

        $this->unique(function () use ($field, $data): void {
            DB::transaction(function () use ($field, $data): void {
                $locked = LeadCustomFieldDefinition::query()->lockForUpdate()->findOrFail($field->id);
                $typeChanged = $data['type'] !== $locked->type || $data['options'] !== $locked->options;

                if ($typeChanged && $locked->values()->exists()) {
                    throw ValidationException::withMessages(['type' => 'This field already has values on one or more leads, so its type and choices can no longer be changed.']);
                }

                $locked->update($data);
            });
        }, 'name', 'A custom field with this name already exists.');

        return back()->with('success', 'Custom field saved.');
    }

    public function toggleField(LeadCustomFieldDefinition $field): RedirectResponse
    {
        $this->manager();
        $field->update(['is_active' => ! $field->is_active]);

        return back()->with('success', $field->is_active ? 'Field turned on.' : 'Field turned off.');
    }

    /** Deleting a field also deletes every lead's value for it. */
    public function destroyField(LeadCustomFieldDefinition $field): RedirectResponse
    {
        $this->manager();
        $field->delete();

        return back()->with('success', 'Custom field deleted.');
    }

    /**
     * @return array{name: string, slug: string, color: string}
     */
    private function tagData(Request $request, ?LeadTag $ignore = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'color' => ['required', Rule::in(LeadTag::availableColors())],
        ]);
        $slug = Str::slug($validated['name']);

        if ($slug === '' || LeadTag::query()->where('slug', $slug)->when($ignore, fn ($q) => $q->whereKeyNot($ignore->id))->exists()) {
            throw ValidationException::withMessages(['name' => $slug === '' ? 'Please use letters or numbers in the name.' : 'A tag with this name already exists.']);
        }

        return ['name' => $validated['name'], 'slug' => $slug, 'color' => $validated['color']];
    }

    /**
     * @return array{name: string, key: string, type: LeadCustomFieldType, options: array<int, string>|null, is_required: bool, is_active: bool, sort_order: int}
     */
    private function fieldData(Request $request, ?LeadCustomFieldDefinition $ignore = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(LeadCustomFieldType::class)],
            'options_text' => ['nullable', 'string', 'max:5000'],
            'is_required' => ['boolean'],
            'is_active' => ['boolean'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:9999'],
        ]);

        $type = LeadCustomFieldType::from($validated['type']);
        $options = null;

        if ($type === LeadCustomFieldType::Select) {
            $options = array_values(array_unique(array_filter(array_map('trim', preg_split('/\R/', (string) ($validated['options_text'] ?? '')) ?: []), fn (string $o): bool => $o !== '')));

            if ($options === []) {
                throw ValidationException::withMessages(['options_text' => 'Provide at least one choice, one per line.']);
            }
        }

        $key = Str::slug($validated['name']);

        if ($key === '' || LeadCustomFieldDefinition::query()->where('key', $key)->when($ignore, fn ($q) => $q->whereKeyNot($ignore->id))->exists()) {
            throw ValidationException::withMessages(['name' => $key === '' ? 'Please use letters or numbers in the name.' : 'A custom field with this name already exists.']);
        }

        return [
            'name' => $validated['name'],
            'key' => $key,
            'type' => $type,
            'options' => $options,
            'is_required' => (bool) ($validated['is_required'] ?? false),
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'sort_order' => (int) $validated['sort_order'],
        ];
    }

    private function unique(callable $write, string $field, string $message): void
    {
        try {
            $write();
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([$field => $message]);
        }
    }

    private function manager(): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();
        abort_unless($admin->isLeadManager(), 403);

        return $admin;
    }
}
