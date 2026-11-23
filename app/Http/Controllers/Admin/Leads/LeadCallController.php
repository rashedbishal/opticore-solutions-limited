<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Calling\CallPermissions;
use App\Leads\Calling\LeadCallActionResult;
use App\Leads\Calling\LeadCallActions;
use App\Leads\Calling\ListActiveLeadCalls;
use App\Leads\Calling\OutboundCalls;
use App\Leads\Calling\SoftphonePresence;
use App\Leads\Events\LeadUpdated;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadSource;
use App\Models\Admin;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * The call box's JSON endpoints. "active" doubles as the check-in that marks
 * the admin as available for calls.
 */
class LeadCallController extends Controller
{
    public function active(ListActiveLeadCalls $list, SoftphonePresence $presence): JsonResponse
    {
        $admin = $this->admin();
        $presence->touch($admin);

        return response()->json(['data' => [
            'calls' => $list->handle($admin),
            'heartbeat_seconds' => (int) config('calling.softphone_heartbeat_seconds'),
            'poll_seconds' => (int) config('calling.softphone_poll_seconds'),
            'staleness_seconds' => (int) config('calling.softphone_staleness_seconds'),
        ]])->header('Cache-Control', 'no-store, private');
    }

    public function claim(string $call, LeadCallActions $actions): JsonResponse
    {
        return $this->respond(fn (Admin $admin) => $actions->claim($admin, $call));
    }

    public function answer(Request $request, string $call, LeadCallActions $actions): JsonResponse
    {
        return $this->respond(fn (Admin $admin) => $actions->answer($admin, $call, $request->input('sdp_type'), $request->input('sdp')));
    }

    public function accept(string $call, LeadCallActions $actions): JsonResponse
    {
        return $this->respond(fn (Admin $admin) => $actions->accept($admin, $call));
    }

    public function reject(string $call, LeadCallActions $actions): JsonResponse
    {
        return $this->respond(fn (Admin $admin) => $actions->reject($admin, $call));
    }

    public function hangup(string $call, LeadCallActions $actions): JsonResponse
    {
        return $this->respond(fn (Admin $admin) => $actions->hangup($admin, $call));
    }

    public function call(Request $request, Lead $lead, OutboundCalls $outbound): JsonResponse
    {
        return $this->respond(fn (Admin $admin) => $outbound->initiate($admin, $lead, $request->input('sdp')));
    }

    public function outboundAnswer(string $call, OutboundCalls $outbound): JsonResponse
    {
        return $this->respond(fn (Admin $admin) => $outbound->answer($admin, $call));
    }

    public function outboundConnected(string $call, OutboundCalls $outbound): JsonResponse
    {
        return $this->respond(fn (Admin $admin) => $outbound->confirmConnected($admin, $call));
    }

    public function cancel(string $call, OutboundCalls $outbound): JsonResponse
    {
        return $this->respond(fn (Admin $admin) => $outbound->cancel($admin, $call));
    }

    /** Check the lead's call permission with Meta now. */
    public function checkPermission(Lead $lead, CallPermissions $permissions): RedirectResponse
    {
        [$admin, $source] = $this->callable($lead, $permissions);
        $result = $permissions->check($lead, $source);
        LeadUpdated::dispatch($lead->id);

        return $result->successful
            ? back()->with('success', 'Call permission checked with WhatsApp.')
            : back()->with('error', $result->userMessage() ?: 'Could not check with WhatsApp.');
    }

    /** Send the "may we call you?" message. */
    public function requestPermission(Lead $lead, CallPermissions $permissions): RedirectResponse
    {
        [$admin, $source] = $this->callable($lead, $permissions);
        $result = $permissions->request($lead, $source);
        LeadUpdated::dispatch($lead->id);

        return back()->with($result['ok'] ? 'success' : 'error', $result['message']);
    }

    /**
     * @return array{0: Admin, 1: LeadSource}
     */
    private function callable(Lead $lead, CallPermissions $permissions): array
    {
        $admin = $this->admin();
        abort_unless($permissions->canCall($admin, $lead), 403);
        $source = $permissions->sourceFor($lead);
        abort_if($source === null || ! $source->calling_enabled || $permissions->waId($lead) === null, 422, 'Calling is not available for this lead.');

        return [$admin, $source];
    }

    /**
     * @param  Closure(Admin): LeadCallActionResult  $run
     */
    private function respond(Closure $run): JsonResponse
    {
        $admin = $this->admin();
        $result = $run($admin);

        if (! $result->ok || $result->call === null) {
            return response()->json(['error' => [
                'code' => $result->errorCode,
                'message' => $result->message,
                'retryable' => $result->retryable,
            ]], $result->status)->header('Cache-Control', 'no-store, private');
        }

        $data = ['call' => [
            'id' => $result->call->id,
            'status' => $result->call->status->value,
            'claimed_by_me' => $result->call->claimed_by === (int) $admin->id,
        ]];

        if ($result->session !== null) {
            $data['session'] = $result->session;
        }

        return response()->json(['data' => $data])->header('Cache-Control', 'no-store, private');
    }

    private function admin(): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();
        abort_unless($admin->canUseLeads(), 403);

        return $admin;
    }
}
