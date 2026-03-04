<?php

namespace App\Http\Controllers;

use App\Http\Requests\FinishGameRequest;
use App\Http\Requests\LeaveGameRequest;
use App\Models\Game;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GameController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): \Illuminate\Http\JsonResponse
    {
        return response()->json(Game::all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'status' => 'sometimes|string|in:pending,ready,active,completed',
        ]);
        $data = $request->all();
        if (!array_key_exists('status', $data)) {
            $data['status'] = 'pending';
        }
        $game = Game::create($data);

        return response()->json($game, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Game $game): \Illuminate\Http\JsonResponse
    {
        $game = $game->load('users');

        return response()->json($game);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Game $game): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:pending,ready,active,completed',
        ]);
        $game->update($request->all());

        return response()->json($game);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Game $game): \Illuminate\Http\JsonResponse
    {
        $game->delete();

        return response()->json(null, 204);
    }

    public function findGame(Request $request): \Illuminate\Http\JsonResponse
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

    public function leaveGame(LeaveGameRequest $request, Game $game): \Illuminate\Http\JsonResponse
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

    public function readyGame(Game $game): \Illuminate\Http\JsonResponse
    {
        // if ($game->status !== 'pending') {
        //     return response()->json(['message' => 'Game is not in pending state.'], 400);
        // }

        if ($game->users->count() < 2) {
            return response()->json(['message' => 'Not enough players to start the game.'], 400);
        }

        $game->status = 'ready';
        $game->save();

        return response()->json($game->load('users'));
    }

    public function startGame(Game $game): \Illuminate\Http\JsonResponse
    {
        // if ($game->status !== 'ready') {
        //     return response()->json(['message' => 'Game must be in ready state to start.'], 400);
        // }

        $game->status = 'active';
        $game->save();

        return response()->json($game->load('users'));
    }

    public function finishGame(FinishGameRequest $request, Game $game): \Illuminate\Http\JsonResponse
    {
        // if ($game->status !== 'active') {
        //     return response()->json(['message' => 'Game must be active to finish.'], 400);
        // }

        $game->status = 'completed';
        $game->save();

        $results = $request->input('users', []);
        foreach ($results as $result) {
            $user = User::find($result['user_id'])->first();
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
