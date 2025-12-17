<?php

namespace Database\Seeders;

use App\Models\User;
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
        // User::factory(10)->create();

        User::factory(1)->create([
            'name' => 'Quinten',
            'email' => 'quinten@bumbal.eu',
        ]);

        if (!app()->environment('local')) {
            return;
        }

        $clientId = env('OAUTH_DEV_CLIENT_ID', '019b2d20-ce15-7335-828a-b184b656c035');
        $redirects = env('OAUTH_DEV_REDIRECT', 'http://localhost:8080/callback');


        DB::table('oauth_clients')->insert([
            'id' => $clientId,
            'owner_id' => null,
            'owner_type' => null,
            'name' => 'Frontend Service',
            'secret' => null,
            'provider' => null,
            'redirect_uris' => '[' . implode(',', array_map(fn($url) => '"' . trim($url) . '"', explode(',', $redirects))) . ']',
            'grant_types' => '["authorization_code", "refresh_token"]',
            'revoked' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
