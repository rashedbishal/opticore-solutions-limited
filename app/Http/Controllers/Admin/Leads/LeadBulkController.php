<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Actions\AssignLead;
use App\Leads\Actions\ChangeLeadStatus;
use App\Leads\Actions\DeleteLead;
use App\Leads\Enums\LeadPriority;
use App\Leads\Events\LeadUpdated;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadTag;
use App\Leads\Services\LeadAccess;
use App\Models\Admin;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Bulk actions on the managers' All Leads list (up to 100 leads). Each lead
 * goes through exactly the same action as changing it on its own, never a
 * raw mass update.
 */
class LeadBulkController extends Controller
{
    public const int MAX = 100;

    public const array ACTIONS = ['status', 'priority', 'assign', 'unassign', 'tag_attach', 'tag_detach', 'delete'];

    public function __construct(private readonly LeadAccess $access) {}

    public function __invoke(Request $request, ChangeLeadStatus $changeStatus, AssignLead $assign, DeleteLead $delete): RedirectResponse
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();
        abort_unless($this->access->canDelete($admin), 403);

        $validated = $request->validate([
            'action' => ['required', Rule::in(self::ACTIONS)],
            'lead_ids' => ['required', 'array', 'min:1', 'max:'.self::MAX],
            'lead_ids.*' => ['string'],
            'status_id' => ['required_if:action,status', 'nullable', 'string', Rule::exists('lead_statuses', 'id')],
            'priority' => ['required_if:action,priority', 'nullable', Rule::enum(LeadPriority::class)],
            'assigned_to' => ['required_if:action,assign', 'nullable', 'integer'],
            'tag_id' => ['required_if:action,tag_attach,tag_detach', 'nullable', 'string', Rule::exists('lead_tags', 'id')],
        ], ['lead_ids.max' => 'You can change at most '.self::MAX.' leads at once.']);

        $leads = $this->eligible($admin, $validated['lead_ids']);
        $done = 0;
        $failed = 0;

        foreach ($leads as $lead) {
            try {
                $this->apply($validated, $lead, $admin, $changeStatus, $assign, $delete);
                $done++;
            } catch (ValidationException $e) {
                // e.g. an assignee without lead access: the same for every row.
                throw $e;
            } catch (Throwable $e) {
                report($e);
                $failed++;
            }
        }

        $skipped = count(array_unique($validated['lead_ids'])) - $leads->count();
        $verb = $validated['action'] === 'delete' ? 'deleted' : 'updated';
        $message = "{$done} lead".($done === 1 ? '' : 's')." {$verb}.";

        if ($skipped + $failed > 0) {
            $message .= ' '.($skipped + $failed).' could not be changed.';
        }

        return back()->with($done > 0 ? 'success' : 'error', $message);
    }

    /**
     * Only leads this manager can see, re-read from the database.
     *
     * @param  array<int, string>  $ids
     * @return Collection<int, Lead>
     */
    private function eligible(Admin $admin, array $ids): Collection
    {
        return $this->access->visibleLeads($admin)->whereKey(array_values(array_unique($ids)))->get();
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function apply(array $input, Lead $lead, Admin $admin, ChangeLeadStatus $changeStatus, AssignLead $assign, DeleteLead $delete): void
    {
        match ($input['action']) {
            'status' => $changeStatus->handle($lead, (string) $input['status_id'], null, $admin),
            'priority' => $changeStatus->handle($lead, null, LeadPriority::from((string) $input['priority']), $admin),
            'assign' => $assign->handle($lead, (int) $input['assigned_to'], $admin),
            'unassign' => $assign->handle($lead, null, $admin),
            'tag_attach' => $this->tag($lead, (string) $input['tag_id'], $admin, attach: true),
            'tag_detach' => $this->tag($lead, (string) $input['tag_id'], $admin, attach: false),
            'delete' => $delete->handle($lead, $admin, isBulk: true),
            default => null,
        };
    }

    private function tag(Lead $lead, string $tagId, Admin $admin, bool $attach): void
    {
        $tag = LeadTag::query()->findOrFail($tagId);

        $attach
            ? $lead->tags()->syncWithoutDetaching([$tag->id => ['tagged_by' => $admin->id]])
            : $lead->tags()->detach($tag->id);

        LeadUpdated::dispatch($lead->id);
    }
}
