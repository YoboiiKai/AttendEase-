<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Fines;

class StudentFines extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'fines_id',
        'amount',
        'reason',
        'status',
        'payment_date'
    ];

    /**
     * Get the user (student) that owns the fine.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the fine type associated with this student fine.
     */
    public function fine()
    {
        return $this->belongsTo(Fines::class, 'fines_id');
    }
}
