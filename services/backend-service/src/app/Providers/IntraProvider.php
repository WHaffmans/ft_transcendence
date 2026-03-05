<?php

namespace App\Providers;

use GuzzleHttp\RequestOptions;
use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\ProviderInterface;
use Laravel\Socialite\Two\User;

class IntraProvider extends AbstractProvider implements ProviderInterface
{
    /**
     * The scopes being requested.
     *
     * @var array<string>
     */
    protected $scopes = ['public'];

    public function getAuthUrl($state)
    {
        return $this->buildAuthUrlFromBase('https://api.intra.42.fr/oauth/authorize', $state);
    }

    public function getTokenUrl()
    {
        return 'https://api.intra.42.fr/oauth/token';
    }

    /**
     * {@inheritdoc}
     */
    protected function getUserByToken($token)
    {
        $userUrl = 'https://api.intra.42.fr/v2/me';

        $response = $this->getHttpClient()->get(
            $userUrl,
            $this->getRequestOptions($token)
        );

        $user = json_decode($response->getBody(), true);

        return $user;
    }

    /**
     * {@inheritdoc}
     *
     * @param  array<string>  $scopes
     */
    protected function formatScopes(array $scopes, $scopeSeperator = ' '): string
    {
        return implode($scopeSeperator, $scopes);
    }

    /**
     * {@inheritdoc}
     *
     * @param  array{id: int, first_name: string, displayname: string, email: string, image: array{link: string}|null}  $user
     */
    protected function mapUserToObject(array $user)
    {
        return (new User)->setRaw($user)->map([
            'id' => $user['id'],
            'nickname' => $user['first_name'],
            'name' => $user['displayname'],
            'email' => $user['email'],
            'avatar' => ! empty($user['image']) ? $user['image']['link'] : null,
        ]);
    }

    /**
     * Get the default options for an HTTP request.
     *
     * @param  string  $token
     * @return array<string, array{Accept: string, Authorization: string}>
     */
    protected function getRequestOptions($token)
    {
        return [
            RequestOptions::HEADERS => [
                'Accept' => 'application/json',
                'Authorization' => 'Bearer '.$token,
            ],
        ];
    }
}
