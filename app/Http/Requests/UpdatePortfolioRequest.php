<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePortfolioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'sub_category_id' => ['nullable', 'integer', 'exists:portfolio_sub_categories,id'],
            'alt' => ['nullable', 'string', 'max:255'],
            'media_source' => ['required', 'in:file,youtube'],
            'media' => [
                'nullable',
                'file',
                'max:307200',
                'mimes:jpg,jpeg,png,webp,gif,mp4,mov,avi,webm',
            ],
            'youtube_url' => [
                'nullable',
                'required_if:media_source,youtube',
                'string',
                'max:255',
                'regex:/^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w\-]{11}/',
            ],
        ];
    }
}
