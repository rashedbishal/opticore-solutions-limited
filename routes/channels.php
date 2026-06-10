<?php

use App\Models\Admin;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('conversations.{id}', function ($user, $id) {
    if ($user instanceof Admin) {
        return true;
    }

    return $user->conversations()->where('id', $id)->exists();
}, ['guards' => ['web', 'admin']]);

Broadcast::channel('admin.conversations', function ($user) {
    return $user instanceof Admin;
}, ['guards' => ['admin', 'web']]);

Broadcast::channel('admin.orders', function ($user) {
    return $user instanceof Admin;
}, ['guards' => ['admin', 'web']]);

Broadcast::channel('admin.transactions', function ($user) {
    return $user instanceof Admin;
}, ['guards' => ['admin', 'web']]);

Broadcast::channel('admin.tasks', function ($user) {
    return $user instanceof Admin;
}, ['guards' => ['admin', 'web']]);
