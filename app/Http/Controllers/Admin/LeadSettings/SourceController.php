<?php

namespace App\Http\Controllers\Admin\LeadSettings;

use App\Http\Controllers\Controller;
use App\Leads\Calling\ManageWhatsAppCalling;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\LeadSource;
use App\Leads\Services\Meta\SourceConnectionTester;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;

/**
 * Setting up channels on the Lead Sources page — mother admin only (the
 * `lead-settings` route key). Secrets left blank on edit keep their saved
 * value.
 */
class SourceController extends Controller
{
    /** Permissions a Meta token needs for every lead feature (same as OptiFin). */
    private const REQUIRED_SCOPES = [
        'pages_messaging',
        'instagram_manage_messages',
        'whatsapp_business_messaging',
        'leads_retrieval',
        'pages_manage_metadata',
        'pages_utility_messaging',
    ];

    public function store(Request $request): RedirectResponse
    {
        $type = LeadSourceType::tryFrom((string) $request->input('type'));

        abort_if($type === null || $type->isBuiltIn(), 422, 'Choose a valid channel type.');

        $validated = $request->validate([
            'type' => ['required', Rule::enum(LeadSourceType::class)],
            'name' => ['required', 'string', 'max:255'],
            ...$type->configValidationRules(),
        ]);

        LeadSource::create([
            'type' => $type,
            'name' => $validated['name'],
            'config' => $this->cleanConfig($type, $validated['config'] ?? []),
            'is_active' => true,
        ]);

        return back()->with('success', 'Lead source added.');
    }

    public function update(Request $request, LeadSource $source): RedirectResponse
    {
        abort_if($source->type->isBuiltIn(), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            ...$source->type->configValidationRules(isUpdate: true),
        ]);

        $config = $this->cleanConfig($source->type, $validated['config'] ?? []);

        foreach ($source->type->sensitiveConfigKeys() as $key) {
            if (($config[$key] ?? null) === null) {
                unset($config[$key]);
            }
        }

        $source->update([
            'name' => $validated['name'],
            'config' => array_merge($source->config ?? [], $config),
        ]);

        return back()->with('success', 'Lead source saved.');
    }

    public function toggle(LeadSource $source): RedirectResponse
    {
        abort_if($source->type->isBuiltIn(), 403);

        $source->update(['is_active' => ! $source->is_active]);

        return back()->with('success', $source->is_active ? 'Lead source turned on.' : 'Lead source turned off.');
    }

    /**
     * A source that brought in leads can't be deleted (its leads point at
     * it); turn it off instead.
     */
    public function destroy(LeadSource $source): RedirectResponse
    {
        abort_if($source->type->isBuiltIn(), 403);

        $deleted = DB::transaction(function () use ($source): bool {
            $locked = LeadSource::query()->lockForUpdate()->findOrFail($source->id);

            if ($locked->leads()->exists()) {
                return false;
            }

            $locked->delete();

            return true;
        });

        return $deleted
            ? back()->with('success', 'Lead source deleted.')
            : back()->with('error', 'This source has leads, so it can\'t be deleted. Turn it off instead.');
    }

    public function test(LeadSource $source, SourceConnectionTester $tester): RedirectResponse
    {
        $result = $tester->test($source);

        return back()->with($result['success'] ? 'success' : 'error', $result['message']);
    }

    /**
     * Which Meta permissions this source's key has (read-only).
     */
    public function permissions(LeadSource $source): JsonResponse
    {
        $token = $source->metaAccessToken();

        if ($token === null) {
            return response()->json(['error' => 'No access token is configured on this lead source.'], 422);
        }

        $response = Http::timeout(10)->get('https://graph.facebook.com/debug_token', ['input_token' => $token, 'access_token' => $token]);

        if (! $response->successful()) {
            return response()->json(['error' => $response->json('error.message') ?? 'Could not inspect this token.'], 502);
        }

        $scopes = $response->json('data.scopes') ?? [];

        return response()->json([
            'is_valid' => $response->json('data.is_valid'),
            'expires_at' => $response->json('data.expires_at'),
            'required_scopes' => collect(self::REQUIRED_SCOPES)->mapWithKeys(fn (string $scope): array => [
                $scope => is_array($scopes) && in_array($scope, $scopes, true),
            ]),
        ]);
    }

    /**
     * Keeps only this type's own fields, trimmed; empty values become null.
     *
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function cleanConfig(LeadSourceType $type, array $input): array
    {
        $config = [];

        foreach ($type->configFields() as $field) {
            $value = $input[$field['key']] ?? null;
            $config[$field['key']] = is_string($value) ? (trim($value) === '' ? null : trim($value)) : $value;
        }

        if ($type === LeadSourceType::Instagram) {
            $config['auth_mode'] ??= 'facebook';
        }

        return $config;
    }

    /** Mother admin: turn Meta's calling on for a WhatsApp number. */
    public function callingEnable(LeadSource $source, ManageWhatsAppCalling $calling): RedirectResponse
    {
        return $this->callingOutcome($calling->enable($source));
    }

    public function callingDisable(LeadSource $source, ManageWhatsAppCalling $calling): RedirectResponse
    {
        abort_unless($source->type === LeadSourceType::Whatsapp, 404);

        return $this->callingOutcome($calling->disable($source));
    }

    public function callingCheck(LeadSource $source, ManageWhatsAppCalling $calling): RedirectResponse
    {
        abort_unless($source->type === LeadSourceType::Whatsapp, 404);

        return $this->callingOutcome($calling->check($source));
    }

    /**
     * @param  array{level: string, message: string}  $outcome
     */
    private function callingOutcome(array $outcome): RedirectResponse
    {
        return back()->with($outcome['level'] === 'danger' ? 'error' : 'success', $outcome['message']);
    }
}
