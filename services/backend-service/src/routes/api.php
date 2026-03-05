<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\InternalAuthMiddleware;
use App\Http\Controllers\AvatarController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\UserController;

// Internal API routes (no CSRF, uses X-Internal-Api-Key)
Route::prefix('internal')->middleware(InternalAuthMiddleware::class)->group(function () {
    Route::post('/games/{game}/start', [App\Http\Controllers\GameController::class, 'startGame']);
    Route::post('/games/{game}/finish', [App\Http\Controllers\GameController::class, 'finishGame']);
    Route::post('/games/{game}/leave', [App\Http\Controllers\GameController::class, 'leaveGame']);
});

// External API routes (require authentication)
Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [App\Http\Controllers\Auth\AuthController::class, 'logout']);

    Route::get('/games/find', [App\Http\Controllers\GameController::class, 'findGame']);
    Route::apiResource('games', App\Http\Controllers\GameController::class)->only('show');

    Route::get('/user', [UserController::class, 'me']);
    Route::post('users/{user}/avatar', [AvatarController::class, 'upload']);
    Route::apiResource('users', UserController::class)->except(['store']);
    Route::get('online-users', [UserController::class, 'onlineCount']);
});
// Forward auth route for gateway (no CSRF, returns 200 with X-User-Id header if authenticated)
Route::get('/verify', [App\Http\Controllers\Auth\AuthController::class, 'verify'])->middleware(['cookie.passport', 'auth:api']);

// Public API routes (no authentication required)
Route::get('leaderboard', [LeaderboardController::class, 'index']);
