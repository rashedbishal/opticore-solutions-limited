<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AppointmentRequest extends FormRequest
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
            'service' => ['required', 'string', 'max:255'],
            'preferred_date' => ['required', 'date'],
            'message' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
