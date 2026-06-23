<?php

namespace App\Http\Requests;

use App\Http\Controllers\Admin\CategoryController;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
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
            'label' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],

            // Marketing/service-page fields — all optional so a category
            // can keep being a plain hire-us grouping with none of this set.
            'icon' => ['nullable', 'string', Rule::in(CategoryController::ALLOWED_ICONS)],
            'color' => ['nullable', 'string', Rule::in(CategoryController::ALLOWED_COLORS)],
            // Required only when publishing — otherwise a category can be
            // marked active with an empty hero paragraph on a live page.
            'long_description' => [
                Rule::requiredIf(fn () => $this->boolean('is_active')),
                'nullable', 'string', 'max:2000',
            ],
            'is_active' => ['boolean'],

            'headings' => ['nullable', 'array'],
            'headings.capabilities.eyebrow' => ['nullable', 'string', 'max:60'],
            'headings.capabilities.title' => ['nullable', 'string', 'max:120'],
            'headings.whyOpticore.eyebrow' => ['nullable', 'string', 'max:60'],
            'headings.whyOpticore.title' => ['nullable', 'string', 'max:120'],
            'headings.process.eyebrow' => ['nullable', 'string', 'max:60'],
            'headings.process.title' => ['nullable', 'string', 'max:120'],
            'headings.selectedWork.eyebrow' => ['nullable', 'string', 'max:60'],
            'headings.selectedWork.title' => ['nullable', 'string', 'max:120'],

            'sub_services' => ['nullable', 'array'],
            'sub_services.*.title' => ['required', 'string', 'max:100'],
            'sub_services.*.description' => ['required', 'string', 'max:500'],

            'reasons' => ['nullable', 'array'],
            'reasons.*.title' => ['required', 'string', 'max:100'],
            'reasons.*.description' => ['required', 'string', 'max:500'],

            'process' => ['nullable', 'array'],
            'process.*.title' => ['required', 'string', 'max:100'],
            'process.*.description' => ['required', 'string', 'max:500'],
        ];
    }
}
