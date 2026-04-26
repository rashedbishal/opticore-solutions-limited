import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import MagneticButton from '@/components/UI/MagneticButton';
import Marquee from '@/components/UI/Marquee';
import SectionHeader from '@/components/UI/SectionHeader';
import { clientLogos } from '@/lib/site';

const values = [
    {
        title: 'Innovation',
        description:
            'We push for sharper ideas, fresher visual language, and better digital solutions instead of relying on safe templates.',
    },
    {
        title: 'Quality',
        description:
            'Every detail matters, from motion timing and typography to code structure and production finish.',
    },
    {
        title: 'Integrity',
        description:
            'We communicate directly, scope honestly, and keep promises visible through every stage of the project.',
    },
    {
        title: 'Client-First',
        description:
            'Our process is built to make the client look stronger, move faster, and feel supported from brief to delivery.',
    },
];

const storySections = [
    {
        title: 'A digital partner, not just a vendor',
        body: 'Opticore Solutions Ltd. was built to help ambitious brands feel more polished, more credible, and more ready for growth. We bring strategy, design, motion, and development together so clients are not forced to manage disconnected specialists.',
    },
    {
        title: 'Craft that serves business outcomes',
        body: 'We believe premium design is not decoration. It changes how audiences perceive value, trust, and quality. That is why every Opticore deliverable is grounded in business goals as much as visual ambition.',
    },
    {
        title: 'Execution with momentum',
        body: 'Our team moves quickly, communicates clearly, and keeps quality high even under pressure. We work with founders, marketers, and product teams who need sharp output without unnecessary complexity.',
    },
];

export default function About() {
    return (
        <>
            <Head>
                <title>About Us — Opticore Solutions Ltd.</title>
                <meta
                    name="description"
                    content="Learn how Opticore Solutions Ltd. helps brands grow, earn trust, and stand apart through premium digital execution."
                />
                <meta
                    property="og:title"
                    content="About Us — Opticore Solutions Ltd."
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
            </Head>

            <section className="section-shell pt-32 md:pt-36 lg:pt-40">
                <div className="section-inner">
                    <div className="glass-panel rounded-[2rem] p-6 sm:p-10 lg:p-14">
                        <span className="section-kicker">About Us</span>
                        <h1 className="text-4xl font-extrabold text-balance text-theme sm:text-5xl md:text-6xl">
                            <span className="gradient-text">
                                Empowering You to Grow, Earn, and Succeed
                            </span>
                        </h1>
                        <p className="mt-6 max-w-3xl text-base leading-8 text-theme-muted sm:text-lg">
                            Opticore Solutions Ltd. helps businesses build
                            stronger perception and sharper digital experiences
                            through premium creative, production, and
                            development services.
                        </p>
                    </div>
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner space-y-10">
                    {storySections.map((section, index) => (
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
                                className={`glass-panel rounded-[2rem] p-5 sm:p-8 ${index % 2 === 1 ? 'lg:order-2' : ''}`}
                            >
                                <span className="section-kicker">
                                    0{index + 1}
                                </span>
                                <h2 className="text-3xl font-bold text-theme">
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
                                className={`glass-panel rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.2),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 sm:p-8 ${index % 2 === 1 ? 'lg:order-1' : ''}`}
                            >
                                <div className="flex h-full min-h-[18rem] flex-col justify-between">
                                    <p className="text-sm font-semibold tracking-[0.24em] text-cyan-400 uppercase dark:text-cyan-300">
                                        Opticore Perspective
                                    </p>
                                    <p className="text-2xl font-semibold text-balance text-theme sm:text-3xl">
                                        Premium digital work only matters when
                                        it creates trust, momentum, and
                                        commercial advantage.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    ))}
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
                        {values.map((value) => (
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
                                className="glass-panel rounded-[2rem] p-6"
                            >
                                <h3 className="text-xl font-semibold text-theme">
                                    {value.title}
                                </h3>
                                <p className="mt-3 text-sm leading-7 text-theme-muted">
                                    {value.description}
                                </p>
                            </motion.article>
                        ))}
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
                    <div className="glass-panel rounded-[2rem] border-t border-t-cyan-400/70 p-6 text-center sm:p-10 lg:p-14">
                        <h2 className="text-3xl font-extrabold text-balance text-theme sm:text-4xl md:text-5xl">
                            Let’s shape the next version of your brand.
                        </h2>
                        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-theme-muted sm:text-lg">
                            If you need sharper creative, more refined digital
                            delivery, or a partner that can connect strategy
                            with execution, Opticore is ready.
                        </p>
                        <div className="mt-8 flex justify-center">
                            <MagneticButton
                                href="/request-appointment"
                                ariaLabel="Request an appointment"
                            >
                                Start a Conversation
                            </MagneticButton>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
