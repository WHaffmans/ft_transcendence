<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGameRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array{status: string[]}
     */
    public function rules(): array
    {
        return [
            'status' => ['string', 'in:pending,ready,active,completed'],
        ];
    }
}
