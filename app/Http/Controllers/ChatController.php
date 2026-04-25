<?php

namespace App\Http\Controllers;

use App\Models\ChatSession;
use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    public function handleChat(Request $request)
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'session_id' => ['nullable', 'string', 'max:255'],
        ]);

        $message = $validated['message'];
        $sessionId = $validated['session_id'] ?? (string) Str::uuid();

        $session = ChatSession::firstOrCreate(
            ['session_id' => $sessionId],
            ['title' => substr($message, 0, 50)]
        );

        $session->messages()->create([
            'sender' => 'user',
            'content' => $message,
        ]);

        $knowledgeBase = $this->getWebsiteKnowledge();
        $reply = $this->getGroundedReply($message, $knowledgeBase);

        $session->messages()->create([
            'sender' => 'ai',
            'content' => $reply,
        ]);

        return response()->json(['reply' => $reply, 'session_id' => $sessionId]);
    }

    private function getWebsiteKnowledge(): array
    {
        // Combined and structured knowledge base based on provided instructions
        return [
            'company' => [
                'name' => 'Opticore Solutions Ltd.',
                'description' => 'A modern digital agency offering creative and technical services. We focus on high-quality design, strategic marketing, modern web solutions, and client satisfaction. Our goal is to help businesses grow with creative and digital solutions.',
                'focus_areas' => ['high-quality design', 'strategic marketing', 'modern web solutions', 'client satisfaction', 'business growth'],
                'tone' => 'Professional but friendly, clear and confident, not too long, not robotic.',
            ],
            'services' => [
                'Graphic Design' => [
                    'description' => 'Brand-led visuals, campaign creative, and print-ready assets that make businesses feel established from the first glance.',
                    'includes' => ['Logo & Brand Identity', 'Social Media Design', 'Print Design', 'Packaging Design'],
                    'benefits' => ['Strong branding', 'Professional appearance', 'Better audience engagement'],
                    'handling_user_asks' => 'Focus on branding & visual impact. Suggest portfolio viewing.',
                ],
                'Digital Marketing' => [
                    'description' => 'Performance-minded campaigns that connect strategy, messaging, creative, and conversion into one system.',
                    'includes' => ['Social media marketing', 'Paid advertising', 'Strategy planning'],
                    'benefits' => ['More reach', 'More leads', 'Business growth'],
                    'handling_user_asks' => 'Focus on ROI & growth. Ask about their business type.',
                ],
                'Video Editing' => [
                    'description' => 'Crisp, kinetic edits that turn raw footage into modern brand stories built for retention.',
                    'includes' => ['Promotional videos', 'Social media videos', 'Advertisement videos'],
                    'benefits' => ['High engagement', 'Better storytelling', 'Professional presentation'],
                    'handling_user_asks' => 'Emphasize engagement & branding.',
                ],
                '3D Production' => [
                    'description' => 'Immersive renders and animation that give ideas volume, realism, and premium presentation value.',
                    'includes' => ['Product visualization', '3D animation', 'Realistic rendering'],
                    'benefits' => ['Premium presentation', 'High-end visuals', 'Better product showcase'],
                    'handling_user_asks' => 'Highlight realism & premium quality.',
                ],
                'Web Development' => [
                    'description' => 'High-performance websites and products designed to convert, scale, and stay unmistakably on-brand.',
                    'includes' => ['Business websites', 'Custom web solutions', 'Responsive design'],
                    'benefits' => ['Strong online presence', 'Better user experience', 'Increased credibility'],
                    'handling_user_asks' => 'Focus on business growth & trust.',
                ],
            ],
            'portfolio' => [
                'summary' => 'We have proven experience in logo design, packaging design, social media graphics, print design, and Photoshop editing. You can explore our work to see how we bring brands to life.',
                'call_to_action' => 'Encourage them to explore portfolio.',
            ],
            'faq' => [
                'handling' => 'Answer clearly and simply. Avoid complexity.',
                'topics' => ['Pricing', 'Timeline', 'Process', 'Services', 'Revisions', 'Payments', 'NDAs', 'Jobs'],
            ],
            'lead_conversion' => [
                'encouragement_phrases' => ['Let’s discuss your project', 'I’d be happy to guide you'],
                'user_needs_service' => [
                    'Ask 1–2 simple questions',
                    'Guide to contact',
                    'Example question: "That sounds great! Can you tell me a bit about your project?"',
                ],
            ],
            'smart_behavior' => [
                'always' => ['Keep answers short and clear', 'Ask follow-up questions', 'Guide users toward taking action'],
                'never' => ['Give long boring paragraphs', 'Be robotic', 'Say "I don\'t know"'],
                'instead_say' => ['Let me guide you'],
            ],
            'user_intent' => [
                'confused' => 'Suggest the best service',
                'exploring' => 'Educate briefly',
                'ready' => 'Push toward contact',
            ],
            'contact_info' => [
                ['label' => 'Phone', 'value' => '+88-01896204400', 'subValue' => '+1 (575) 303-6925'],
                ['label' => 'Email', 'value' => 'hello@opticoresolutions.com'],
                ['label' => 'Location', 'value' => 'Dhaka, Bangladesh'],
            ],
            'navigation' => [
                ['label' => 'Graphic Design', 'href' => '/graphic-design'],
                ['label' => 'Digital Marketing', 'href' => '/digital-marketing'],
                ['label' => 'Video Editing', 'href' => '/video-editing'],
                ['label' => '3D Production', 'href' => '/3d-production'],
                ['label' => 'Web Development', 'href' => '/web-development'],
                ['label' => 'Contact', 'href' => '/contact'],
            ],
            'testimonials' => [
                ['name' => 'Sarah Bennett', 'role' => 'Founder', 'company' => 'North Peak Studio', 'quote' => 'Opticore gave our rebrand the kind of presence that usually takes years to earn. The visuals felt premium, strategic, and immediately credible.'],
                ['name' => 'Imran Hossain', 'role' => 'Marketing Lead', 'company' => 'Velocity Commerce', 'quote' => 'Their team connected design, paid ads, and landing page execution into one coherent growth system.'],
            ],
            'final_goal' => 'Convert website visitors into potential clients through helpful, clear, and engaging conversation.',
        ];
    }

    private function getGroundedReply(string $message, array $knowledgeBase): string
    {
        $lowerMessage = strtolower($message);

        // --- Smart Behavior & Tone Rules ---
        // Tone is applied contextually through response construction.

        // --- Intent Handling ---
        // Simplified intent detection. A real system would use NLP.

        // If user is confused or needs direction
        if (Str::contains($lowerMessage, ['help', 'confused', 'lost', 'what now', 'where to start'])) {
            return 'I can help guide you. Are you interested in learning about our services, seeing our portfolio, or discussing a specific project?';
        }

        // If user is exploring
        if (Str::contains($lowerMessage, ['explore', 'learn more', 'tell me about', 'what are'])) {
            // If asking about a service, briefly educate
            foreach ($knowledgeBase['services'] as $serviceName => $serviceData) {
                if (Str::contains($lowerMessage, strtolower($serviceName))) {
                    return $serviceName.': '.$serviceData['description'].' Would you like to know more about its specific features or benefits?';
                }
            }

            // General exploration
            return 'We offer a range of services including Graphic Design, Digital Marketing, Video Editing, 3D Production, and Web Development. What sparks your interest the most?';
        }

        // If user is ready to take action or needs contact
        if (Str::contains($lowerMessage, ['ready', 'hire', 'project', 'quote', 'pricing', 'discuss', 'need a service', 'want to work with you']) || preg_match('/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/', $message)) {
            // Check if a specific service is mentioned
            $foundService = null;
            foreach ($knowledgeBase['services'] as $serviceName => $serviceData) {
                if (Str::contains($lowerMessage, strtolower($serviceName))) {
                    $foundService = $serviceName;
                    break;
                }
            }

            if ($foundService) {
                $questions = ['Can you tell me a bit about your '.$foundService.' project?'];
                if ($foundService === 'Graphic Design') {
                    $questions[] = "What's your primary goal for this project (e.g., branding, campaign)?";
                } elseif ($foundService === 'Web Development') {
                    $questions[] = 'What kind of website are you looking to build (e.g., business site, e-commerce)?';
                }

                return 'That sounds great! '.implode(' ', $questions).' This will help me guide you to the right contact.';
            } else {
                return "That's wonderful! ".$knowledgeBase['lead_conversion']['encouragement_phrases'][0].'. What are you looking to achieve?';
            }
        }

        // --- Specific Knowledge Lookup ---

        // Company Information
        if (Str::contains($lowerMessage, ['who are you', 'your company', 'your name', 'about opticore', 'opticore solutions ltd'])) {
            return $knowledgeBase['company']['description'];
        }

        if (Str::contains($lowerMessage, ['location', 'address', 'based'])) {
            return 'We are based in '.($knowledgeBase['contact_info'][2]['value'] ?? 'Dhaka, Bangladesh').'.';
        }

        // Services Overview
        if (Str::contains($lowerMessage, ['services', 'what do you do', 'offer', 'capabilities'])) {
            $serviceList = implode(', ', array_keys($knowledgeBase['services']));

            return 'We offer 5 core services: '.$serviceList.'. What are you most interested in learning about?';
        }

        // Specific Service Details
        foreach ($knowledgeBase['services'] as $serviceName => $serviceData) {
            if (Str::contains($lowerMessage, strtolower($serviceName))) {
                $response = "{$serviceName}: {$serviceData['description']}";
                if (! empty($serviceData['includes'])) {
                    $response .= ' Our focus areas include: '.implode(', ', $serviceData['includes']).'.';
                }
                if (! empty($serviceData['benefits'])) {
                    $response .= " Clients benefit from {$serviceData['benefits'][0]}, {$serviceData['benefits'][1]}, and {$serviceData['benefits'][2]}.";
                }
                if (isset($serviceData['handling_user_asks'])) {
                    $response .= " When you're ready, we can {$serviceData['handling_user_asks']}.";
                }

                return $response;
            }
        }

        // Portfolio
        if (Str::contains($lowerMessage, ['portfolio', 'work', 'examples', 'past projects'])) {
            return $knowledgeBase['portfolio']['summary'].' '.$knowledgeBase['portfolio']['call_to_action'];
        }

        // Contact Information
        if (Str::contains($lowerMessage, ['contact', 'email', 'phone', 'reach out', 'talk', 'get in touch'])) {
            $contactDetails = [];
            if (isset($knowledgeBase['contact_info'][0]['value'])) {
                $contactDetails[] = 'Phone: '.$knowledgeBase['contact_info'][0]['value'].(isset($knowledgeBase['contact_info'][0]['subValue']) ? ' (Alt: '.$knowledgeBase['contact_info'][0]['subValue'].')' : '');
            }
            if (isset($knowledgeBase['contact_info'][1]['value'])) {
                $contactDetails[] = 'Email: '.$knowledgeBase['contact_info'][1]['value'];
            }
            if (isset($knowledgeBase['contact_info'][2]['value'])) {
                $contactDetails[] = 'Location: '.$knowledgeBase['contact_info'][2]['value'];
            }

            // Tone is mentioned in instructions, but here it's a bit generic.
            // Let's try to be more friendly/professional as per instructions.
            return 'You can reach us via: '.implode(', ', $contactDetails).'. We aim to respond within 24 hours.';
        }

        // FAQ Handling - simplified for demonstration
        if (Str::contains($lowerMessage, ['pricing', 'timeline', 'process', 'how long', 'cost'])) {
            return "Regarding pricing, timeline, or process: {$knowledgeBase['faq']['handling']}";
        }

        // Testimonials
        if (Str::contains($lowerMessage, ['testimonial', 'clients say', 'feedback', 'happy client'])) {
            if (! empty($knowledgeBase['testimonials'])) {
                // Simplified static testimonial to avoid parsing issues with dynamic data.
                return 'A client shared: "Opticore gave our rebrand the kind of presence that usually takes years to earn. The visuals felt premium, strategic, and immediately credible." - Sarah Bennett, North Peak Studio';
            }
        }

        // Navigation items
        foreach ($knowledgeBase['navigation'] as $navItem) {
            if (Str::contains($lowerMessage, strtolower($navItem['label']))) {
                return "You can find more information about {$navItem['label']} on our website at {$navItem['href']}.";
            }
        }

        // Default reply if no specific intent is matched
        return $this->getAiFallbackReply($message, $knowledgeBase);
    }

    private function getAiFallbackReply(string $message, array $knowledgeBase): string
    {
        $apiKey = config('services.groq.key');

        if (empty($apiKey)) {
            Log::error('Groq API key is missing.');

            return "I'm having a little trouble connecting to my brain right now. Please try again or reach out to us directly at hello@opticoresolutions.com!";
        }

        $systemPrompt = 'You are an AI assistant for Opticore Solutions Ltd., a digital agency.

Company Info: '.$knowledgeBase['company']['description'].'
Tone: '.$knowledgeBase['company']['tone'].'

Website Knowledge:
Services: '.json_encode($knowledgeBase['services']).'
Portfolio: '.$knowledgeBase['portfolio']['summary'].'
FAQ Handling: '.$knowledgeBase['faq']['handling'].'

Instructions:
1. Use the knowledge above to answer.
2. If you don\'t know the answer, be helpful and guide them to contact us at hello@opticoresolutions.com.
3. Keep answers short, clear, and professional.
4. Don\'t mention that you are an AI model; act as the Opticore Assistant.';

        try {
            $client = new Client(['verify' => false]);

            $response = $client->post('https://api.groq.com/openai/v1/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer '.$apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => 'llama-3.3-70b-versatile',
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $message],
                    ],
                    'max_tokens' => 512,
                    'temperature' => 0.7,
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            return $data['choices'][0]['message']['content'] ?? "I'm having a little trouble connecting to my brain right now. Please try again or reach out to us directly at hello@opticoresolutions.com!";
        } catch (\Exception $e) {
            Log::error('Groq AI Error: '.$e->getMessage());

            return "I'm having a little trouble connecting to my brain right now. Please try again or reach out to us directly at hello@opticoresolutions.com!";
        }
    }
}
