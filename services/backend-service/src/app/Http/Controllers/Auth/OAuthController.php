<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
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
        if ($request->filled('error')) {
            return redirect(config('app.frontend_url', '/') . '?error=' . urlencode((string) $request->input('error')));
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
            return redirect(config('app.frontend_url', '/') . '?error=token_exchange_failed');
        }

        $tokenData = json_decode($response->getContent(), true);
        $accessToken = $tokenData['access_token'] ?? null;
        $refreshToken = $tokenData['refresh_token'] ?? null;

        if (!$accessToken) {
            return redirect(config('app.frontend_url', '/') . '?error=token_missing');
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

        return redirect("http://" . config('app.frontend_url', '/') . '/callback') // todo: need better way to handle http/https
            ->withCookies($cookies);
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
