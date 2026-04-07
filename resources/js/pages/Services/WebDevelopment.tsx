import ServicePageTemplate from '@/components/Services/ServicePageTemplate';
import { servicePageContent } from '@/lib/site';

export default function WebDevelopment() {
    return (
        <ServicePageTemplate service={servicePageContent['web-development']} />
    );
}
