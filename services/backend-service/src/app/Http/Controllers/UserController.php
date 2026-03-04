<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): \Illuminate\Http\JsonResponse
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
    public function show(User $user): \Illuminate\Http\JsonResponse
    {

        $limit = max(1, min((int) request()->query('limit', 20), 100));
        $user = $user->load(['games' => function ($query) use ($limit) {
            $query->limit($limit);
        }]);

        return response()->json($user);
    }

    /**
     * Update the specified resource in storage.
     *
     * @response 200 scenario="Success" {"id": 1, "name": "John", "email": "john@example.com"}
     * @response 404 scenario="Not found" {"message": "No query results for model [App\\Models\\User]"}
     */
    public function update(UpdateUserRequest $request, User $user): \Illuminate\Http\JsonResponse
    {
        $user->update($request->validated());

        return response()->json($user);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user): \Illuminate\Http\JsonResponse
    {
        $user->delete();

        return response()->json(null, 204);
    }


}
