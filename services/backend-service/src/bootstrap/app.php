<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Laravel\Passport\Http\Middleware\CreateFreshApiToken;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web([
            CreateFreshApiToken::class,
        ]);
        $middleware->trustProxies('*', Request::HEADER_FORWARDED | Request::HEADER_X_FORWARDED_TRAEFIK);
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
