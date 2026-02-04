<?php

namespace App\Http\Controllers;

use App\Http\Requests\FinishGameRequest;
use App\Http\Requests\LeaveGameRequest;
use App\Models\Game;
use Illuminate\Http\Request;

class GameController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(Game::all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $game = Game::create($request->all());

        return response()->json($game, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Game $game)
    {
        $game = $game->load('users');

        return response()->json($game);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Game $game)
    {
        $game->update($request->all());

        return response()->json($game);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Game $game)
    {
        $game->delete();

        return response()->json(null, 204);
    }

    public function findGame(Request $request)
    {
        $open_games = Game::query()->where('status', 'pending')->with('users')->get();
        $applicable = $open_games->filter(function ($game) use ($request) {
            return $game->users->contains($request->user()->id);
        });

        if ($applicable->isNotEmpty()) {
            return response()->json($applicable->first());
        }

        $joinable_games = $open_games->filter(function ($game) {
            return $game->users->count() < 4;
        });

        if (!$joinable_games->isEmpty()) {
            $game = $joinable_games->first();
            $game->users()->attach($request->user()->id);

            return response()->json($game->load('users'));
        }

        $new_game = Game::create(['status' => 'pending']);
        $new_game->users()->attach($request->user()->id);

        return response()->json($new_game->load('users'), 201);
    }

    public function leaveGame(LeaveGameRequest $request, Game $game)
    {
        $game->users()->detach($request->input('user_id'));

        return response()->json($game->load('users'));
    }

    public function startGame(Request $request, Game $game)
    {
        $game->status = 'active';
        $game->save();

        return response()->json($game->load('users'));
    }

    public function finishGame(FinishGameRequest $request, Game $game)
    {
        $game->status = 'finished';
        $game->save();

        $results = $request->input('users', []);
        foreach ($results as $result) {
            $game->users()->updateExistingPivot($result['user_id'], [
                'rank' => $result['rank'],
                'rating_mu' => $result['rating_mu'],
                'rating_sigma' => $result['rating_sigma'],
            ]);
        }

        return response()->json($game->load('users'));
    }
}
