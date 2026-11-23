<?php

namespace App\Leads\Enums;

use Illuminate\Validation\Rule;

enum LeadCustomFieldType: string
{
    case Text = 'text';
    case Number = 'number';
    case Date = 'date';
    case Select = 'select';

    public function label(): string
    {
        return match ($this) {
            self::Text => 'Text',
            self::Number => 'Number',
            self::Date => 'Date',
            self::Select => 'Choice list',
        };
    }

    /**
     * Same rules as OptiFin.
     *
     * @param  array<int, string>|null  $options
     * @return array<int, mixed>
     */
    public function rules(bool $required, ?array $options): array
    {
        $presence = $required ? 'required' : 'nullable';

        return match ($this) {
            self::Text => [$presence, 'string', 'max:255'],
            self::Number => [$presence, 'numeric', 'regex:/^-?\d{1,12}(\.\d{1,2})?$/'],
            self::Date => [$presence, 'date'],
            self::Select => [$presence, Rule::in($options ?? [])],
        };
    }
}
