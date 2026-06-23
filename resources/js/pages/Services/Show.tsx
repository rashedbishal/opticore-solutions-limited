import type { ServicePageContent } from '@/types';
import ServicePageTemplate from '@/components/Services/ServicePageTemplate';

export default function Show({ service }: { service: ServicePageContent }) {
    return <ServicePageTemplate service={service} />;
}
