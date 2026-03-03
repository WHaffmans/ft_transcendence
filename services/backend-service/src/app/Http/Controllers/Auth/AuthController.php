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
     * Verify authentication.
     *
     * Returns a 200 response with the authenticated user's ID in the X-User-Id header.
     * Used by the gateway for forward auth.
     *
     * @tags Auth
     * @response 200 scenario="Authenticated" {"message": "Authenticated"}
     */
    public function verify(): \Illuminate\Http\JsonResponse
    {
        return response()->json(['message' => 'Authenticated'], 200, ['X-User-Id' => auth()->id()]);
    }

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
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended('/');
    }

    /**
     * Log the user out.
     */
    public function logout(Request $request)
    {
        $request->user()->token()->revoke();

        $domain = config('session.domain');
        return response()->json(['message' => 'Logged out'])->withCookie(
            cookie()->forget('access_token', '/', $domain)
        )->withCookie(
                cookie()->forget('refresh_token', '/', $domain)
            );
    }
}
