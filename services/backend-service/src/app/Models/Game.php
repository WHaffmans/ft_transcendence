<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    use HasUuids;

    public $table = 'games';

    protected $fillable = [
        'status',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_game')
            ->withPivot('rating_mu', 'rating_sigma', 'rank')
            ->as('user_game')
            ->withTimestamps();
    }
}
