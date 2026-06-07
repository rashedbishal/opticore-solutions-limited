<?php

use App\Http\Controllers\Admin\BlogController as AdminBlogController;
use App\Http\Controllers\Admin\BrandController;
use App\Http\Controllers\Admin\ChatSessionController;
use App\Http\Controllers\Admin\ClientController;
use App\Http\Controllers\Admin\ClientReviewController as AdminClientReviewController;
use App\Http\Controllers\Admin\ContactController as AdminContactController;
use App\Http\Controllers\Admin\CustomerConversationController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\FaqController as AdminFaqController;
use App\Http\Controllers\Admin\LoginController as AdminLoginController;
use App\Http\Controllers\Admin\OfferController as AdminOfferController;
use App\Http\Controllers\Admin\PortfolioController as AdminPortfolioController;
use App\Http\Controllers\Admin\PortfolioSubCategoryController;
use App\Http\Controllers\Admin\TaskController;
use App\Http\Controllers\Admin\TestimonialController as AdminTestimonialController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\AppointmentController as OriginalAppointmentController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\Auth\SocialController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\CareerController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\ClientReviewController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HireUsController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\OfferController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\ServiceController;
use App\Http\Middleware\RedirectAdminToPanel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Broadcasting Auth — accessible by web users and admins.
// CSRF is excluded for this route in bootstrap/app.php because the Pusher.js
// authorizer sends JSON (not a form post with _token).
Route::post('/broadcasting/auth', function (Request $request) {
    // Promote the admin guard to default so Broadcast::auth() resolves
    // the admin user when an admin is the one subscribing to a channel.
    if (auth('admin')->check()) {
        auth()->shouldUse('admin');
    }

    return Broadcast::auth($request);
})->middleware(['web', 'auth:web,admin']);

// All website (non-admin) routes — admins are redirected to the panel.
Route::middleware(RedirectAdminToPanel::class)->group(function () {
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

    // Hire Us Page Routes
    Route::get('/hire-us', [PageController::class, 'hireUs'])->name('hireUs');
    Route::get('/hire-us/{category}/{subcategory}', [HireUsController::class, 'showSubCategory'])
        ->where('category', 'graphic-design|digital-marketing|video-editing|3d-production|web-development')
        ->name('hireUsSubCategory');

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
        Route::post('/login', [LoginController::class, 'store'])->middleware('throttle:login');
        Route::get('/register', [RegisterController::class, 'create'])->name('register');
        Route::post('/register', [RegisterController::class, 'store'])->middleware('throttle:register');
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

        // User Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // Profile
        Route::get('/profile', function () {
            return Inertia::render('Profile');
        })->name('profile');

        // Checkout
        Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout');
        Route::post('/checkout/process', [CheckoutController::class, 'process'])->name('checkout.process');

        // Client Reviews
        Route::post('/reviews', [ClientReviewController::class, 'store'])->name('reviews.store')->middleware('throttle:5,1');

        // User Chat Routes
        Route::post('/user-chat/init', [ConversationController::class, 'init'])->name('user.chat.init');
        Route::get('/user-chat/{conversation}/messages', [ConversationController::class, 'fetchMessages'])->name('user.chat.messages');
        Route::post('/user-chat/{conversation}/message', [ConversationController::class, 'sendMessage'])->name('user.chat.send');
        Route::post('/user-chat/{conversation}/read', [ConversationController::class, 'markAsRead'])->name('user.chat.read');
        Route::post('/user-chat/ping', [ConversationController::class, 'pingOnline'])->name('user.chat.ping');
        Route::post('/user-chat/offline', [ConversationController::class, 'goOffline'])->name('user.chat.offline');
    });
});

Route::get('/chat/attachments/{message}/download', [ConversationController::class, 'downloadAttachment'])
    ->name('chat.attachment.download')
    ->middleware('auth:web,admin');

// Offer view — accessible by the offer's client (web) or any admin
Route::get('/offer/{token}', [OfferController::class, 'show'])
    ->name('offer.show')
    ->middleware('auth:web,admin');

// Offer accept / decline — client only
Route::middleware('auth')->group(function () {
    Route::post('/offer/{token}/accept', [OfferController::class, 'accept'])->name('offer.accept');
    Route::post('/offer/{token}/decline', [OfferController::class, 'decline'])->name('offer.decline');
});

// Offer edit — admin only
Route::put('/offer/{token}', [OfferController::class, 'update'])
    ->name('offer.update')
    ->middleware('auth:admin');

// Admin Auth Routes
Route::prefix('admin')->name('admin.')->group(function () {
    Route::middleware('guest:admin')->group(function () {
        Route::get('/login', [AdminLoginController::class, 'create'])->name('login');
        Route::post('/login', [AdminLoginController::class, 'store'])->middleware('throttle:admin-login');
    });

    Route::middleware('auth:admin')->group(function () {
        Route::post('/logout', [AdminLoginController::class, 'destroy'])->name('logout');
    });
});

// CMS Admin Routes
Route::middleware(['auth:admin'])->prefix('admin')->name('admin.')->group(function () {

    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::resource('portfolios', AdminPortfolioController::class);
    Route::resource('sub-categories', PortfolioSubCategoryController::class);
    Route::post('sub-categories/{sub_category}/gallery', [PortfolioSubCategoryController::class, 'galleryStore'])->name('sub-categories.gallery.store');
    Route::delete('sub-categories/{sub_category}/gallery/{portfolio}', [PortfolioSubCategoryController::class, 'galleryDestroy'])->name('sub-categories.gallery.destroy');
    Route::resource('blogs', AdminBlogController::class);
    Route::resource('faqs', AdminFaqController::class);
    Route::resource('brands', BrandController::class)->except(['show', 'create', 'edit']);
    Route::resource('chats', ChatSessionController::class)->only(['index', 'show', 'destroy']);
    Route::resource('contacts', AdminContactController::class)->only(['index', 'destroy']);
    Route::resource('users', UserController::class);
    Route::get('clients', [ClientController::class, 'index'])->name('clients.index');
    Route::delete('clients/{user}', [ClientController::class, 'destroy'])->name('clients.destroy');
    Route::resource('tasks', TaskController::class);

    // Customer Support Chat Routes
    Route::get('/customer-conversations', [CustomerConversationController::class, 'index'])->name('customer-conversations.index');
    Route::get('/api/customer-conversations', [CustomerConversationController::class, 'getConversations'])->name('customer-conversations.list');
    Route::get('/api/customer-conversations/{conversation}/messages', [CustomerConversationController::class, 'fetchMessages'])->name('customer-conversations.messages');
    Route::post('/api/customer-conversations/{conversation}/message', [CustomerConversationController::class, 'sendMessage'])->name('customer-conversations.send');
    Route::post('/api/customer-conversations/{conversation}/read', [CustomerConversationController::class, 'markAsRead'])->name('customer-conversations.read');
    Route::post('/api/customer-conversations/ping', [CustomerConversationController::class, 'pingOnline'])->name('customer-conversations.ping');
    Route::post('/api/customer-conversations/{conversation}/offer', [AdminOfferController::class, 'store'])->name('customer-conversations.offer.store');
    Route::delete('/api/customer-conversations/{conversation}/offer/{message}', [AdminOfferController::class, 'destroy'])->name('customer-conversations.offer.destroy');

    Route::resource('testimonials', AdminTestimonialController::class)->except(['show']);

    // Client Review Control
    Route::get('/client-reviews', [AdminClientReviewController::class, 'index'])->name('client-reviews.index');
    Route::delete('/client-reviews/{clientReview}', [AdminClientReviewController::class, 'destroy'])->name('client-reviews.destroy');
    Route::post('/client-reviews/reorder', [AdminClientReviewController::class, 'reorder'])->name('client-reviews.reorder');
});
