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
Route::get('/portfolio/{type}', [PortfolioController::class, 'show'])
    ->where('type', 'logo-identity|packaging-design|social-media-graphics|print-design|photoshop-editing')
    ->name('portfolioShow');

Route::post('/api/contact', [ContactController::class, 'store'])->name('contactStore');
Route::post('/api/appointment', [AppointmentController::class, 'store'])->name('appointmentStore');
Route::post('/api/career/apply', [CareerController::class, 'apply'])->name('careerApply');
Route::post('/chat', [ChatController::class, 'handleChat'])->name('chat');
