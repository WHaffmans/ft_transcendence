<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FinishGameRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
      // ['users' => [{userid :1, ranking:2, rating_mu: 24, rating_sigma:3}, {}], 'game_id' => 1]
    public function rules(): array
    {
        return [
            'users' => 'required|array',
            'users.*.user_id' => 'required|integer|exists:users,id',
            'users.*.ranking' => 'required|integer|min:1',
            'users.*.rating_mu' => 'required|numeric',
            'users.*.rating_sigma' => 'required|numeric',
        ];
    }
}
