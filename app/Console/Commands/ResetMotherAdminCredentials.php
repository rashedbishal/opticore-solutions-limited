<?php

namespace App\Console\Commands;

use App\Models\Admin;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

class ResetMotherAdminCredentials extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:reset-mother-admin-credentials';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create or reset the mother admin account — the single super-admin with full CMS access. Intended as a server-access "break glass" recovery path when the mother admin is locked out.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = text(
            label: 'Mother admin email',
            required: true,
            validate: fn (string $value) => Validator::make(['email' => $value], [
                'email' => ['required', 'email'],
            ])->errors()->first('email'),
        );

        $password = password(
            label: 'New password',
            required: true,
            validate: fn (string $value) => Validator::make(['password' => $value], [
                'password' => ['required', 'string', 'min:8'],
            ])->errors()->first('password'),
        );

        password(
            label: 'Confirm password',
            required: true,
            validate: fn (string $value) => $value === $password ? null : 'The passwords do not match.',
        );

        $admin = Admin::where('email', $email)->first();

        if (! $admin) {
            $name = text(label: 'Name for the new mother admin account', required: true);

            $admin = new Admin(['name' => $name, 'email' => $email]);
            $admin->email_verified_at = now();

            $this->components->info("Creating a new mother admin account for {$email}.");
        } elseif (! $admin->is_super_admin) {
            if (! confirm("'{$admin->name}' ({$email}) is currently a regular admin. Promote them to mother admin and reset their password?", default: false)) {
                $this->components->warn('Aborted — no changes were made.');

                return self::FAILURE;
            }
        } else {
            $this->components->info("Resetting credentials for the existing mother admin '{$admin->name}' ({$email}).");
        }

        $admin->forceFill([
            'password' => Hash::make($password),
            'is_super_admin' => true,
            'full_access' => true,
            'permissions' => [],
        ])->save();

        $this->demoteOtherMotherAdmins($admin);

        $this->components->info("Mother admin credentials set for {$email}.");

        return self::SUCCESS;
    }

    /**
     * The system supports exactly one mother admin. If a different account
     * was previously the mother admin, offer to demote it to a regular admin
     * with no special access — confirming first since this strips another
     * account's privileges.
     */
    private function demoteOtherMotherAdmins(Admin $current): void
    {
        $others = Admin::where('is_super_admin', true)->where('id', '!=', $current->id)->get();

        foreach ($others as $other) {
            if (! confirm("'{$other->name}' ({$other->email}) is also currently a mother admin. Demote them to a regular admin with no access?", default: true)) {
                $this->components->warn("Left '{$other->name}' ({$other->email}) as a mother admin — the system now has more than one.");

                continue;
            }

            $other->forceFill([
                'is_super_admin' => false,
                'full_access' => false,
                'permissions' => [],
            ])->save();

            $this->components->info("Demoted '{$other->name}' ({$other->email}) to a regular admin.");
        }
    }
}
