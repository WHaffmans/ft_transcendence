<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class OAuthController extends Controller
{
    public function initiate(Request $request)
    {
        $clientId = config('services.oauth.client_id');
        if (!$clientId) {
            abort(500, 'OAuth client ID not configured.');
        }

        $state = Str::random(40);
        $codeVerifier = Str::random(128);
        $codeChallenge = $this->base64UrlEncode(hash('sha256', $codeVerifier, true));

        $request->session()->put('pkce_state', $state);
        $request->session()->put('pkce_code_verifier', $codeVerifier);

        $redirectUri = url('/oauth/callback');

        $query = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'user:read',
            'state' => $state,
            'code_challenge' => $codeChallenge,
            'code_challenge_method' => 'S256',
        ]);

        return redirect()->to(url('/oauth/authorize') . '?' . $query);
    }

    public function callback(Request $request)
    {
        $frontendUrl = config('app.frontend_url', '/');
        // Ensure frontend_url has a protocol
        if (!str_starts_with($frontendUrl, 'http://') && !str_starts_with($frontendUrl, 'https://')) {
            $frontendUrl = 'http://' . $frontendUrl;
        }


        if ($request->filled('error')) {
            return redirect($frontendUrl . '/callback?error=' . urlencode((string) $request->input('error')) . '&error_description=' . urlencode((string) $request->input('error_description')));
        }

        $clientId = config('services.oauth.client_id');

        if (!$clientId) {
            abort(500, 'OAuth client ID not configured.');
        }

        $state = (string) $request->input('state');
        $storedState = (string) $request->session()->pull('pkce_state');
        $codeVerifier = (string) $request->session()->pull('pkce_code_verifier');

        if (!$state || !$storedState || $state !== $storedState || !$codeVerifier) {
            abort(400, 'Invalid OAuth state.');
        }

        $code = (string) $request->input('code');

        if (!$code) {
            dd('NO CODE');
            abort(400, 'Missing authorization code.');
        }

        $redirectUri = url('/oauth/callback');

        $requestData = [
            'grant_type' => 'authorization_code',
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'code_verifier' => $codeVerifier,
            'code' => $code,
        ];

        $internalRequest = Request::create('/oauth/token', 'POST', $requestData);
        $response = app()->handle($internalRequest);
        if ($response->getStatusCode() !== Response::HTTP_OK) {
            return redirect($frontendUrl . '/callback?error=token_exchange_failed');
        }

        $tokenData = json_decode($response->getContent(), true);
        $accessToken = $tokenData['access_token'] ?? null;
        $refreshToken = $tokenData['refresh_token'] ?? null;

        if (!$accessToken) {
            return redirect($frontendUrl . '/callback?error=token_missing');
        }

        $accessMinutes = max(1, (int) floor(((int) ($tokenData['expires_in'] ?? 900)) / 60));
        $refreshMinutes = 60 * 24 * 30;
        $domain = config('session.domain');
        $secure = (bool) config('session.secure');

        $cookies = [
            cookie('access_token', $accessToken, $accessMinutes, '/', $domain, $secure, true, false, 'Lax'),
        ];

        if ($refreshToken) {
            $cookies[] = cookie('refresh_token', $refreshToken, $refreshMinutes, '/', $domain, $secure, true, false, 'Lax');
        }

        return redirect($frontendUrl . '/callback')
            ->withCookies($cookies);
    }

    public function refresh(Request $request)
    {
        $refreshToken = $request->cookie('refresh_token');
        if (!$refreshToken) {
            Log::warning('Refresh attempt without refresh_token cookie');
            return response()->json(['message' => 'No refresh token'], 401);
        }

        Log::info('Attempting token refresh', ['refresh_token_length' => strlen($refreshToken)]);

        $internalRequest = Request::create('/oauth/token', 'POST', [
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken,
            'client_id' => config('services.oauth.client_id'),
            'scope' => 'user:read',
        ]);

        $response = app()->handle($internalRequest);

        if ($response->getStatusCode() !== Response::HTTP_OK) {
            Log::error('Token refresh failed', [
                'status' => $response->getStatusCode(),
                'body' => $response->getContent(),
            ]);
            return response()->json(['message' => 'Token refresh failed'], 401);
        }

        $tokenData = json_decode($response->getContent(), true);
        $accessToken = $tokenData['access_token'] ?? null;
        $newRefresh = $tokenData['refresh_token'] ?? null;

        if (!$accessToken) {
            return response()->json(['message' => 'Token refresh failed'], 401);
        }

        $accessMinutes = max(1, (int) floor(((int) ($tokenData['expires_in'] ?? 900)) / 60));
        $refreshMinutes = 60 * 24 * 30;
        $domain = config('session.domain');
        $secure = (bool) config('session.secure');

        $accessCookie = cookie('access_token', $accessToken, $accessMinutes, '/', $domain, $secure, true, false, 'Lax');
        if ($newRefresh) {
            $refreshCookie = cookie('refresh_token', $newRefresh, $refreshMinutes, '/', $domain, $secure, true, false, 'Lax');
        }

        $response = response()->noContent()->withCookie($accessCookie);
        if (isset($refreshCookie)) {
            $response = $response->withCookie($refreshCookie);
        }
        Log::info('Token refresh successful');
        return $response;
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
