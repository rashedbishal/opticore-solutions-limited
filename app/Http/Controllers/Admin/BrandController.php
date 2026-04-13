<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
            'logo' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('brands', 'public');
            $validated['logo_path'] = '/storage/'.$path;
        }

        Brand::create($validated);

        return back()->with('success', 'Brand added successfully.');
    }

    public function update(Request $request, Brand $brand)
    {
        // Inertia sends multipart/form-data as POST with _method=PUT
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:brands,name,'.$brand->id,
            'logo' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            // Delete old logo
            if ($brand->logo_path) {
                $oldPath = str_replace('/storage/', '', $brand->logo_path);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('logo')->store('brands', 'public');
            $validated['logo_path'] = '/storage/'.$path;
        }

        $brand->update($validated);

        return back()->with('success', 'Brand updated successfully.');
    }

    public function destroy(Brand $brand)
    {
        if ($brand->logo_path) {
            $oldPath = str_replace('/storage/', '', $brand->logo_path);
            Storage::disk('public')->delete($oldPath);
        }

        $brand->delete();

        return back()->with('success', 'Brand deleted successfully.');
    }
}
