<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * @tags Users
 */
class UserController extends Controller
{
    /**
     * Get authenticated user.
     *
     * Returns the currently authenticated user's profile.
     *
     * @response 200 scenario="Success" {"id": 1, "name": "John", "email": "john@example.com", "avatar_url": "/storage/avatars/abc.png"}
     */
    public function me(Request $request): JsonResponse
    {
        return $this->show($request->user());
    }

    /**
     * Get online user count.
     *
     * Returns the number of users with session activity in the last 5 minutes.
     *
     * @response 200 scenario="Success" 12
     */
    public function onlineCount(): JsonResponse
    {
        $sessionConnection = config('session.connection');

        $count = DB::connection($sessionConnection)
            ->table(config('session.table'))
            ->whereNotNull('user_id')
            ->where('last_activity', '>=', now()->subMinutes(5)->getTimestamp())
            ->distinct()
            ->count('user_id');

        return response()->json($count);
    }

    /**
     * List all users.
     *
     * @response 200 scenario="Success" [{"id": 1, "name": "John", "email": "john@example.com"}]
     */
    public function index(): JsonResponse
    {
        return response()->json(User::all());
    }

    /**
     * Store a newly created resource in storage.
     */
    // public function store(Request $request)
    // {
    //     $user = User::create($request->all());
    //     return response()->json($user, 201);
    // }

    /**
     * Get a user.
     *
     * Returns a user profile with their recent games.
     *
     * @queryParam limit int Number of games to include. Example: 20
     *
     * @response 200 scenario="Success" {"id": 1, "name": "John", "email": "john@example.com", "games": []}
     * @response 404 scenario="Not found" {"message": "No query results for model [App\\Models\\User]"}
     */
    public function show(User $user): JsonResponse
    {

        $limit = max(1, min((int) request()->query('limit', 20), 100));
        $user = $user->load(['games' => function ($query) use ($limit) {
            $query->limit($limit);
        }]);

        return response()->json($user);
    }

    /**
     * Update a user.
     *
     * @response 200 scenario="Success" {"id": 1, "name": "John", "email": "john@example.com"}
     * @response 404 scenario="Not found" {"message": "No query results for model [App\\Models\\User]"}
     *
     * @response 200 scenario="Success" {"id": 1, "name": "John", "email": "john@example.com"}
     * @response 404 scenario="Not found" {"message": "No query results for model [App\\Models\\User]"}
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user->update($request->validated());

        return response()->json($user);
    }

    /**
     * Delete a user.
     *
     * @response 204 scenario="Deleted"
     * @response 404 scenario="Not found" {"message": "No query results for model [App\\Models\\User]"}
     */
    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json(null, 204);
    }


}
