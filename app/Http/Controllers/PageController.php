<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Faq;
use App\Models\JobListing;
use App\Models\PortfolioSubCategory;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function hireUs(): Response
    {
        return Inertia::render('HireUs', [
            'meta' => [
                'title' => 'Hire Us',
                'description' => 'Hire Opticore Solutions Limited for expert digital services. Browse our full service catalogue and get a custom quote.',
            ],
            'subCategories' => $this->hireUsSubCategories(),
        ]);
    }

    /**
     * @return array<string, array<int, array{name: string, slug: string, price: string, rating: float, reviews: int, image: string}>>
     */
    private function hireUsSubCategories(): array
    {
        $categories = Category::configShape();

        return Cache::remember('hire-us.subcategories', now()->addMinutes(60), function () use ($categories) {
            $groupedSubCategories = PortfolioSubCategory::query()
                ->orderBy('category_slug')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->groupBy('category_slug');

            return collect(array_keys($categories))
                ->mapWithKeys(function (string $categorySlug) use ($groupedSubCategories) {
                    $subCategories = $groupedSubCategories->get($categorySlug, collect())
                        ->map(fn (PortfolioSubCategory $subCategory) => [
                            'name' => $subCategory->name,
                            'slug' => $subCategory->slug,
                            'price' => $subCategory->price ?: 'Custom Quote',
                            'rating' => $subCategory->rating !== null ? (float) $subCategory->rating : 5.0,
                            'reviews' => $subCategory->reviews_count ?? 0,
                            'image' => $subCategory->image ? asset('storage/'.$subCategory->image) : 'https://placehold.co/800x600/111111/FFFFFF?text=Opticore',
                        ])
                        ->values()
                        ->toArray();

                    return [$categorySlug => $subCategories];
                })
                ->toArray();
        });
    }

    public function aboutUs(): Response
    {
        return Inertia::render('About', [
            'meta' => [
                'title' => 'About Us — Opticore Solutions Limited',
                'description' => 'Learn more about Opticore Solutions Limited, our approach, values, and multidisciplinary digital expertise.',
            ],
        ]);
    }

    public function career(): Response
    {
        return Inertia::render('Career', [
            'meta' => [
                'title' => 'Career — Opticore Solutions Limited',
                'description' => 'Explore remote career opportunities with Opticore Solutions Limited',
            ],
            'jobListings' => Cache::remember('career.jobListings', now()->addMinutes(60), fn () => JobListing::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get(['title', 'location', 'type', 'description'])
                ->toArray()),
        ]);
    }

    public function contact(): Response
    {
        return Inertia::render('Contact', [
            'meta' => [
                'title' => 'Contact — Opticore Solutions Limited',
                'description' => 'Contact Opticore Solutions Limited to discuss your next digital project.',
            ],
        ]);
    }

    public function faq(): Response
    {
        return Inertia::render('FAQ', [
            'meta' => [
                'title' => 'FAQ — Opticore Solutions Limited',
                'description' => 'Find answers to common questions about services, pricing, timelines, and project workflow.',
            ],
            'faqs' => Cache::remember('faq.items', now()->addMinutes(60), fn () => Faq::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get(['question', 'answer'])
                ->toArray()),
        ]);
    }

    public function messageFromMd(): Response
    {
        return Inertia::render('MessageFromMd', [
            'meta' => [
                'title' => 'Message from MD — Opticore Solutions Limited',
                'description' => 'A message from the Managing Director of Opticore Solutions Limited about the company vision, standards, and client commitment.',
            ],
        ]);
    }

    public function privacyPolicy(): Response
    {
        return Inertia::render('PrivacyPolicy', [
            'meta' => [
                'title' => 'Privacy Policy — Opticore Solutions Limited',
                'description' => 'Review the privacy policy for Opticore Solutions Limited',
            ],
        ]);
    }

    public function termsConditions(): Response
    {
        return Inertia::render('TermsConditions', [
            'meta' => [
                'title' => 'Terms & Conditions — Opticore Solutions Limited',
                'description' => 'Review the terms and conditions for Opticore Solutions Limited',
            ],
        ]);
    }
}
