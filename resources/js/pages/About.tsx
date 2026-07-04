import { Head } from '@inertiajs/react';
import { m as motion } from 'framer-motion';
import { Handshake, Lightbulb, ShieldCheck, Trophy } from 'lucide-react';
import Marquee from '@/components/UI/Marquee';
import SectionHeader from '@/components/UI/SectionHeader';
import { cardAccent } from '@/lib/cardAccents';
import { clientLogos } from '@/lib/site';

const values = [
    {
        title: 'Innovation',
        description:
            'We embrace creativity, technology, and forward-thinking ideas to help businesses stay ahead in a changing digital landscape.',
        icon: Lightbulb,
    },
    {
        title: 'Excellence',
        description:
            'We maintain high standards in every project, ensuring professional quality, attention to detail, and consistent results.',
        icon: Trophy,
    },
    {
        title: 'Integrity',
        description:
            'Transparency, accountability, and trust guide every relationship we build with clients and partners.',
        icon: ShieldCheck,
    },
    {
        title: 'Partnership',
        description:
            'We believe long-term success is achieved through collaboration, communication, and shared goals.',
        icon: Handshake,
    },
];

const storySections = [
    {
        title: 'More Than a Service Provider',
        body: 'We work as an extension of our clients’ teams. By combining creativity, strategic thinking, and technical expertise, we help businesses solve challenges, improve visibility, and create long-term value.',
        perspective:
            'A vendor delivers what is asked. A partner asks what the business actually needs.',
    },
    {
        title: 'Creativity With Purpose',
        body: 'We believe creative work should serve a business objective. Every design, animation, campaign, and website is developed with clear goals, measurable outcomes, and user-focused experiences.',
        perspective:
            'Great design is judged by the outcome it drives, not just the reaction it gets.',
    },
    {
        title: 'Built for Growth',
        body: 'As industries evolve, so do we. Our team continuously develops new skills, embraces emerging technologies, and refines processes to deliver future-ready solutions for our clients.',
        perspective:
            'Staying relevant is not a one-time achievement. It is a habit we practice on every project.',
    },
];

export default function About() {
    return (
        <>
            <Head>
                <title>About Us</title>
                <meta
                    name="description"
                    content="Learn how Opticore Solutions Limited helps brands grow, earn trust, and stand apart through premium digital execution."
                />
                <meta
                    property="og:title"
                    content="About Us — Opticore Solutions Limited"
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
            </Head>

            <section className="section-shell pt-32 md:pt-36 lg:pt-40">
                <div className="section-inner">
                    <div className="neo-panel-elevated rounded-[2rem] p-6 sm:p-10 lg:p-14">
                        <span className="section-kicker">About Us</span>
                        <h1 className="text-4xl font-extrabold text-balance text-theme sm:text-5xl md:text-6xl">
                            <span className="gradient-text">
                                Empowering Businesses Through Creative
                                Excellence
                            </span>
                        </h1>
                        <p className="mt-6 max-w-3xl text-base leading-8 text-theme-muted sm:text-lg">
                            Opticore Solutions Ltd. is a multidisciplinary
                            creative and digital solutions company helping
                            businesses strengthen brand perception, improve
                            communication, and achieve sustainable growth.
                        </p>
                        <p className="mt-4 max-w-3xl text-base leading-8 text-theme-muted sm:text-lg">
                            From strategic graphic design and engaging video
                            content to immersive 3D visualization, digital
                            marketing, and high-performance web development, we
                            create solutions that combine creativity with
                            measurable business impact.
                        </p>
                    </div>
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner space-y-10">
                    {storySections.map((section, index) => {
                        const accent = cardAccent(index);

                        return (
                            <div
                                key={section.title}
                                className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12"
                            >
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        x: index % 2 === 0 ? -80 : 80,
                                    }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: '-80px' }}
                                    transition={{
                                        duration: 0.8,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    className={`neo-panel rounded-[2rem] border-t-2 p-5 sm:p-8 ${accent.ring} ${index % 2 === 1 ? 'lg:order-2' : ''}`}
                                >
                                    <span
                                        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black ${accent.chip} ${accent.icon}`}
                                    >
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <h2 className="mt-4 text-3xl font-bold text-theme">
                                        {section.title}
                                    </h2>
                                    <p className="mt-5 text-base leading-8 text-theme-muted sm:text-lg">
                                        {section.body}
                                    </p>
                                </motion.div>
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        x: index % 2 === 0 ? 80 : -80,
                                    }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: '-80px' }}
                                    transition={{
                                        duration: 0.8,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    className={`neo-panel-elevated relative overflow-hidden rounded-[2rem] border-t-2 p-5 sm:p-8 ${accent.ring} ${index % 2 === 1 ? 'lg:order-1' : ''}`}
                                >
                                    <div
                                        className={`pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full blur-3xl ${accent.chip}`}
                                    />
                                    <div className="relative flex h-full min-h-[18rem] flex-col justify-between">
                                        <p
                                            className={`text-sm font-semibold tracking-[0.24em] uppercase ${accent.icon}`}
                                        >
                                            Opticore Perspective
                                        </p>
                                        <p className="text-2xl font-semibold text-balance text-theme sm:text-3xl">
                                            {section.perspective}
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <SectionHeader
                        eyebrow="Core Values"
                        title="How We Work"
                        description="The standards behind every project, conversation, and final deliverable."
                        align="center"
                    />
                    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                        {values.map((value, index) => {
                            const accent = cardAccent(index);
                            const Icon = value.icon;

                            return (
                                <motion.article
                                    key={value.title}
                                    initial={{
                                        opacity: 0,
                                        rotate: -15,
                                        scale: 0.8,
                                    }}
                                    whileInView={{
                                        opacity: 1,
                                        rotate: 0,
                                        scale: 1,
                                    }}
                                    viewport={{ once: true, margin: '-80px' }}
                                    transition={{
                                        duration: 0.6,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    className={`neo-panel rounded-[2rem] border-t-2 p-6 ${accent.ring}`}
                                >
                                    <span
                                        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${accent.chip} ${accent.icon}`}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <h3 className="mt-4 text-xl font-semibold text-theme">
                                        {value.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-7 text-theme-muted">
                                        {value.description}
                                    </p>
                                </motion.article>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <Marquee items={clientLogos} />
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <div className="neo-panel-elevated rounded-[2rem] border-t-2 border-t-cyan-500/70 p-6 text-center sm:p-10 lg:p-14">
                        <h2 className="text-3xl font-extrabold text-balance text-theme sm:text-4xl md:text-5xl">
                            Let’s shape the next version of your brand.
                        </h2>
                        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-theme-muted sm:text-lg">
                            If you need sharper creative, more refined digital
                            delivery, or a partner that can connect strategy
                            with execution, Opticore is ready.
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}
