import { Head } from '@inertiajs/react';
import { m as motion } from 'framer-motion';
import { useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { privacySections } from '@/lib/site';

export default function PrivacyPolicy() {
    const mobile = useMediaQuery('(max-width: 1023px)');
    const [activeSection, setActiveSection] = useState(
        privacySections[0]?.id ?? 'overview',
    );

    return (
        <>
            <Head>
                <title>Privacy Policy</title>
                <meta
                    name="description"
                    content="Read the privacy policy for Opticore Solutions Ltd."
                />
                <meta
                    property="og:title"
                    content="Privacy Policy — Opticore Solutions Ltd."
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
            </Head>

            <section className="section-shell pt-32 md:pt-36 lg:pt-40">
                <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-8 px-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                    {mobile ? (
                        <select
                            value={activeSection}
                            onChange={(event) => {
                                setActiveSection(event.target.value);
                                document
                                    .getElementById(event.target.value)
                                    ?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="rounded-2xl border border-theme bg-theme-surface px-4 py-3 text-foreground outline-none"
                        >
                            {privacySections.map((section) => (
                                <option
                                    key={section.id}
                                    value={section.id}
                                    className="bg-surface"
                                >
                                    {section.title}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <aside className="sticky top-28 h-fit rounded-[2rem] border border-theme bg-theme-surface p-5 backdrop-blur-md">
                            <p className="text-sm font-semibold tracking-[0.24em] text-theme-muted uppercase">
                                Contents
                            </p>
                            <div className="mt-4 space-y-2">
                                {privacySections.map((section) => (
                                    <a
                                        key={section.id}
                                        href={`#${section.id}`}
                                        className="block rounded-xl px-3 py-2 text-sm text-theme-muted transition-colors hover:bg-theme-surface hover:text-foreground"
                                    >
                                        {section.title}
                                    </a>
                                ))}
                            </div>
                        </aside>
                    )}

                    <div className="glass-panel rounded-[2rem] p-6 sm:p-10">
                        <h1 className="text-4xl font-extrabold text-foreground sm:text-5xl">
                            Privacy Policy
                        </h1>
                        <div className="legal-content mt-10">
                            {privacySections.map((section) => (
                                <motion.section
                                    key={section.id}
                                    id={section.id}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-80px' }}
                                    transition={{ duration: 0.6 }}
                                    className="mb-10 scroll-mt-32"
                                >
                                    <h2>{section.title}</h2>
                                    {section.body.map((paragraph) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}
                                </motion.section>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
