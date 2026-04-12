import type {
    ClientLogo,
    FaqItem,
    HighlightItem,
    JobListing,
    NavItem,
    PortfolioCategory,
    ProcessStep,
    ServiceItem,
    ServicePageContent,
    StatItem,
    Testimonial,
} from '@/types';

const defaultProcess: ProcessStep[] = [
    {
        title: 'Brief',
        description:
            'We align on business goals, audience, deliverables, and the visual or technical direction required to move fast without guesswork.',
    },
    {
        title: 'Concept',
        description:
            'Our team translates the brief into moodboards, wireframes, story beats, or campaign ideas that sharpen the creative point of view.',
    },
    {
        title: 'Execution',
        description:
            'Design, editing, production, and development happen with constant quality control, clear milestones, and focused iteration cycles.',
    },
    {
        title: 'Delivery',
        description:
            'We hand over polished assets, launch-ready experiences, and support materials built for real-world performance across channels.',
    },
];

const defaultReasons: HighlightItem[] = [
    {
        title: 'Strategy-Led Creative',
        description:
            'Every output is anchored in positioning, audience intent, and measurable business goals instead of surface-level aesthetics alone.',
    },
    {
        title: 'Fast Communication',
        description:
            'You get clear checkpoints, tight feedback loops, and a team that knows how to keep complex creative work moving without friction.',
    },
    {
        title: 'Premium Craft',
        description:
            'From motion polish to production detail, we build work that looks refined, feels cohesive, and stands up in competitive markets.',
    },
];

export const navigationItems: NavItem[] = [
    { label: 'Graphic Design', href: '/graphic-design' },
    { label: 'Digital Marketing', href: '/digital-marketing' },
    { label: 'Video Editing', href: '/video-editing' },
    { label: '3D Production', href: '/3d-production' },
    { label: 'Web Development', href: '/web-development' },
    { label: 'Contact', href: '/contact' },
];

export const services: ServiceItem[] = [
    {
        key: 'graphic-design',
        name: 'Graphic Design',
        tagline: 'Identity systems with edge and clarity',
        description:
            'Brand-led visuals, campaign creative, and print-ready assets that make businesses feel established from the first glance.',
        href: '/graphic-design',
        icon: 'PenTool',
    },
    {
        key: 'digital-marketing',
        name: 'Digital Marketing',
        tagline: 'Growth systems built for visibility and conversion',
        description:
            'SEO, paid media, content direction, and channel management designed to turn attention into pipeline and revenue.',
        href: '/digital-marketing',
        icon: 'Globe',
    },
    {
        key: 'video-editing',
        name: 'Video Editing',
        tagline: 'Cinematic edits for modern attention spans',
        description:
            'Short-form, long-form, and branded motion editing that keeps stories tight, punchy, and impossible to scroll past.',
        href: '/video-editing',
        icon: 'Film',
    },
    {
        key: '3d-production',
        name: '3D Production',
        tagline: 'Depth, realism, and product storytelling',
        description:
            'High-end 3D models, animation, and rendering for products, spaces, and brands that need premium visual presentation.',
        href: '/3d-production',
        icon: 'Layers',
    },
    {
        key: 'web-development',
        name: 'Web Development',
        tagline: 'Fast, polished digital experiences',
        description:
            'Custom sites and applications engineered for performance, conversion, and a distinct brand presence on every screen.',
        href: '/web-development',
        icon: 'Code2',
    },
];

export const homeStats: StatItem[] = [
    { label: 'Projects', value: 50, suffix: '+' },
    { label: 'Happy Clients', value: 30, suffix: '+' },
    { label: 'Satisfaction', value: 100, suffix: '%' },
];

export const testimonials: Testimonial[] = [
    {
        name: 'Sarah Bennett',
        role: 'Founder',
        company: 'North Peak Studio',
        quote: 'Opticore gave our rebrand the kind of presence that usually takes years to earn. The visuals felt premium, strategic, and immediately credible.',
    },
    {
        name: 'Imran Hossain',
        role: 'Marketing Lead',
        company: 'Velocity Commerce',
        quote: 'Their team connected design, paid ads, and landing page execution into one coherent growth system. The speed and clarity were exceptional.',
    },
    {
        name: 'Laura Mitchell',
        role: 'Operations Director',
        company: 'Arbor Living',
        quote: 'From packaging to campaign edits, every deliverable looked intentional and market-ready. Opticore understands how to make brands feel expensive.',
    },
    {
        name: 'Kevin Tran',
        role: 'Product Manager',
        company: 'Nova Devices',
        quote: 'The 3D renders and website launch gave our product story real weight. We looked sharper in one month than we had in the previous year.',
    },
    {
        name: 'Nadia Rahman',
        role: 'CEO',
        company: 'Luma Health Media',
        quote: 'They operate like a true creative partner. Direction was smart, revisions were precise, and the final output landed exactly where we needed it.',
    },
];

export const clientLogos: ClientLogo[] = [
    { name: 'North Peak', icon: 'Mountain' },
    { name: 'Velocity', icon: 'Zap' },
    { name: 'Aurelia', icon: 'Sparkles' },
    { name: 'Nova', icon: 'Orbit' },
    { name: 'Arbor', icon: 'Trees' },
    { name: 'Luma', icon: 'Sun' },
    { name: 'Kinetic', icon: 'Activity' },
    { name: 'Summit', icon: 'Pyramid' },
];

export const aboutBentoImages = [
    {
        src: '/images/about/about-creative.svg',
        alt: 'Opticore creative team workshop',
    },
    {
        src: '/images/about/about-marketing.svg',
        alt: 'Opticore campaign strategy dashboard',
    },
    {
        src: '/images/about/about-3d.svg',
        alt: 'Opticore motion and 3D production scene',
    },
    {
        src: '/images/about/about-web.svg',
        alt: 'Opticore web interface design system',
    },
];

export const servicePageContent: Record<string, ServicePageContent> = {
    'graphic-design': {
        name: 'Graphic Design',
        shortDescription:
            'Bold, polished brand visuals built to earn trust at first sight and stay memorable long after the scroll.',
        longDescription:
            'We shape visual identities that feel premium, coherent, and commercial. From startups finding their voice to established teams refreshing their look, Opticore designs systems that hold together across print, digital, packaging, and campaigns.',
        href: '/graphic-design',
        icon: 'PenTool',
        subServices: [
            {
                title: 'Logo Design',
                description:
                    'Distinctive logo systems that work from tiny social avatars to large-format applications.',
            },
            {
                title: 'Brand Identity',
                description:
                    'Typography, color, layouts, and usage systems that unify every touchpoint.',
            },
            {
                title: 'Packaging Design',
                description:
                    'Shelf-ready packaging concepts built to communicate value, quality, and differentiation.',
            },
            {
                title: 'Social Media Graphics',
                description:
                    'Campaign visuals and post systems tuned for clarity, consistency, and velocity.',
            },
            {
                title: 'Print Design',
                description:
                    'Brochures, flyers, signage, and collateral designed with strong hierarchy and finish.',
            },
            {
                title: 'Photoshop Editing',
                description:
                    'High-end retouching, compositing, and visual cleanup for commercial-grade presentation.',
            },
        ],
        headings: {
            capabilities: { eyebrow: 'Visual Scope', title: 'Defining Your Brand Edge' },
            whyOpticore: { eyebrow: 'The Standard', title: 'Why Brands Trust Our Eye' },
            process: { eyebrow: 'The Journey', title: 'From Sketch to Final Asset' },
            selectedWork: { eyebrow: 'The Proof', title: 'Identity Systems in the Wild' },
        },
        reasons: defaultReasons,
        process: defaultProcess,
        portfolio: [
            {
                title: 'Lumina Identity Suite',
                category: 'Logo & Identity',
                image: '/images/portfolio/identity.svg',
                alt: 'Lumina logo identity presentation',
                description:
                    'A sleek monogram and typography system built for a premium wellness brand.',
            },
            {
                title: 'Arbor Packaging Refresh',
                category: 'Packaging',
                image: '/images/portfolio/packaging.svg',
                alt: 'Arbor packaging system',
                description:
                    'Natural, shelf-focused packaging with strong contrast and an elevated product story.',
            },
            {
                title: 'Flux Campaign Graphics',
                category: 'Social Media',
                image: '/images/portfolio/social.svg',
                alt: 'Flux social campaign graphics',
                description:
                    'A high-energy social toolkit for rapid campaign deployment across multiple channels.',
            },
        ],
    },
    'digital-marketing': {
        name: 'Digital Marketing',
        shortDescription:
            'Performance-minded campaigns that connect strategy, messaging, creative, and conversion into one system.',
        longDescription:
            'Opticore builds digital marketing programs that feel as refined as the brand itself. We blend paid media, SEO, content, and channel operations into a plan designed for predictable growth instead of disconnected tactics.',
        href: '/digital-marketing',
        icon: 'Globe',
        subServices: [
            {
                title: 'SEO',
                description:
                    'Search visibility strategies that improve rankings, organic reach, and long-term demand capture.',
            },
            {
                title: 'Social Media Management',
                description:
                    'Editorial planning, publishing systems, and visual consistency across active channels.',
            },
            {
                title: 'Paid Ads',
                description:
                    'Conversion-focused campaigns across search and social with clean creative-testing workflows.',
            },
            {
                title: 'Content Marketing',
                description:
                    'Story-led content that supports positioning, lead generation, and trust-building.',
            },
            {
                title: 'Email Marketing',
                description:
                    'Lifecycle and promotional sequences that nurture audiences without sounding generic.',
            },
        ],
        headings: {
            capabilities: { eyebrow: 'Growth Toolkit', title: 'Systems for Global Visibility' },
            whyOpticore: { eyebrow: 'The Advantage', title: 'Why Partners Scale With Us' },
            process: { eyebrow: 'The Roadmap', title: 'Strategy to Conversion Pipeline' },
            selectedWork: { eyebrow: 'The Results', title: "Growth Engines We've Engineered" },
        },
        reasons: defaultReasons,
        process: defaultProcess,
        portfolio: [
            {
                title: 'Velocity Lead Engine',
                category: 'Paid Growth',
                image: '/images/portfolio/marketing.svg',
                alt: 'Velocity campaign dashboard',
                description:
                    'A full-funnel paid strategy paired with landing page refinement and reporting clarity.',
            },
            {
                title: 'North Peak Search Lift',
                category: 'SEO',
                image: '/images/portfolio/marketing.svg',
                alt: 'Search performance visual',
                description:
                    'Content architecture and SEO direction that expanded category visibility for a creative studio.',
            },
            {
                title: 'Luma Retention Flow',
                category: 'Email',
                image: '/images/portfolio/marketing.svg',
                alt: 'Email marketing lifecycle campaign',
                description:
                    'A cleaner lifecycle sequence that improved activation and repeat customer engagement.',
            },
        ],
    },
    'video-editing': {
        name: 'Video Editing',
        shortDescription:
            'Crisp, kinetic edits that turn raw footage into modern brand stories built for retention.',
        longDescription:
            "We edit with pace, structure, and taste. Whether it is short-form social, YouTube, branded explainers, or corporate communication, Opticore shapes footage into confident, polished narratives that respect the audience's time.",
        href: '/video-editing',
        icon: 'Film',
        subServices: [
            {
                title: 'Reels & Shorts',
                description:
                    'Attention-first edits with pacing, captions, hooks, and punch built for social performance.',
            },
            {
                title: 'YouTube Videos',
                description:
                    'Long-form editing that improves clarity, rhythm, and viewer retention.',
            },
            {
                title: 'Corporate Videos',
                description:
                    'Professional edits for internal communications, launches, and brand storytelling.',
            },
            {
                title: 'Motion Graphics',
                description:
                    'Dynamic titles, transitions, and animated scenes that elevate the final cut.',
            },
            {
                title: 'Color Grading',
                description:
                    'Balanced, cinematic finishing that gives each piece a more refined visual identity.',
            },
        ],
        headings: {
            capabilities: { eyebrow: 'Motion Craft', title: 'Precision Cinematic Retention' },
            whyOpticore: { eyebrow: 'The Rhythm', title: 'Why Creators Trust Our Cut' },
            process: { eyebrow: 'The Sequence', title: 'From Raw Dailies to Master Export' },
            selectedWork: { eyebrow: 'The Reel', title: 'Visual Stories That Stick' },
        },
        reasons: defaultReasons,
        process: defaultProcess,
        portfolio: [
            {
                title: 'Aurelia Launch Film',
                category: 'Brand Video',
                image: '/images/portfolio/video.svg',
                alt: 'Aurelia launch film scene',
                description:
                    'A cinematic product intro shaped for both hero placement and cutdown formats.',
            },
            {
                title: 'Creator Sprint Pack',
                category: 'Short-Form',
                image: '/images/portfolio/video.svg',
                alt: 'Short form editing showcase',
                description:
                    'Fast-moving vertical edits with strong hooks and clean subtitle systems.',
            },
            {
                title: 'Executive Storyline',
                category: 'Corporate',
                image: '/images/portfolio/video.svg',
                alt: 'Corporate video storyboard scene',
                description:
                    'Interview and b-roll editing structured for clarity, authority, and internal alignment.',
            },
        ],
    },
    '3d-production': {
        name: '3D Production',
        shortDescription:
            'Immersive renders and animation that give ideas volume, realism, and premium presentation value.',
        longDescription:
            'Opticore creates 3D visuals that help products, spaces, and concepts feel tangible before they ever reach the market. We focus on lighting, materials, composition, and motion so the final output feels convincing and commercially polished.',
        href: '/3d-production',
        icon: 'Layers',
        subServices: [
            {
                title: '3D Modeling',
                description:
                    'Clean, production-ready models for products, environments, and branded visual systems.',
            },
            {
                title: 'Arch Visualization',
                description:
                    'Atmospheric renders that help spaces communicate scale, material, and mood.',
            },
            {
                title: 'Product Rendering',
                description:
                    'High-resolution product imagery designed for launches, ads, and presentations.',
            },
            {
                title: 'Animation',
                description:
                    'Motion-led sequences that bring features, assemblies, and environments to life.',
            },
        ],
        headings: {
            capabilities: { eyebrow: 'Spatial Fidelity', title: 'Building Immersive Worlds' },
            whyOpticore: { eyebrow: 'The Precision', title: 'Why Detail is Everything to Us' },
            process: { eyebrow: 'The Forge', title: 'Modeling to Immersive Reveal' },
            selectedWork: { eyebrow: 'The Render', title: 'Tangible Ideas Rendered Pure' },
        },
        reasons: defaultReasons,
        process: defaultProcess,
        portfolio: [
            {
                title: 'Nova Device Reveal',
                category: 'Product Render',
                image: '/images/portfolio/three-d.svg',
                alt: 'Nova device 3D product render',
                description:
                    'Premium lighting and material direction for a product reveal sequence and sales assets.',
            },
            {
                title: 'Harbor Residence',
                category: 'Arch Viz',
                image: '/images/portfolio/three-d.svg',
                alt: 'Architectural visualization scene',
                description:
                    'Exterior and interior visualization designed to sell mood, scale, and finish quality.',
            },
            {
                title: 'Kinetic Motion System',
                category: 'Animation',
                image: '/images/portfolio/three-d.svg',
                alt: '3D motion graphics concept',
                description:
                    'A clean mechanical animation built to explain product movement and design intelligence.',
            },
        ],
    },
    'web-development': {
        name: 'Web Development',
        shortDescription:
            'High-performance websites and products designed to convert, scale, and stay unmistakably on-brand.',
        longDescription:
            'We build websites that feel premium in both design and engineering. From landing pages to custom web apps, Opticore pairs visual polish with strong frontend performance, structured backend logic, and a conversion-focused content flow.',
        href: '/web-development',
        icon: 'Code2',
        subServices: [
            {
                title: 'Custom Web Apps',
                description:
                    'Tailored products with clean UX, scalable architecture, and reliable backend logic.',
            },
            {
                title: 'E-Commerce',
                description:
                    'Conversion-ready storefronts optimized for trust, speed, and high-value product storytelling.',
            },
            {
                title: 'CMS',
                description:
                    'Flexible content-managed builds that help teams move without developer dependency.',
            },
            {
                title: 'Landing Pages',
                description:
                    'Focused pages for campaigns, offers, and lead generation with strong narrative structure.',
            },
            {
                title: 'Maintenance',
                description:
                    'Ongoing support, updates, optimization, and refinement after launch.',
            },
        ],
        headings: {
            capabilities: { eyebrow: 'Stack Setup', title: 'Polished Brand Experience' },
            whyOpticore: { eyebrow: 'The Engine', title: 'Why Performance is Non-Negotiable' },
            process: { eyebrow: 'The Build', title: 'Logic to Production-Ready Launch' },
            selectedWork: { eyebrow: 'The Ship', title: 'Digital Products Living Online' },
        },
        reasons: defaultReasons,
        process: defaultProcess,
        portfolio: [
            {
                title: 'Optivault Platform',
                category: 'Custom App',
                image: '/images/portfolio/web.svg',
                alt: 'Web platform dashboard interface',
                description:
                    'A data-rich client portal with sharp hierarchy and a refined premium interface.',
            },
            {
                title: 'Summit Commerce',
                category: 'E-Commerce',
                image: '/images/portfolio/web.svg',
                alt: 'E-commerce website design',
                description:
                    'A store experience designed for premium positioning and stronger product storytelling.',
            },
            {
                title: 'Aurelia Campaign Site',
                category: 'Landing Page',
                image: '/images/portfolio/web.svg',
                alt: 'Campaign landing page hero',
                description:
                    'A launch page combining animation, positioning, and conversion-focused structure.',
            },
        ],
    },
};

export const portfolioCategories: PortfolioCategory[] = [
    {
        type: 'logo-identity',
        title: 'Logo & Identity',
        description:
            'Marks, systems, and identity applications that make brands feel established from the first glance.',
        items: [
            {
                title: 'Lumina Monogram',
                category: 'Identity',
                image: '/images/portfolio/identity.svg',
                alt: 'Lumina identity showcase',
                description:
                    'A minimalist monogram system designed for premium wellness positioning.',
            },
            {
                title: 'Summit Wordmark',
                category: 'Branding',
                image: '/images/portfolio/identity.svg',
                alt: 'Summit logo concept',
                description:
                    'A high-contrast wordmark crafted for bold digital and print applications.',
            },
            {
                title: 'North Peak System',
                category: 'Brand Suite',
                image: '/images/portfolio/identity.svg',
                alt: 'North Peak identity system',
                description:
                    'A geometric identity suite with typography and application guidance.',
            },
        ],
    },
    {
        type: 'packaging-design',
        title: 'Packaging Design',
        description:
            'Retail-ready packaging concepts built to communicate quality, clarity, and differentiation.',
        items: [
            {
                title: 'Arbor Living Line',
                category: 'Packaging',
                image: '/images/portfolio/packaging.svg',
                alt: 'Arbor packaging concept',
                description:
                    'A nature-led premium packaging system with tactile contrast and clarity.',
            },
            {
                title: 'Velora Serum',
                category: 'Beauty',
                image: '/images/portfolio/packaging.svg',
                alt: 'Velora serum packaging',
                description:
                    'Dark luxury packaging for a high-margin skincare launch.',
            },
            {
                title: 'Pulse Coffee',
                category: 'Consumer Goods',
                image: '/images/portfolio/packaging.svg',
                alt: 'Pulse coffee packaging',
                description:
                    'Graphic-led pouch design that balanced energy and shelf presence.',
            },
        ],
    },
    {
        type: 'social-media-graphics',
        title: 'Social Media Graphics',
        description:
            'High-performance visual systems for campaigns, product drops, and ongoing content calendars.',
        items: [
            {
                title: 'Flux Launch Set',
                category: 'Campaign',
                image: '/images/portfolio/social.svg',
                alt: 'Flux campaign graphics',
                description:
                    'A fast-moving launch pack designed for urgency and consistency across formats.',
            },
            {
                title: 'Nova Teaser Series',
                category: 'Product Social',
                image: '/images/portfolio/social.svg',
                alt: 'Nova teaser series',
                description:
                    'Teaser visuals built around dramatic product framing and strong contrast.',
            },
            {
                title: 'Aurelia Event Loop',
                category: 'Event Promotion',
                image: '/images/portfolio/social.svg',
                alt: 'Aurelia social event graphics',
                description:
                    'A modular visual system for event promotion and recap posts.',
            },
        ],
    },
    {
        type: 'print-design',
        title: 'Print Design',
        description:
            'Collateral and large-format graphics with strong hierarchy, finish detail, and brand consistency.',
        items: [
            {
                title: 'Investor Prospectus',
                category: 'Editorial',
                image: '/images/portfolio/print.svg',
                alt: 'Investor prospectus print layout',
                description:
                    'A sleek editorial system designed to carry complex information with confidence.',
            },
            {
                title: 'Conference Suite',
                category: 'Event Print',
                image: '/images/portfolio/print.svg',
                alt: 'Conference print suite',
                description:
                    'Signage and collateral designed for clarity at scale and in motion.',
            },
            {
                title: 'Brand Brochure',
                category: 'Sales Material',
                image: '/images/portfolio/print.svg',
                alt: 'Brand brochure concept',
                description:
                    'A premium brochure layout with layered image treatment and persuasive structure.',
            },
        ],
    },
    {
        type: 'photoshop-editing',
        title: 'Photoshop Editing',
        description:
            'Retouching and compositing work that turns rough source material into polished visual assets.',
        items: [
            {
                title: 'Studio Composite',
                category: 'Compositing',
                image: '/images/portfolio/photo.svg',
                alt: 'Photoshop compositing showcase',
                description:
                    'A layered product scene built for campaign-ready hero usage.',
            },
            {
                title: 'Beauty Retouch',
                category: 'Retouching',
                image: '/images/portfolio/photo.svg',
                alt: 'Beauty retouching example',
                description:
                    'Commercial retouching focused on refinement without losing realism.',
            },
            {
                title: 'Lifestyle Cleanup',
                category: 'Post Production',
                image: '/images/portfolio/photo.svg',
                alt: 'Lifestyle cleanup example',
                description:
                    'Tone, color, and environmental cleanup for polished final campaign imagery.',
            },
        ],
    },
];

export const faqItems: FaqItem[] = [
    {
        question: 'What services does Opticore Solutions Ltd. offer?',
        answer: 'We provide Graphic Design, Video Editing, Digital Marketing, 3D Production, and Web Development services, often combining them into one cohesive delivery pipeline.',
    },
    {
        question: 'How do I get started with a project?',
        answer: 'You can reach out through our contact form or request an appointment. We will review your goals, timeline, and scope, then recommend the most effective starting point.',
    },
    {
        question: 'What is your typical project turnaround time?',
        answer: 'Turnaround depends on scope, but focused design or editing projects often move within days, while larger branding, marketing, or web builds are structured around phased milestones.',
    },
    {
        question: 'Do you offer custom pricing packages?',
        answer: 'Yes. We build pricing around deliverables, complexity, and business goals instead of forcing clients into rigid one-size-fits-all packages.',
    },
    {
        question: 'How many revisions are included?',
        answer: 'Revision cycles are defined up front based on the project. We aim for efficient, high-signal feedback rounds rather than open-ended iteration that slows momentum.',
    },
    {
        question: 'Can I request a specific designer or editor?',
        answer: 'Yes, when availability allows. We can align you with a specialist whose style and strengths best fit the work.',
    },
    {
        question: 'What file formats do you deliver?',
        answer: 'Deliverables vary by service and can include source files, print-ready exports, social assets, development handoff files, optimized web formats, and presentation-ready renders.',
    },
    {
        question: 'Do you work with international clients?',
        answer: 'Yes. Opticore works remotely with clients across markets and time zones, with communication workflows built to keep projects moving clearly.',
    },
    {
        question: 'How do I track my project progress?',
        answer: 'We use structured checkpoints, milestone reviews, and clear update loops so you always know what is in progress, what is pending, and what comes next.',
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'We support standard digital payment methods and confirm the most suitable payment arrangement during onboarding.',
    },
    {
        question: 'Do you sign NDAs for confidential projects?',
        answer: 'Yes. We regularly work with confidential launches and can sign NDAs when discretion is required.',
    },
    {
        question: 'How do I apply for a job at Opticore?',
        answer: 'Visit the Career page, open the role that fits your experience, and submit the application form with your details, portfolio link, and a concise introduction.',
    },
];

export const culturePerks: HighlightItem[] = [
    {
        title: 'Remote-Friendly',
        description:
            'We build distributed workflows that protect momentum, focus, and strong communication across time zones.',
    },
    {
        title: 'Creative Environment',
        description:
            'Design craft, experimentation, and taste matter here. We care deeply about the quality of what reaches the client.',
    },
    {
        title: 'Growth-Focused',
        description:
            'You will work on ambitious projects, sharpen your process, and expand your range alongside a multidisciplinary team.',
    },
];

export const jobListings: JobListing[] = [
    {
        title: 'Graphic Designer',
        location: 'Remote',
        type: 'Full Time',
        description:
            'Build premium brand systems, campaign visuals, and polished presentation assets for fast-moving client work.',
    },
    {
        title: 'Video Editor',
        location: 'Remote',
        type: 'Full Time',
        description:
            'Edit social, branded, and long-form content with a strong sense of rhythm, storytelling, and motion detail.',
    },
    {
        title: 'Web Developer',
        location: 'Remote',
        type: 'Full Time',
        description:
            'Ship high-quality digital experiences with strong frontend craft and dependable backend execution.',
    },
    {
        title: 'Digital Marketer',
        location: 'Remote',
        type: 'Full Time',
        description:
            'Own campaign strategy, channel growth, and performance-minded systems across search, social, and lifecycle marketing.',
    },
    {
        title: '3D Artist',
        location: 'Remote',
        type: 'Full Time',
        description:
            'Create high-end models, renders, and motion sequences for brand, product, and architectural work.',
    },
];

export const privacySections = [
    {
        id: 'overview',
        title: 'Overview',
        body: [
            'Opticore Solutions Ltd. collects only the information needed to respond to inquiries, manage projects, provide services, and improve client communication.',
            'We treat all submitted business information, creative materials, and contact details with discretion and do not sell personal data to third parties.',
        ],
    },
    {
        id: 'information-we-collect',
        title: 'Information We Collect',
        body: [
            'Contact details such as name, email, phone number, company name, and project information submitted through our forms.',
            'Communication records related to inquiries, proposals, project updates, and service delivery.',
            'Basic website usage data collected through standard analytics or server logs to understand performance and user behavior.',
        ],
    },
    {
        id: 'how-we-use-information',
        title: 'How We Use Information',
        body: [
            'To respond to inquiries, schedule appointments, evaluate applications, and manage active client projects.',
            'To improve our website experience, refine service delivery, and maintain secure communication across our systems.',
            'To share proposals, updates, deliverables, invoices, or relevant service information when needed.',
        ],
    },
    {
        id: 'data-protection',
        title: 'Data Protection',
        body: [
            'We use reasonable administrative and technical safeguards to protect submitted information from unauthorized access, misuse, or disclosure.',
            'Access to project and client information is limited to team members or service providers who need that information to perform their role.',
        ],
    },
    {
        id: 'your-rights',
        title: 'Your Rights',
        body: [
            'You may request access to, correction of, or deletion of the personal information you have provided to us, subject to legal or operational requirements.',
            'If you would like to update or remove your information, contact us directly and we will respond within a reasonable timeframe.',
        ],
    },
];

export const termsSections = [
    {
        id: 'engagement',
        title: 'Engagement',
        body: [
            'Projects begin after scope, deliverables, pricing, and timelines have been agreed in writing between Opticore Solutions Ltd. and the client.',
            'Any work outside the approved scope may require a revised estimate, updated timeline, or separate agreement.',
        ],
    },
    {
        id: 'payments',
        title: 'Payments',
        body: [
            'Payment terms are defined at the start of each engagement. Work may be scheduled based on deposit receipt, milestone approvals, or agreed billing stages.',
            'Late payments may pause ongoing work, delay delivery, or affect reserved production timelines until the account is brought current.',
        ],
    },
    {
        id: 'revisions',
        title: 'Revisions',
        body: [
            'Revision rounds are based on the approved proposal or engagement terms. Additional revision cycles may be billed separately when they exceed the agreed scope.',
            'Clear consolidated feedback helps maintain timeline efficiency and improves the quality of final output.',
        ],
    },
    {
        id: 'delivery-and-ownership',
        title: 'Delivery & Ownership',
        body: [
            'Final deliverables are provided after outstanding balances have been settled unless a written agreement states otherwise.',
            'Ownership and usage rights for final approved assets are transferred according to the agreement, while Opticore retains rights to unused concepts, working files, and process materials unless expressly assigned.',
        ],
    },
    {
        id: 'liability',
        title: 'Liability',
        body: [
            'Opticore Solutions Ltd. is not liable for indirect, incidental, or consequential losses arising from the use of delivered assets, campaign performance fluctuations, or delays caused by missing client input.',
            'Clients are responsible for reviewing and approving final materials before publication, launch, or distribution.',
        ],
    },
];
