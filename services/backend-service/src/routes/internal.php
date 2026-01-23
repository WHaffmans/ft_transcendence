<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.internal')->group(function () {
	// Define internal routes here
	Route::get('/test', function () {
		return response()->json(['message' => 'Internal route accessed'], 200);
	});

});