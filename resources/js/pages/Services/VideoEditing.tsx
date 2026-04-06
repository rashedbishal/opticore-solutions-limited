import ServicePageTemplate from '@/components/Services/ServicePageTemplate';
import { servicePageContent } from '@/lib/site';

export default function VideoEditing() {
    return <ServicePageTemplate service={servicePageContent['video-editing']} />;
}
