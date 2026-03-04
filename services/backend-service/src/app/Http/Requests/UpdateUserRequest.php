<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'       => ['sometimes', 'string', 'max:255'],
            'email'      => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->route('user'))],
            'password'   => ['sometimes', 'string', 'confirmed', Password::defaults()],
            'avatar_url' => ['sometimes', 'nullable', 'string', 'url'],
        ];
    }
}
