<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Delete games with status 'cancelled'
        DB::table('games')->where('status', 'cancelled')->delete();
        // Update games with status 'ready' to 'pending'
        DB::table('games')->where('status', 'ready')->update(['status' => 'pending']);
    }

    public function down(): void
    {
        // Optionally restore previous states if needed (no-op for safety)
    }
};
