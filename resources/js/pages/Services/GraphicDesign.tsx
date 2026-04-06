import ServicePageTemplate from '@/components/Services/ServicePageTemplate';
import { servicePageContent } from '@/lib/site';

export default function GraphicDesign() {
    return <ServicePageTemplate service={servicePageContent['graphic-design']} />;
}
