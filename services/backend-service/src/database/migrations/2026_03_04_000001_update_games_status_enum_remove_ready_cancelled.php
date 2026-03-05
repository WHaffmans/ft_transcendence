<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->enum('status', ['pending', 'active', 'completed'])
                ->default('pending')
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->enum('status', ['pending', 'active', 'completed', 'ready', 'cancelled'])
                ->default('pending')
                ->change();
        });
    }
};
