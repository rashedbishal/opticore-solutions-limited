<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Enums\LeadAttachmentStatus;
use App\Leads\Models\LeadAttachment;
use App\Leads\Services\LeadAccess;
use App\Models\Admin;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Opens a lead's attachment from the private disk — only for someone who
 * can see that lead. Pictures, video and audio open in the browser; other
 * files download.
 */
class LeadAttachmentController extends Controller
{
    public function show(LeadAttachment $attachment, LeadAccess $access): StreamedResponse
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();

        abort_unless($access->canView($admin, $attachment->lead), 403);
        abort_unless($attachment->status === LeadAttachmentStatus::Downloaded && $attachment->path !== null, 404);
        abort_unless(Storage::disk('local')->exists($attachment->path), 404);

        $inline = (bool) preg_match('#^(image|video|audio)/#', (string) $attachment->mime);
        $name = $attachment->type.'-'.$attachment->id.'.'.pathinfo($attachment->path, PATHINFO_EXTENSION);

        return Storage::disk('local')->response($attachment->path, $name, [
            'Content-Type' => $attachment->mime ?? 'application/octet-stream',
            'X-Content-Type-Options' => 'nosniff',
        ], $inline ? 'inline' : 'attachment');
    }
}
