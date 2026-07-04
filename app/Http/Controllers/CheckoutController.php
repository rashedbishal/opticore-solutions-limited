<?php

namespace App\Http\Controllers;

use App\Models\CheckoutMetadata;
use App\Models\Offer;
use App\Models\TaskAttachment;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CheckoutController extends Controller
{
    public function index(Request $request): Response
    {
        if ($offerToken = $request->query('offer_token')) {
            $offer = Offer::where('offer_token', $offerToken)
                ->with(['subCategory', 'milestones', 'conversation'])
                ->firstOrFail();

            abort_if($offer->conversation->user_id !== $request->user()->id, 403);
            abort_if($offer->status !== 'accepted', 422);

            $milestoneId = $request->query('milestone_id') ? (int) $request->query('milestone_id') : null;

            if ($milestoneId !== null) {
                $milestone = $offer->milestones->firstWhere('id', $milestoneId);
                abort_if(! $milestone, 404);
                $totalPrice = (float) $milestone->price;
                $deliveryDays = $milestone->delivery_days;
                $plan = $milestone->name;
            } else {
                $totalPrice = $offer->payment_type === 'single'
                    ? (float) $offer->price
                    : (float) $offer->milestones->sum('price');
                $deliveryDays = $offer->payment_type === 'single'
                    ? ($offer->delivery_days ?? 0)
                    : $offer->milestones->sum('delivery_days');
                $plan = 'Custom';
            }

            $serviceName = $offer->subCategory?->name
                ?? ($offer->category_slug ? ucwords(str_replace('-', ' ', $offer->category_slug)) : 'Custom Service');

            return Inertia::render('Checkout', [
                'item' => [
                    'service' => $serviceName,
                    'plan' => $plan,
                    'price' => '$'.number_format($totalPrice, 2),
                    'delivery' => $deliveryDays.' Days',
                    'category' => $offer->category_slug ?? '',
                    'subcategory' => $offer->subCategory?->name ?? '',
                    'subcategory_id' => $offer->sub_category_id ?? 0,
                    'offer_token' => $offerToken,
                    'milestone_id' => $milestoneId,
                ],
                'sslEmbedScriptUrl' => config('sslcommerz.embedScriptUrl'),
            ]);
        }

        return Inertia::render('Checkout', [
            'item' => [
                'service' => $request->query('service', 'Service'),
                'plan' => $request->query('plan', 'Standard'),
                'price' => $request->query('price', '$10'),
                'delivery' => $request->query('delivery', '4 Days'),
                'category' => $request->query('category', ''),
                'subcategory' => $request->query('subcategory', ''),
                'subcategory_id' => (int) $request->query('subcategory_id', 0),
            ],
            'sslEmbedScriptUrl' => config('sslcommerz.embedScriptUrl'),
        ]);
    }

    public function exchangeRate(): JsonResponse
    {
        $rate = Cache::remember('exchange_rate_usd_bdt', now()->addHours(6), function () {
            try {
                $response = Http::connectTimeout(3)->timeout(5)
                    ->get('https://v6.exchangerate-api.com/v6/'.config('services.exchangerate.key').'/pair/USD/BDT');
            } catch (ConnectionException) {
                return null;
            }

            return $response->json('conversion_rate');
        });

        return response()->json(['rate' => $rate]);
    }

    /**
     * Accept file uploads before payment. Files are stored in a private
     * temporary location; an upload_token ties them to the payment once
     * the user completes checkout.
     *
     * Accepted types: images, common video formats, common document formats.
     * Total size across all files must not exceed 300 MB.
     */
    public function uploadAttachments(Request $request): JsonResponse
    {
        $request->validate([
            'files' => ['required', 'array', 'min:1', 'max:10'],
            'files.*' => [
                'file',
                'mimes:jpg,jpeg,png,gif,webp,mp4,mov,avi,mkv,webm,mpeg,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv',
            ],
        ]);

        $totalBytes = collect($request->file('files'))->sum(fn ($f) => $f->getSize());
        $maxBytes = 300 * 1024 * 1024; // 300 MB

        if ($totalBytes > $maxBytes) {
            return response()->json([
                'message' => 'Total file size must not exceed 300 MB.',
            ], 422);
        }

        $uploadToken = Str::uuid()->toString();
        $user = $request->user();
        $storedFiles = [];

        foreach ($request->file('files') as $file) {
            $path = $file->storeAs(
                "task_uploads/pending/{$uploadToken}",
                Str::uuid()->toString().'.'.$file->getClientOriginalExtension(),
                'local',
            );

            $storedFiles[] = [
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
            ];
        }

        CheckoutMetadata::create([
            'upload_token' => $uploadToken,
            'user_id' => $user->id,
            'attachment_paths' => $storedFiles,
        ]);

        return response()->json([
            'upload_token' => $uploadToken,
            'files' => array_map(fn ($f) => [
                'original_name' => $f['original_name'],
                'mime_type' => $f['mime_type'],
                'size' => $f['size'],
            ], $storedFiles),
        ]);
    }

    /**
     * Stream a task attachment to the authenticated user or admin.
     * Clients may only download attachments belonging to their own tasks;
     * admins need the `tasks` permission (route isn't under the `admin.`
     * prefix, so EnsureAdminHasPermission can't derive the key automatically).
     */
    public function downloadTaskAttachment(TaskAttachment $taskAttachment): StreamedResponse
    {
        $task = $taskAttachment->task;

        $adminGuard = auth()->guard('admin');
        $webGuard = auth()->guard('web');

        if ($adminGuard->check()) {
            abort_unless($adminGuard->user()->canAccess('tasks'), 403);
        } else {
            abort_if(! $webGuard->check() || $webGuard->id() !== $task->user_id, 403);
        }

        abort_unless(Storage::disk('local')->exists($taskAttachment->file_path), 404);

        return Storage::disk('local')->download(
            $taskAttachment->file_path,
            $taskAttachment->original_name,
        );
    }
}
