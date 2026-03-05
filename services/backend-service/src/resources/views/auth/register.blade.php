<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Sign Up · ACHTUNG</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: #0a0e1a;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }

        .topbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            display: flex;
            align-items: center;
            padding: 0 1.5rem;
            height: 52px;
            background: rgba(10, 14, 26, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            z-index: 10;
        }

        .topbar-brand {
            font-size: 0.9rem;
            font-weight: 700;
            letter-spacing: 0.15em;
            color: #ffffff;
            text-transform: uppercase;
        }

        .card {
            background: rgba(20, 25, 40, 0.75);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            box-shadow: 0 32px 64px rgba(0, 0, 0, 0.6);
            max-width: 400px;
            width: 100%;
            overflow: hidden;
        }

        .card-header {
            padding: 2rem 1.75rem 1.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .card-header h1 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 0.25rem;
            letter-spacing: -0.01em;
        }

        .card-header p {
            color: rgba(255, 255, 255, 0.45);
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }

        .card-body {
            padding: 1.5rem 1.75rem;
        }

        .alert {
            padding: 0.75rem 1rem;
            border-radius: 8px;
            margin-bottom: 1.25rem;
            font-size: 0.8rem;
        }

        .alert-error {
            background: rgba(220, 38, 38, 0.15);
            border: 1px solid rgba(220, 38, 38, 0.4);
            color: #f87171;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .form-label {
            display: block;
            font-size: 0.7rem;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 0.4rem;
        }

        .form-input {
            width: 100%;
            padding: 0.7rem 0.875rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            font-size: 0.875rem;
            color: #ffffff;
            transition: all 0.15s ease;
            outline: none;
        }

        .form-input::placeholder {
            color: rgba(255, 255, 255, 0.2);
        }

        .form-input:focus {
            border-color: rgba(0, 255, 136, 0.5);
            background: rgba(255, 255, 255, 0.07);
            box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.08);
        }

        .form-input.error {
            border-color: rgba(248, 113, 113, 0.5);
        }

        .error-message {
            color: #f87171;
            font-size: 0.75rem;
            margin-top: 0.25rem;
        }

        .btn-row {
            display: flex;
            gap: 0.625rem;
        }

        .btn {
            width: 100%;
            padding: 0.7rem 1rem;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            cursor: pointer;
            border: none;
            transition: all 0.15s ease;
        }

        .btn-primary {
            background: #ffffff;
            color: #0a0e1a;
        }

        .btn-primary:hover {
            background: #e8e8e8;
            transform: translateY(-1px);
        }

        .btn-secondary {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .btn-secondary:hover {
            border-color: rgba(255, 255, 255, 0.35);
            color: #ffffff;
        }

        .card-footer {
            padding: 1rem 1.75rem;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            text-align: center;
        }

        .card-footer p {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.35);
        }

        .card-footer a {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            font-weight: 600;
        }

        .card-footer a:hover {
            color: #ffffff;
        }
    </style>
</head>

<body>
    <div class="topbar">
        <span class="topbar-brand">Achtung</span>
    </div>

    <div class="card">
        <div class="card-header">
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
