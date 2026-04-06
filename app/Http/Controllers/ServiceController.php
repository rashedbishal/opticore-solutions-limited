<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function graphicDesign(): Response
    {
        return Inertia::render('Services/GraphicDesign', [
            'meta' => [
                'title' => 'Graphic Design — Opticore Solutions Ltd.',
                'description' => 'Logo design, brand identity, packaging, print, and campaign visuals with premium finish.',
            ],
        ]);
    }

    public function digitalMarketing(): Response
    {
        return Inertia::render('Services/DigitalMarketing', [
            'meta' => [
                'title' => 'Digital Marketing — Opticore Solutions Ltd.',
                'description' => 'Growth-focused SEO, paid media, social media management, content strategy, and lifecycle marketing.',
            ],
        ]);
    }

    public function videoEditing(): Response
    {
        return Inertia::render('Services/VideoEditing', [
            'meta' => [
                'title' => 'Video Editing — Opticore Solutions Ltd.',
                'description' => 'Premium reels, shorts, YouTube edits, corporate videos, motion graphics, and color grading.',
            ],
        ]);
    }

    public function threeDProduction(): Response
    {
        return Inertia::render('Services/ThreeDProduction', [
            'meta' => [
                'title' => '3D Production — Opticore Solutions Ltd.',
                'description' => '3D modeling, animation, product rendering, and architectural visualization with premium realism.',
            ],
        ]);
    }

    public function webDevelopment(): Response
    {
        return Inertia::render('Services/WebDevelopment', [
            'meta' => [
                'title' => 'Web Development — Opticore Solutions Ltd.',
                'description' => 'Custom websites, web apps, e-commerce builds, CMS solutions, and landing pages engineered to convert.',
            ],
        ]);
    }
}
