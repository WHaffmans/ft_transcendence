<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Game;
use DB;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (! app()->environment('local')) {
            return;
        }

        User::upsert([
            'name' => 'Willem',
            'email' => 'test@lobby.nl',
            'password' => bcrypt('password'),
        ], ['email']);

        User::upsert([
            'name' => 'Quinten',
            'email' => 'test2@lobby.nl',
            'password' => bcrypt('password'),
        ], ['email']);

        // create 10 random users with random names and emails and rating
        User::factory()->count(10)->create();

        //now create 20 random games
        Game::factory()->count(20)->create();


        $clientId = env('OAUTH_CLIENT_ID', '019b2d20-ce15-7335-828a-b184b656c035');
        $redirects = env('OAUTH_REDIRECT', 'http://localhost:8080/callback');

        DB::table('oauth_clients')->upsert([
            'id' => $clientId,
            'owner_id' => null,
            'owner_type' => null,
            'name' => 'Frontend Service',
            'secret' => null,
            'provider' => null,
            'redirect_uris' => '['.implode(',', array_map(fn ($url) => '"'.trim($url).'"', explode(',', $redirects))).']',
            'grant_types' => '["authorization_code", "refresh_token"]',
            'revoked' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ], ['id']);

        // $this->call([
        //     GameSeeder::class,
        // ]);
    }
}
