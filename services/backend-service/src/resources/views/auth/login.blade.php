<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Sign In</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }

        .card {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            max-width: 400px;
            width: 100%;
            overflow: hidden;
        }

        .card-header {
            background: #f8fafc;
            padding: 2rem 1.5rem;
            border-bottom: 1px solid #e2e8f0;
            text-align: center;
        }

        .logo {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
        }

        .logo svg {
            width: 32px;
            height: 32px;
            color: white;
        }

        .card-header h1 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.25rem;
        }

        .card-header p {
            color: #64748b;
            font-size: 0.875rem;
        }

        .card-body {
            padding: 1.5rem;
        }

        .alert {
            padding: 0.75rem 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: 0.875rem;
        }

        .alert-error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
        }

        .alert-success {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #16a34a;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .form-label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            margin-bottom: 0.5rem;
        }

        .form-input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 0.875rem;
            transition: all 0.15s ease;
            outline: none;
        }

        .form-input:focus {
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-input.error {
            border-color: #dc2626;
        }

        .error-message {
            color: #dc2626;
            font-size: 0.75rem;
            margin-top: 0.25rem;
        }

        .form-options {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .checkbox-label {
            display: flex;
            align-items: center;
            font-size: 0.875rem;
            color: #4b5563;
            cursor: pointer;
        }

        .checkbox-label input {
            margin-right: 0.5rem;
            width: 16px;
            height: 16px;
            accent-color: #6366f1;
        }

        .forgot-link {
            font-size: 0.875rem;
            color: #6366f1;
            text-decoration: none;
            font-weight: 500;
        }

        .forgot-link:hover {
            text-decoration: underline;
        }

        .btn-row {
            display: flex;
            gap: 0.75rem;
        }

        .btn {
            width: 100%;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: all 0.15s ease;
        }

        .btn-primary {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
        }

        .btn-primary:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }

        .btn-secondary {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            color: #475569;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .btn-secondary:hover {
            background: #f1f5f9;
            border-color: #cbd5e1;
        }

        .divider {
            display: flex;
            align-items: center;
            margin: 1.5rem 0;
        }

        .divider::before,
        .divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: #e2e8f0;
        }

        .divider span {
            padding: 0 1rem;
            color: #94a3b8;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .social-buttons {
            display: flex;
            gap: 0.75rem;
        }

        .btn-social {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            color: #475569;
            font-size: 0.875rem;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.15s ease;
        }

        .btn-social:hover {
            background: #f1f5f9;
            border-color: #cbd5e1;
        }

        .btn-social svg {
            width: 20px;
            height: 20px;
        }

        .card-footer {
            padding: 1rem 1.5rem;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            text-align: center;
        }

        .card-footer p {
            font-size: 0.875rem;
            color: #64748b;
        }

        .card-footer a {
            color: #6366f1;
            text-decoration: none;
            font-weight: 500;
        }

        .card-footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>

<body>
    <div class="card">
        <div class="card-header">
            <div class="logo">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z">
                    </path>
                </svg>
            </div>
            <h1>Welcome</h1>
            <p>Sign in to your account to continue</p>
        </div>

        <div class="card-body">
            @if ($errors->any())
                <div class="alert alert-error">
                    @foreach ($errors->all() as $error)
                        <div>{{ $error }}</div>
                    @endforeach
                </div>
            @endif

            @if (session('status'))
                <div class="alert alert-success">
                    {{ session('status') }}
                </div>
            @endif

            <form method="POST" action="{{ route('login') }}">
                @csrf

                <div class="form-group">
                    <label for="email" class="form-label">Email address</label>
                    <input type="email" id="email" name="email" class="form-input @error('email') error @enderror"
                        value="{{ old('email') }}" placeholder="you@example.com" required autofocus>
                    @error('email')
                        <div class="error-message">{{ $message }}</div>
                    @enderror
                </div>

                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" id="password" name="password"
                        class="form-input @error('password') error @enderror" placeholder="••••••••" required>
                    @error('password')
                        <div class="error-message">{{ $message }}</div>
                    @enderror
                </div>

                <div class="form-options">
                    <label class="checkbox-label">
                        <input type="checkbox" name="remember" {{ old('remember') ? 'checked' : '' }}>
                        Remember me
                    </label>
                    @if (Route::has('password.request'))
                        <a href="{{ route('password.request') }}" class="forgot-link">Forgot password?</a>
                    @endif
                </div>

                <div class="btn-row">
                    <button type="submit" class="btn btn-primary">Sign in</button>
                    @if (Route::has('register'))
                        <a href="{{ route('register') }}" class="btn btn-secondary">Sign up</a>
                    @endif
                </div>
            </form>

            {{-- Uncomment if you have social login --}}

            <div class="divider">
                <span>or continue with</span>
            </div>

            <div class="social-buttons">
                <a href="{{ route('social.redirect', 'intra') }}" class="btn-social">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="24" rx="4" fill="#263238" />
                        <path
                            d="M11.5625 12.8125V14.1367H5.41602L5.33398 13.1113L8.89062 7.46875H10.2324L8.7793 9.90039L7.00977 12.8125H11.5625ZM10.5957 7.46875V16H8.9082V7.46875H10.5957ZM18.3125 14.6816V16H12.4766V14.875L15.2363 11.916C15.5137 11.6074 15.7324 11.3359 15.8926 11.1016C16.0527 10.8633 16.168 10.6504 16.2383 10.4629C16.3125 10.2715 16.3496 10.0898 16.3496 9.91797C16.3496 9.66016 16.3066 9.43945 16.2207 9.25586C16.1348 9.06836 16.0078 8.92383 15.8398 8.82227C15.6758 8.7207 15.4727 8.66992 15.2305 8.66992C14.9727 8.66992 14.75 8.73242 14.5625 8.85742C14.3789 8.98242 14.2383 9.15625 14.1406 9.37891C14.0469 9.60156 14 9.85352 14 10.1348H12.3066C12.3066 9.62695 12.4277 9.16211 12.6699 8.74023C12.9121 8.31445 13.2539 7.97656 13.6953 7.72656C14.1367 7.47266 14.6602 7.3457 15.2656 7.3457C15.8633 7.3457 16.3672 7.44336 16.7773 7.63867C17.1914 7.83008 17.5039 8.10742 17.7148 8.4707C17.9297 8.83008 18.0371 9.25977 18.0371 9.75977C18.0371 10.041 17.9922 10.3164 17.9023 10.5859C17.8125 10.8516 17.6836 11.1172 17.5156 11.3828C17.3516 11.6445 17.1523 11.9102 16.918 12.1797C16.6836 12.4492 16.4238 12.7285 16.1387 13.0176L14.6562 14.6816H18.3125Z"
                            fill="white" />
                    </svg>
                    Intra
                </a>
                <a href="{{ route('social.redirect', 'github') }}" class="btn-social">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                        <path
                            d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                </a>
            </div>

        </div>

        @if (Route::has('register'))
            <div class="card-footer">
                <p>Don't have an account? <a href="{{ route('register') }}">Sign up</a></p>
            </div>
        @endif
    </div>
</body>

</html>