<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TestimonialController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Testimonial/Index', [
            'testimonials' => Testimonial::orderBy('sort_order')->orderBy('id')
                ->paginate(10)
                ->through(fn (Testimonial $t) => [
                    'id' => $t->id,
                    'name' => $t->name,
                    'company' => $t->company,
                    'role' => $t->role,
                    'rating' => $t->rating,
                    'comment' => $t->comment,
                    'sort_order' => $t->sort_order,
                    'is_active' => $t->is_active,
                    'image_url' => $t->image_path ? asset('storage/'.$t->image_path) : null,
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Testimonial/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'company' => ['required', 'string', 'max:100'],
            'role' => ['required', 'string', 'max:100'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string', 'max:1000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
            'image' => ['nullable', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('testimonials', 'public');
        }

        unset($validated['image']);

        Testimonial::create($validated);
        Cache::forget('home.testimonials');

        return redirect()->route('admin.testimonials.index')->with('success', 'Testimonial created.');
    }

    public function edit(Testimonial $testimonial): Response
    {
        return Inertia::render('Admin/Testimonial/Edit', [
            'testimonial' => [
                'id' => $testimonial->id,
                'name' => $testimonial->name,
                'company' => $testimonial->company,
                'role' => $testimonial->role,
                'rating' => $testimonial->rating,
                'comment' => $testimonial->comment,
                'sort_order' => $testimonial->sort_order,
                'is_active' => $testimonial->is_active,
                'image_url' => $testimonial->image_path ? asset('storage/'.$testimonial->image_path) : null,
            ],
        ]);
    }

    public function update(Request $request, Testimonial $testimonial): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'company' => ['required', 'string', 'max:100'],
            'role' => ['required', 'string', 'max:100'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string', 'max:1000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
            'image' => ['nullable', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('image')) {
            if ($testimonial->image_path) {
                Storage::disk('public')->delete($testimonial->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('testimonials', 'public');
        }

        unset($validated['image']);

        $testimonial->update($validated);
        Cache::forget('home.testimonials');

        return redirect()->route('admin.testimonials.index')->with('success', 'Testimonial updated.');
    }

    public function destroy(Testimonial $testimonial): RedirectResponse
    {
        if ($testimonial->image_path) {
            Storage::disk('public')->delete($testimonial->image_path);
        }

        $testimonial->delete();
        Cache::forget('home.testimonials');

        return back()->with('success', 'Testimonial deleted.');
    }
}
