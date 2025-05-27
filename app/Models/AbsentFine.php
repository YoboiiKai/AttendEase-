<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AbsentFine extends Model
{
    use HasFactory;

    protected $table = 'absent_fines';
    
    protected $fillable = [
        'user_id',
        'event_id',
        'date',
        'time_in_am',
        'time_out_am',
        'time_in_pm',
        'time_out_pm',
        'time_in_night',
        'time_out_night',
        'fine_amount',
        'status'
    ];

    /**
     * Get the user that owns the absent fine record.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the event associated with the absent fine record.
     */
    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
