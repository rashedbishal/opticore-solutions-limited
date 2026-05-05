import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Quote, CheckCircle2, ArrowRight } from 'lucide-react';
import GradientOrb from '@/components/UI/GradientOrb';
import MagneticButton from '@/components/UI/MagneticButton';
import mdImage from '@/images/md.jpg';

const commitments = [
    {
        title: 'Clarity in Strategy',
        description:
            'We begin with the business objective, then align every creative and technical decision to that commercial direction.',
    },
    {
        title: 'Discipline in Execution',
        description:
            'Our standard is not to ship quickly at the expense of finish. We move with pace, but we protect quality in every handoff.',
    },
    {
        title: 'Trust in Partnership',
        description:
            'Clients work with us because they need reliability as much as creativity. That trust is something we work to earn repeatedly.',
    },
];

export default function MessageFromMd() {
    return (
        <>
            <Head>
                <title>Message from MD — Opticore Solutions Ltd.</title>
                <meta
                    name="description"
                    content="Read a message from the Managing Director of Opticore Solutions Ltd. about the company vision, values, and commitment to clients."
                />
            </Head>

            <section className="section-shell relative overflow-hidden pt-32 md:pt-40 lg:pt-48">
                {/* Background Decorations */}
                <div className="pointer-events-none absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 opacity-20">
                    <GradientOrb
                        color="var(--color-primary)"
                        className="h-150 w-150"
                    />
                </div>
                <div className="pointer-events-none absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4 opacity-10">
                    <GradientOrb
                        color="var(--color-secondary)"
                        className="h-125 w-125"
                    />
                </div>

                <div className="section-inner relative z-10">
                    <div className="mx-auto mb-16 max-w-4xl text-center lg:mb-24">
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="section-kicker mx-auto mb-6"
                        >
                            Executive Perspective
                        </motion.span>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl leading-[1.1] font-extrabold tracking-tight text-white sm:text-5xl lg:text-7xl"
                        >
                            Vision for{' '}
                            <span className="gradient-text">Excellence</span>,
                            <br />
                            Commitment to{' '}
                            <span className="gradient-text">Growth</span>.
                        </motion.h1>
                    </div>

                    <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16 xl:gap-20">
                        {/* MD Image Sticky Container */}
                        <div className="lg:sticky lg:top-32 lg:col-span-5">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{
                                    duration: 0.8,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="group relative mx-auto flex max-w-md justify-center lg:mx-0 lg:max-w-none"
                            >
                                {/* Decorative elements */}
                                <div className="absolute -inset-4 -rotate-2 rounded-[2.5rem] border border-white/5 transition-transform duration-700 group-hover:rotate-0" />
                                <div className="absolute -inset-4 rotate-2 rounded-[2.5rem] border border-primary/20 transition-transform duration-700 group-hover:rotate-0" />

                                <div className="glass-panel relative aspect-[4/5] h-[60vh] max-h-[700px] min-h-[400px] overflow-hidden rounded-[2rem] border-white/10 shadow-2xl sm:aspect-[3/4] sm:h-[70vh] lg:aspect-[4/5] lg:h-[calc(100vh-200px)]">
                                    <img
                                        src={mdImage}
                                        alt="Md. Asaduzzaman, Managing Director of Opticore Solutions Ltd."
                                        className="h-full w-full scale-105 object-cover filter transition-all duration-700 group-hover:scale-100 group-hover:grayscale-0"
                                    />

                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-40" />

                                    <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/80 to-transparent p-6 pt-20 sm:p-8">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <h3 className="text-xl font-bold tracking-tight whitespace-nowrap text-white sm:text-2xl">
                                                Md. Asaduzzaman
                                            </h3>
                                            <p className="mt-1 text-[10px] font-medium tracking-[0.2em] text-primary uppercase sm:text-sm">
                                                Managing Director
                                            </p>
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="absolute -top-4 -right-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 shadow-xl backdrop-blur-xl">
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                                    <span className="text-[10px] font-bold tracking-widest text-white/70 uppercase">
                                        Founder
                                    </span>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.6 }}
                                className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
                            >
                                {['Strategy', 'Innovation', 'Execution'].map(
                                    (tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full border border-white/5 bg-white/[0.02] px-4 py-1.5 text-[10px] font-bold tracking-widest text-zinc-400 uppercase"
                                        >
                                            {tag}
                                        </span>
                                    ),
                                )}
                            </motion.div>

                            {/* Commitments Grid */}
                            <div className="mt-12 hidden grid-cols-1 gap-6 md:grid-cols-2 lg:grid">
                                {commitments.map((item, index) => (
                                    <motion.div
                                        key={item.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.1 * index }}
                                        className="glass-panel group rounded-3xl border-white/5 p-6 transition-colors hover:border-primary/30"
                                    >
                                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 transition-transform group-hover:scale-110">
                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <h4 className="mb-2 font-bold text-white">
                                            {item.title}
                                        </h4>
                                        <p className="text-xs leading-relaxed text-zinc-400">
                                            {item.description}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Content Side */}
                        <div className="lg:col-span-7">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="glass-panel relative overflow-hidden rounded-[2.5rem] p-8 md:p-12 lg:p-16"
                            >
                                {/* Decorative Quote Icon */}
                                <Quote className="pointer-events-none absolute top-12 right-12 h-24 w-24 -rotate-12 text-white/[0.03]" />

                                <div className="prose prose-invert relative z-10 max-w-none">
                                    <p className="mb-8 border-l-4 border-primary pl-8 text-xl leading-relaxed font-light text-white italic md:text-2xl">
                                        "Digital transformation is not merely a
                                        technical shift, but a strategic
                                        imperative that defines the future of
                                        every brand."
                                    </p>

                                    <div className="space-y-6 text-lg leading-relaxed font-light text-zinc-300">
                                        <p>
                                            Opticore Solutions Ltd. was
                                            established on a simple yet powerful
                                            conviction: that in an increasingly
                                            crowded digital landscape, only
                                            those who combine{' '}
                                            <span className="font-medium text-white">
                                                creative ambition
                                            </span>{' '}
                                            with{' '}
                                            <span className="font-medium text-white">
                                                operational discipline
                                            </span>{' '}
                                            will truly stand out.
                                        </p>

                                        <p>
                                            Since our inception, our focus has
                                            been to bridge the gap between
                                            abstract strategy and tactical
                                            execution. Too many businesses
                                            settle for fragmented solutions that
                                            dilute their message and weaken
                                            their market position. We advocate
                                            for a different position.
                                        </p>

                                        <p>
                                            We believe every visual, every line
                                            of code, and every interaction is a
                                            brand asset that must work toward a
                                            singular objective:{' '}
                                            <span className="font-medium text-primary">
                                                building trust and momentum
                                            </span>
                                            .
                                        </p>

                                        <p>
                                            Whether we are developing a complex
                                            web ecosystem, a brand identity, or
                                            a motion campaign, our
                                            responsibility remains constant: to
                                            deliver work that feels premium and
                                            performs with purpose.
                                        </p>

                                        <p>
                                            Our clients trust us with their most
                                            ambitious goals. We respect that by
                                            staying disciplined in our process
                                            and uncompromising in our quality
                                            standards. We are not just vendors;
                                            we are partners in your growth
                                            journey.
                                        </p>
                                    </div>

                                    <div className="mt-16 border-t border-white/5 pt-12">
                                        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end lg:flex-col lg:items-start xl:flex-row xl:items-end">
                                            <div className="shrink-0">
                                                <p className="font-serif text-4xl leading-none whitespace-nowrap text-white italic">
                                                    Md. Asaduzzaman
                                                </p>
                                                <div className="mt-4 h-0.5 w-32 bg-linear-to-r from-primary to-transparent" />
                                                <p className="mt-4 text-xs font-bold tracking-[0.3em] text-primary uppercase">
                                                    Managing Director
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-medium tracking-widest text-zinc-500 uppercase">
                                                <span className="whitespace-nowrap">
                                                    EST. 2015
                                                </span>
                                                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                                                <span className="whitespace-nowrap">
                                                    OPTICORE SOLUTIONS LTD.
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Commitments Grid */}
                            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 lg:hidden">
                                {commitments.map((item, index) => (
                                    <motion.div
                                        key={item.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.1 * index }}
                                        className="glass-panel group rounded-3xl border-white/5 p-6 transition-colors hover:border-primary/30"
                                    >
                                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 transition-transform group-hover:scale-110">
                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <h4 className="mb-2 font-bold text-white">
                                            {item.title}
                                        </h4>
                                        <p className="text-xs leading-relaxed text-zinc-400">
                                            {item.description}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* CTA Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="group relative mt-12 overflow-hidden rounded-[2.5rem] border border-white/5 bg-linear-to-br from-primary/20 via-primary/5 to-transparent p-6 md:p-10"
                            >
                                <div className="relative z-10 flex flex-col items-center justify-between gap-8 text-center sm:flex-row sm:text-left xl:flex-row">
                                    <div className="max-w-md">
                                        <h3 className="mb-3 text-2xl font-bold text-white">
                                            Ready to transform your brand?
                                        </h3>
                                        <p className="text-sm text-zinc-400">
                                            Join the ranks of ambitious
                                            businesses that trust Opticore for
                                            their digital excellence.
                                        </p>
                                    </div>
                                    <div className="shrink-0">
                                        <MagneticButton
                                            href="/request-appointment"
                                            className="group/btn"
                                            ariaLabel={''}
                                        >
                                            <span className="flex items-center gap-2 px-2 whitespace-nowrap">
                                                Start Conversation
                                                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover/btn:translate-x-1" />
                                            </span>
                                        </MagneticButton>
                                    </div>
                                </div>

                                {/* Background Glow */}
                                <div className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 bg-radial from-primary/20 to-transparent" />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bottom spacer for footer */}
            <div className="h-32" />
        </>
    );
}
