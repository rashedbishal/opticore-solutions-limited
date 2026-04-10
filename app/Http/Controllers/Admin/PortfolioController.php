<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Portfolio;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;

class PortfolioController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Portfolio/Index', [
            'portfolios' => Portfolio::latest()->paginate(10)
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Portfolio/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'alt' => 'nullable|string|max:255',
            'image' => 'nullable|image|max:10240', // up to 10MB
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('portfolios', 'public');
            $validated['image'] = '/storage/' . $path;
        }

        Portfolio::create($validated);

        return redirect()->route('admin.portfolios.index')->with('success', 'Portfolio created.');
    }

    public function edit(Portfolio $portfolio): Response
    {
        return Inertia::render('Admin/Portfolio/Edit', [
            'portfolio' => $portfolio
        ]);
    }

    public function update(Request $request, Portfolio $portfolio): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'alt' => 'nullable|string|max:255',
            'image' => 'nullable|image|max:10240',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('portfolios', 'public');
            $validated['image'] = '/storage/' . $path;
        }

        $portfolio->update($validated);

        return redirect()->route('admin.portfolios.index')->with('success', 'Portfolio updated.');
    }

    public function destroy(Portfolio $portfolio): RedirectResponse
    {
        $portfolio->delete();
        return back()->with('success', 'Portfolio deleted.');
    }
}
