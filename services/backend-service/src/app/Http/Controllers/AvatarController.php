<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\User;

/**
 * @tags Avatar
 */
class AvatarController extends Controller
{
    /**
     * Upload user avatar.
     *
     * Uploads a new avatar image for the specified user. Replaces any existing avatar.
     * The image is stored in public storage and the user's avatar_url is updated.
     *
     * @bodyParam avatar file required The avatar image file (max 2MB). Example: avatar.png
     *
     * @response 200 scenario="Success" {"id": 1, "name": "John", "avatar_url": "/storage/avatars/abc123.png"}
     * @response 422 scenario="Validation error" {"message": "The avatar field is required.", "errors": {"avatar": ["The avatar field is required."]}}
     */
    public function upload(Request $request, User $user)
    {
        $request->validate([
            'avatar' => 'required|image|max:2048', // 2MB max
        ]);

        // Delete old avatar if it was a file (not an external URL)
        if ($user->avatar_url && str_starts_with($user->avatar_url, '/storage/avatars/')) {
            $oldPath = str_replace('/storage/', '', $user->avatar_url);
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->avatar_url = '/storage/' . $path;
        $user->save();

        return response()->json($user);
    }
}
