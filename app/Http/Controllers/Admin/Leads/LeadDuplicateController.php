<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Enums\LeadDuplicateLinkStatus;
use App\Leads\Events\LeadUpdated;
use App\Leads\Exceptions\LeadMergeException;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadDuplicateLink;
use App\Leads\Services\LeadAccess;
use App\Leads\Services\LeadMerger;
use App\Models\Admin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

/**
 * Merge two duplicate leads, or mark them "Not a duplicate" (managers and
 * the mother admin).
 */
class LeadDuplicateController extends Controller
{
    public function __construct(private readonly LeadAccess $access) {}

    public function merge(Request $request, Lead $lead, LeadDuplicateLink $link, LeadMerger $merger): RedirectResponse
    {
        $admin = $this->manager();
        abort_unless($link->involves($lead) && $link->status === LeadDuplicateLinkStatus::Pending, 404);

        $validated = $request->validate([
            'keep' => ['required', Rule::in(['this', 'other'])],
            'choices' => ['array'],
            'choices.*' => [Rule::in(['survivor', 'loser'])],
        ]);

        $other = Lead::query()->find($link->otherId($lead));

        if ($other === null) {
            return back()->with('error', 'The other lead no longer exists.');
        }

        [$survivor, $loser] = $validated['keep'] === 'this' ? [$lead, $other] : [$other, $lead];

        try {
            $merged = $merger->merge($survivor, $loser, $admin, $validated['choices'] ?? [], $link);
        } catch (LeadMergeException $e) {
            return back()->with('error', $e->getMessage());
        }

        LeadUpdated::dispatch($merged->id);
        LeadUpdated::dispatch($loser->id);

        return redirect()->route('admin.leads.show', $merged)->with('success', "{$loser->identifier} was merged into {$merged->identifier}.");
    }

    public function dismiss(Lead $lead, LeadDuplicateLink $link): RedirectResponse
    {
        $admin = $this->manager();
        abort_unless($link->involves($lead) && $link->status === LeadDuplicateLinkStatus::Pending, 404);

        $link->update([
            'status' => LeadDuplicateLinkStatus::Dismissed,
            'resolved_by' => $admin->id,
            'resolved_by_name' => $admin->name,
            'resolved_at' => now(),
        ]);

        return back()->with('success', 'Marked as not a duplicate.');
    }

    private function manager(): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();
        abort_unless($this->access->canDelete($admin), 403);

        return $admin;
    }
}
