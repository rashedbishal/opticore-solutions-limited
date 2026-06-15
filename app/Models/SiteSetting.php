<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SiteSetting extends Model
{
    /**
     * Cache key for the singleton settings row.
     */
    public const CACHE_KEY = 'site-settings.current';

    protected $fillable = [
        'contact_email',
        'phone_usa',
        'phone_bangladesh',
        'address_usa',
        'address_usa_map_url',
        'address_bangladesh',
        'address_bangladesh_map_url',
        'social_facebook',
        'social_x',
        'social_instagram',
        'social_linkedin',
        'social_youtube',
        'social_behance',
        'social_pinterest',
        'social_tiktok',
    ];

    /**
     * Default values matching the previously hardcoded footer and contact
     * page content, used to seed the singleton row on first access.
     *
     * @return array<string, string>
     */
    public static function defaults(): array
    {
        return [
            'contact_email' => 'osl@opticoresolutionsltd.com',
            'phone_usa' => '+1 (575) 303-6925',
            'phone_bangladesh' => '+88-01896204400',
            'address_usa' => "Opticore Solutions LLC\n1209 Mountain Road PL NE STE N\nAlbuquerque, NM 87110",
            'address_usa_map_url' => 'https://maps.app.goo.gl/Ghn2hcVHHid6FQwv6',
            'address_bangladesh' => "House # 1178, (1st Floor) Apt.- 2E\nEast Monipur, Mirpur, Dhaka-1216",
            'address_bangladesh_map_url' => 'https://maps.app.goo.gl/7zvqD4Lemwst7bEQ8',
            'social_facebook' => 'https://www.facebook.com/opticoresolutionsltd',
            'social_x' => 'https://x.com/osl_opticore',
            'social_instagram' => 'https://www.instagram.com/opticoresolutionsltd',
            'social_linkedin' => 'https://www.linkedin.com/in/opticoresolutionsltd',
            'social_youtube' => 'https://www.youtube.com/@OpticoreSolutionsLtd',
            'social_behance' => 'https://www.behance.net/opticorsolutionsltd#',
            'social_pinterest' => 'https://www.pinterest.com/opticoresolutionsltd',
            'social_tiktok' => 'https://www.tiktok.com/@opticoresolutionsltd',
        ];
    }

    /**
     * The single settings row used to populate the public footer and
     * contact page, cached indefinitely and created with defaults() on
     * first access.
     *
     * Only the plain attributes array is cached (not the model instance)
     * so the value survives serialization on non-array cache stores, then
     * the model is rehydrated via newFromBuilder().
     */
    public static function current(): self
    {
        $attributes = Cache::rememberForever(self::CACHE_KEY, function () {
            return (static::query()->first() ?? static::create(self::defaults()))->getAttributes();
        });

        return (new static)->newFromBuilder($attributes);
    }

    /**
     * Forget the cached singleton so the next current() call re-reads the
     * latest values from the database.
     */
    public static function forgetCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Shape consumed by the public footer and contact page via Inertia
     * shared props.
     *
     * @return array<string, string|null>
     */
    public function toPublicArray(): array
    {
        return [
            'email' => $this->contact_email,
            'phoneUsa' => $this->phone_usa,
            'phoneBangladesh' => $this->phone_bangladesh,
            'phoneBangladeshLink' => $this->phone_bangladesh
                ? 'tel:'.preg_replace('/[^0-9+]/', '', $this->phone_bangladesh)
                : null,
            'addressUsa' => $this->address_usa,
            'addressUsaMapUrl' => $this->address_usa_map_url,
            'addressBangladesh' => $this->address_bangladesh,
            'addressBangladeshMapUrl' => $this->address_bangladesh_map_url,
            'socialFacebook' => $this->social_facebook,
            'socialX' => $this->social_x,
            'socialInstagram' => $this->social_instagram,
            'socialLinkedin' => $this->social_linkedin,
            'socialYoutube' => $this->social_youtube,
            'socialBehance' => $this->social_behance,
            'socialPinterest' => $this->social_pinterest,
            'socialTiktok' => $this->social_tiktok,
        ];
    }
}
