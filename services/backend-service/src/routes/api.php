<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [App\Http\Controllers\Auth\AuthController::class, 'logout']);

    Route::post('/games/{game}/finish', [App\Http\Controllers\GameController::class, 'finishGame']);
    Route::post('/games/{game}/start', [App\Http\Controllers\GameController::class, 'startGame']);
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
        return $request->user();
    });
});

Route::apiResource('users', App\Http\Controllers\UserController::class)->except(['store']);

Route::get('leaderboard', function (Request $request) {
    return App\Models\User::query()
        ->orderBy('rating', 'desc')
        ->take(10)
        ->get();
});