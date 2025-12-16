<?php

use App\Http\Controllers\Auth\AuthController;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Laravel\Socialite\Facades\Socialite;

Route::get('/', function () {
    return view('welcome');
});

// Authentication routes
Route::group([], function () {
    Route::get('/login', [AuthController::class, 'loginView'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});

Route::get("/redirect/{provider}", function ($provider) {
    return Socialite::driver($provider)->redirect();
})->name('social.redirect');

Route::get("/callback/{provider}", function ($provider) {
    $githubUser = Socialite::driver($provider)->user();
    $user = User::updateOrCreate(
        [
            'name' => $githubUser->name ?? $githubUser->nickname,
            'email' => $githubUser->email,
            // 'github_token' => $githubUser->token,
            // 'github_refresh_token' => $githubUser->refreshToken,
        ]
    );

    Auth::login($user);
    // $intended = session()->pull('url.intended', "/");
    // $parsed = parse_url($intended);
    // parse_str($parsed['query'] ?? '', $query);
    // $code = $query['code'] ?? null;
    // $state = $query['state'] ?? null;
    // dd($intended, $query, $code, $state);
    return redirect()->intended("/");
});
