<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Models\LeadSource;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Leads → Lead Sources: a read-only list of where leads come from, for
 * everyone with a lead role. Credentials are never sent to this page.
 */
class LeadSourceController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Leads/Sources', [
            'sources' => LeadSource::query()
                ->withCount('leads')
                ->orderBy('name')
                ->get()
                ->map(fn (LeadSource $source): array => [
                    'id' => $source->id,
                    'name' => $source->name,
                    'type' => $source->type->value,
                    'type_label' => $source->type->label(),
                    'is_active' => $source->is_active,
                    'leads_count' => $source->leads_count,
                ]),
        ]);
    }
}
