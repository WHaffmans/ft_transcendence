<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class GameSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $game = \App\Models\Game::create([
            'status' => 'pending',
        ]);
        $users = \App\Models\User::all();
        $game->users()->saveMany($users);
    }
}
