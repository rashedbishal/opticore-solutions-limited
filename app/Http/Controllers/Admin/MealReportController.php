<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\MealSelection;
use App\Support\MealClock;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MealReportController extends Controller
{
    public function export(Request $request): StreamedResponse|JsonResponse
    {
        abort_unless($this->actor()->isMotherAdmin(), 403);

        $data = $request->validate([
            'month' => 'required|date_format:Y-m',
        ]);

        abort_unless(in_array($data['month'], $this->allowedMonths(), true), 422, 'That month is not available for export.');

        $period = CarbonImmutable::createFromFormat('Y-m', $data['month'], MealClock::TIMEZONE)->startOfMonth();

        // toBase() drops down to a plain query builder (rows come back as
        // stdClass, not MealSelection models) since `total` is an aggregate
        // alias with no corresponding column on the table.
        $rows = MealSelection::query()
            ->where('status', 'accepted')
            ->whereBetween('date', [$period->startOfMonth()->toDateString(), $period->endOfMonth()->toDateString()])
            ->selectRaw('admin_id, count(*) as total')
            ->groupBy('admin_id')
            ->toBase()
            ->get();

        if ($rows->isEmpty()) {
            return response()->json([
                'message' => 'No lunch data is available for '.$period->format('F Y').'.',
            ], 422);
        }

        $names = Admin::query()->whereIn('id', $rows->pluck('admin_id'))->pluck('name', 'id');

        $reportRows = $rows->map(fn ($row) => [
            'name' => (string) $names->get($row->admin_id, 'Unknown'),
            'total' => (int) $row->total,
        ])->sortBy('name')->values();

        $spreadsheet = $this->buildSpreadsheet($period->format('F Y'), $reportRows);

        $filename = 'Lunch-Report-'.$period->format('Y-m').'.xlsx';

        return response()->streamDownload(function () use ($spreadsheet) {
            (new Xlsx($spreadsheet))->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * @param  Collection<int, array{name: string, total: int}>  $rows
     */
    private function buildSpreadsheet(string $monthLabel, $rows): Spreadsheet
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Lunch Report');

        $sheet->mergeCells('A1:B1');
        $sheet->setCellValue('A1', config('app.name'));
        $sheet->mergeCells('A2:B2');
        $sheet->setCellValue('A2', 'Lunch Report — '.$monthLabel);

        foreach (['A1', 'A2'] as $cell) {
            $sheet->getStyle($cell)->getFont()->setBold(true)->setSize($cell === 'A1' ? 14 : 12);
            $sheet->getStyle($cell)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        $sheet->setCellValue('A4', 'Employee Name');
        $sheet->setCellValue('B4', 'Total Lunch Count');
        $sheet->getStyle('A4:B4')->getFont()->setBold(true);
        $sheet->getStyle('A4:B4')->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('DDDDDD');

        $row = 5;
        foreach ($rows as $entry) {
            $sheet->setCellValue("A{$row}", $entry['name']);
            $sheet->setCellValue("B{$row}", $entry['total']);
            $row++;
        }

        $sheet->getColumnDimension('A')->setWidth(32);
        $sheet->getColumnDimension('B')->setWidth(20);

        return $spreadsheet;
    }

    /**
     * The current month plus the previous two, as "Y-m" strings — the only
     * months selectable in the export dropdown, enforced server-side too.
     *
     * @return array<int, string>
     */
    private function allowedMonths(): array
    {
        $startOfMonth = MealClock::now()->startOfMonth();

        return [
            $startOfMonth->format('Y-m'),
            $startOfMonth->subMonth()->format('Y-m'),
            $startOfMonth->subMonths(2)->format('Y-m'),
        ];
    }

    private function actor(): Admin
    {
        /** @var Admin */
        return Auth::guard('admin')->user();
    }
}
