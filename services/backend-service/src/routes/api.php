<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InternalAuthMiddleware;
use App\Http\Controllers\AvatarController;

// Internal API routes (no CSRF, uses X-Internal-Api-Key)
Route::prefix('internal')->middleware(InternalAuthMiddleware::class)->group(function () {
    Route::post('/games/{game}/start', [App\Http\Controllers\GameController::class, 'startGame']);
    Route::post('/games/{game}/ready', [App\Http\Controllers\GameController::class, 'readyGame']);
    Route::post('/games/{game}/finish', [App\Http\Controllers\GameController::class, 'finishGame']);
    Route::post('/games/{game}/leave', [App\Http\Controllers\GameController::class, 'leaveGame']);
    Route::get('/test', function () {
        return response()->json(['message' => 'Internal route accessed via api.php']);
    });
});

// External API routes (require authentication)
Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [App\Http\Controllers\Auth\AuthController::class, 'logout']);

    // Keep these for external API usage (if needed)
    Route::get('/games/find', [App\Http\Controllers\GameController::class, 'findGame']);
    Route::apiResource('games', App\Http\Controllers\GameController::class);

    Route::get('/user', function (Request $request) {
        return app(\App\Http\Controllers\UserController::class)->show($request->user());
    });
});

// External API route to verify authentication (for frontend)
Route::get('/verify', fn() => response()->json(['message' => 'Authenticated'], 200, ['X-User-Id' => auth()->id()]))->middleware(['cookie.passport', 'auth:api']);

Route::post('users/{user}/avatar', [AvatarController::class, 'upload'])->middleware('auth:api');
Route::apiResource('users', App\Http\Controllers\UserController::class)->except(['store']);

Route::get('leaderboard', function (Request $request) {
    return App\Models\User::query()
        ->orderBy('rating', 'desc')
        ->take(5)
        ->get();
});

Route::get('online-users', function () {
    return DB::table(config('session.table'))
        ->whereNotNull('user_id')
        ->where('last_activity', '>=', now()->subMinutes(5)->getTimestamp())
        ->distinct('user_id')
        ->count();
});
