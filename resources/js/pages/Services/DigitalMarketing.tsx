import ServicePageTemplate from '@/components/Services/ServicePageTemplate';
import { servicePageContent } from '@/lib/site';

export default function DigitalMarketing() {
    return <ServicePageTemplate service={servicePageContent['digital-marketing']} />;
}
