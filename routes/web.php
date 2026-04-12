<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\CareerController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\ServiceController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/blogs', [BlogController::class, 'index'])->name('blogs');
Route::get('/blog/{slug}', [BlogController::class, 'show'])->name('blogShow');
Route::get('/graphic-design', [ServiceController::class, 'graphicDesign'])->name('graphicDesign');
Route::get('/digital-marketing', [ServiceController::class, 'digitalMarketing'])->name('digitalMarketing');
Route::get('/video-editing', [ServiceController::class, 'videoEditing'])->name('videoEditing');
Route::get('/3d-production', [ServiceController::class, 'threeDProduction'])->name('threeDProduction');
Route::get('/web-development', [ServiceController::class, 'webDevelopment'])->name('webDevelopment');
Route::get('/about-us', [PageController::class, 'aboutUs'])->name('aboutUs');
Route::get('/career', [PageController::class, 'career'])->name('career');
Route::get('/contact', [PageController::class, 'contact'])->name('contact');
Route::get('/faq', [PageController::class, 'faq'])->name('faq');
Route::get('/message-from-md', [PageController::class, 'messageFromMd'])->name('messageFromMd');
Route::get('/request-appointment', [PageController::class, 'requestAppointment'])->name('requestAppointment');
Route::get('/privacy-policy', [PageController::class, 'privacyPolicy'])->name('privacyPolicy');
Route::get('/terms-conditions', [PageController::class, 'termsConditions'])->name('termsConditions');

// Portfolio public routes
Route::get('/portfolio', [PortfolioController::class, 'index'])->name('portfolio');

Route::get('/portfolio/{category}', [PortfolioController::class, 'showCategory'])
    ->where('category', 'graphic-design|digital-marketing|video-editing|3d-production|web-development')
    ->name('portfolioCategory');

Route::get('/portfolio/{category}/{subcategory}', [PortfolioController::class, 'showSubCategory'])
    ->where('category', 'graphic-design|digital-marketing|video-editing|3d-production|web-development')
    ->name('portfolioSubCategory');

Route::get('/portfolio-item/{portfolio}', [PortfolioController::class, 'preview'])->name('portfolioPreview');

Route::post('/api/contact', [ContactController::class, 'store'])->name('contactStore');
Route::post('/api/appointment', [AppointmentController::class, 'store'])->name('appointmentStore');
Route::post('/api/career/apply', [CareerController::class, 'apply'])->name('careerApply');
Route::post('/chat', [ChatController::class, 'handleChat'])->name('chat');

use App\Http\Controllers\Admin\BlogController as AdminBlogController;
use App\Http\Controllers\Admin\BrandController;
use App\Http\Controllers\Admin\ChatSessionController;
use App\Http\Controllers\Admin\ContactController as AdminContactController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PortfolioController as AdminPortfolioController;
use App\Http\Controllers\Admin\PortfolioSubCategoryController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\LoginController;

// Authentication Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
});
Route::post('/logout', [LoginController::class, 'destroy'])->name('logout')->middleware('auth');

// CMS Admin Routes
Route::middleware('auth')->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('portfolios', AdminPortfolioController::class);
    Route::resource('portfolio-sub-categories', PortfolioSubCategoryController::class);
    Route::resource('blogs', AdminBlogController::class);
    Route::resource('brands', BrandController::class)->except(['show', 'create', 'edit']);
    Route::resource('chats', ChatSessionController::class)->only(['index', 'show', 'destroy']);
    Route::resource('contacts', AdminContactController::class)->only(['index', 'destroy']);
    Route::resource('users', UserController::class);
});
