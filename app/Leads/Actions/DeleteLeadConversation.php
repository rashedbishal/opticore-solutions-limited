<?php

namespace App\Leads\Actions;

use App\Leads\Events\LeadUpdated;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadAttachment;
use App\Leads\Models\LeadConversation;
use App\Leads\Models\LeadConversationDeletion;
use App\Leads\Models\LeadMessage;
use App\Models\Admin;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Deletes a lead's whole conversation — messages, attachments and their
 * files — keeping a record of the deletion (same as OptiFin). The lead
 * itself stays.
 */
class DeleteLeadConversation
{
    /**
     * @return array{messages: int, conversations: int, attachments: int, files: int}
     */
    public function summarize(Lead $lead): array
    {
        return [
            'messages' => LeadMessage::query()->where('lead_id', $lead->id)->count(),
            'conversations' => LeadConversation::query()->where('lead_id', $lead->id)->count(),
            'attachments' => LeadAttachment::query()->where('lead_id', $lead->id)->count(),
            'files' => count($this->paths($lead)),
        ];
    }

    public function handle(Lead $lead, Admin $actor): void
    {
        $paths = [];

        DB::transaction(function () use ($lead, $actor, &$paths): void {
            $locked = Lead::query()->whereKey($lead->id)->lockForUpdate()->with('source')->firstOrFail();
            $paths = $this->paths($locked);

            LeadConversationDeletion::create([
                'lead_id' => $locked->id,
                'lead_identifier' => $locked->identifier,
                'lead_name' => $locked->name,
                'channel' => $locked->source->type->value,
                'deleted_by' => $actor->id,
                'deleted_by_name' => $actor->name,
                'summary' => $this->summarize($locked),
            ]);

            LeadMessage::query()->where('lead_id', $locked->id)->delete();
            LeadConversation::query()->where('lead_id', $locked->id)->delete();
            LeadAttachment::query()->where('lead_id', $locked->id)->delete();
            $locked->forceFill(['message' => null])->save();
        });

        Storage::disk('local')->delete($paths);
        LeadUpdated::dispatch($lead->id);
    }

    /**
     * @return array<int, string>
     */
    private function paths(Lead $lead): array
    {
        return LeadAttachment::query()->where('lead_id', $lead->id)->whereNotNull('path')->pluck('path')
            ->merge(LeadMessage::query()->where('lead_id', $lead->id)->whereNotNull('attachment_path')->pluck('attachment_path'))
            ->unique()->values()->all();
    }
}
