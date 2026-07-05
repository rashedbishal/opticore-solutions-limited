<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CspReportController extends Controller
{
    /**
     * Browsers POST here whenever the CSP blocks something, using
     * application/csp-report or application/reports+json — neither of
     * which Laravel treats as form data, so the payload is read and
     * decoded manually rather than via $request->input().
     */
    public function store(Request $request)
    {
        $report = json_decode($request->getContent(), true);

        Log::warning('CSP violation', is_array($report) ? $report : []);

        return response('', 204);
    }
}
