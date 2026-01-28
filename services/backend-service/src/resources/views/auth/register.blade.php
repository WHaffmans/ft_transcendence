<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Sign Up</title>
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
        }

        .btn-secondary:hover {
            background: #f1f5f9;
            border-color: #cbd5e1;
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
                        d="M12 11c0 1.105 0.895 2 2 2h1v2h-1a4 4 0 01-4-4V9a4 4 0 014-4h1v2h-1c-1.105 0-2 .895-2 2v2zm-2 0V9c0-1.105-.895-2-2-2H7V5h1a4 4 0 014 4v2a4 4 0 01-4 4H7v-2h1c1.105 0 2-.895 2-2z">
                    </path>
                </svg>
            </div>
            <h1>Create account</h1>
            <p>Join to start playing and tracking results</p>
        </div>

        <div class="card-body">
            @if ($errors->any())
                <div class="alert alert-error">
                    @foreach ($errors->all() as $error)
                        <div>{{ $error }}</div>
                    @endforeach
                </div>
            @endif

            <form method="POST" action="{{ route('register') }}">
                @csrf

                <div class="form-group">
                    <label for="name" class="form-label">Full name</label>
                    <input type="text" id="name" name="name" class="form-input @error('name') error @enderror"
                        value="{{ old('name') }}" placeholder="Your name" required autofocus>
                    @error('name')
                        <div class="error-message">{{ $message }}</div>
                    @enderror
                </div>

                <div class="form-group">
                    <label for="email" class="form-label">Email address</label>
                    <input type="email" id="email" name="email" class="form-input @error('email') error @enderror"
                        value="{{ old('email') }}" placeholder="you@example.com" required>
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

                <div class="form-group">
                    <label for="password_confirmation" class="form-label">Confirm password</label>
                    <input type="password" id="password_confirmation" name="password_confirmation"
                        class="form-input" placeholder="••••••••" required>
                </div>

                <div class="btn-row">
                    <button type="submit" class="btn btn-primary">Create account</button>
                    <a href="{{ route('login') }}" class="btn btn-secondary">Back to sign in</a>
                </div>
            </form>
        </div>

        <div class="card-footer">
            <p>Already have an account? <a href="{{ route('login') }}">Sign in</a></p>
        </div>
    </div>
</body>

</html>
