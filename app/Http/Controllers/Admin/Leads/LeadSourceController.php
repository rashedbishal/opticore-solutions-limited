<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Calling\ManageWhatsAppCalling;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\LeadSource;
use App\Leads\Services\SourceHealth;
use App\Models\Admin;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Leads → Lead Sources. Everyone with a lead role sees the list and its
 * health badges; the mother admin also gets the setup details (secrets are
 * only ever shown as "saved", never sent to the page).
 */
class LeadSourceController extends Controller
{
    public function index(SourceHealth $health): Response
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();
        // Managers see it read-only; only the mother admin changes it.
        abort_unless($admin->isLeadManager(), 403);
        $canManage = $admin->isMotherAdmin();

        $sources = LeadSource::query()
            ->with('tokenCheck')
            ->withCount('leads')
            ->orderBy('name')
            ->get()
            ->map(function (LeadSource $source) use ($health, $canManage): array {
                $row = [
                    'id' => $source->id,
                    'name' => $source->name,
                    'type' => $source->type->value,
                    'type_label' => $source->type->label(),
                    'is_active' => $source->is_active,
                    'built_in' => $source->type->isBuiltIn(),
                    'leads_count' => $source->leads_count,
                    'last_activity_at' => $source->last_synced_at?->toIso8601String(),
                    'health' => $health->of($source),
                ];

                if ($canManage) {
                    $row['webhook_url'] = $source->webhookUrl();
                    $row['config'] = $this->publicConfig($source);
                    $row['missing_app_secret'] = $source->type->isMeta() && empty($source->config['app_secret'] ?? null);

                    if ($source->type === LeadSourceType::Whatsapp) {
                        $row['calling'] = [
                            'enabled' => $source->calling_enabled,
                            'meta_status' => $source->calling_meta_status,
                            'checked_at' => $source->calling_meta_checked_at?->toIso8601String(),
                            'blocked_reason' => app(ManageWhatsAppCalling::class)->blockedReason($source),
                        ];
                    }
                }

                return $row;
            });

        return Inertia::render('Admin/Leads/Sources', [
            'sources' => $sources,
            'canManage' => $canManage,
            'types' => $canManage ? array_map(fn (LeadSourceType $type): array => [
                'value' => $type->value,
                'label' => $type->label(),
                'fields' => $type->configFields(),
            ], LeadSourceType::addable()) : [],
        ]);
    }

    /**
     * Non-secret values as they are; secrets only as whether one is saved.
     *
     * @return array<string, mixed>
     */
    private function publicConfig(LeadSource $source): array
    {
        $config = $source->config ?? [];
        $values = [];

        foreach ($source->type->configFields() as $field) {
            $values[$field['key']] = $field['sensitive']
                ? ['saved' => ! empty($config[$field['key']] ?? null)]
                : ($config[$field['key']] ?? null);
        }

        return $values;
    }
}
