<?php

use App\Models\Admin;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('conversations.{id}', function ($user, $id) {
    if ($user instanceof Admin) {
        return $user->canAccess('customer-conversations');
    }

    return $user->conversations()->where('id', $id)->exists();
}, ['guards' => ['web', 'admin']]);

Broadcast::channel('admin.conversations', function ($user) {
    return $user instanceof Admin && $user->canAccess('customer-conversations');
}, ['guards' => ['admin', 'web']]);

Broadcast::channel('admin.orders', function ($user) {
    return $user instanceof Admin && $user->canAccess('orders');
}, ['guards' => ['admin', 'web']]);

Broadcast::channel('admin.transactions', function ($user) {
    return $user instanceof Admin && $user->canAccess('transactions');
}, ['guards' => ['admin', 'web']]);

Broadcast::channel('admin.tasks', function ($user) {
    return $user instanceof Admin && $user->canAccess('tasks');
}, ['guards' => ['admin', 'web']]);

Broadcast::channel('admin.meal-management', function ($user) {
    return $user instanceof Admin && $user->canAccess('meal-management');
}, ['guards' => ['admin', 'web']]);

// Lead alerts bell — one private channel per admin, only while they still
// hold a lead role (the mother admin always does).
Broadcast::channel('admin.lead-notifications.{adminId}', function ($user, $adminId) {
    return $user instanceof Admin
        && (int) $user->id === (int) $adminId
        && $user->canUseLeads();
}, ['guards' => ['admin', 'web']]);

// Live refresh for lead lists/boards — payload is only a lead id; each
// viewer refetches through their own visibility rules.
Broadcast::channel('admin.leads', function ($user) {
    return $user instanceof Admin && $user->canUseLeads();
}, ['guards' => ['admin', 'web']]);

// WhatsApp call box — one private channel per admin, only while they hold a
// lead role. Carries only a call id and status.
Broadcast::channel('admin.lead-calls.{adminId}', function ($user, $adminId) {
    return $user instanceof Admin
        && (int) $user->id === (int) $adminId
        && $user->canUseLeads();
}, ['guards' => ['admin', 'web']]);
