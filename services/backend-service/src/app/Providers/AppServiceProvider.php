<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * TODO: Revise this with Traefik config cause I'm not sure if this is a very good idea. Probably not tbh
     */
    public function boot(): void
    {
        $socialite = $this->app->make('Laravel\Socialite\Contracts\Factory');
        $socialite->extend(
            'intra',
            function ($app) use ($socialite) {
                $config = $app['config']['services.intra'];

                return $socialite->buildProvider(IntraProvider::class, $config);
            }
        );

        // Ensure redirects and routes use the correct base URL
        // if (config('app.url')) {
        //     // To make sure generated URLs use the correct base URL
        //     URL::forceRootUrl(config('app.url'));
        //     $path = parse_url(config('app.url'), PHP_URL_PATH);
        //     if ($path) {
        //         // Set the X-Forwarded-Prefix header for requests
        //         $this->app['request']->headers->set('X-Forwarded-Prefix', $path);
        //     }
        // }

        Passport::tokensExpireIn(now()->addMinutes(15));
        Passport::authorizationView('auth.oauth.authorize');
        Passport::tokensCan([
            'user:read' => 'Read user information',
        ]);
    }
}
