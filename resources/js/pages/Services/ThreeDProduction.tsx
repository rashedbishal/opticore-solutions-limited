import ServicePageTemplate from '@/components/Services/ServicePageTemplate';
import { servicePageContent } from '@/lib/site';

export default function ThreeDProduction() {
    return (
        <ServicePageTemplate service={servicePageContent['3d-production']} />
    );
}
