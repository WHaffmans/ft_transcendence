<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class CookiePassportAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Log::debug('CookiePassportAuth middleware invoked', [
        //     'has_authorization_header' => $request->hasHeader('Authorization'),
        //     'has_access_token_cookie' => $request->hasCookie('access_token'),
        // ]);
        if ($request->hasHeader("Authorization")) {
            return $next($request);
        }

        if (!$request->hasCookie('access_token')) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $access_token = $request->cookie('access_token');
        if (!$access_token) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        if (is_array($access_token)){
            $access_token = last($access_token);
        }
        $request->headers->set('Authorization', 'Bearer ' . $access_token);

        return $next($request);
    }
}
