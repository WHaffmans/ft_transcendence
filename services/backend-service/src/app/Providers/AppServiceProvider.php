<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
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

        Passport::tokensExpireIn(now()->addMinutes(15));
        Passport::authorizationView('auth.oauth.authorize');
        Passport::tokensCan([
            'user:read' => 'Read user information',
        ]);

        RateLimiter::for('api', function ($request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
