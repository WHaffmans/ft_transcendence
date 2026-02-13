<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Passport\Http\Middleware\CreateFreshApiToken;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        then: function () {
            // Explicit route model binding for UUID-based Game model
            Route::bind('game', function (string $value) {
                return \App\Models\Game::where('id', $value)->firstOrFail();
            });
        }
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web([
            CreateFreshApiToken::class,
        ]);
        $middleware->trustProxies('*', Request::HEADER_X_FORWARDED_TRAEFIK);
        $middleware->encryptCookies([
            'access_token',
            'refresh_token',
        ]);
        
        // API routes already don't have CSRF protection
        // Internal routes are now in api.php with InternalAuthMiddleware
    })
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'auth.internal' => \App\Http\Middleware\InternalAuthMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (AuthenticationException $exception, Request $request): JsonResponse|RedirectResponse {
            if (request()->is('verify') || request()->is('api/*')) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            return response()->redirectGuest('/login');
        });
    })->create();
