<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InternalAuthMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Log for debugging
        \Log::info('InternalAuthMiddleware hit', [
            'path' => $request->path(),
            'method' => $request->method(),
            'has_key' => $request->hasHeader('X-Internal-Api-Key'),
        ]);

        $internalApiKey = $request->header('X-Internal-Api-Key');

        if ($internalApiKey !== config('app.internal_api_key')) {
            \Log::warning('Internal API key mismatch');
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}
