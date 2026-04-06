import type { FlashProps, SiteMeta } from '@/types';
import type { Auth } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            flash: FlashProps;
            meta?: SiteMeta;
            [key: string]: unknown;
        };
    }
}
