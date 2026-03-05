<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Authorize {{ $client->name }} · ACHTUNG</title>
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
            max-width: 420px;
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

        .client-info {
            text-align: center;
            margin-bottom: 1.5rem;
        }

        .client-icon {
            width: 56px;
            height: 56px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 0.875rem;
            font-size: 1.375rem;
            font-weight: 700;
            color: #ffffff;
        }

        .client-name {
            font-size: 1.125rem;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 0.25rem;
        }

        .authorization-message {
            color: rgba(255, 255, 255, 0.45);
            font-size: 0.8rem;
            line-height: 1.5;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .scopes {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.07);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
        }

        .scopes-title {
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: rgba(255, 255, 255, 0.4);
            margin-bottom: 0.75rem;
        }

        .scope-item {
            display: flex;
            align-items: center;
            padding: 0.5rem 0;
            color: rgba(255, 255, 255, 0.75);
            font-size: 0.875rem;
        }

        .scope-item:not(:last-child) {
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .scope-icon {
            width: 18px;
            height: 18px;
            margin-right: 0.75rem;
            color: #00ff88;
            flex-shrink: 0;
        }

        .actions {
            display: flex;
            gap: 0.625rem;
        }

        .actions form {
            flex: 1;
            display: flex;
        }

        .btn {
            flex: 1;
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

        .btn-cancel {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: rgba(255, 255, 255, 0.7);
        }

        .btn-cancel:hover {
            border-color: rgba(255, 255, 255, 0.35);
            color: #ffffff;
        }

        .btn-authorize {
            background: #ffffff;
            color: #0a0e1a;
        }

        .btn-authorize:hover {
            background: #e8e8e8;
            transform: translateY(-1px);
        }

        .user-info {
            text-align: center;
            padding-top: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            margin-top: 1rem;
        }

        .user-info p {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.3);
        }

        .user-info strong {
            color: rgba(255, 255, 255, 0.55);
            font-weight: 600;
        }
    </style>
</head>

<body>
    <div class="topbar">
        <span class="topbar-brand">Achtung</span>
    </div>

    <div class="card">
        <div class="card-header">
            <h1>Authorization Request</h1>
            <p>Review permissions before continuing</p>
        </div>

        <div class="card-body">
            <div class="client-info">
                <div class="client-icon">
                    {{ strtoupper(substr($client->name, 0, 1)) }}
                </div>
                <div class="client-name">{{ $client->name }}</div>
                <p class="authorization-message">
                    This application is requesting access to your account.
                </p>
            </div>

            @if (count($scopes) > 0)
                <div class="scopes">
                    <div class="scopes-title">This will allow the application to:</div>
                    @foreach ($scopes as $scope)
                        <div class="scope-item">
                            <svg class="scope-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            {{ $scope->description }}
                        </div>
                    @endforeach
                </div>
            @endif

            <div class="actions">
                <form method="POST" action="{{ route('passport.authorizations.deny') }}">
                    @csrf
                    @method('DELETE')
                    <input type="hidden" name="state" value="{{ $request->state }}">
                    <input type="hidden" name="client_id" value="{{ $client->getKey() }}">
                    <input type="hidden" name="auth_token" value="{{ $authToken }}">
                    <button type="submit" class="btn btn-cancel">Cancel</button>
                </form>

                <form method="POST" action="{{ route('passport.authorizations.approve') }}">
                    @csrf
                    <input type="hidden" name="state" value="{{ $request->state }}">
                    <input type="hidden" name="client_id" value="{{ $client->getKey() }}">
                    <input type="hidden" name="auth_token" value="{{ $authToken }}">
                    <button type="submit" class="btn btn-authorize">Authorize</button>
                </form>
            </div>

            <div class="user-info">
                <p>Signed in as <strong>{{ auth()->user()->email ?? auth()->user()->name }}</strong></p>
            </div>
        </div>
    </div>
</body>

</html>