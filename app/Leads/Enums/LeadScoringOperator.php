<?php

namespace App\Leads\Enums;

/**
 * Same operators and matching as OptiFin.
 */
enum LeadScoringOperator: string
{
    case GreaterThanOrEqual = '>=';
    case LessThanOrEqual = '<=';
    case GreaterThan = '>';
    case LessThan = '<';
    case Equals = '=';
    case NotEquals = '!=';
    case In = 'in';
    case NotIn = 'not_in';

    public function label(): string
    {
        return match ($this) {
            self::GreaterThanOrEqual => 'is at least',
            self::LessThanOrEqual => 'is at most',
            self::GreaterThan => 'is more than',
            self::LessThan => 'is less than',
            self::Equals => 'is',
            self::NotEquals => 'is not',
            self::In => 'is one of',
            self::NotIn => 'is not one of',
        };
    }

    public function isList(): bool
    {
        return $this === self::In || $this === self::NotIn;
    }

    public function evaluate(mixed $actual, mixed $expected): bool
    {
        return match ($this) {
            self::GreaterThanOrEqual => is_numeric($actual) && is_numeric($expected) && (float) $actual >= (float) $expected,
            self::LessThanOrEqual => is_numeric($actual) && is_numeric($expected) && (float) $actual <= (float) $expected,
            self::GreaterThan => is_numeric($actual) && is_numeric($expected) && (float) $actual > (float) $expected,
            self::LessThan => is_numeric($actual) && is_numeric($expected) && (float) $actual < (float) $expected,
            self::Equals => is_numeric($actual) && is_numeric($expected)
                ? (float) $actual === (float) $expected
                : self::normalize($actual) === self::normalize($expected),
            self::NotEquals => is_numeric($actual) && is_numeric($expected)
                ? (float) $actual !== (float) $expected
                : self::normalize($actual) !== self::normalize($expected),
            self::In => is_array($expected) && in_array(self::normalize($actual), array_map(self::normalize(...), $expected), true),
            self::NotIn => is_array($expected) && ! in_array(self::normalize($actual), array_map(self::normalize(...), $expected), true),
        };
    }

    private static function normalize(mixed $value): ?string
    {
        if ($value === null || is_array($value)) {
            return null;
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        return (string) $value;
    }
}
