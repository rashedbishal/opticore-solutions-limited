<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function aboutUs(): Response
    {
        return Inertia::render('About', [
            'meta' => [
                'title' => 'About Us — Opticore Solutions Ltd.',
                'description' => 'Learn more about Opticore Solutions Ltd., our approach, values, and multidisciplinary digital expertise.',
            ],
        ]);
    }

    public function career(): Response
    {
        return Inertia::render('Career', [
            'meta' => [
                'title' => 'Career — Opticore Solutions Ltd.',
                'description' => 'Explore remote career opportunities with Opticore Solutions Ltd.',
            ],
        ]);
    }

    public function contact(): Response
    {
        return Inertia::render('Contact', [
            'meta' => [
                'title' => 'Contact — Opticore Solutions Ltd.',
                'description' => 'Contact Opticore Solutions Ltd. to discuss your next digital project.',
            ],
        ]);
    }

    public function faq(): Response
    {
        return Inertia::render('FAQ', [
            'meta' => [
                'title' => 'FAQ — Opticore Solutions Ltd.',
                'description' => 'Find answers to common questions about services, pricing, timelines, and project workflow.',
            ],
        ]);
    }

    public function messageFromMd(): Response
    {
        return Inertia::render('MessageFromMd', [
            'meta' => [
                'title' => 'Message from MD — Opticore Solutions Ltd.',
                'description' => 'A message from the Managing Director of Opticore Solutions Ltd. about the company vision, standards, and client commitment.',
            ],
        ]);
    }

    public function requestAppointment(): Response
    {
        return Inertia::render('RequestAppointment', [
            'meta' => [
                'title' => 'Request Appointment — Opticore Solutions Ltd.',
                'description' => 'Book a project consultation with Opticore Solutions Ltd.',
            ],
        ]);
    }

    public function privacyPolicy(): Response
    {
        return Inertia::render('PrivacyPolicy', [
            'meta' => [
                'title' => 'Privacy Policy — Opticore Solutions Ltd.',
                'description' => 'Review the privacy policy for Opticore Solutions Ltd.',
            ],
        ]);
    }

    public function termsConditions(): Response
    {
        return Inertia::render('TermsConditions', [
            'meta' => [
                'title' => 'Terms & Conditions — Opticore Solutions Ltd.',
                'description' => 'Review the terms and conditions for Opticore Solutions Ltd.',
            ],
        ]);
    }
}
