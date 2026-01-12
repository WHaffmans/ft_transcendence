<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->group(function () {

    Route::apiResource('games', App\Http\Controllers\GameController::class);

    Route::get('/verify', function (Request $request) {
        return response()->json(['message' => 'Authenticated'], 200, ['X-User-Id', request()->getUserInfo()]);
    });

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

Route::apiResource('users', App\Http\Controllers\UserController::class)->except(['store']);