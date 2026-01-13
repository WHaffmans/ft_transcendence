<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    public $table = 'games';

    protected $fillable = [
        'status',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_game')
                    ->withPivot('rating_mu', 'rating_sigma','ranking')
                    ->withTimestamps();
    }
}
