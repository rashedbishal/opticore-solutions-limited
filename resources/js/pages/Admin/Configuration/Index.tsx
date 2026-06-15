import type { FormEventHandler, ReactNode } from 'react';
import { useForm } from '@inertiajs/react';
import { Loader2, Mail, MapPin, Save, Share2 } from 'lucide-react';
import { useState } from 'react';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import AdminLayout from '@/components/Layout/AdminLayout';
import {
    BehanceIcon,
    FacebookIcon,
    InstagramIcon,
    LinkedInIcon,
    PinterestIcon,
    TikTokIcon,
    XIcon,
    YouTubeIcon,
} from '@/components/UI/SocialIcons';
import adminRoutes from '@/routes/admin';

interface SiteSettingData {
    contact_email: string | null;
    phone_usa: string | null;
    phone_bangladesh: string | null;
    address_usa: string | null;
    address_usa_map_url: string | null;
    address_bangladesh: string | null;
    address_bangladesh_map_url: string | null;
    social_facebook: string | null;
    social_x: string | null;
    social_instagram: string | null;
    social_linkedin: string | null;
    social_youtube: string | null;
    social_behance: string | null;
    social_pinterest: string | null;
    social_tiktok: string | null;
}

interface Props {
    settings: SiteSettingData;
}

const INPUT =
    'block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5';
const LABEL =
    'mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase';
const SECTION_TITLE =
    'mb-6 flex items-center gap-2 text-sm font-semibold text-white';
const CARD =
    'relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-8 backdrop-blur-sm';
const CARD_ACCENT =
    'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent';

const SOCIAL_FIELDS = [
    {
        key: 'social_facebook' as const,
        label: 'Facebook',
        icon: FacebookIcon,
        placeholder: 'https://www.facebook.com/yourpage',
    },
    {
        key: 'social_x' as const,
        label: 'X (Twitter)',
        icon: XIcon,
        placeholder: 'https://x.com/yourhandle',
    },
    {
        key: 'social_instagram' as const,
        label: 'Instagram',
        icon: InstagramIcon,
        placeholder: 'https://www.instagram.com/yourhandle',
    },
    {
        key: 'social_linkedin' as const,
        label: 'LinkedIn',
        icon: LinkedInIcon,
        placeholder: 'https://www.linkedin.com/in/yourpage',
    },
    {
        key: 'social_youtube' as const,
        label: 'YouTube',
        icon: YouTubeIcon,
        placeholder: 'https://www.youtube.com/@yourchannel',
    },
    {
        key: 'social_behance' as const,
        label: 'Behance',
        icon: BehanceIcon,
        placeholder: 'https://www.behance.net/yourprofile',
    },
    {
        key: 'social_pinterest' as const,
        label: 'Pinterest',
        icon: PinterestIcon,
        placeholder: 'https://www.pinterest.com/yourprofile',
    },
    {
        key: 'social_tiktok' as const,
        label: 'TikTok',
        icon: TikTokIcon,
        placeholder: 'https://www.tiktok.com/@yourhandle',
    },
];

export default function ConfigurationIndex({ settings }: Props) {
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const { data, setData, put, processing } = useForm({
        contact_email: settings.contact_email ?? '',
        phone_usa: settings.phone_usa ?? '',
        phone_bangladesh: settings.phone_bangladesh ?? '',
        address_usa: settings.address_usa ?? '',
        address_usa_map_url: settings.address_usa_map_url ?? '',
        address_bangladesh: settings.address_bangladesh ?? '',
        address_bangladesh_map_url: settings.address_bangladesh_map_url ?? '',
        social_facebook: settings.social_facebook ?? '',
        social_x: settings.social_x ?? '',
        social_instagram: settings.social_instagram ?? '',
        social_linkedin: settings.social_linkedin ?? '',
        social_youtube: settings.social_youtube ?? '',
        social_behance: settings.social_behance ?? '',
        social_pinterest: settings.social_pinterest ?? '',
        social_tiktok: settings.social_tiktok ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(adminRoutes.configuration.update.url(), {
            preserveScroll: true,
            onError: (errs) =>
                setErrorMessages(
                    Object.values(errs).filter(Boolean) as string[],
                ),
        });
    };

    return (
        <>
            <CmsErrorDialog
                messages={errorMessages}
                onClose={() => setErrorMessages([])}
            />
            <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
                <div className={CARD}>
                    <div className={CARD_ACCENT} />
                    <h2 className={SECTION_TITLE}>
                        <Mail className="h-4 w-4 text-violet-400" /> Contact
                        Details
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className={LABEL}>Contact Email</label>
                            <input
                                type="email"
                                value={data.contact_email}
                                onChange={(e) =>
                                    setData('contact_email', e.target.value)
                                }
                                placeholder="hello@example.com"
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>Phone (USA)</label>
                            <input
                                type="text"
                                value={data.phone_usa}
                                onChange={(e) =>
                                    setData('phone_usa', e.target.value)
                                }
                                placeholder="+1 (575) 303-6925"
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>Phone (Bangladesh)</label>
                            <input
                                type="text"
                                value={data.phone_bangladesh}
                                onChange={(e) =>
                                    setData('phone_bangladesh', e.target.value)
                                }
                                placeholder="+88-01XXXXXXXXX"
                                className={INPUT}
                            />
                        </div>
                    </div>
                </div>

                <div className={CARD}>
                    <div className={CARD_ACCENT} />
                    <h2 className={SECTION_TITLE}>
                        <MapPin className="h-4 w-4 text-violet-400" /> Addresses
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <label className={LABEL}>USA Address</label>
                            <textarea
                                value={data.address_usa}
                                onChange={(e) =>
                                    setData('address_usa', e.target.value)
                                }
                                rows={4}
                                placeholder={
                                    'Opticore Solutions LLC\n1209 Mountain Road PL NE STE N\nAlbuquerque, NM 87110'
                                }
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>
                                USA &ndash; View on Map URL
                            </label>
                            <input
                                type="url"
                                value={data.address_usa_map_url}
                                onChange={(e) =>
                                    setData(
                                        'address_usa_map_url',
                                        e.target.value,
                                    )
                                }
                                placeholder="https://maps.app.goo.gl/..."
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>Bangladesh Address</label>
                            <textarea
                                value={data.address_bangladesh}
                                onChange={(e) =>
                                    setData(
                                        'address_bangladesh',
                                        e.target.value,
                                    )
                                }
                                rows={4}
                                placeholder={
                                    'House # 1178, (1st Floor) Apt.- 2E\nEast Monipur, Mirpur, Dhaka-1216'
                                }
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>
                                Bangladesh &ndash; View on Map URL
                            </label>
                            <input
                                type="url"
                                value={data.address_bangladesh_map_url}
                                onChange={(e) =>
                                    setData(
                                        'address_bangladesh_map_url',
                                        e.target.value,
                                    )
                                }
                                placeholder="https://maps.app.goo.gl/..."
                                className={INPUT}
                            />
                        </div>
                    </div>
                </div>

                <div className={CARD}>
                    <div className={CARD_ACCENT} />
                    <h2 className={SECTION_TITLE}>
                        <Share2 className="h-4 w-4 text-violet-400" /> Social
                        Media Links
                    </h2>
                    <p className="-mt-4 mb-6 text-xs text-zinc-500">
                        Leave a field empty to hide that platform's icon from
                        the website footer and contact page.
                    </p>
                    <div className="grid gap-6 sm:grid-cols-2">
                        {SOCIAL_FIELDS.map(
                            ({ key, label, icon: Icon, placeholder }) => (
                                <div key={key}>
                                    <label className={LABEL}>
                                        <span className="inline-flex items-center gap-1.5">
                                            <Icon className="h-3.5 w-3.5" />{' '}
                                            {label}
                                        </span>
                                    </label>
                                    <input
                                        type="url"
                                        value={data[key]}
                                        onChange={(e) =>
                                            setData(key, e.target.value)
                                        }
                                        placeholder={placeholder}
                                        className={INPUT}
                                    />
                                </div>
                            ),
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        disabled={processing}
                        type="submit"
                        className="relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-[0_0_38px_rgba(124,58,237,0.65),inset_0_1px_0_rgba(255,255,255,0.2)] hover:before:translate-x-full disabled:opacity-50"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" /> Save Configuration
                            </>
                        )}
                    </button>
                </div>
            </form>
        </>
    );
}

ConfigurationIndex.layout = (page: ReactNode) => (
    <AdminLayout title="Configuration">{page}</AdminLayout>
);
