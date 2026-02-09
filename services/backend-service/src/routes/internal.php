<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.internal')->group(function () {
	// Define internal routes here
	Route::get('/test', function () {
		return response()->json(['message' => 'Internal route accessed'], 200);
	});

	// TODO: Body is array of player objects

	/*
	```
        return [
            'users' => 'required|array',
            'users.*.user_id' => 'required|integer|exists:users,id',
            'users.*.rank' => 'required|integer|min:1',
            'users.*.rating_mu' => 'required|numeric',
            'users.*.rating_sigma' => 'required|numeric',
        ];
	```
	*/

	Route::post('/games/{game}/finish', [App\Http\Controllers\GameController::class, 'finishGame']);
    Route::post('/games/{game}/start', [App\Http\Controllers\GameController::class, 'startGame']);
    Route::post('/games/{game}/leave', [App\Http\Controllers\GameController::class, 'leaveGame']);
	Route::get('/games/{game}', [App\Http\Controllers\GameController::class, 'show']);

});
