<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CareerApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'role' => ['required', 'string', 'max:255'],
            'portfolio_url' => ['nullable', 'url', 'max:255'],
            'resume' => ['required', 'file', 'mimes:pdf', 'max:5120'],
        ];
    }
}
