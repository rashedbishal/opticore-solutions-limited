<?php

namespace App\Leads\Models;

use Illuminate\Database\Eloquent\Model;

class LeadAssignment extends Model
{
    protected $fillable = ['lead_id', 'assigned_to', 'assigned_to_name', 'assigned_by', 'assigned_by_name', 'assignment_note'];
}
