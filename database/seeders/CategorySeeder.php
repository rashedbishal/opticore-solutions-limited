<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Process steps and "Why Opticore" reasons were previously shared
     * verbatim across all five static service pages — preserved here as
     * each category's starting point, editable independently from now on.
     */
    private const DEFAULT_PROCESS = [
        [
            'title' => 'Brief',
            'description' => 'We align on business goals, audience, deliverables, and the visual or technical direction required to move fast without guesswork.',
        ],
        [
            'title' => 'Concept',
            'description' => 'Our team translates the brief into moodboards, wireframes, story beats, or campaign ideas that sharpen the creative point of view.',
        ],
        [
            'title' => 'Execution',
            'description' => 'Design, editing, production, and development happen with constant quality control, clear milestones, and focused iteration cycles.',
        ],
        [
            'title' => 'Delivery',
            'description' => 'We hand over polished assets, launch-ready experiences, and support materials built for real-world performance across channels.',
        ],
    ];

    private const DEFAULT_REASONS = [
        [
            'title' => 'Strategy-Led Creative',
            'description' => 'Every output is anchored in positioning, audience intent, and measurable business goals instead of surface-level aesthetics alone.',
        ],
        [
            'title' => 'Fast Communication',
            'description' => 'You get clear checkpoints, tight feedback loops, and a team that knows how to keep complex creative work moving without friction.',
        ],
        [
            'title' => 'Premium Craft',
            'description' => 'From motion polish to production detail, we build work that looks refined, feels cohesive, and stands up in competitive markets.',
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'slug' => 'graphic-design',
                'label' => 'Graphic Design',
                'description' => 'Bold, polished brand visuals built to earn trust at first sight and stay memorable long after the scroll.',
                'long_description' => 'We shape visual identities that feel premium, coherent, and commercial. From startups finding their voice to established teams refreshing their look, Opticore designs systems that hold together across print, digital, packaging, and campaigns.',
                'icon' => 'PenTool',
                'color' => 'pink',
                'headings' => [
                    'capabilities' => ['eyebrow' => 'Visual Scope', 'title' => 'Defining Your Brand Edge'],
                    'whyOpticore' => ['eyebrow' => 'The Standard', 'title' => 'Why Brands Trust Our Eye'],
                    'process' => ['eyebrow' => 'The Journey', 'title' => 'From Sketch to Final Asset'],
                    'selectedWork' => ['eyebrow' => 'The Proof', 'title' => 'Identity Systems in the Wild'],
                ],
                'sub_services' => [
                    ['title' => 'Logo Design', 'description' => 'Distinctive logo systems that work from tiny social avatars to large-format applications.'],
                    ['title' => 'Brand Identity', 'description' => 'Typography, color, layouts, and usage systems that unify every touchpoint.'],
                    ['title' => 'Packaging Design', 'description' => 'Shelf-ready packaging concepts built to communicate value, quality, and differentiation.'],
                    ['title' => 'Social Media Graphics', 'description' => 'Campaign visuals and post systems tuned for clarity, consistency, and velocity.'],
                    ['title' => 'Print Design', 'description' => 'Brochures, flyers, signage, and collateral designed with strong hierarchy and finish.'],
                    ['title' => 'Photoshop Editing', 'description' => 'High-end retouching, compositing, and visual cleanup for commercial-grade presentation.'],
                ],
                'portfolio' => [
                    ['title' => 'Lumina Identity Suite', 'category' => 'Logo & Identity', 'image' => '/images/portfolio/identity.svg', 'alt' => 'Lumina logo identity presentation', 'description' => 'A sleek monogram and typography system built for a premium wellness brand.'],
                    ['title' => 'Arbor Packaging Refresh', 'category' => 'Packaging', 'image' => '/images/portfolio/packaging.svg', 'alt' => 'Arbor packaging system', 'description' => 'Natural, shelf-focused packaging with strong contrast and an elevated product story.'],
                    ['title' => 'Flux Campaign Graphics', 'category' => 'Social Media', 'image' => '/images/portfolio/social.svg', 'alt' => 'Flux social campaign graphics', 'description' => 'A high-energy social toolkit for rapid campaign deployment across multiple channels.'],
                ],
            ],
            [
                'slug' => 'digital-marketing',
                'label' => 'Digital Marketing',
                'description' => 'Performance-minded campaigns that connect strategy, messaging, creative, and conversion into one system.',
                'long_description' => 'Opticore builds digital marketing programs that feel as refined as the brand itself. We blend paid media, SEO, content, and channel operations into a plan designed for predictable growth instead of disconnected tactics.',
                'icon' => 'Globe',
                'color' => 'orange',
                'headings' => [
                    'capabilities' => ['eyebrow' => 'Growth Toolkit', 'title' => 'Systems for Global Visibility'],
                    'whyOpticore' => ['eyebrow' => 'The Advantage', 'title' => 'Why Partners Scale With Us'],
                    'process' => ['eyebrow' => 'The Roadmap', 'title' => 'Strategy to Conversion Pipeline'],
                    'selectedWork' => ['eyebrow' => 'The Results', 'title' => "Growth Engines We've Engineered"],
                ],
                'sub_services' => [
                    ['title' => 'SEO', 'description' => 'Search visibility strategies that improve rankings, organic reach, and long-term demand capture.'],
                    ['title' => 'Social Media Management', 'description' => 'Editorial planning, publishing systems, and visual consistency across active channels.'],
                    ['title' => 'Paid Ads', 'description' => 'Conversion-focused campaigns across search and social with clean creative-testing workflows.'],
                    ['title' => 'Content Marketing', 'description' => 'Story-led content that supports positioning, lead generation, and trust-building.'],
                    ['title' => 'Email Marketing', 'description' => 'Lifecycle and promotional sequences that nurture audiences without sounding generic.'],
                ],
                'portfolio' => [
                    ['title' => 'Velocity Lead Engine', 'category' => 'Paid Growth', 'image' => '/images/portfolio/marketing.svg', 'alt' => 'Velocity campaign dashboard', 'description' => 'A full-funnel paid strategy paired with landing page refinement and reporting clarity.'],
                    ['title' => 'North Peak Search Lift', 'category' => 'SEO', 'image' => '/images/portfolio/marketing.svg', 'alt' => 'Search performance visual', 'description' => 'Content architecture and SEO direction that expanded category visibility for a creative studio.'],
                    ['title' => 'Luma Retention Flow', 'category' => 'Email', 'image' => '/images/portfolio/marketing.svg', 'alt' => 'Email marketing lifecycle campaign', 'description' => 'A cleaner lifecycle sequence that improved activation and repeat customer engagement.'],
                ],
            ],
            [
                'slug' => 'video-editing',
                'label' => 'Video Editing',
                'description' => 'Crisp, kinetic edits that turn raw footage into modern brand stories built for retention.',
                'long_description' => "We edit with pace, structure, and taste. Whether it is short-form social, YouTube, branded explainers, or corporate communication, Opticore shapes footage into confident, polished narratives that respect the audience's time.",
                'icon' => 'Film',
                'color' => 'cyan',
                'headings' => [
                    'capabilities' => ['eyebrow' => 'Motion Craft', 'title' => 'Precision Cinematic Retention'],
                    'whyOpticore' => ['eyebrow' => 'The Rhythm', 'title' => 'Why Creators Trust Our Cut'],
                    'process' => ['eyebrow' => 'The Sequence', 'title' => 'From Raw Dailies to Master Export'],
                    'selectedWork' => ['eyebrow' => 'The Reel', 'title' => 'Visual Stories That Stick'],
                ],
                'sub_services' => [
                    ['title' => 'Reels & Shorts', 'description' => 'Attention-first edits with pacing, captions, hooks, and punch built for social performance.'],
                    ['title' => 'YouTube Videos', 'description' => 'Long-form editing that improves clarity, rhythm, and viewer retention.'],
                    ['title' => 'Corporate Videos', 'description' => 'Professional edits for internal communications, launches, and brand storytelling.'],
                    ['title' => 'Motion Graphics', 'description' => 'Dynamic titles, transitions, and animated scenes that elevate the final cut.'],
                    ['title' => 'Color Grading', 'description' => 'Balanced, cinematic finishing that gives each piece a more refined visual identity.'],
                ],
                'portfolio' => [
                    ['title' => 'Aurelia Launch Film', 'category' => 'Brand Video', 'image' => '/images/portfolio/video.svg', 'alt' => 'Aurelia launch film scene', 'description' => 'A cinematic product intro shaped for both hero placement and cutdown formats.'],
                    ['title' => 'Creator Sprint Pack', 'category' => 'Short-Form', 'image' => '/images/portfolio/video.svg', 'alt' => 'Short form editing showcase', 'description' => 'Fast-moving vertical edits with strong hooks and clean subtitle systems.'],
                    ['title' => 'Executive Storyline', 'category' => 'Corporate', 'image' => '/images/portfolio/video.svg', 'alt' => 'Corporate video storyboard scene', 'description' => 'Interview and b-roll editing structured for clarity, authority, and internal alignment.'],
                ],
            ],
            [
                'slug' => '3d-production',
                'label' => '3D Production',
                'description' => 'Immersive renders and animation that give ideas volume, realism, and premium presentation value.',
                'long_description' => 'Opticore creates 3D visuals that help products, spaces, and concepts feel tangible before they ever reach the market. We focus on lighting, materials, composition, and motion so the final output feels convincing and commercially polished.',
                'icon' => 'Box',
                'color' => 'violet',
                'headings' => [
                    'capabilities' => ['eyebrow' => 'Spatial Fidelity', 'title' => 'Building Immersive Worlds'],
                    'whyOpticore' => ['eyebrow' => 'The Precision', 'title' => 'Why Detail is Everything to Us'],
                    'process' => ['eyebrow' => 'The Forge', 'title' => 'Modeling to Immersive Reveal'],
                    'selectedWork' => ['eyebrow' => 'The Render', 'title' => 'Tangible Ideas Rendered Pure'],
                ],
                'sub_services' => [
                    ['title' => '3D Modeling', 'description' => 'Clean, production-ready models for products, environments, and branded visual systems.'],
                    ['title' => 'Arch Visualization', 'description' => 'Atmospheric renders that help spaces communicate scale, material, and mood.'],
                    ['title' => 'Product Rendering', 'description' => 'High-resolution product imagery designed for launches, ads, and presentations.'],
                    ['title' => 'Animation', 'description' => 'Motion-led sequences that bring features, assemblies, and environments to life.'],
                ],
                'portfolio' => [
                    ['title' => 'Nova Device Reveal', 'category' => 'Product Render', 'image' => '/images/portfolio/three-d.svg', 'alt' => 'Nova device 3D product render', 'description' => 'Premium lighting and material direction for a product reveal sequence and sales assets.'],
                    ['title' => 'Harbor Residence', 'category' => 'Arch Viz', 'image' => '/images/portfolio/three-d.svg', 'alt' => 'Architectural visualization scene', 'description' => 'Exterior and interior visualization designed to sell mood, scale, and finish quality.'],
                    ['title' => 'Kinetic Motion System', 'category' => 'Animation', 'image' => '/images/portfolio/three-d.svg', 'alt' => '3D motion graphics concept', 'description' => 'A clean mechanical animation built to explain product movement and design intelligence.'],
                ],
            ],
            [
                'slug' => 'web-development',
                'label' => 'Web Development',
                'description' => 'High-performance websites and products designed to convert, scale, and stay unmistakably on-brand.',
                'long_description' => 'We build websites that feel premium in both design and engineering. From landing pages to custom web apps, Opticore pairs visual polish with strong frontend performance, structured backend logic, and a conversion-focused content flow.',
                'icon' => 'Code2',
                'color' => 'emerald',
                'headings' => [
                    'capabilities' => ['eyebrow' => 'Stack Setup', 'title' => 'Polished Brand Experience'],
                    'whyOpticore' => ['eyebrow' => 'The Engine', 'title' => 'Why Performance is Non-Negotiable'],
                    'process' => ['eyebrow' => 'The Build', 'title' => 'Logic to Production-Ready Launch'],
                    'selectedWork' => ['eyebrow' => 'The Ship', 'title' => 'Digital Products Living Online'],
                ],
                'sub_services' => [
                    ['title' => 'Custom Web Apps', 'description' => 'Tailored products with clean UX, scalable architecture, and reliable backend logic.'],
                    ['title' => 'E-Commerce', 'description' => 'Conversion-ready storefronts optimized for trust, speed, and high-value product storytelling.'],
                    ['title' => 'CMS', 'description' => 'Flexible content-managed builds that help teams move without developer dependency.'],
                    ['title' => 'Landing Pages', 'description' => 'Focused pages for campaigns, offers, and lead generation with strong narrative structure.'],
                    ['title' => 'Maintenance', 'description' => 'Ongoing support, updates, optimization, and refinement after launch.'],
                ],
                'portfolio' => [
                    ['title' => 'Optivault Platform', 'category' => 'Custom App', 'image' => '/images/portfolio/web.svg', 'alt' => 'Web platform dashboard interface', 'description' => 'A data-rich client portal with sharp hierarchy and a refined premium interface.'],
                    ['title' => 'Summit Commerce', 'category' => 'E-Commerce', 'image' => '/images/portfolio/web.svg', 'alt' => 'E-commerce website design', 'description' => 'A store experience designed for premium positioning and stronger product storytelling.'],
                    ['title' => 'Aurelia Campaign Site', 'category' => 'Landing Page', 'image' => '/images/portfolio/web.svg', 'alt' => 'Campaign landing page hero', 'description' => 'A launch page combining animation, positioning, and conversion-focused structure.'],
                ],
            ],
        ];

        foreach ($categories as $index => $data) {
            $category = Category::query()->updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'label' => $data['label'],
                    'description' => $data['description'],
                    'long_description' => $data['long_description'],
                    'icon' => $data['icon'],
                    'color' => $data['color'],
                    'headings' => $data['headings'],
                    'sub_services' => $data['sub_services'],
                    'reasons' => self::DEFAULT_REASONS,
                    'process' => self::DEFAULT_PROCESS,
                    'is_active' => true,
                    'sort_order' => $index,
                ]
            );

            foreach ($data['portfolio'] as $itemIndex => $item) {
                $category->portfolioItems()->updateOrCreate(
                    ['title' => $item['title']],
                    [
                        'category' => $item['category'],
                        'description' => $item['description'],
                        'image' => $item['image'],
                        'alt' => $item['alt'],
                        'sort_order' => $itemIndex,
                    ]
                );
            }
        }
    }
}
