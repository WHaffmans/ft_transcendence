<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
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
     * Display the specified resource.
     */
    public function show(User $user)
    {
        $user = $user->load('games');

        return response()->json($user);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        // TODO: validate input
        $user->update($request->all());

        return response()->json($user);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        $user->delete();

        return response()->json(null, 204);
    }

    /**
     * Get the authenticated user's match history.
     */
    public function getMatches(Request $request)
    {
        $limit = $request->query('limit', 10);
        
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        
        $games = $user->games()
            ->where('status', 'completed')
            ->with('users')
            ->orderBy('updated_at', 'desc')
            ->limit($limit)
            ->get();
        
        return response()->json($games);
    }
}
