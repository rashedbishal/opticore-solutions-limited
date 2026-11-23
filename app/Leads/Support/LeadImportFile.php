<?php

namespace App\Leads\Support;

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\IReadFilter;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;
use RuntimeException;

/**
 * Reads a lead import file (CSV or Excel .xlsx) a batch at a time, so a big
 * file never has to fit in memory or one queue job.
 *
 * Column names are matched loosely: "Service Interest" = service_interest.
 */
class LeadImportFile
{
    /** @var array<int, string> */
    public const array COLUMNS = [
        'name', 'email', 'phone', 'company', 'industry', 'location', 'service_interest',
        'budget', 'budget_currency', 'deal_value', 'deal_value_currency',
        'status', 'priority', 'assignee_email', 'tags',
    ];

    public function __construct(private readonly string $path, private readonly string $type) {}

    public static function normalizeHeader(string $header): string
    {
        $header = preg_replace('/^\xEF\xBB\xBF/', '', $header) ?? $header;

        return trim((string) preg_replace('/[^a-z0-9]+/', '_', mb_strtolower(trim($header))), '_');
    }

    /**
     * @return array<int, string> normalized header names, in column order
     */
    public function headers(): array
    {
        if ($this->type === 'csv') {
            $handle = $this->open();
            $row = fgetcsv($handle, escape: '');
            fclose($handle);

            return array_map(fn ($h): string => self::normalizeHeader((string) $h), $row === false ? [] : $row);
        }

        [$rows] = $this->xlsxRows(1, 1);

        return array_map(fn ($h): string => self::normalizeHeader((string) $h), $rows[1] ?? []);
    }

    /** Data rows (not counting the header), ignoring fully blank lines. */
    public function countRows(): int
    {
        if ($this->type === 'csv') {
            $handle = $this->open();
            fgetcsv($handle, escape: '');
            $count = 0;

            while (($row = fgetcsv($handle, escape: '')) !== false) {
                if (! $this->isBlank($row)) {
                    $count++;
                }
            }

            fclose($handle);

            return $count;
        }

        $reader = new Xlsx;
        $info = $reader->listWorksheetInfo($this->path);

        return max(0, (int) ($info[0]['totalRows'] ?? 0) - 1);
    }

    /**
     * Up to $limit data rows starting at $cursor (0 = the start). For CSV
     * the cursor is a byte offset and $row the file line reached; for Excel
     * the cursor is the next sheet row.
     *
     * @param  array<int, string>  $headers
     * @return array{rows: array<int, array<string, string|null>>, cursor: int, row: int, done: bool}
     */
    public function batch(array $headers, int $cursor, int $row, int $limit): array
    {
        return $this->type === 'csv' ? $this->csvBatch($headers, $cursor, $row, $limit) : $this->xlsxBatch($headers, $cursor, $limit);
    }

    /**
     * @param  array<int, string>  $headers
     * @return array{rows: array<int, array<string, string|null>>, cursor: int, row: int, done: bool}
     */
    private function csvBatch(array $headers, int $cursor, int $rowNumber, int $limit): array
    {
        $handle = $this->open();

        if ($cursor === 0) {
            fgetcsv($handle, escape: '');
            $rowNumber = 1;
        } else {
            fseek($handle, $cursor);
        }

        $rows = [];

        while (count($rows) < $limit && ($cells = fgetcsv($handle, escape: '')) !== false) {
            $rowNumber++;

            if (! $this->isBlank($cells)) {
                $rows[$rowNumber] = $this->combine($headers, $cells);
            }
        }

        $next = (int) ftell($handle);
        $done = fgetcsv($handle, escape: '') === false;
        fclose($handle);

        return ['rows' => $rows, 'cursor' => $next, 'row' => $rowNumber, 'done' => $done];
    }

    /**
     * @param  array<int, string>  $headers
     * @return array{rows: array<int, array<string, string|null>>, cursor: int, row: int, done: bool}
     */
    private function xlsxBatch(array $headers, int $cursor, int $limit): array
    {
        $first = $cursor === 0 ? 2 : $cursor;
        $last = $first + $limit - 1;
        [$raw, $highest] = $this->xlsxRows($first, $last);
        $rows = [];

        foreach ($raw as $rowNumber => $cells) {
            if (! $this->isBlank($cells)) {
                $rows[$rowNumber] = $this->combine($headers, $cells);
            }
        }

        return ['rows' => $rows, 'cursor' => $last + 1, 'row' => $last, 'done' => $last >= $highest];
    }

    /**
     * @return array{0: array<int, array<int, mixed>>, 1: int}
     */
    private function xlsxRows(int $first, int $last): array
    {
        $reader = IOFactory::createReader('Xlsx');
        $reader->setReadDataOnly(true);
        $reader->setReadEmptyCells(false);
        $reader->setReadFilter(new class($first, $last) implements IReadFilter
        {
            public function __construct(private readonly int $first, private readonly int $last) {}

            public function readCell(string $columnAddress, int $row, string $worksheetName = ''): bool
            {
                return $row >= $this->first && $row <= $this->last;
            }
        });

        $sheet = $reader->load($this->path)->getSheet(0);
        $info = (new Xlsx)->listWorksheetInfo($this->path);
        $highest = (int) ($info[0]['totalRows'] ?? 0);
        $rows = [];

        foreach ($sheet->getRowIterator($first, min($last, max($first, $highest))) as $row) {
            $cells = [];

            foreach ($row->getCellIterator() as $cell) {
                $cells[] = $cell->getFormattedValue();
            }

            $rows[$row->getRowIndex()] = $cells;
        }

        return [$rows, $highest];
    }

    /**
     * @param  array<int, string>  $headers
     * @param  array<int, mixed>  $cells
     * @return array<string, string|null>
     */
    private function combine(array $headers, array $cells): array
    {
        $row = [];

        foreach ($headers as $index => $header) {
            if ($header === '') {
                continue;
            }

            $value = trim((string) ($cells[$index] ?? ''));
            $row[$header] = $value === '' ? null : $value;
        }

        return $row;
    }

    /**
     * @param  array<int, mixed>  $cells
     */
    private function isBlank(array $cells): bool
    {
        foreach ($cells as $cell) {
            if (trim((string) $cell) !== '') {
                return false;
            }
        }

        return true;
    }

    /**
     * @return resource
     */
    private function open()
    {
        $handle = fopen($this->path, 'r');

        if ($handle === false) {
            throw new RuntimeException('The import file could not be opened.');
        }

        return $handle;
    }
}
