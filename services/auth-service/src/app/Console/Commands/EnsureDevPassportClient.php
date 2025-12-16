<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EnsureDevPassportClient extends Command
{
    protected $signature = 'dev:passport-client
        {--id= : UUID for the client (defaults to OAUTH_DEV_CLIENT_ID)}
        {--name=SPA (dev) : Client name}
        {--redirect=* : Redirect URI(s) (defaults to OAUTH_DEV_REDIRECTS)}
        {--provider= : User provider (optional)}';

    protected $description = 'Create or update a development Passport public client (PKCE) with a stable ID';

    public function handle(): int
    {
        if (!app()->environment('local')) {
            $this->warn('Not in local environment, skipping.');
            return self::SUCCESS;
        }

        $id = $this->option('id') ?: env('OAUTH_DEV_CLIENT_ID') ?: (string) Str::uuid();
        $redirects = $this->option('redirect') ?: array_filter(explode(',', (string) env('OAUTH_DEV_REDIRECTS')));

        if (!$redirects) {
            $this->error('No redirect URIs provided. Use --redirect or OAUTH_DEV_REDIRECTS.');
            return self::INVALID;
        }

        $payload = [
            'id' => $id,
            'name' => $this->option('name') ?: 'SPA (dev)',
            'secret' => null, // public PKCE client
            'provider' => $this->option('provider'),
            'redirect_uris' => json_encode(array_values($redirects)),
            'grant_types' => json_encode(['authorization_code', 'refresh_token']),
            'revoked' => false,
            'updated_at' => now(),
        ];

        $exists = DB::table('oauth_clients')->where('id', $id)->first();

        if ($exists) {
            DB::table('oauth_clients')->where('id', $id)->update($payload);
            $this->info("Updated dev client {$id}");
        } else {
            $payload['created_at'] = now();
            DB::table('oauth_clients')->insert($payload);
            $this->info("Created dev client {$id}");
        }

        $this->line("CLIENT_ID={$id}");
        return self::SUCCESS;
    }
}