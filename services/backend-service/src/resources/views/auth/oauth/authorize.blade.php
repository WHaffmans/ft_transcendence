<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Authorize {{ $client->name }}</title>
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
            max-width: 420px;
            width: 100%;
            overflow: hidden;
        }

        .card-header {
            background: #f8fafc;
            padding: 1.5rem;
            border-bottom: 1px solid #e2e8f0;
            text-align: center;
        }

        .card-header h1 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1e293b;
        }

        .card-body {
            padding: 1.5rem;
        }

        .client-info {
            text-align: center;
            margin-bottom: 1.5rem;
        }

        .client-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            font-size: 1.5rem;
            color: white;
        }

        .client-name {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.25rem;
        }

        .authorization-message {
            color: #64748b;
            font-size: 0.875rem;
            line-height: 1.5;
        }

        .scopes {
            background: #f8fafc;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
        }

        .scopes-title {
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin-bottom: 0.75rem;
        }

        .scope-item {
            display: flex;
            align-items: center;
            padding: 0.5rem 0;
            color: #334155;
            font-size: 0.875rem;
        }

        .scope-item:not(:last-child) {
            border-bottom: 1px solid #e2e8f0;
        }

        .scope-icon {
            width: 20px;
            height: 20px;
            margin-right: 0.75rem;
            color: #22c55e;
        }

        .actions {
            display: flex;
            gap: 0.75rem;
        }

        .btn {
            flex: 1;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: all 0.15s ease;
        }

        .btn-cancel {
            background: #f1f5f9;
            color: #475569;
        }

        .btn-cancel:hover {
            background: #e2e8f0;
        }

        .btn-authorize {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
        }

        .btn-authorize:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }

        .user-info {
            text-align: center;
            padding-top: 1rem;
            border-top: 1px solid #e2e8f0;
            margin-top: 1rem;
        }

        .user-info p {
            font-size: 0.75rem;
            color: #94a3b8;
        }

        .user-info strong {
            color: #64748b;
        }
    </style>
</head>

<body>
    <div class="card">
        <div class="card-header">
            <h1>Authorization Request</h1>
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