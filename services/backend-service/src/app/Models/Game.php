<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Game extends Model
{
    /**
     * @use \Illuminate\Database\Eloquent\Factories\HasFactory<\Database\Factories\GameFactory>
     */
    use HasFactory, HasUuids;

    public $table = 'games';

    // Explicitly set primary key configuration
    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'status',
    ];

    /**
     * @return BelongsToMany<User, $this, \Illuminate\Database\Eloquent\Relations\Pivot, 'user_game'>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_game')
            ->withPivot('rating_mu', 'rating_sigma', 'rating', 'rank', 'diff')
            ->as('user_game')
            ->withTimestamps();
    }
}
