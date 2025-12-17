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

        if (app()->environment('local')) {
            DB::table('oauth_clients')->insert([
                'id' => '019b2d20-ce15-7335-828a-b184b656c035',
                'owner_id' => null,
                'owner_type' => null,
                'name' => 'Frontend Service',
                'secret' => null,
                'provider' => null,
                'redirect_uris' => '["http:\/\/localhost:8080\/frontend\/callback"]',
                'grant_types' => '["authorization_code", "refresh_token"]',
                'revoked' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
