<?php

use App\Http\Controllers\Admin\BlogController as AdminBlogController;
use App\Http\Controllers\Admin\BrandController;
use App\Http\Controllers\Admin\ChatSessionController;
use App\Http\Controllers\Admin\ContactController as AdminContactController;
use App\Http\Controllers\Admin\CustomerConversationController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\LoginController as AdminLoginController;
use App\Http\Controllers\Admin\PortfolioController as AdminPortfolioController;
use App\Http\Controllers\Admin\PortfolioSubCategoryController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\Auth\SocialController;
use App\Http\Controllers\Auth\VerifyEmailController;

use App\Http\Controllers\HomeController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\AppointmentController as OriginalAppointmentController;
use App\Http\Controllers\CareerController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ConversationController;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Broadcasting Auth
Route::post('/broadcasting/auth', function (Request $request) {
    if (auth('admin')->check()) {
        auth()->shouldUse('admin');
    }

    return Broadcast::auth($request);
})->middleware(['web']);

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

// Hire Us Page Route
Route::get('/hire-us', fn () => Inertia::render('HireUs'))->name('hireUs');

// Portfolio public routes
Route::get('/portfolio', [PortfolioController::class, 'index'])->name('portfolio');
Route::get('/portfolio/{category}', [PortfolioController::class, 'showCategory'])
    ->where('category', 'graphic-design|digital-marketing|video-editing|3d-production|web-development')
    ->name('portfolioCategory');
Route::get('/portfolio/{category}/{subcategory}', [PortfolioController::class, 'showSubCategory'])
    ->where('category', 'graphic-design|digital-marketing|video-editing|3d-production|web-development')
    ->name('portfolioSubCategory');
Route::get('/portfolio-item/{portfolio}', [PortfolioController::class, 'preview'])->name('portfolioPreview');

Route::post('/api/contact', [ContactController::class, 'store'])->name('contactStore')->middleware('throttle:5,1');
Route::post('/api/appointment', [OriginalAppointmentController::class, 'store'])->name('appointmentStore')->middleware('throttle:5,1');
Route::post('/api/career/apply', [CareerController::class, 'apply'])->name('careerApply')->middleware('throttle:3,1');
Route::post('/chat', [ChatController::class, 'handleChat'])->name('chat')->middleware('throttle:30,1');

// User Auth Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store']);
    Route::get('/forgot-password', [ForgotPasswordController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [ForgotPasswordController::class, 'store'])->name('password.email');
    Route::get('/reset-password/{token}', [ResetPasswordController::class, 'create'])->name('password.reset');
    Route::post('/reset-password', [ResetPasswordController::class, 'store'])->name('password.update');

    // Social Auth
    Route::get('/auth/{provider}/redirect', [SocialController::class, 'redirect'])->name('social.redirect');
    Route::get('/auth/{provider}/callback', [SocialController::class, 'callback'])->name('social.callback');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');
    Route::get('/verify-email', [VerifyEmailController::class, 'notice'])->name('verification.notice');
    Route::get('/verify-email/{id}/{hash}', [VerifyEmailController::class, '__invoke'])->middleware('signed')->name('verification.verify');
    Route::post('/email/verification-notification', [VerifyEmailController::class, 'resend'])->middleware('throttle:6,1')->name('verification.send');

    // Settings
    Route::get('/settings', function () {
        return Inertia::render('Settings');
    })->name('settings');

    // User Chat Routes
    Route::post('/user-chat/init', [ConversationController::class, 'init'])->name('user.chat.init');
    Route::get('/user-chat/{conversation}/messages', [ConversationController::class, 'fetchMessages'])->name('user.chat.messages');
    Route::post('/user-chat/{conversation}/message', [ConversationController::class, 'sendMessage'])->name('user.chat.send');
    Route::post('/user-chat/{conversation}/read', [ConversationController::class, 'markAsRead'])->name('user.chat.read');
    Route::post('/user-chat/ping', [ConversationController::class, 'pingOnline'])->name('user.chat.ping');
    Route::get('/chat/attachments/{message}/download', [ConversationController::class, 'downloadAttachment'])->name('chat.attachment.download');
});

// Admin Auth Routes
Route::prefix('admin')->name('admin.')->group(function () {
    Route::middleware('guest:admin')->group(function () {
        Route::get('/login', [AdminLoginController::class, 'create'])->name('login');
        Route::post('/login', [AdminLoginController::class, 'store']);
    });

    Route::middleware('auth:admin')->group(function () {
        Route::post('/logout', [AdminLoginController::class, 'destroy'])->name('logout');
    });
});

// CMS Admin Routes
Route::middleware(['auth:admin'])->prefix('admin')->name('admin.')->group(function () {

    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('portfolios', AdminPortfolioController::class);
    Route::resource('portfolio-sub-categories', PortfolioSubCategoryController::class);
    Route::resource('blogs', AdminBlogController::class);
    Route::resource('brands', BrandController::class)->except(['show', 'create', 'edit']);
    Route::resource('chats', ChatSessionController::class)->only(['index', 'show', 'destroy']);
    Route::resource('contacts', AdminContactController::class)->only(['index', 'destroy']);
    Route::resource('users', UserController::class);

    // Customer Support Chat Routes
    Route::get('/customer-conversations', [CustomerConversationController::class, 'index'])->name('customer-conversations.index');
    Route::get('/api/customer-conversations', [CustomerConversationController::class, 'getConversations'])->name('customer-conversations.list');
    Route::get('/api/customer-conversations/{conversation}/messages', [CustomerConversationController::class, 'fetchMessages'])->name('customer-conversations.messages');
    Route::post('/api/customer-conversations/{conversation}/message', [CustomerConversationController::class, 'sendMessage'])->name('customer-conversations.send');
    Route::post('/api/customer-conversations/{conversation}/read', [CustomerConversationController::class, 'markAsRead'])->name('customer-conversations.read');
    Route::post('/api/customer-conversations/ping', [CustomerConversationController::class, 'pingOnline'])->name('customer-conversations.ping');
});

require __DIR__.'/../routes/channels.php';

