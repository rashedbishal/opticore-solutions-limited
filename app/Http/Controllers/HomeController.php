<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Home/Index', [
            'meta' => [
                'title' => 'Opticore Solutions Ltd. — Premium Digital Agency',
                'description' => 'We build brands that leave a lasting impression.',
            ],
        ]);
    }
}
