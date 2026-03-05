<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;

/**
 * @tags Leaderboard
 */
class LeaderboardController extends Controller
{
    /**
     * Get leaderboard.
     *
     * Returns the top 5 players ranked by rating.
     *
     * @response 200 scenario="Success" [{"id": 1, "name": "John", "rating": 1500}]
     */
    public function index(): JsonResponse
    {
        $users = User::query()
            ->orderBy('rating', 'desc')
            ->take(5)
            ->get(['id', 'name', 'rating']);

        return response()->json($users);
    }
}
