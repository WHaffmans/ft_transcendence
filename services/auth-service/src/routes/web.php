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

Route::get('/redirect/{provider}', function ($provider) {
    return Socialite::driver($provider)->redirect();
})->name('social.redirect');

Route::get('/callback/{provider}', function ($provider) {
    $socialUser = Socialite::driver($provider)->user();

    $user = User::where('email', $socialUser->getEmail())->first();
    if (! $user) {
        $user = User::create([
            'name' => $socialUser->name ?? $socialUser->getNickname(),
            'provider' => $provider,
            'provider_id' => $socialUser->getId(),
            'email' => $socialUser->getEmail(),
            'email_verified_at' => method_exists($socialUser, 'user') && ($socialUser->user['email_verified'] ?? false) ? now() : null,
            'password' => null,
        ]);
    }

    Auth::login($user);

    return redirect()->intended('/');
});
