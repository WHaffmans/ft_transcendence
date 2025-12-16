<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable()->change();
            $table->string('provider')->nullable();
            $table->integer('provider_id')->nullable();
            $table->unique(['provider_id']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['provider_id']);
            $table->dropColumn(['provider_id']);
            // Don't force non-null password on rollback; schema may vary.
        });
    }
};
