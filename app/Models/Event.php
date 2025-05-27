<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    // Fillable properties for mass assignment
    protected $fillable = [
        'eventname',
        'date',
        'location',
        'timeInAM',
        'timeInAMDuration',
        'timeOutAM',
        'timeOutAMDuration',
        'timeInPM',
        'timeInPMDuration',
        'timeOutPM',
        'timeOutPMDuration',
        'timeInNight',
        'timeInNightDuration',
        'timeOutNight',
        'timeOutNightDuration',
    ];

    // Validation rules (if needed)
    public static function rules()
    {
        return [
            'eventname' => 'required|string|max:255',
            'date' => 'required|date',
            'location' => 'required|string|max:255',
            'timeInAM' => 'nullable|date_format:H:i',
            'timeInAMDuration' => 'nullable|date_format:H:i',
            'timeOutAM' => 'nullable|date_format:H:i',
            'timeOutAMDuration' => 'nullable|date_format:H:i',
            'timeInPM' => 'nullable|date_format:H:i',
            'timeInPMDuration' => 'nullable|date_format:H:i',
            'timeOutPM' => 'nullable|date_format:H:i',
            'timeOutPMDuration' => 'nullable|date_format:H:i',
            'timeInNight' => 'nullable|date_format:H:i',
            'timeInNightDuration' => 'nullable|date_format:H:i',
            'timeOutNight' => 'nullable|date_format:H:i',
            'timeOutNightDuration' => 'nullable|date_format:H:i',
        ];
    }
    
    /**
     * Get the attendances for the event.
     */
    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'event_id');
    }
}