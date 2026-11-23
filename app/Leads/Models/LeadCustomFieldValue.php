<?php

namespace App\Leads\Models;

use Illuminate\Database\Eloquent\Model;

class LeadCustomFieldValue extends Model
{
    protected $fillable = ['lead_id', 'lead_custom_field_definition_id', 'value'];
}
