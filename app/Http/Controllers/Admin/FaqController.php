<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFaqRequest;
use App\Http\Requests\UpdateFaqRequest;
use App\Models\Faq;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class FaqController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Faq/Index', [
            'faqs' => Faq::query()
                ->orderBy('sort_order')
                ->orderBy('id')
                ->paginate(10)
                ->through(fn (Faq $faq) => [
                    'id' => $faq->id,
                    'question' => $faq->question,
                    'answer' => $faq->answer,
                    'sort_order' => $faq->sort_order,
                    'is_active' => $faq->is_active,
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Faq/Create');
    }

    public function store(StoreFaqRequest $request): RedirectResponse
    {
        Faq::create($request->validated());
        Cache::forget('faq.items');

        return redirect()->route('admin.faqs.index')->with('success', 'FAQ created.');
    }

    public function show(Faq $faq): RedirectResponse
    {
        return redirect()->route('admin.faqs.edit', $faq);
    }

    public function edit(Faq $faq): Response
    {
        return Inertia::render('Admin/Faq/Edit', [
            'faq' => [
                'id' => $faq->id,
                'question' => $faq->question,
                'answer' => $faq->answer,
                'sort_order' => $faq->sort_order,
                'is_active' => $faq->is_active,
            ],
        ]);
    }

    public function update(UpdateFaqRequest $request, Faq $faq): RedirectResponse
    {
        $faq->update($request->validated());
        Cache::forget('faq.items');

        return redirect()->route('admin.faqs.index')->with('success', 'FAQ updated.');
    }

    public function destroy(Faq $faq): RedirectResponse
    {
        $faq->delete();
        Cache::forget('faq.items');

        return back()->with('success', 'FAQ deleted.');
    }
}
