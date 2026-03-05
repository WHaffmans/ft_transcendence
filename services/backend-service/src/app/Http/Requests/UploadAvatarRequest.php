<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadAvatarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->id === $this->route('user')->id;
    }

    /**
     * @return array{avatar: string[]}
     */
    public function rules(): array
    {
        return [
            'avatar' => ['required', 'image', 'max:2048'],
        ];
    }
}
