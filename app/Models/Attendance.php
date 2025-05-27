<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;
use App\Models\Event;

class Attendance extends Model
{
    protected $fillable = [
        'user_id',
        'event_id',
        'rfid',
        'date',
        'time_in_am',
        'time_out_am',
        'time_in_pm',
        'time_out_pm',
        'time_in_night',
        'time_out_night',
        'status_am',
        'status_pm',
        'status_night',
    ];

    /**
     * Get the user that owns the attendance record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the event that owns the attendance record.
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
