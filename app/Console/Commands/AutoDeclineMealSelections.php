<?php

namespace App\Console\Commands;

use App\Events\MealSelectionUpdated;
use App\Models\MealSelection;
use App\Models\MealSetting;
use App\Support\MealClock;
use App\Support\MealScheduleService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('meal:auto-decline')]
#[Description("Auto-decline any eligible admin who hasn't selected lunch by today's lock time.")]
class AutoDeclineMealSelections extends Command
{
    public function handle(): int
    {
        $today = MealClock::today();
        $settings = MealSetting::current();

        if (MealScheduleService::isHolidayOrCancelled($today, $settings)) {
            $this->line('Today is a holiday/cancelled — nothing to do.');

            return self::SUCCESS;
        }

        if (! MealScheduleService::isLocked($settings)) {
            $this->line('Lock time has not been reached yet — nothing to do.');

            return self::SUCCESS;
        }

        $eligibleIds = MealScheduleService::eligibleAdminIds();

        if ($eligibleIds === []) {
            return self::SUCCESS;
        }

        $alreadyDecided = MealSelection::query()
            ->where('date', $today)
            ->whereIn('admin_id', $eligibleIds)
            ->pluck('admin_id')
            ->all();

        $missing = array_diff($eligibleIds, $alreadyDecided);

        foreach ($missing as $adminId) {
            MealSelection::create([
                'date' => $today,
                'admin_id' => $adminId,
                'status' => 'declined',
                'is_auto_declined' => true,
                'decided_at' => MealClock::now(),
            ]);
        }

        if ($missing !== []) {
            $this->info('Auto-declined '.count($missing).' admin(s) for '.$today.'.');
            MealSelectionUpdated::dispatch();
        }

        return self::SUCCESS;
    }
}
