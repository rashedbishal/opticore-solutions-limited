<?php

namespace App\Http\Controllers\Admin;

use App\Events\MealSelectionUpdated;
use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\MealCancellation;
use App\Models\MealHoliday;
use App\Models\MealItem;
use App\Models\MealSelection;
use App\Models\MealSetting;
use App\Support\MealClock;
use App\Support\MealScheduleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MealManagementController extends Controller
{
    public function index(): Response
    {
        $admin = $this->actor();
        $today = MealClock::today();

        if ($admin->isMotherAdmin()) {
            return $this->overview($today);
        }

        return $this->selfService($admin, $today);
    }

    private function overview(string $today): Response
    {
        $settings = MealSetting::current();
        $item = MealItem::forDate($today);
        $blockedReason = MealScheduleService::blockedReason($today, $settings);

        $eligibleAdmins = MealScheduleService::eligibleAdmins();
        $selections = MealSelection::query()->where('date', $today)->get();

        $roster = $eligibleAdmins->map(function (Admin $eligibleAdmin) use ($selections) {
            $selection = $selections->firstWhere('admin_id', $eligibleAdmin->id);

            if ($selection === null) {
                return [
                    'admin_id' => $eligibleAdmin->id,
                    'name' => $eligibleAdmin->name,
                    'email' => $eligibleAdmin->email,
                    'status' => 'pending',
                    'is_auto_declined' => false,
                    'decided_at' => null,
                    'overridden_at' => null,
                ];
            }

            return [
                'admin_id' => $eligibleAdmin->id,
                'name' => $eligibleAdmin->name,
                'email' => $eligibleAdmin->email,
                'status' => $selection->status,
                'is_auto_declined' => $selection->is_auto_declined,
                'decided_at' => $selection->decided_at?->toIso8601String(),
                'overridden_at' => $selection->overridden_at?->toIso8601String(),
            ];
        })->values();

        $holidays = MealHoliday::query()->orderByDesc('start_date')->limit(25)->get();

        return Inertia::render('Admin/MealManagement/Overview', [
            'today' => $today,
            'settings' => [
                'accept_start_time' => $settings->accept_start_time,
                'lock_time' => $settings->lock_time,
                'weekly_holiday_day' => $settings->weekly_holiday_day,
                'is_configured' => $settings->isConfigured(),
            ],
            'todaysItem' => $item?->item_name,
            'blockedReason' => $blockedReason,
            'roster' => $roster,
            'totals' => [
                'accepted' => $roster->where('status', 'accepted')->count(),
                'declined' => $roster->where('status', 'declined')->count(),
                'pending' => $roster->where('status', 'pending')->count(),
            ],
            'holidays' => $holidays,
        ]);
    }

    private function selfService(Admin $admin, string $today): Response
    {
        $settings = MealSetting::current();
        $blockedReason = MealScheduleService::blockedReason($today, $settings);
        $item = MealItem::forDate($today);
        $selection = MealSelection::query()
            ->where('date', $today)
            ->where('admin_id', $admin->id)
            ->first();

        return Inertia::render('Admin/MealManagement/SelfService', [
            'today' => $today,
            'todaysItem' => $item?->item_name,
            'blockedReason' => $blockedReason,
            'isConfigured' => $settings->isConfigured(),
            'isOpen' => MealScheduleService::isSelectionOpen($settings),
            'isLocked' => MealScheduleService::isLocked($settings),
            'acceptStartTime' => $settings->accept_start_time,
            'lockTime' => $settings->lock_time,
            'selection' => $selection ? [
                'status' => $selection->status,
                'is_auto_declined' => $selection->is_auto_declined,
                'decided_at' => $selection->decided_at?->toIso8601String(),
            ] : null,
        ]);
    }

    public function select(Request $request): RedirectResponse
    {
        $admin = $this->actor();

        abort_if($admin->isMotherAdmin(), 403);
        abort_unless($admin->canAccess('meal-management'), 403);

        $data = $request->validate([
            'status' => ['required', Rule::in(['accepted', 'declined'])],
        ]);

        $today = MealClock::today();
        $settings = MealSetting::current();

        if (MealScheduleService::isHolidayOrCancelled($today, $settings)) {
            return back()->with('error', 'Lunch selection is closed today.');
        }

        if (! MealScheduleService::isSelectionOpen($settings)) {
            return back()->with('error', 'Lunch selection is not open right now.');
        }

        $exists = MealSelection::query()
            ->where('date', $today)
            ->where('admin_id', $admin->id)
            ->exists();

        if ($exists) {
            return back()->with('error', "You've already made your selection for today.");
        }

        MealSelection::create([
            'date' => $today,
            'admin_id' => $admin->id,
            'status' => $data['status'],
            'decided_at' => MealClock::now(),
        ]);

        MealSelectionUpdated::dispatch();

        return back()->with('success', 'Your lunch selection has been recorded.');
    }

    public function updateItem(Request $request): RedirectResponse
    {
        $this->authorizeMotherAdminOnly();

        $data = $request->validate([
            'item_name' => 'nullable|string|max:255',
        ]);

        MealItem::updateOrCreate(
            ['date' => MealClock::today()],
            [
                'item_name' => $data['item_name'] ?? null,
                'set_by_admin_id' => $this->actor()->id,
            ],
        );

        return back()->with('success', "Today's meal item has been updated.");
    }

    public function updateSettings(Request $request): RedirectResponse
    {
        $this->authorizeMotherAdminOnly();

        $data = $request->validate([
            'accept_start_time' => 'required|date_format:H:i',
            'lock_time' => 'required|date_format:H:i|after:accept_start_time',
            'weekly_holiday_day' => 'required|integer|min:0|max:6',
        ]);

        $settings = MealSetting::current();
        $settings->exists ? $settings->update($data) : MealSetting::create($data);
        MealSetting::forgetCache();

        return back()->with('success', 'Meal schedule settings updated.');
    }

    public function storeHoliday(Request $request): RedirectResponse
    {
        $this->authorizeMotherAdminOnly();

        $data = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'note' => 'nullable|string|max:255',
        ]);

        MealHoliday::create([
            ...$data,
            'created_by_admin_id' => $this->actor()->id,
        ]);

        return back()->with('success', 'Holiday added.');
    }

    public function destroyHoliday(MealHoliday $holiday): RedirectResponse
    {
        $this->authorizeMotherAdminOnly();

        $holiday->delete();

        return back()->with('success', 'Holiday removed.');
    }

    public function storeCancellation(Request $request): RedirectResponse
    {
        $this->authorizeMotherAdminOnly();

        $data = $request->validate([
            'date' => 'required|date',
            'note' => 'required|string|max:500',
        ]);

        MealCancellation::updateOrCreate(
            ['date' => $data['date']],
            [
                'note' => $data['note'],
                'cancelled_by_admin_id' => $this->actor()->id,
            ],
        );

        // Cancelling a day acts like an ad hoc holiday: any selections
        // already made for that date are cleared so it's excluded from the
        // monthly report, and the day shows the cancellation note instead
        // of the accept/decline UI.
        MealSelection::query()->where('date', $data['date'])->delete();

        MealSelectionUpdated::dispatch();

        return back()->with('success', "That day's lunch has been cancelled.");
    }

    public function destroyCancellation(MealCancellation $cancellation): RedirectResponse
    {
        $this->authorizeMotherAdminOnly();

        $cancellation->delete();

        MealSelectionUpdated::dispatch();

        return back()->with('success', 'Cancellation removed.');
    }

    public function override(Request $request): RedirectResponse
    {
        $admin = $this->actor();
        $this->authorizeMotherAdminOnly();

        $data = $request->validate([
            'date' => 'required|date',
            'admin_id' => ['required', 'integer', Rule::exists('admin.admins', 'id')],
            'status' => ['required', Rule::in(['accepted', 'declined'])],
            'password' => 'required|string',
        ]);

        if (! Hash::check($data['password'], $admin->password)) {
            return back()->withErrors(['password' => 'Incorrect password.']);
        }

        MealSelection::updateOrCreate(
            ['date' => $data['date'], 'admin_id' => $data['admin_id']],
            [
                'status' => $data['status'],
                'is_auto_declined' => false,
                'decided_at' => MealClock::now(),
                'overridden_by_admin_id' => $admin->id,
                'overridden_at' => MealClock::now(),
            ],
        );

        MealSelectionUpdated::dispatch();

        return back()->with('success', 'Selection updated.');
    }

    private function actor(): Admin
    {
        /** @var Admin */
        return Auth::guard('admin')->user();
    }

    private function authorizeMotherAdminOnly(): void
    {
        abort_unless($this->actor()->isMotherAdmin(), 403);
    }
}
