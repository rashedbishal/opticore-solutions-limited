<?php

namespace App\Leads\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

/**
 * One field a website form asks for. Phase 2 supports the standard lead
 * fields ("fixed"); custom fields and consent tick-boxes come later.
 */
class WebsiteFormField extends Model
{
    use HasUlids;

    protected $fillable = ['website_form_id', 'field_type', 'fixed_field', 'sort_order'];
}
