<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Passport\Token;

class AuthController extends Controller
{
    /**
     * Display the login form.
     */
    public function loginView(): \Illuminate\Contracts\View\View
    {
        return view('auth.login');
    }

    /**
     * Handle login attempt.
     */
    public function login(Request $request): \Illuminate\Http\RedirectResponse
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
    public function registerView(): \Illuminate\Contracts\View\View
    {
        return view('auth.register');
    }

    /**
     * Handle registration.
     */
    public function register(Request $request): \Illuminate\Http\RedirectResponse
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
    public function logout(Request $request): \Illuminate\Http\JsonResponse
    {
        /**
         * @var User $user
         */
        $user = $request->user();
        $user->tokens()->each(function (Token $token) {
            $token->revoke();
            $token->refreshToken?->revoke();
        });
        
        $domain = config('session.domain');
        return response()->json(['message' => 'Logged out'])->withCookie(
            cookie()->forget('access_token', '/', $domain)
        )->withCookie(
                cookie()->forget('refresh_token', '/', $domain)
            );
    }
}
