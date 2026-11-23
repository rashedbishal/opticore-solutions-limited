<?php

namespace App\Http\Controllers\Admin\LeadSettings;

use App\Http\Controllers\Controller;
use App\Leads\Models\LeadStatus;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Lead Settings → Statuses (mother admin only, enforced by the
 * `lead-settings` route key in EnsureAdminHasPermission). The list order is
 * the board's column order.
 */
class LeadStatusController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/LeadSettings/Statuses', [
            'statuses' => LeadStatus::query()->orderBy('sort_order')->get(['id', 'name', 'color', 'is_closed', 'sort_order']),
            'colorOptions' => LeadStatus::availableColors(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validated($request);

        $this->saveUniquely(fn () => LeadStatus::create([
            ...$validated,
            'sort_order' => (int) LeadStatus::query()->max('sort_order') + 1,
        ]));

        return back()->with('success', 'Status added.');
    }

    public function update(Request $request, LeadStatus $status): RedirectResponse
    {
        $validated = $this->validated($request, $status);

        $this->saveUniquely(fn () => $status->update($validated));

        return back()->with('success', 'Status updated.');
    }

    /**
     * Saves the board order after a drag and drop. The request must list
     * every status exactly once, so a stale tab can't silently drop or
     * duplicate a column.
     */
    public function reorder(Request $request): RedirectResponse
    {
        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'string', 'distinct'],
        ])['ids'];

        DB::transaction(function () use ($ids): void {
            $statuses = LeadStatus::query()->lockForUpdate()->get()->keyBy('id');

            if (count($ids) !== $statuses->count() || collect($ids)->diff($statuses->keys())->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'ids' => 'The status list changed in the meantime. Please reload the page and try again.',
                ]);
            }

            foreach (array_values($ids) as $index => $id) {
                $statuses[$id]->update(['sort_order' => $index + 1]);
            }
        });

        return back()->with('success', 'Status order saved.');
    }

    /**
     * The row is locked before the in-use check so nothing can start
     * referencing the status between the check and the delete.
     */
    public function destroy(LeadStatus $status): RedirectResponse
    {
        $deleted = DB::transaction(function () use ($status): bool {
            $locked = LeadStatus::query()->lockForUpdate()->findOrFail($status->id);

            if ($locked->isInUse()) {
                return false;
            }

            $locked->delete();

            return true;
        });

        return $deleted
            ? back()->with('success', 'Status deleted.')
            : back()->with('error', 'This status is in use and cannot be deleted.');
    }

    /**
     * @return array{name: string, slug: string, color: string, is_closed: bool}
     */
    private function validated(Request $request, ?LeadStatus $ignore = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'color' => ['required', Rule::in(LeadStatus::availableColors())],
            'is_closed' => ['required', 'boolean'],
        ]);

        $slug = Str::slug($validated['name']);

        $taken = LeadStatus::query()
            ->where('slug', $slug)
            ->when($ignore, fn ($query) => $query->whereKeyNot($ignore->id))
            ->exists();

        if ($slug === '' || $taken) {
            throw ValidationException::withMessages([
                'name' => $slug === '' ? 'Please use letters or numbers in the name.' : 'A status with this name already exists.',
            ]);
        }

        return [
            'name' => $validated['name'],
            'slug' => $slug,
            'color' => $validated['color'],
            'is_closed' => (bool) $validated['is_closed'],
        ];
    }

    /**
     * The uniqueness check above and the write aren't atomic; the unique
     * index turns a same-moment duplicate into this friendly error instead
     * of a 500.
     */
    private function saveUniquely(callable $write): void
    {
        try {
            $write();
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['name' => 'A status with this name already exists.']);
        }
    }
}
