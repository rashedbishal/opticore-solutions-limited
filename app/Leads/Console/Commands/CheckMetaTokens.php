<?php

namespace App\Leads\Console\Commands;

use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\LeadSource;
use App\Leads\Services\Meta\MetaTokenChecker;
use Illuminate\Console\Command;

/**
 * Daily: checks every active Facebook/Instagram/WhatsApp source's key with
 * Meta, for the health warnings on Lead Sources.
 */
class CheckMetaTokens extends Command
{
    protected $signature = 'leads:check-meta-tokens';

    protected $description = 'Check every active Meta lead source\'s access token with Meta';

    public function handle(MetaTokenChecker $checker): int
    {
        LeadSource::query()
            ->where('is_active', true)
            ->whereIn('type', array_filter(LeadSourceType::cases(), fn (LeadSourceType $type): bool => $type->isMeta()))
            ->each(fn (LeadSource $source) => $checker->check($source));

        return self::SUCCESS;
    }
}
