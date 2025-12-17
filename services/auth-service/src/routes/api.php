<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:api');

Route::get('/verify', function (Request $request) {
    return response()->json(['message' => 'Authenticated'], 200, ['X-User-Id', request()->getUserInfo()]);
})->middleware(['auth:api']);
