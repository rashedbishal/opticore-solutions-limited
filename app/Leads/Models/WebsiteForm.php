<?php

namespace App\Leads\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A form placed on another website (e.g. a landing page). Submissions are
 * posted to /api/forms/{secret key}; only the key's hash is stored.
 *
 * @property array<int, string>|null $allowed_domains
 * @property bool $is_active
 */
class WebsiteForm extends Model
{
    use HasUlids;

    protected $fillable = ['lead_source_id', 'name', 'token_hash', 'is_active', 'allowed_domains'];

    protected $hidden = ['token_hash'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'allowed_domains' => 'array',
        ];
    }

    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    /**
     * @return BelongsTo<LeadSource, $this>
     */
    public function leadSource(): BelongsTo
    {
        return $this->belongsTo(LeadSource::class);
    }

    /**
     * @return HasMany<WebsiteFormField, $this>
     */
    public function fields(): HasMany
    {
        return $this->hasMany(WebsiteFormField::class)->orderBy('sort_order');
    }

    /**
     * Whether a submission coming from this host may be accepted: any host
     * while the list is empty, otherwise a listed domain or one of its
     * subdomains.
     */
    public function allowsHost(?string $host): bool
    {
        $domains = array_values(array_filter($this->allowed_domains ?? []));

        if ($domains === []) {
            return true;
        }

        if ($host === null || $host === '') {
            return false;
        }

        $host = strtolower($host);

        foreach ($domains as $domain) {
            $domain = str_contains($domain, '://') ? (string) parse_url($domain, PHP_URL_HOST) : $domain;
            $domain = strtolower(trim($domain, "/. \t\n\r\0\x0B"));

            if ($domain !== '' && ($host === $domain || str_ends_with($host, '.'.$domain))) {
                return true;
            }
        }

        return false;
    }
}
