export type * from './auth';

export interface SiteMeta {
    title: string;
    description: string;
}

export interface FlashProps {
    success?: string | null;
}

export interface SharedPageProps {
    name: string;
    auth: import('./auth').Auth;
    flash: FlashProps;
    meta?: SiteMeta;
    [key: string]: unknown;
}

export interface NavItem {
    label: string;
    href: string;
}

export interface ServiceItem {
    key: string;
    name: string;
    tagline: string;
    description: string;
    href: string;
    icon: string;
}

export interface StatItem {
    label: string;
    value: number;
    suffix: string;
}

export interface Testimonial {
    name: string;
    role: string;
    company: string;
    quote: string;
}

export interface ProcessStep {
    title: string;
    description: string;
}

export interface HighlightItem {
    title: string;
    description: string;
}

export interface PortfolioItem {
    id: number;
    title: string;
    category: string;
    media_path: string | null;
    image?: string;
    media_type: 'image' | 'video';
    alt: string;
    description?: string;
}

export interface PortfolioCategory {
    type: string;
    title: string;
    description: string;
    items: PortfolioItem[];
}

export interface ServicePageContent {
    name: string;
    shortDescription: string;
    longDescription: string;
    href: string;
    icon: string;
    subServices: HighlightItem[];
    reasons: HighlightItem[];
    process: ProcessStep[];
    portfolio: PortfolioItem[];
}

export interface FaqItem {
    question: string;
    answer: string;
}

export interface JobListing {
    title: string;
    location: string;
    type: string;
    description: string;
}

export interface ClientLogo {
    name: string;
    icon: string;
}

export interface ContactFormData {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
}

export interface AppointmentFormData {
    name: string;
    email: string;
    phone: string;
    service: string;
    preferred_date: string;
    message: string;
}

export interface CareerFormData {
    name: string;
    email: string;
    phone: string;
    role: string;
    portfolio_url: string;
    message: string;
}
