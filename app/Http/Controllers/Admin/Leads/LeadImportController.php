<?php

namespace App\Http\Controllers\Admin\Leads;

use App\Http\Controllers\Controller;
use App\Leads\Enums\LeadImportRowStatus;
use App\Leads\Enums\LeadImportStatus;
use App\Leads\Jobs\ProcessLeadImport;
use App\Leads\Models\LeadImport;
use App\Leads\Models\LeadImportRow;
use App\Leads\Support\LeadImportFile;
use App\Models\Admin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

/**
 * Leads → Import (managers and the mother admin): upload a CSV or Excel file
 * of leads; it is imported in the background with a per-row report.
 */
class LeadImportController extends Controller
{
    public const int MAX_ROWS = 10000;

    public const int MAX_KB = 10240;

    public function index(): Response
    {
        $this->manager();

        return Inertia::render('Admin/Leads/Imports', [
            'imports' => LeadImport::query()->latest()->limit(30)->get()->toBase()->map(fn (LeadImport $i): array => $this->summary($i)),
            'columns' => LeadImportFile::COLUMNS,
            'maxRows' => self::MAX_ROWS,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $admin = $this->manager();

        $request->validate([
            'file' => ['required', 'file', 'max:'.self::MAX_KB, 'mimes:csv,txt,xlsx'],
        ], [
            'file.mimes' => 'Please upload a .csv or .xlsx file.',
            'file.max' => 'The file is bigger than 10 MB.',
        ]);

        $upload = $request->file('file');
        abort_if($upload === null || is_array($upload), 422);

        $extension = strtolower($upload->getClientOriginalExtension());
        $type = $extension === 'xlsx' ? 'xlsx' : 'csv';
        $path = $upload->storeAs('leads/imports', Str::ulid().'.'.$type, 'local');

        if ($path === false) {
            throw ValidationException::withMessages(['file' => 'The file could not be saved. Please try again.']);
        }

        $total = 0;

        try {
            $total = $this->check(new LeadImportFile(Storage::disk('local')->path($path), $type));
        } catch (ValidationException $e) {
            Storage::disk('local')->delete($path);

            throw $e;
        } catch (Throwable $e) {
            Storage::disk('local')->delete($path);
            report($e);

            throw ValidationException::withMessages(['file' => 'This file could not be read. Is it a real CSV or Excel file?']);
        }

        $import = LeadImport::create([
            'file_name' => mb_substr($upload->getClientOriginalName(), 0, 255),
            'file_path' => $path,
            'file_type' => $type,
            'status' => LeadImportStatus::Pending,
            'total_rows' => $total,
            'imported_by' => $admin->id,
            'imported_by_name' => $admin->name,
        ]);

        ProcessLeadImport::dispatch($import->id);

        return redirect()->route('admin.leads.imports.show', $import)->with('success', "Importing {$total} rows in the background.");
    }

    public function show(Request $request, LeadImport $import): Response
    {
        $this->manager();

        $filter = in_array($request->query('show'), ['failed', 'duplicate', 'imported'], true) ? (string) $request->query('show') : 'problems';
        $rows = LeadImportRow::query()
            ->where('lead_import_id', $import->id)
            ->when($filter === 'problems', fn ($q) => $q->where('status', '!=', LeadImportRowStatus::Imported))
            ->when($filter !== 'problems', fn ($q) => $q->where('status', $filter))
            ->orderBy('row_number')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('Admin/Leads/ImportReport', [
            'import' => $this->summary($import),
            'filter' => $filter,
            'rows' => [
                'data' => collect($rows->items())->map(fn (LeadImportRow $r): array => [
                    'row_number' => $r->getAttribute('row_number'),
                    'status' => $r->status->value,
                    'name' => $r->data['name'] ?? null,
                    'email' => $r->data['email'] ?? null,
                    'phone' => $r->data['phone'] ?? null,
                    'errors' => $r->errors ?? [],
                    'lead_id' => $r->getAttribute('lead_id'),
                ])->all(),
                'links' => $rows->linkCollection(),
            ],
        ]);
    }

    public function sample(): StreamedResponse
    {
        $this->manager();

        return response()->streamDownload(function (): void {
            $out = fopen('php://output', 'w');

            if ($out === false) {
                return;
            }

            fputcsv($out, LeadImportFile::COLUMNS, escape: '');
            fputcsv($out, ['Rahim Uddin', 'rahim@example.com', '+8801711000000', 'Acme Ltd', 'Retail', 'Dhaka', 'Website', '50000', 'BDT', '', '', 'New', 'high', '', 'VIP'], escape: '');
            fclose($out);
        }, 'lead-import-sample.csv', ['Content-Type' => 'text/csv']);
    }

    /** Checks the columns and row count; returns the number of rows. */
    private function check(LeadImportFile $file): int
    {
        $headers = $file->headers();
        $unknown = array_values(array_diff(array_filter($headers), LeadImportFile::COLUMNS));

        if (! in_array('name', $headers, true)) {
            throw ValidationException::withMessages(['file' => 'The first row must have the column names, including a "name" column. Download the sample file to see the format.']);
        }

        if ($unknown !== []) {
            throw ValidationException::withMessages(['file' => 'Unknown column(s): '.implode(', ', $unknown).'. Allowed: '.implode(', ', LeadImportFile::COLUMNS).'.']);
        }

        if (count($headers) !== count(array_unique(array_filter($headers)))) {
            throw ValidationException::withMessages(['file' => 'A column name appears twice.']);
        }

        $total = $file->countRows();

        if ($total === 0) {
            throw ValidationException::withMessages(['file' => 'The file has no rows under the column names.']);
        }

        if ($total > self::MAX_ROWS) {
            throw ValidationException::withMessages(['file' => 'The file has '.number_format($total).' rows; the most is '.number_format(self::MAX_ROWS).'. Please split it.']);
        }

        return $total;
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(LeadImport $import): array
    {
        return [
            'id' => $import->id,
            'file_name' => $import->getAttribute('file_name'),
            'status' => $import->status->value,
            'status_label' => $import->status->label(),
            'finished' => $import->status->isFinished(),
            'total_rows' => $import->total_rows,
            'processed_rows' => $import->processed_rows,
            'imported_count' => $import->imported_count,
            'duplicate_count' => $import->duplicate_count,
            'failed_count' => $import->failed_count,
            'imported_by_name' => $import->getAttribute('imported_by_name'),
            'error' => $import->getAttribute('error'),
            'created_at' => $import->created_at?->toIso8601String(),
        ];
    }

    private function manager(): Admin
    {
        /** @var Admin $admin */
        $admin = Auth::guard('admin')->user();
        abort_unless($admin->isLeadManager(), 403);

        return $admin;
    }
}
