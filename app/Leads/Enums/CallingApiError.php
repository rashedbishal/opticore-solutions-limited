<?php

namespace App\Leads\Enums;

/**
 * Meta Calling API errors, grouped as in OptiFin.
 */
enum CallingApiError: string
{
    case Validation = 'validation';
    case Authentication = 'authentication';
    case Permission = 'permission';
    case CallingNotEnabled = 'calling_not_enabled';
    case TemporarilyDisabled = 'temporarily_disabled';
    case NotEligible = 'not_eligible';
    case MissingPermission = 'missing_permission';
    case SipNumber = 'sip_number';
    case Payment = 'payment';
    case Limit = 'limit';
    case Transient = 'transient';
    case Network = 'network';
    case InvalidResponse = 'invalid_response';
    case Unknown = 'unknown';

    public static function classify(?int $metaCode, ?int $httpStatus): self
    {
        if ($metaCode !== null) {
            $byCode = match (true) {
                $metaCode === 138000 => self::CallingNotEnabled,
                $metaCode === 138014 => self::TemporarilyDisabled,
                in_array($metaCode, [138013, 138015, 138018], true) => self::NotEligible,
                $metaCode === 138006 => self::MissingPermission,
                $metaCode === 131055 => self::SipNumber,
                $metaCode === 131044 => self::Payment,
                in_array($metaCode, [138002, 138005, 138009, 138012, 613], true) => self::Limit,
                in_array($metaCode, [138004, 138007], true), $metaCode >= 138019 && $metaCode <= 138023 => self::Transient,
                $metaCode === 190 => self::Authentication,
                $metaCode === 10, $metaCode >= 200 && $metaCode <= 299 => self::Permission,
                $metaCode === 100 => self::Validation,
                default => null,
            };

            if ($byCode !== null) {
                return $byCode;
            }
        }

        return match (true) {
            $httpStatus === 401 => self::Authentication,
            $httpStatus === 403 => self::Permission,
            $httpStatus === 429 => self::Limit,
            $httpStatus !== null && $httpStatus >= 500 => self::Transient,
            $httpStatus !== null && $httpStatus >= 400 => self::Validation,
            default => self::Unknown,
        };
    }

    public function retryable(): bool
    {
        return in_array($this, [self::Network, self::Transient, self::Limit, self::InvalidResponse], true);
    }

    public function userMessage(): string
    {
        return match ($this) {
            self::Validation => 'WhatsApp rejected the request. Check the number\'s Phone Number ID and try again.',
            self::Authentication => 'WhatsApp rejected the access token. Update it on this source and try again.',
            self::Permission => 'The access token is not allowed to manage calling for this number.',
            self::CallingNotEnabled => 'Calling is not enabled for this WhatsApp number.',
            self::TemporarilyDisabled => 'WhatsApp has temporarily disabled calling for this number.',
            self::NotEligible => 'This WhatsApp number does not meet WhatsApp\'s requirements for calling.',
            self::MissingPermission => 'This person has not allowed calls from your business.',
            self::SipNumber => 'This number uses SIP calling, which can\'t be managed here.',
            self::Payment => 'WhatsApp reports no valid payment method on this account.',
            self::Limit => 'WhatsApp is limiting requests. Try again in a few minutes.',
            self::Transient => 'WhatsApp had a temporary problem. Try again in a few minutes.',
            self::Network => 'Could not reach WhatsApp. Try again in a few minutes.',
            self::InvalidResponse => 'WhatsApp returned an unexpected response.',
            self::Unknown => 'WhatsApp returned an error.',
        };
    }
}
