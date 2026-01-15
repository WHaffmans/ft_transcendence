<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        DB::statement('
            ALTER TABLE users
            ADD COLUMN rating DECIMAL(10, 2)
            AS (rating_mu - (3 * rating_sigma)) STORED
        ');

        // Optional: Add an index for better performance
        Schema::table('users', function (Blueprint $table) {
            $table->index('rating');
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('rating');
        });
    }
};