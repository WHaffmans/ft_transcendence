<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InternalAuthMiddleware;

// Explicit route model binding for UUID-based Game model
Route::bind('game', function (string $value) {
    return \App\Models\Game::where('id', $value)->firstOrFail();
});

// Internal API routes (no CSRF, uses X-Internal-Api-Key)
Route::prefix('internal')->middleware(InternalAuthMiddleware::class)->group(function () {
    Route::post('/games/{game}/finish', [App\Http\Controllers\GameController::class, 'finishGame']);
    Route::post('/games/{game}/start', [App\Http\Controllers\GameController::class, 'startGame']);
    Route::post('/games/{game}/leave', [App\Http\Controllers\GameController::class, 'leaveGame']);
    Route::get('/test', function () {
        return response()->json(['message' => 'Internal route accessed via api.php']);
    });
});

Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [App\Http\Controllers\Auth\AuthController::class, 'logout']);

    // Keep these for external API usage (if needed)
    Route::get('/games/find', [App\Http\Controllers\GameController::class, 'findGame']);
    Route::apiResource('games', App\Http\Controllers\GameController::class);
    Route::get('/verify', function (Request $request) {
        $user = $request->user();

        return response()->json(
            ['message' => 'Authenticated', 'user_id' => $user->id],
            200,
            ['X-User-Id' => $user->id]
        );
    });

    Route::get('/user', function (Request $request) {
        $user = $request->user();
        return $user->load('games');
    });

    Route::get('/user/matches', [App\Http\Controllers\UserController::class, 'getMatches']);
});

Route::apiResource('users', App\Http\Controllers\UserController::class)->except(['store']);

Route::get('leaderboard', function (Request $request) {
    return App\Models\User::query()
        ->orderBy('rating', 'desc')
        ->take(5)
        ->get();
});

