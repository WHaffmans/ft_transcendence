<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Display the login form.
     */
    public function loginView()
    {
        return view('auth.login');
    }

    /**
     * Handle login attempt.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($validated, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => __('The provided credentials do not match our records.'),
            ]);
        }

        $request->session()->regenerate();

        // Redirect back to intended URL (OAuth flow) or default
        return redirect()->intended('/');
    }

    /**
     * Display the registration form.
     */
    public function registerView()
    {
        return view('auth.register');
    }

    /**
     * Handle registration.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'avatar_url' => $this->generateDefaultAvatar($validated['name']),
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended('/');
    }

    /**
     * Generate a default avatar as a base64-encoded SVG.
     */
    private function generateDefaultAvatar(string $name): string
    {
        $initial = strtoupper(mb_substr($name, 0, 1));
        $colors = [
            '#F44336',
            '#E91E63',
            '#9C27B0',
            '#673AB7',
            '#3F51B5',
            '#2196F3',
            '#03A9F4',
            '#00BCD4',
            '#009688',
            '#4CAF50',
            '#8BC34A',
            '#FF9800',
        ];
        $colorIndex = ord($initial) % count($colors);
        $bgColor = $colors[$colorIndex];

        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <circle cx="64" cy="64" r="64" fill="{$bgColor}"/>
    <text x="64" y="64" dy="0.35em" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="64" font-weight="bold">{$initial}</text>
</svg>
SVG;

        return 'data:image/svg+xml;base64,' . base64_encode($svg);
    }

    /**
     * Log the user out.
     */
    public function logout(Request $request)
    {
        $request->session()->flush();
        $request->user()->token()->revoke();

        $domain = config('session.domain');
        return response()->json(['message' => 'Logged out'])->withCookie(
            cookie()->forget('access_token', '/', $domain)
        )->withCookie(
                cookie()->forget('refresh_token', '/', $domain)
            );
    }
}
