<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // (sender_type, delivered_at) — used by the admin-ping full-table scan
        // that marks all undelivered user messages as delivered when an admin
        // comes online: WHERE sender_type = 'user' AND delivered_at IS NULL.
        //
        // (conversation_id, sender_type, read_at) — used by getConversations'
        // withCount unread query: WHERE conversation_id = ? AND sender_type =
        // 'user' AND read_at IS NULL.  conversation_id is the leading column
        // so it also accelerates per-conversation delivery/read marking.
        Schema::table('messages', function (Blueprint $table) {
            $table->index(['sender_type', 'delivered_at'], 'messages_sender_type_delivered_at_index');
            $table->index(['conversation_id', 'sender_type', 'read_at'], 'messages_conversation_sender_read_index');
        });

        // transactions.email — ProfileController filters by the user's email
        // on every profile page load; without an index this is a full scan.
        Schema::table('transactions', function (Blueprint $table) {
            $table->index('email', 'transactions_email_index');
        });

        // orders.transaction_id — joined to transactions.transaction_id in the
        // admin OrderController; the transactions side is already unique-indexed
        // but the orders side was unindexed, causing a full scan of orders.
        Schema::table('orders', function (Blueprint $table) {
            $table->index('transaction_id', 'orders_transaction_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('messages_sender_type_delivered_at_index');
            $table->dropIndex('messages_conversation_sender_read_index');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('transactions_email_index');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_transaction_id_index');
        });
    }
};
