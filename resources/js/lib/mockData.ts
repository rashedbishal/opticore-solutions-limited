import type { PortfolioItem, Testimonial } from '@/types';

export const mockPortfolios: PortfolioItem[] = [
    {
        id: 1,
        title: 'E-commerce Redesign',
        category: 'web-development',
        media_path:
            'https://images.unsplash.com/photo-1523474253046-2cd2c78b6ad1?auto=format&fit=crop&q=80&w=800',
        media_type: 'image',
        alt: 'E-commerce website on a laptop',
        description:
            'A full redesign of a high-traffic e-commerce platform focusing on mobile conversion.',
    },
    {
        id: 2,
        title: 'Cyberpunk 3D Character',
        category: '3d-production',
        media_path:
            'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=800',
        media_type: 'image',
        alt: 'Detailed 3D character model',
        description:
            'High-fidelity 3D character modeling and texturing for a sci-fi project.',
    },
    {
        id: 3,
        title: 'Brand Identity - Neo',
        category: 'graphic-design',
        media_path:
            'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=800',
        media_type: 'image',
        alt: 'Modern brand identity manual',
        description:
            'Complete visual identity system for a futuristic tech startup.',
    },
    {
        id: 4,
        title: 'Social Media Growth',
        category: 'digital-marketing',
        media_path:
            'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800',
        media_type: 'image',
        alt: 'Social media marketing graphics',
        description:
            'Data-driven social media campaign that increased engagement by 300%.',
    },
    {
        id: 5,
        title: 'SaaS Dashboard UI',
        category: 'web-development',
        media_path:
            'https://images.unsplash.com/photo-1551288049-bbbda536639a?auto=format&fit=crop&q=80&w=800',
        media_type: 'image',
        alt: 'Clean SaaS dashboard interface',
        description:
            'User-centric dashboard design for a project management tool.',
    },
    {
        id: 6,
        title: 'Motion Graphics Intro',
        category: 'video-editing',
        media_path:
            'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800',
        media_type: 'image',
        alt: 'Vibrant motion graphics frame',
        description:
            'Energetic motion graphics for a global brand launch event.',
    },
    {
        id: 7,
        title: 'Product Visualizer',
        category: '3d-production',
        media_path:
            'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&q=80&w=800',
        media_type: 'image',
        alt: 'Architectural 3D visualization',
        description:
            'Hyper-realistic 3D product rendering for marketing materials.',
    },
    {
        id: 8,
        title: 'Mobile App Design',
        category: 'web-development',
        media_path:
            'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800',
        media_type: 'image',
        alt: 'App design on a smartphone',
        description:
            'Intuitive mobile application design for a fintech company.',
    },
];

export const mockTestimonials: Testimonial[] = [
    {
        name: 'Sarah Johnson',
        role: 'Marketing Director',
        company: 'Vortex Tech',
        quote: 'Opticore transformed our brand identity into something truly world-class. Their attention to detail is unmatched.',
        icon: 'https://i.pravatar.cc/150?u=sarah',
    },
    {
        name: 'Michael Chen',
        role: 'CEO',
        company: 'Lumina Labs',
        quote: 'The 3D production work they did for our product launch was breathtaking. It really set us apart from the competition.',
        icon: 'https://i.pravatar.cc/150?u=michael',
    },
    {
        name: 'Elena Rodriguez',
        role: 'Creative Lead',
        company: 'Aura Design',
        quote: 'Working with Opticore is a seamless experience. They understand the vision and deliver beyond expectations every time.',
        icon: 'https://i.pravatar.cc/150?u=elena',
    },
    {
        name: 'David Smith',
        role: 'Founder',
        company: 'Growth Engine',
        quote: 'Our website conversion rate doubled after the redesign. The UX is incredibly polished and professional.',
        icon: 'https://i.pravatar.cc/150?u=david',
    },
];
