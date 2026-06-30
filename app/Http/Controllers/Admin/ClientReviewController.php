<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClientReview;
use App\Models\PortfolioSubCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ClientReviewController extends Controller
{
    public function index(): Response
    {
        $subCategories = PortfolioSubCategory::orderBy('category_slug')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'category_slug', 'name', 'slug']);

        $paginator = ClientReview::orderBy('category_slug')
            ->orderBy('sub_category_id')
            ->orderBy('sort_order')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        $reviews = $paginator->getCollection()->map(fn (ClientReview $r) => [
            'id' => $r->id,
            'task_id' => $r->task_id,
            'sub_category_id' => $r->sub_category_id,
            'category_slug' => $r->category_slug,
            'username' => $r->username,
            'client_type' => $r->client_type,
            'rating' => $r->rating,
            'comment' => $r->comment,
            'image_url' => $r->image_path ? asset('storage/'.$r->image_path) : null,
            'price_range' => $r->price_range,
            'work_duration' => $r->work_duration,
            'sort_order' => $r->sort_order,
            'created_at' => $r->created_at?->format('Y-m-d'),
        ]);

        // Group reviews by category → subcategory.
        $grouped = [];

        foreach ($reviews as $review) {
            $catSlug = $review['category_slug'];
            $subId = $review['sub_category_id'];

            if (! isset($grouped[$catSlug])) {
                $grouped[$catSlug] = [];
            }

            if (! isset($grouped[$catSlug][$subId])) {
                $sub = $subCategories->firstWhere('id', $subId);
                $grouped[$catSlug][$subId] = [
                    'sub_category_id' => $subId,
                    'sub_category_name' => $sub ? $sub->name : 'Unknown',
                    'reviews' => [],
                ];
            }

            $grouped[$catSlug][$subId]['reviews'][] = $review;
        }

        // Re-index subcategories arrays for JSON serialisation.
        foreach ($grouped as $cat => &$subCats) {
            $subCats = array_values($subCats);
        }

        return Inertia::render('Admin/ClientReview/Index', [
            'grouped' => $grouped,
            'paginationLinks' => $paginator->linkCollection()->toArray(),
        ]);
    }

    public function destroy(ClientReview $clientReview): RedirectResponse
    {
        $subCategoryId = $clientReview->sub_category_id;

        if ($clientReview->image_path) {
            Storage::disk('public')->delete($clientReview->image_path);
        }

        $clientReview->delete();

        $this->recalculateSubCategoryStats($subCategoryId);

        Cache::forget("hire-us.reviews.{$subCategoryId}");
        Cache::forget('hire-us.recommended-pool');

        return back()->with('success', 'Review deleted successfully.');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'order' => ['required', 'array'],
            'order.*.id' => ['required', 'integer', 'exists:client_reviews,id'],
            'order.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        $affectedSubCategoryIds = ClientReview::whereIn('id', array_column($validated['order'], 'id'))
            ->distinct()
            ->pluck('sub_category_id');

        foreach ($validated['order'] as $item) {
            ClientReview::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        $affectedSubCategoryIds->each(fn (int $id) => Cache::forget("hire-us.reviews.{$id}"));

        return back()->with('success', 'Review order saved.');
    }

    private function recalculateSubCategoryStats(int $subCategoryId): void
    {
        $reviews = ClientReview::where('sub_category_id', $subCategoryId);
        $count = $reviews->count();
        $avg = $count > 0 ? round($reviews->avg('rating'), 1) : 0.0;

        PortfolioSubCategory::where('id', $subCategoryId)->update([
            'reviews_count' => $count,
            'rating' => $avg,
        ]);
    }
}
