<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('conversations.{id}', function ($user, $id) {
    if ($user instanceof \App\Models\Admin) {
        return true;
    }
    
    return $user->conversation && (int) $user->conversation->id === (int) $id;
}, ['guards' => ['web', 'admin']]);

Broadcast::channel('admin.conversations', function ($user) {
    return true;
}, ['guards' => ['admin']]);
