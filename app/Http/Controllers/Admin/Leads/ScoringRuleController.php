<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Enums\LeadScoringField;
use App\Leads\Enums\LeadScoringOperator;
use App\Leads\Events\LeadUpdated;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadScoringRule;
use App\Leads\Services\LeadScorer;
use App\Models\Admin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Leads → Scoring Rules (managers and the mother admin). Any change
 * re-scores every lead in the background.
 */
class ScoringRuleController extends Controller
{
    public function index(): Response
    {
        $this->manager();

        return Inertia::render('Admin/Leads/ScoringRules', [
            'rules' => LeadScoringRule::query()->orderBy('sort_order')->orderBy('created_at')->get()->toBase()->map(fn (LeadScoringRule $r): array => [
                'id' => $r->id,
                'name' => $r->name,
                'field' => $r->field,
                'operator' => $r->operator,
                'value' => $r->value,
                'points' => $r->points,
                'is_active' => $r->is_active,
                'sort_order' => $r->getAttribute('sort_order'),
                'summary' => $this->summary($r),
            ]),
            'fields' => array_map(fn (LeadScoringField $f): array => [
                'value' => $f->value,
                'label' => $f->label(),
                'kind' => $f->kind(),
                'operators' => array_map(fn (LeadScoringOperator $o): array => ['value' => $o->value, 'label' => $o->label()], $f->allowedOperators()),
                'options' => $f->valueOptions(),
            ], LeadScoringField::cases()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->manager();
        LeadScoringRule::create($this->data($request));
        $this->rescoreAll();

        return back()->with('success', 'Rule added. Scores are being updated.');
    }

    public function update(Request $request, LeadScoringRule $rule): RedirectResponse
    {
        $this->manager();
        $rule->update($this->data($request));
        $this->rescoreAll();

        return back()->with('success', 'Rule saved. Scores are being updated.');
    }

    public function toggle(LeadScoringRule $rule): RedirectResponse
    {
        $this->manager();
        $rule->update(['is_active' => ! $rule->is_active]);
        $this->rescoreAll();

        return back()->with('success', $rule->is_active ? 'Rule turned on.' : 'Rule turned off.');
    }

    public function destroy(LeadScoringRule $rule): RedirectResponse
    {
        $this->manager();
        $rule->delete();
        $this->rescoreAll();

        return back()->with('success', 'Rule deleted. Scores are being updated.');
    }

    public function rescoreLead(Lead $lead, LeadScorer $scorer): RedirectResponse
    {
        $this->manager();
        $scorer->score($lead);
        LeadUpdated::dispatch($lead->id);

        return back()->with('success', 'Score recalculated.');
    }

    /**
     * @return array<string, mixed>
     */
    private function data(Request $request): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'field' => ['required', Rule::enum(LeadScoringField::class)],
            'operator' => ['required', Rule::enum(LeadScoringOperator::class)],
            'value' => ['required'],
            'value.*' => ['string', 'max:255'],
            'points' => ['required', 'integer', 'min:-1000', 'max:1000'],
            'is_active' => ['boolean'],
            'sort_order' => ['required', 'integer', 'min:0', 'max:9999'],
        ]);

        $field = LeadScoringField::from($validated['field']);
        $operator = LeadScoringOperator::from($validated['operator']);

        if (! in_array($operator, $field->allowedOperators(), true)) {
            throw ValidationException::withMessages(['operator' => 'That comparison does not fit this field.']);
        }

        return [
            'name' => $validated['name'],
            'field' => $field->value,
            'operator' => $operator->value,
            'value' => $this->value($field, $operator, $validated['value']),
            'points' => (int) $validated['points'],
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'sort_order' => (int) $validated['sort_order'],
        ];
    }

    private function value(LeadScoringField $field, LeadScoringOperator $operator, mixed $raw): mixed
    {
        $options = $field->valueOptions();

        if ($operator->isList()) {
            $values = array_values(array_filter(array_map(fn ($v): string => trim((string) $v), is_array($raw) ? $raw : explode(',', (string) $raw)), fn (string $v): bool => $v !== ''));

            if ($values === [] || ($options !== null && array_diff($values, array_map('strval', array_keys($options))) !== [])) {
                throw ValidationException::withMessages(['value' => 'Pick at least one valid choice.']);
            }

            return $values;
        }

        $value = is_array($raw) ? (string) ($raw[0] ?? '') : trim((string) $raw);

        return match ($field->kind()) {
            'numeric' => is_numeric($value) ? (float) $value : throw ValidationException::withMessages(['value' => 'Enter a number.']),
            'yes_no' => in_array($value, ['1', '0'], true) ? $value === '1' : throw ValidationException::withMessages(['value' => 'Choose Yes or No.']),
            default => $options !== null && array_key_exists($value, $options) ? $value : throw ValidationException::withMessages(['value' => 'Choose a valid option.']),
        };
    }

    private function summary(LeadScoringRule $rule): string
    {
        $field = $rule->fieldEnum();
        $operator = $rule->operatorEnum();

        if ($field === null || $operator === null) {
            return 'Unsupported rule';
        }

        $options = $field->valueOptions() ?? [];
        $show = function (mixed $v) use ($options): string {
            $key = is_bool($v) ? ($v ? '1' : '0') : (string) (is_float($v) && floor($v) === $v ? (int) $v : $v);

            return (string) ($options[$key] ?? $key);
        };
        $value = is_array($rule->value) ? implode(', ', array_map($show, $rule->value)) : $show($rule->value);

        return "{$field->label()} {$operator->label()} {$value}";
    }

    private function rescoreAll(): void
    {
        Artisan::queue('leads:recalculate-scores');
    }

    private function manager(): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();
        abort_unless($admin->isLeadManager(), 403);

        return $admin;
    }
}
