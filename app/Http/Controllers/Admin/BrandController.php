<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BrandController extends Controller
{
    public function index()
    {
        $brands = Brand::orderBy('created_at', 'desc')->get();

        return Inertia::render('Admin/Brand/Index', [
            'brands' => $brands,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:brands,name',
        ]);

        Brand::create($validated);

        return back()->with('success', 'Brand name added successfully.');
    }

    public function update(Request $request, Brand $brand)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:brands,name,'.$brand->id,
        ]);

        $brand->update($validated);

        return back()->with('success', 'Brand name updated successfully.');
    }

    public function destroy(Brand $brand)
    {
        $brand->delete();

        return back()->with('success', 'Brand deleted successfully.');
    }
}
