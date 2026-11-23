<?php

use App\Leads\Enums\LeadImportStatus;
use App\Leads\Enums\LeadSourceType;
use App\Leads\Models\Lead;
use App\Leads\Models\LeadImport;
use App\Leads\Models\LeadTag;
use App\Models\Admin;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

beforeEach(fn () => Storage::fake('local'));

function csvUpload(string $contents): UploadedFile
{
    return UploadedFile::fake()->createWithContent('leads.csv', $contents);
}

it('imports a CSV, skipping duplicates and reporting bad rows', function () {
    $manager = Admin::factory()->leadManager()->create();
    $agent = Admin::factory()->leadAgent()->create(['email' => 'agent@opticore.test']);
    LeadTag::create(['name' => 'VIP', 'slug' => 'vip', 'color' => 'amber']);
    $existing = Lead::factory()->create(['email' => 'old@example.com']);

    $csv = "Name,Email,Phone,Priority,Assignee Email,Tags,Budget,Budget Currency\n"
        ."Rahim Uddin,rahim@example.com,01711000000,high,agent@opticore.test,VIP,5000,BDT\n"
        ."Karim,old@example.com,,,,,,\n"
        ."Rahim Again,,01711000000,,,,,\n"
        ."Bad Priority,b@example.com,,someday,,,,\n"
        .",nobody@example.com,,,,,,\n";

    $this->actingAs($manager, 'admin')->post(route('admin.leads.imports.store'), ['file' => csvUpload($csv)])->assertSessionHasNoErrors();

    $import = LeadImport::sole();

    expect($import->status)->toBe(LeadImportStatus::CompletedWithErrors)
        ->and($import->total_rows)->toBe(5)
        ->and($import->imported_count)->toBe(1)
        ->and($import->duplicate_count)->toBe(2)
        ->and($import->failed_count)->toBe(2);

    $lead = Lead::query()->where('email', 'rahim@example.com')->sole();

    expect($lead->source->type)->toBe(LeadSourceType::CsvImport)
        ->and($lead->assigned_to)->toBe($agent->id)
        ->and($lead->priority->value)->toBe('high')
        ->and($lead->tags()->pluck('name')->all())->toBe(['VIP'])
        ->and($import->rows()->where('row_number', 3)->value('duplicate_of'))->toBe($existing->identifier);

    Storage::disk('local')->assertMissing($import->file_path);
});

it('reads Excel files too', function () {
    $sheet = new Spreadsheet;
    $sheet->getActiveSheet()->fromArray([['name', 'email'], ['Excel Person', 'xl@example.com']]);
    $path = tempnam(sys_get_temp_dir(), 'xlsx');
    (new Xlsx($sheet))->save($path);

    $this->actingAs(Admin::factory()->leadManager()->create(), 'admin')
        ->post(route('admin.leads.imports.store'), ['file' => new UploadedFile($path, 'leads.xlsx', null, null, true)])
        ->assertSessionHasNoErrors();

    expect(Lead::query()->where('email', 'xl@example.com')->exists())->toBeTrue();
});

it('rejects unknown columns and non-managers', function () {
    $this->actingAs(Admin::factory()->leadManager()->create(), 'admin')
        ->post(route('admin.leads.imports.store'), ['file' => csvUpload("name,shoe_size\nA,42\n")])
        ->assertSessionHasErrors('file');

    expect(LeadImport::count())->toBe(0);

    $this->flushSession();
    $this->actingAs(Admin::factory()->leadAgent()->create(), 'admin')
        ->get(route('admin.leads.imports.index'))
        ->assertForbidden();
});
