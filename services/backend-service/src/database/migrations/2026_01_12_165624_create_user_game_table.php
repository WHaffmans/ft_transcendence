<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_game', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('game_id')->constrained('games')->onDelete('cascade');
            $table->double('rating_mu')->nullable();
            $table->double('rating_sigma')->nullable();
            $table->double('diff')->nullable();
            $table->integer('rank')->nullable();
            $table->unique(['user_id', 'game_id']);
            $table->index(['user_id', 'game_id']);
            $table->timestamps();
        });

        // Add computed column for rating
        DB::statement('
            ALTER TABLE user_game
            ADD COLUMN rating DECIMAL(10, 2)
            AS (rating_mu - (3 * rating_sigma)) STORED
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_game');
    }
};
