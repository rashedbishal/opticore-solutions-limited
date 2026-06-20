import type { Auth } from './auth';

export type * from './auth';

export interface SiteMeta {
    title: string;
    description: string;
}

export interface FlashProps {
    success?: string | null;
    error?: string | null;
    payment_success?: {
        invoice_number: string;
        amount: string;
        currency: string;
        tran_id: string;
    } | null;
    payment_error?: string | null;
    checkout_url?: string | null;
    subscription?: 'subscribed' | 'unsubscribed' | null;
}

export interface CategoryConfig {
    label: string;
    description: string | null;
}

export interface SiteSettings {
    email: string | null;
    phoneUsa: string | null;
    phoneBangladesh: string | null;
    phoneBangladeshLink: string | null;
    addressUsa: string | null;
    addressUsaMapUrl: string | null;
    addressBangladesh: string | null;
    addressBangladeshMapUrl: string | null;
    socialFacebook: string | null;
    socialX: string | null;
    socialInstagram: string | null;
    socialLinkedin: string | null;
    socialYoutube: string | null;
    socialBehance: string | null;
    socialPinterest: string | null;
    socialTiktok: string | null;
}

export interface SharedPageProps {
    name: string;
    auth: Auth;
    flash: FlashProps;
    meta?: SiteMeta;
    categories: Record<string, CategoryConfig>;
    siteSettings: SiteSettings;
    [key: string]: unknown;
}

export interface NavItem {
    label: string;
    href: string;
    icon?: string;
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
    icon?: string;
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
    id?: number;
    title: string;
    category: string;
    media_path?: string | null;
    image?: string;
    media_type?: 'image' | 'video';
    alt: string;
    description?: string;
}

export interface PortfolioCategory {
    type: string;
    title: string;
    description: string;
    items: PortfolioItem[];
}

export interface SectionHeading {
    eyebrow: string;
    title: string;
}

export interface ServicePageContent {
    name: string;
    shortDescription: string;
    longDescription: string;
    href: string;
    icon: string;
    subServices: HighlightItem[];
    headings?: {
        capabilities?: SectionHeading;
        whyOpticore?: SectionHeading;
        process?: SectionHeading;
        selectedWork?: SectionHeading;
    };
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
    resume: File | null;
}
