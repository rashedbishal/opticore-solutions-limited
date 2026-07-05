<?php

namespace App\Console\Commands;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ForcePasswordReset extends Command
{
    protected $signature = 'auth:force-password-reset
        {--dry-run : Report how many accounts would be affected without changing anything}
        {--force : Skip the confirmation prompt}';

    protected $description = 'Invalidate every User and Admin password hash — nobody can log in with their current password afterward';

    public function handle(): int
    {
        $userCount = User::count();
        $adminCount = Admin::count();

        if ($this->option('dry-run')) {
            $this->info("Dry run: would invalidate {$userCount} user password(s) and {$adminCount} admin password(s). Nothing was changed.");

            return self::SUCCESS;
        }

        $this->warn("This will invalidate {$userCount} user password(s) and {$adminCount} admin password(s).");
        $this->warn('Nobody will be able to log in with their current password afterward.');
        $this->warn('Users can recover via the existing "forgot password" email flow.');
        $this->warn('Admins have NO self-service password reset. If you invalidate your own');
        $this->warn('admin password too, you will need `php artisan admin:reset-mother-admin-credentials`');
        $this->warn('to regain access before you can reset any other admin through the CMS.');

        if (! $this->option('force') && ! $this->confirm('Are you sure you want to continue?')) {
            $this->info('Aborted — nothing was changed.');

            return self::SUCCESS;
        }

        User::query()->chunkById(200, function ($users) {
            foreach ($users as $user) {
                $user->forceFill(['password' => Hash::make(Str::random(60))])->save();
            }
        });

        Admin::query()->chunkById(200, function ($admins) {
            foreach ($admins as $admin) {
                $admin->forceFill(['password' => Hash::make(Str::random(60))])->save();
            }
        });

        $this->info("Invalidated {$userCount} user password(s) and {$adminCount} admin password(s).");

        return self::SUCCESS;
    }
}
