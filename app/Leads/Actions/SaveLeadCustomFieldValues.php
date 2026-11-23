<?php

namespace App\Leads\Actions;

use App\Leads\Models\Lead;
use App\Leads\Models\LeadCustomFieldDefinition;
use App\Leads\Models\LeadCustomFieldValue;

/**
 * Saves a lead's extra-field values (already validated). A blank value
 * removes the stored row — an empty value is never stored. Only active
 * fields are touched.
 *
 * @return array<int, string> names of fields that changed
 */
class SaveLeadCustomFieldValues
{
    /**
     * @param  array<string, mixed>  $values  definition id => value
     * @return array<int, string>
     */
    public function handle(Lead $lead, array $values): array
    {
        $changed = [];

        foreach (LeadCustomFieldDefinition::query()->activeOrdered()->get() as $definition) {
            if (! array_key_exists($definition->id, $values)) {
                continue;
            }

            $value = $values[$definition->id];
            $value = $value === null ? '' : trim((string) $value);
            $existing = LeadCustomFieldValue::query()->where('lead_id', $lead->id)->where('lead_custom_field_definition_id', $definition->id)->first();

            if ($value === '') {
                if ($existing !== null) {
                    $existing->delete();
                    $changed[] = $definition->name;
                }

                continue;
            }

            if ($existing?->value === $value) {
                continue;
            }

            LeadCustomFieldValue::query()->updateOrCreate(
                ['lead_id' => $lead->id, 'lead_custom_field_definition_id' => $definition->id],
                ['value' => $value],
            );
            $changed[] = $definition->name;
        }

        return $changed;
    }
}
