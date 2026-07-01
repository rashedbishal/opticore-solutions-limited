<?php

use App\Http\Controllers\Admin\BlogController as AdminBlogController;
use App\Http\Controllers\Admin\BrandController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\ChatSessionController;
use App\Http\Controllers\Admin\ClientController;
use App\Http\Controllers\Admin\ClientReviewController as AdminClientReviewController;
use App\Http\Controllers\Admin\ConfigurationController as AdminConfigurationController;
use App\Http\Controllers\Admin\ContactController as AdminContactController;
use App\Http\Controllers\Admin\CustomerConversationController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\FaqController as AdminFaqController;
use App\Http\Controllers\Admin\JobApplicationController as AdminJobApplicationController;
use App\Http\Controllers\Admin\JobListingController as AdminJobListingController;
use App\Http\Controllers\Admin\LoginController as AdminLoginController;
use App\Http\Controllers\Admin\OfferController as AdminOfferController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\PendingPaymentController;
use App\Http\Controllers\Admin\PortfolioController as AdminPortfolioController;
use App\Http\Controllers\Admin\PortfolioSubCategoryController;
use App\Http\Controllers\Admin\SubscriptionController as AdminSubscriptionController;
use App\Http\Controllers\Admin\TaskController;
use App\Http\Controllers\Admin\TestimonialController as AdminTestimonialController;
use App\Http\Controllers\Admin\TransactionController as AdminTransactionController;
use App\Http\Controllers\Admin\UserController;
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
use App\Http\Controllers\GooglePayCheckoutController;
use App\Http\Controllers\HireUsController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\OfferController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\SslCommerzPaymentController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Middleware\RedirectAdminToPanel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

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
    Route::get('/about-us', [PageController::class, 'aboutUs'])->name('aboutUs');
    Route::get('/career', [PageController::class, 'career'])->name('career');
    Route::get('/contact', [PageController::class, 'contact'])->name('contact');
    Route::get('/faq', [PageController::class, 'faq'])->name('faq');
    Route::get('/message-from-md', [PageController::class, 'messageFromMd'])->name('messageFromMd');
    Route::get('/privacy-policy', [PageController::class, 'privacyPolicy'])->name('privacyPolicy');
    Route::get('/terms-conditions', [PageController::class, 'termsConditions'])->name('termsConditions');

    // Hire Us Page Routes
    Route::get('/hire-us', [PageController::class, 'hireUs'])->name('hireUs');
    // 301s for corrected slug typo — must be before the {subcategory} wildcard
    Route::permanentRedirect('/hire-us/video-editing/weading-video-editing', '/hire-us/video-editing/wedding-video-editing');
    Route::get('/hire-us/{category}/{subcategory}', [HireUsController::class, 'showSubCategory'])
        ->where('category', '[a-z0-9-]+')
        ->name('hireUsSubCategory');

    // Portfolio public routes
    Route::get('/portfolio', [PortfolioController::class, 'index'])->name('portfolio');
    Route::get('/portfolio/{category}', [PortfolioController::class, 'showCategory'])
        ->where('category', '[a-z0-9-]+')
        ->name('portfolioCategory');
    // 301s for corrected slug typo — must be before the {subcategory} wildcard
    Route::permanentRedirect('/portfolio/video-editing/weading-video-editing', '/portfolio/video-editing/wedding-video-editing');
    Route::get('/portfolio/{category}/{subcategory}', [PortfolioController::class, 'showSubCategory'])
        ->where('category', '[a-z0-9-]+')
        ->name('portfolioSubCategory');
    Route::get('/portfolio-item/{portfolio}', [PortfolioController::class, 'preview'])->name('portfolioPreview');

    Route::post('/api/contact', [ContactController::class, 'store'])->name('contactStore')->middleware('throttle:5,1');
    Route::post('/api/career/apply', [CareerController::class, 'apply'])->name('careerApply')->middleware('throttle:3,1');
    Route::post('/chat', [ChatController::class, 'handleChat'])->name('chat')->middleware('throttle:12,1');

    // User Auth Routes
    Route::middleware('guest')->group(function () {
        Route::get('/login', [LoginController::class, 'create'])->name('login');
        Route::post('/login', [LoginController::class, 'store'])->middleware('throttle:login');
        Route::get('/register', [RegisterController::class, 'create'])->name('register');
        Route::post('/register', [RegisterController::class, 'store'])->middleware('throttle:register');
        Route::get('/forgot-password', [ForgotPasswordController::class, 'create'])->name('password.request');
        Route::post('/forgot-password', [ForgotPasswordController::class, 'store'])->name('password.email')->middleware('throttle:password-reset');
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
        Route::get('/profile', [ProfileController::class, 'index'])->name('profile');
        Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
        Route::patch('/profile/preferences', [ProfileController::class, 'updatePreferences'])->name('profile.preferences');
        Route::delete('/profile', [ProfileController::class, 'deleteAccount'])->name('profile.delete');
        Route::get('/orders/{transaction}/invoice', [ProfileController::class, 'downloadInvoice'])->name('orders.invoice');
        Route::get('/orders/invoice/verify/{token}', [ProfileController::class, 'verifyInvoice'])->name('orders.invoice.verify');

        // Checkout
        Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout');
        Route::get('/checkout/exchange-rate', [CheckoutController::class, 'exchangeRate'])->name('checkout.exchange-rate');
        Route::post('/checkout/upload-attachments', [CheckoutController::class, 'uploadAttachments'])->name('checkout.upload-attachments');

        // Google Pay (SSLCommerz Merchant Hosted Payment API)
        Route::get('/gpay/config', [GooglePayCheckoutController::class, 'config'])->name('gpay.config');
        Route::post('/gpay/charge', [GooglePayCheckoutController::class, 'charge'])->name('gpay.charge');

        // Client Reviews
        Route::post('/reviews', [ClientReviewController::class, 'store'])->name('reviews.store')->middleware('throttle:5,1');

        // User Chat Routes
        Route::post('/user-chat/init', [ConversationController::class, 'init'])->name('user.chat.init')->middleware('throttle:user-chat-presence');
        Route::get('/user-chat/{conversation}/messages', [ConversationController::class, 'fetchMessages'])->name('user.chat.messages')->middleware('throttle:user-chat-presence');
        Route::post('/user-chat/{conversation}/message', [ConversationController::class, 'sendMessage'])->name('user.chat.send')->middleware('throttle:user-chat-message');
        Route::post('/user-chat/{conversation}/read', [ConversationController::class, 'markAsRead'])->name('user.chat.read')->middleware('throttle:user-chat-presence');
        Route::post('/user-chat/ping', [ConversationController::class, 'pingOnline'])->name('user.chat.ping')->middleware('throttle:user-chat-presence');
        Route::post('/user-chat/offline', [ConversationController::class, 'goOffline'])->name('user.chat.offline')->middleware('throttle:user-chat-presence');
    });
});

// Subscription (public)
Route::get('/subscription/check', [SubscriptionController::class, 'check'])->name('subscription.check')->middleware('throttle:5,1');
Route::post('/subscription/subscribe', [SubscriptionController::class, 'subscribe'])->name('subscription.subscribe')->middleware('throttle:subscription');
Route::post('/subscription/unsubscribe', [SubscriptionController::class, 'unsubscribe'])->name('subscription.unsubscribe')->middleware('throttle:subscription');

// Subscription confirmation links — clicked from the emailed confirm link,
// never called by frontend JS, so only the signed signature (not a request
// middleware) proves the click came from that confirmation email.
Route::get('/subscription/confirm-subscribe', [SubscriptionController::class, 'confirmSubscribe'])
    ->name('subscription.confirm-subscribe')
    ->middleware('signed');
Route::get('/subscription/confirm-unsubscribe', [SubscriptionController::class, 'confirmUnsubscribe'])
    ->name('subscription.confirm-unsubscribe')
    ->middleware('signed');

Route::get('/chat/attachments/{message}/download', [ConversationController::class, 'downloadAttachment'])
    ->name('chat.attachment.download')
    ->middleware('auth:web,admin');

Route::get('/tasks/attachments/{taskAttachment}/download', [CheckoutController::class, 'downloadTaskAttachment'])
    ->name('task.attachment.download')
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

// Offer edit — admin only. The route name isn't under the `admin.` prefix, so
// the permission middleware can't auto-derive a section key for it; the
// "customer-conversations" permission check happens explicitly inside
// OfferController::update() instead. `admin.session` still applies here so a
// demoted/revoked admin is force-logged-out immediately, same as every CMS route.
Route::put('/offer/{token}', [OfferController::class, 'update'])
    ->name('offer.update')
    ->middleware(['auth:admin', 'admin.session']);

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
Route::middleware(['auth:admin', 'admin.session', 'admin.permission'])->prefix('admin')->name('admin.')->group(function () {

    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::resource('portfolios', AdminPortfolioController::class)->except(['show']);
    Route::resource('categories', AdminCategoryController::class)->except(['show']);
    Route::post('categories/{category}/gallery', [AdminCategoryController::class, 'galleryStore'])->name('categories.gallery.store');
    Route::delete('categories/{category}/gallery/{item}', [AdminCategoryController::class, 'galleryDestroy'])->name('categories.gallery.destroy');
    Route::post('categories/{category}/floating-card-images', [AdminCategoryController::class, 'floatingCardImagesStore'])->name('categories.floating-card-images.store');
    Route::delete('categories/{category}/floating-card-images', [AdminCategoryController::class, 'floatingCardImagesDestroy'])->name('categories.floating-card-images.destroy');
    Route::resource('sub-categories', PortfolioSubCategoryController::class)->except(['show']);
    Route::post('sub-categories/{sub_category}/gallery', [PortfolioSubCategoryController::class, 'galleryStore'])->name('sub-categories.gallery.store');
    Route::delete('sub-categories/{sub_category}/gallery/{portfolio}', [PortfolioSubCategoryController::class, 'galleryDestroy'])->name('sub-categories.gallery.destroy');
    Route::resource('blogs', AdminBlogController::class)->except(['show']);
    Route::resource('faqs', AdminFaqController::class);
    Route::resource('job-listings', AdminJobListingController::class);
    Route::resource('job-applications', AdminJobApplicationController::class)->only(['index', 'destroy']);
    Route::get('job-applications/{job_application}/resume', [AdminJobApplicationController::class, 'downloadResume'])->name('job-applications.resume');
    Route::resource('brands', BrandController::class)->except(['show', 'create', 'edit']);
    Route::resource('chats', ChatSessionController::class)->only(['index', 'show', 'destroy']);
    Route::resource('contacts', AdminContactController::class)->only(['index', 'destroy']);
    Route::resource('users', UserController::class)->except(['show']);
    Route::get('clients', [ClientController::class, 'index'])->name('clients.index');
    Route::get('clients/{user}', [ClientController::class, 'show'])->name('clients.show')->withTrashed();
    Route::delete('clients/{user}', [ClientController::class, 'destroy'])->name('clients.destroy')->withTrashed();
    Route::get('tasks/user-search', [TaskController::class, 'userSearch'])->name('tasks.user-search');
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
    Route::get('/api/customer-conversations/{conversation}/current-orders', [CustomerConversationController::class, 'currentOrders'])->name('customer-conversations.current-orders');
    Route::get('/api/customer-conversations/{conversation}/pending-payments', [PendingPaymentController::class, 'index'])->name('customer-conversations.pending-payments.index');
    Route::delete('/api/customer-conversations/{conversation}/pending-payments/{pendingPayment}', [PendingPaymentController::class, 'destroy'])->name('customer-conversations.pending-payments.destroy');
    Route::delete('/api/customer-conversations/{conversation}', [CustomerConversationController::class, 'destroy'])->name('customer-conversations.destroy');

    Route::resource('testimonials', AdminTestimonialController::class)->except(['show']);

    Route::get('orders', [AdminOrderController::class, 'index'])->name('orders.index');
    Route::delete('orders/erase', [AdminOrderController::class, 'erase'])->name('orders.erase');
    Route::delete('orders/clear-all', [AdminOrderController::class, 'clearAll'])->name('orders.clear-all');
    Route::get('transactions', [AdminTransactionController::class, 'index'])->name('transactions.index');
    Route::delete('transactions/erase', [AdminTransactionController::class, 'erase'])->name('transactions.erase');
    Route::delete('transactions/clear-all', [AdminTransactionController::class, 'clearAll'])->name('transactions.clear-all');
    Route::get('transactions/{transaction}/invoice', [AdminTransactionController::class, 'downloadInvoice'])->name('transactions.invoice');

    // Client Review Control
    Route::get('/client-reviews', [AdminClientReviewController::class, 'index'])->name('client-reviews.index');
    Route::delete('/client-reviews/{clientReview}', [AdminClientReviewController::class, 'destroy'])->name('client-reviews.destroy');
    Route::post('/client-reviews/reorder', [AdminClientReviewController::class, 'reorder'])->name('client-reviews.reorder');

    // Site Configuration
    Route::get('/configuration', [AdminConfigurationController::class, 'index'])->name('configuration.index');
    Route::put('/configuration', [AdminConfigurationController::class, 'update'])->name('configuration.update');

    // Subscriptions
    Route::get('subscriptions', [AdminSubscriptionController::class, 'index'])->name('subscriptions.index');
    Route::delete('subscriptions/{subscription}', [AdminSubscriptionController::class, 'destroy'])->name('subscriptions.destroy');
    Route::get('subscriptions/offer-email', [AdminSubscriptionController::class, 'offerEmail'])->name('subscriptions.offer-email');
    Route::post('subscriptions/offer-email', [AdminSubscriptionController::class, 'sendOfferEmail'])->name('subscriptions.offer-email.send');
    Route::get('subscriptions/custom-email', [AdminSubscriptionController::class, 'customEmail'])->name('subscriptions.custom-email');
    Route::post('subscriptions/custom-email', [AdminSubscriptionController::class, 'sendCustomEmail'])->name('subscriptions.custom-email.send');
});

// SSLCommerz
Route::middleware('throttle:payment-callback')->group(function () {
    // payViaAjax reads the customer from $request->user(), unlike SSLCommerz's
    // stock example (which builds cus_* fields straight from the POST body) —
    // so, unlike the gateway callbacks below, it needs an authenticated user.
    Route::post('/pay-via-ajax', [SslCommerzPaymentController::class, 'payViaAjax'])->middleware('auth');
    Route::post('/success', [SslCommerzPaymentController::class, 'success']);
    Route::post('/fail', [SslCommerzPaymentController::class, 'fail']);
    Route::post('/cancel', [SslCommerzPaymentController::class, 'cancel']);
    Route::post('/ipn', [SslCommerzPaymentController::class, 'ipn']);
});

// CMS-managed service pages (e.g. /video-editing). Single-segment wildcard —
// Laravel matches routes in registration order across the *entire* file, not
// just within one group, so this MUST stay the very last route defined in
// this file, after the admin route block too — otherwise it silently
// shadows any literal route registered below it (this previously broke
// plain `/admin` once, since "admin" satisfies the slug pattern just as
// well as a real service slug). ServiceController::show() 404s any unknown
// or inactive slug via an explicit is_active-scoped lookup.
Route::middleware(RedirectAdminToPanel::class)
    ->get('/{slug}', [ServiceController::class, 'show'])
    ->where('slug', '[a-z0-9-]+')
    ->name('services.show');
