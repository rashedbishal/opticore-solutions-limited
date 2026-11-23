<?php

namespace App\Http\Controllers\Admin\LeadSettings;

use App\Http\Controllers\Controller;
use App\Leads\Models\Currency;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Lead Settings → Currencies (mother admin only, enforced by the
 * `lead-settings` route key in EnsureAdminHasPermission).
 */
class CurrencyController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/LeadSettings/Currencies', [
            'currencies' => Currency::query()->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validated($request);

        $this->saveUniquely(fn () => Currency::create($validated));

        return back()->with('success', 'Currency added.');
    }

    public function update(Request $request, Currency $currency): RedirectResponse
    {
        $validated = $this->validated($request, $currency);

        $this->saveUniquely(fn () => $currency->update($validated));

        return back()->with('success', 'Currency updated.');
    }

    /**
     * The row is locked before the in-use check so nothing can start
     * referencing the currency between the check and the delete.
     */
    public function destroy(Currency $currency): RedirectResponse
    {
        $deleted = DB::transaction(function () use ($currency): bool {
            $locked = Currency::query()->lockForUpdate()->findOrFail($currency->id);

            if ($locked->isInUse()) {
                return false;
            }

            $locked->delete();

            return true;
        });

        return $deleted
            ? back()->with('success', 'Currency deleted.')
            : back()->with('error', 'This currency is in use and cannot be deleted.');
    }

    /**
     * @return array{code: string, name: string}
     */
    private function validated(Request $request, ?Currency $ignore = null): array
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:10', 'regex:/^[A-Za-z]+$/'],
            'name' => ['required', 'string', 'max:255'],
        ], [
            'code.regex' => 'Currency code may only contain letters.',
        ]);

        $code = Str::upper($validated['code']);

        $taken = Currency::query()
            ->where('code', $code)
            ->when($ignore, fn ($query) => $query->whereKeyNot($ignore->id))
            ->exists();

        if ($taken) {
            throw ValidationException::withMessages(['code' => 'A currency with this code already exists.']);
        }

        return ['code' => $code, 'name' => $validated['name']];
    }

    private function saveUniquely(callable $write): void
    {
        try {
            $write();
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['code' => 'A currency with this code already exists.']);
        }
    }
}
