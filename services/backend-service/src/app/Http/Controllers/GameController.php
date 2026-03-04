<?php

namespace App\Http\Controllers;

use App\Http\Requests\FinishGameRequest;
use App\Http\Requests\LeaveGameRequest;
use App\Models\Game;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * @tags Games
 */
class GameController extends Controller
{
    /**
     * List all games.
     *
     * Returns a list of all games.
     *
     * @response 200 scenario="Success" [{"id": "uuid", "status": "pending", "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"}]
     */
    public function index()
    {
        return response()->json(Game::all());
    }

    /**
     * Create a new game.
     *
     * @bodyParam status string The initial game status. Example: pending
     *
     * @response 201 scenario="Created" {"id": "uuid", "status": "pending", "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-01T00:00:00Z"}
     */
    public function store(Request $request)
    {
        $game = Game::create($request->all());

        return response()->json($game, 201);
    }

    /**
     * Get a game.
     *
     * Returns a single game with its associated users.
     *
     * @response 200 scenario="Success" {"id": "uuid", "status": "active", "users": [{"id": 1, "name": "John"}]}
     * @response 404 scenario="Not found" {"message": "No query results for model [App\\Models\\Game]"}
     */
    public function show(Game $game)
    {
        $game = $game->load('users');

        return response()->json($game);
    }

    /**
     * Update a game.
     *
     * @bodyParam status string The new game status. Example: active
     *
     * @response 200 scenario="Success" {"id": "uuid", "status": "active"}
     * @response 404 scenario="Not found" {"message": "No query results for model [App\\Models\\Game]"}
     */
    public function update(Request $request, Game $game)
    {
        $game->update($request->all());

        return response()->json($game);
    }

    /**
     * Delete a game.
     *
     * @response 204 scenario="Deleted"
     * @response 404 scenario="Not found" {"message": "No query results for model [App\\Models\\Game]"}
     */
    public function destroy(Game $game)
    {
        $game->delete();

        return response()->json(null, 204);
    }

    /**
     * Find or create a game.
     *
     * Finds an active or pending game for the authenticated user. If no suitable game
     * exists, joins an open game with available slots, or creates a new one.
     *
     * @response 200 scenario="Existing game found" {"id": "uuid", "status": "pending", "users": [{"id": 1, "name": "John"}]}
     * @response 201 scenario="New game created" {"id": "uuid", "status": "pending", "users": [{"id": 1, "name": "John"}]}
     */
    public function findGame(Request $request)
    {
        $user = $request->user();

        $activeGame = $user->games()->where('status', 'active')->with('users')->first();
        if ($activeGame !== null) {
            return response()->json($activeGame);
        }

        $open_games = Game::query()->where('status', 'pending')->with('users')->get();
        $applicable = $open_games->filter(function ($game) use ($user) {
            return $game->users->contains($user->id);
        });

        if ($applicable->isNotEmpty()) {
            return response()->json($applicable->first());
        }

        $joinable_games = $open_games->filter(function ($game) {
            return $game->users->count() < 4;
        });

        if (!$joinable_games->isEmpty()) {
            $game = $joinable_games->first();
            $game->users()->attach($user->id);

            return response()->json($game->load('users'));
        }

        $new_game = Game::create(['status' => 'pending']);
        $new_game->users()->attach($user->id);

        return response()->json($new_game->load('users'), 201);
    }

    /**
     * Leave a game.
     *
     * Removes a user from a pending game. If the user is the last player, the game is deleted.
     *
     * @response 200 scenario="Left game" {"id": "uuid", "status": "pending", "users": []}
     * @response 204 scenario="Game deleted (last player left)"
     * @response 400 scenario="User not in game" {"message": "User is not part of this game."}
     */
    public function leaveGame(LeaveGameRequest $request, Game $game)
    {
        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        if ($game->status !== "pending") {
            return response()->json(null, status: 200);
        }

        if (! $game->users->contains($request->input('user_id'))) {
            return response()->json(['message' => 'User is not part of this game.'], 400);
        }

        $userId = $request->input('user_id');
        $game->load('users');

        if ($game->users->count() === 1 && $game->users->contains($userId)) {
            $game->delete();

            return response()->json(null, 204);
        }

        $game->users()->detach($userId);

        return response()->json($game->load('users'));
    }

    /**
     * Start a game.
     *
     * Transitions a game from ready to active status.
     *
     * @response 200 scenario="Success" {"id": "uuid", "status": "active", "users": [{"id": 1, "name": "John"}]}
     */
    public function startGame(Request $request, Game $game)
    {
        if ($game->status !== 'pending') {
            return response()->json(['message' => 'Game must be in pending state to start.'], 400);
        }

        $game->status = 'active';
        $game->save();

        return response()->json($game->load('users'));
    }

    /**
     * Finish a game.
     *
     * Marks a game as completed and updates player rankings. Each user's rating
     * (mu/sigma) and rank are stored on the pivot, and the user's global rating is updated.
     *
     * @response 200 scenario="Success" {"id": "uuid", "status": "completed", "users": [{"id": 1, "name": "John", "user_game": {"rank": 1, "rating_mu": 25.0, "rating_sigma": 8.0, "diff": 2.5}}]}
     */
    public function finishGame(FinishGameRequest $request, Game $game)
    {
        if ($game->status !== 'active') {
            return response()->json(['message' => 'Game must be active to finish.'], 400);
        }

        $game->status = 'completed';
        $game->save();

        $results = $request->input('users', []);
        foreach ($results as $result) {
            $user = User::find($result['user_id']);
            if ($user) {
                // Calculate rating difference: (new_rating - old_rating)
                $old_rating = $user->rating_mu - (3 * $user->rating_sigma);
                $new_rating = $result['rating_mu'] - (3 * $result['rating_sigma']);
                $diff = $new_rating - $old_rating;

                $game->users()->updateExistingPivot($result['user_id'], [
                    'rank' => $result['rank'],
                    'rating_mu' => $result['rating_mu'],
                    'rating_sigma' => $result['rating_sigma'],
                    'diff' => $diff,
                ]);

                $user->update([
                    'rating_mu' => $result['rating_mu'],
                    'rating_sigma' => $result['rating_sigma'],
                ]);
            }
        }

        return response()->json($game->load('users'));
    }
}
