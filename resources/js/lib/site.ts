import type {
    ClientLogo,
    FaqItem,
    HighlightItem,
    NavItem,
    PortfolioCategory,
    StatItem,
    Testimonial,
} from '@/types';

export const navigationItems: NavItem[] = [
    { label: 'Home', href: '/', icon: 'Home' },
    { label: 'Hire Us', href: '/hire-us', icon: 'Briefcase' },
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
        icon: 'Mountain',
    },
    {
        name: 'Imran Hossain',
        role: 'Marketing Lead',
        company: 'Velocity Commerce',
        quote: 'Their team connected design, paid ads, and landing page execution into one coherent growth system. The speed and clarity were exceptional.',
        icon: 'Zap',
    },
    {
        name: 'Laura Mitchell',
        role: 'Operations Director',
        company: 'Arbor Living',
        quote: 'From packaging to campaign edits, every deliverable looked intentional and market-ready. Opticore understands how to make brands feel expensive.',
        icon: 'Trees',
    },
    {
        name: 'Kevin Tran',
        role: 'Product Manager',
        company: 'Nova Devices',
        quote: 'The 3D renders and website launch gave our product story real weight. We looked sharper in one month than we had in the previous year.',
        icon: 'Orbit',
    },
    {
        name: 'Nadia Rahman',
        role: 'CEO',
        company: 'Luma Health Media',
        quote: 'They operate like a true creative partner. Direction was smart, revisions were precise, and the final output landed exactly where we needed it.',
        icon: 'Sun',
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
        answer: 'You can reach out through our contact form. We will review your goals, timeline, and scope, then recommend the most effective starting point.',
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
            'To respond to inquiries, evaluate applications, and manage active client projects.',
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
    {
        id: 'social-login-data-deletion',
        title: 'Social Login & Data Deletion',
        body: [
            'Our platform supports sign-in via third-party providers such as Google and Facebook. When you use these services to log in, we receive basic profile information including your name, email address, and profile picture.',
            'We do not store any additional Facebook data beyond what is required to authenticate and maintain your account on our platform.',
            'If you wish to have your account and all associated data permanently deleted, you may send a deletion request to info@opticoresolutions.com with the subject line "Data Deletion Request". We will process your request and confirm deletion within 30 days.',
            "You may also remove our app's access to your Facebook account at any time by visiting Facebook's App Settings at facebook.com/settings?tab=applications and revoking access for Opticore Solutions. Your data will be deleted from our system upon request.",
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
