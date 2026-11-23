<?php

namespace App\Leads\Actions;

use App\Leads\Enums\LeadImportRowStatus;
use App\Leads\Enums\LeadPriority;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\Currency;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadImport;
use App\Leads\Models\LeadImportRow;
use App\Leads\Models\LeadSource;
use App\Leads\Models\LeadStatus;
use App\Leads\Models\LeadTag;
use App\Leads\Services\LeadAssignmentService;
use App\Leads\Services\LeadDuplicateDetector;
use App\Leads\Services\LeadPeople;
use App\Leads\Support\LeadRules;
use App\Models\Admin;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Throwable;

/**
 * Imports one row of a lead file, as OptiFin does: the row is checked,
 * skipped as a duplicate when its email or phone matches an existing lead
 * (or an earlier row of the same file), and otherwise created on the
 * "Imported File" source. No new-lead alerts are sent.
 */
class ImportLeadRow
{
    public function __construct(
        private readonly LeadAssignmentService $assignments,
        private readonly LeadPeople $people,
    ) {}

    /**
     * @param  array<string, string|null>  $row
     */
    public function handle(LeadImport $import, int $rowNumber, array $row, ?Admin $importedBy): LeadImportRowStatus
    {
        if (LeadImportRow::query()->where('lead_import_id', $import->id)->where('row_number', $rowNumber)->exists()) {
            return LeadImportRowStatus::Imported;
        }

        try {
            return $this->process($import, $rowNumber, $row, $importedBy);
        } catch (Throwable $e) {
            report($e);

            return $this->record($import, $rowNumber, $row, LeadImportRowStatus::Failed, ['Something went wrong importing this row.']);
        }
    }

    /**
     * @param  array<string, string|null>  $row
     */
    private function process(LeadImport $import, int $rowNumber, array $row, ?Admin $importedBy): LeadImportRowStatus
    {
        $rules = LeadRules::contact() + array_intersect_key(LeadRules::company(), array_flip(['company', 'industry', 'location']));
        $deal = LeadRules::deal();
        $rules['service_interest'] = $deal['service_interest'];
        $rules['budget'] = $deal['estimated_budget'];
        $rules['deal_value'] = $deal['deal_value'];

        $validator = Validator::make($row, $rules, [
            ...LeadRules::messages(),
            'budget.regex' => 'Enter a plain budget amount with up to 2 decimal places.',
            'deal_value.regex' => 'Enter a plain deal value with up to 2 decimal places.',
        ]);

        if ($validator->fails()) {
            return $this->record($import, $rowNumber, $row, LeadImportRowStatus::Failed, $validator->errors()->all());
        }

        $email = LeadDuplicateDetector::normalizeEmail($row['email'] ?? null);
        $phone = LeadDuplicateDetector::normalizePhone($row['phone'] ?? null);

        $earlier = $this->matching(LeadImportRow::query()->where('lead_import_id', $import->id)->where('status', LeadImportRowStatus::Imported), $email, $phone)->value('row_number');

        if ($earlier !== null) {
            return $this->record($import, $rowNumber, $row, LeadImportRowStatus::Duplicate, ["Same person as row {$earlier} of this file."], $email, $phone);
        }

        $existing = $this->matching(Lead::query()->withMerged(), $email, $phone)->first();

        if ($existing !== null) {
            $current = $existing->latestVersion();

            return $this->record($import, $rowNumber, $row, LeadImportRowStatus::Duplicate, ["Duplicate of {$current->identifier}."], $email, $phone, duplicateOf: $current->identifier);
        }

        $problems = [];
        $statusId = $this->status($row['status'] ?? null, $problems);
        $priority = $this->priority($row['priority'] ?? null, $problems);
        $assignee = $this->assignee($row['assignee_email'] ?? null, $problems);
        $tagIds = $this->tags($row['tags'] ?? null, $problems);
        $budgetCurrency = $this->currency($row['budget'] ?? null, $row['budget_currency'] ?? null, 'budget_currency', $problems);
        $dealCurrency = $this->currency($row['deal_value'] ?? null, $row['deal_value_currency'] ?? null, 'deal_value_currency', $problems);

        if ($problems !== []) {
            return $this->record($import, $rowNumber, $row, LeadImportRowStatus::Failed, $problems, $email, $phone);
        }

        return DB::transaction(function () use ($import, $rowNumber, $row, $importedBy, $email, $phone, $statusId, $priority, $assignee, $tagIds, $budgetCurrency, $dealCurrency): LeadImportRowStatus {
            $lead = Lead::create([
                'source_id' => LeadSource::ofType(LeadSourceType::CsvImport)->id,
                'name' => $row['name'],
                'email' => $row['email'] ?? null,
                'phone' => $row['phone'] ?? null,
                'company' => $row['company'] ?? null,
                'industry' => $row['industry'] ?? null,
                'location' => $row['location'] ?? null,
                'service_interest' => $row['service_interest'] ?? null,
                'estimated_budget' => $row['budget'] ?? null,
                'estimated_budget_currency_id' => $budgetCurrency,
                'deal_value' => $row['deal_value'] ?? null,
                'deal_value_currency_id' => $dealCurrency,
                'status_id' => $statusId,
                'priority' => $priority,
                'source_data' => ['import_id' => $import->id, 'import_file' => $import->file_name, 'row' => $rowNumber],
            ]);

            if ($tagIds !== []) {
                $lead->tags()->attach(array_fill_keys($tagIds, ['tagged_by' => $importedBy?->id]));
            }

            if ($assignee !== null) {
                $this->assignments->assign($lead, $assignee, $importedBy, 'Imported from '.$import->file_name);
            }

            return $this->record($import, $rowNumber, $row, LeadImportRowStatus::Imported, null, $email, $phone, $lead->id);
        });
    }

    /**
     * @template T of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<T>  $query
     * @return Builder<T>
     */
    private function matching(Builder $query, ?string $email, ?string $phone): Builder
    {
        if ($email === null && $phone === null) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where(function (Builder $q) use ($email, $phone): void {
            if ($email !== null) {
                $q->orWhere('email_normalized', $email);
            }

            if ($phone !== null) {
                $q->orWhere('phone_normalized', $phone);
            }
        });
    }

    /**
     * @param  array<int, string>  $problems
     */
    private function status(?string $name, array &$problems): ?string
    {
        if ($name === null) {
            return LeadStatus::initial()?->id;
        }

        $id = LeadStatus::query()->whereRaw('lower(name) = ?', [mb_strtolower($name)])->value('id');

        if ($id === null) {
            $problems[] = "Unknown status: {$name}";
        }

        return $id;
    }

    /**
     * @param  array<int, string>  $problems
     */
    private function priority(?string $value, array &$problems): LeadPriority
    {
        if ($value === null) {
            return LeadPriority::Medium;
        }

        $priority = LeadPriority::tryFrom(mb_strtolower($value));

        if ($priority === null) {
            $problems[] = "Unknown priority: {$value} (use low, medium, high or urgent)";
        }

        return $priority ?? LeadPriority::Medium;
    }

    /**
     * @param  array<int, string>  $problems
     */
    private function assignee(?string $email, array &$problems): ?Admin
    {
        if ($email === null) {
            return null;
        }

        $admin = $this->people->leadUsersQuery()->whereRaw('lower(email) = ?', [mb_strtolower($email)])->first();

        if ($admin === null) {
            $problems[] = "No one with lead access has the email {$email}";
        }

        return $admin;
    }

    /**
     * @param  array<int, string>  $problems
     * @return array<int, string>
     */
    private function tags(?string $value, array &$problems): array
    {
        if ($value === null) {
            return [];
        }

        $names = array_values(array_unique(array_filter(array_map('trim', explode(',', $value)), fn (string $n): bool => $n !== '')));
        $found = LeadTag::query()->get(['id', 'name'])->keyBy(fn (LeadTag $t): string => mb_strtolower($t->name));
        $ids = [];

        foreach ($names as $name) {
            $tag = $found->get(mb_strtolower($name));

            if ($tag === null) {
                $problems[] = "Unknown tag: {$name}";
            } else {
                $ids[] = $tag->id;
            }
        }

        return $ids;
    }

    /**
     * @param  array<int, string>  $problems
     */
    private function currency(?string $amount, ?string $code, string $column, array &$problems): ?string
    {
        if ($amount === null || $code === null) {
            return null;
        }

        $id = Currency::query()->whereRaw('upper(code) = ?', [mb_strtoupper($code)])->value('id');

        if ($id === null) {
            $problems[] = "Unknown {$column}: {$code}";
        }

        return $id;
    }

    /**
     * @param  array<string, string|null>  $row
     * @param  array<int, string>|null  $errors
     */
    private function record(LeadImport $import, int $rowNumber, array $row, LeadImportRowStatus $status, ?array $errors, ?string $email = null, ?string $phone = null, ?string $leadId = null, ?string $duplicateOf = null): LeadImportRowStatus
    {
        LeadImportRow::query()->create([
            'lead_import_id' => $import->id,
            'row_number' => $rowNumber,
            'status' => $status,
            'data' => $row,
            'errors' => $errors,
            'email_normalized' => $email,
            'phone_normalized' => $phone,
            'lead_id' => $leadId,
            'duplicate_of' => $duplicateOf,
        ]);

        return $status;
    }
}
