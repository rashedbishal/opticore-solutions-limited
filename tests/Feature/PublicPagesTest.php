<?php

use App\Models\Blog;
use App\Models\Portfolio;
use App\Models\PortfolioSubCategory;
use App\Models\Task;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the homepage', function () {
    $this->get(route('home'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Home/Index'));
});

it('renders the blog index page', function () {
    Blog::factory()->create(['title' => 'A Published Post']);

    $this->get(route('blogs'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Blogs/Index')
            ->has('dbBlogs')
        );
});

it('renders a single blog post page', function () {
    $blog = Blog::factory()->create(['slug' => 'a-great-read']);

    $this->get(route('blogShow', $blog->slug))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Blogs/Show')
            ->where('slug', 'a-great-read')
            ->where('dbBlog.title', $blog->title)
        );
});

it('returns 404 for an unknown blog slug', function () {
    $this->get(route('blogShow', 'does-not-exist'))->assertNotFound();
});

it('renders each of the five service pages', function (string $routeName, string $component) {
    $this->get(route($routeName))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component($component));
})->with([
    ['graphicDesign', 'Services/GraphicDesign'],
    ['digitalMarketing', 'Services/DigitalMarketing'],
    ['videoEditing', 'Services/VideoEditing'],
    ['threeDProduction', 'Services/ThreeDProduction'],
    ['webDevelopment', 'Services/WebDevelopment'],
]);

it('renders the portfolio landing page with category cards', function () {
    $this->get(route('portfolio'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Portfolio/Show')
            ->has('categories')
        );
});

it('renders a portfolio category page with its sub-categories', function () {
    $subCategory = PortfolioSubCategory::factory()->create(['category_slug' => 'graphic-design']);

    $this->get(route('portfolioCategory', 'graphic-design'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Portfolio/CategoryShow')
            ->where('category.slug', 'graphic-design')
            ->where('selectedSubCategory.slug', $subCategory->slug)
        );
});

it('returns 404 for an unknown portfolio category', function () {
    $this->get(route('portfolioCategory', 'not-a-real-category'))->assertNotFound();
});

it('renders a portfolio sub-category page with its portfolios', function () {
    $subCategory = PortfolioSubCategory::factory()->create(['category_slug' => 'web-development']);
    $portfolio = Portfolio::factory()->create([
        'category' => 'web-development',
        'sub_category_id' => $subCategory->id,
    ]);

    $this->get(route('portfolioSubCategory', ['web-development', $subCategory->slug]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Portfolio/CategoryShow')
            ->where('selectedSubCategory.slug', $subCategory->slug)
            ->where('portfolios.0.id', $portfolio->id)
        );
});

it('returns 404 when the sub-category does not belong to the given category', function () {
    $subCategory = PortfolioSubCategory::factory()->create(['category_slug' => 'graphic-design']);

    $this->get(route('portfolioSubCategory', ['web-development', $subCategory->slug]))->assertNotFound();
});

it('renders a portfolio item preview page', function () {
    $portfolio = Portfolio::factory()->create();

    $this->get(route('portfolioPreview', $portfolio))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Portfolio/Preview')
            ->where('item.id', $portfolio->id)
        );
});

it('returns 404 for an unknown portfolio item', function () {
    $this->get(route('portfolioPreview', 999999))->assertNotFound();
});

it('renders each of the static informational pages', function (string $routeName, string $component) {
    $this->get(route($routeName))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component($component));
})->with([
    ['hireUs', 'HireUs'],
    ['aboutUs', 'About'],
    ['career', 'Career'],
    ['contact', 'Contact'],
    ['faq', 'FAQ'],
    ['messageFromMd', 'MessageFromMd'],
    ['requestAppointment', 'RequestAppointment'],
    ['privacyPolicy', 'PrivacyPolicy'],
    ['termsConditions', 'TermsConditions'],
]);

it('renders a hire-us sub-category page', function () {
    $subCategory = PortfolioSubCategory::factory()->create(['category_slug' => 'video-editing']);

    $this->get(route('hireUsSubCategory', ['video-editing', $subCategory->slug]))
        ->assertSuccessful();
});

it('renders the dashboard for an authenticated user with their tasks', function () {
    $user = User::factory()->create();
    $task = Task::factory()->create(['user_id' => $user->id, 'task_name' => 'My Task']);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Index')
            ->where('tasks.0.id', $task->id)
            ->where('tasks.0.task_name', 'My Task')
        );
});

it('redirects guests away from the dashboard', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

it('renders the profile page for an authenticated user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('profile'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('Profile'));
});

it('redirects guests away from the profile page', function () {
    $this->get(route('profile'))->assertRedirect(route('login'));
});
