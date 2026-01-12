<?php

namespace App\Http\Controllers;

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
}
