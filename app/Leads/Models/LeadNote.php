<?php

namespace App\Leads\Models;

use Illuminate\Database\Eloquent\Model;

class LeadNote extends Model
{
    protected $fillable = ['lead_id', 'admin_id', 'admin_name', 'note'];
}
