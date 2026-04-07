import { Head, Link } from '@inertiajs/react';
import { motion  } from 'framer-motion';
import type {Variants} from 'framer-motion';
import {
    ArrowRight,
    Check,
    Palette,
    Megaphone,
    Clapperboard,
    Box,
    Code2,
    PenTool,
    Paintbrush,
    Video,
    Film,
    MonitorPlay,
    Layers,
    BoxSelect,
    Globe,
    Terminal,
    Smartphone,
    Camera,
    ScanLine,
    Cpu,
    Sparkles,
    LucideIcon
} from 'lucide-react';
import MagneticButton from '@/components/UI/MagneticButton';
import SectionHeader from '@/components/UI/SectionHeader';
import type { ServicePageContent } from '@/types';
import ScrambledText from '../text-animations/scramble-text-scroll';

// Icon mapping for service pages
const iconMap: Record<string, LucideIcon> = {
    // Graphic Design icons
    Palette,
    PenTool,
    Paintbrush,
    // Video Editing icons
    Clapperboard,
    Video,
    Film,
    MonitorPlay,
    Camera,
    ScanLine,
    // Digital Marketing icons
    Megaphone,
    Globe,
    Smartphone,
    // 3D Production icons
    Box,
    Layers,
    BoxSelect,
    Cpu,
    // Web Development icons
    Code2,
    Terminal,
};

const easing = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: easing },
    },
};

const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.7, ease: easing },
    },
};

const rotateFade: Variants = {
    hidden: { opacity: 0, rotate: -15, scale: 0.8 },
    visible: {
        opacity: 1,
        rotate: 0,
        scale: 1,
        transition: { duration: 0.6, ease: easing },
    },
};

interface ServicePageTemplateProps {
    service: ServicePageContent;
}

export default function ServicePageTemplate({ service }: ServicePageTemplateProps) {
    const ServiceIcon = iconMap[service.icon] || Sparkles;

    return (
        <>
            <Head>
                <title>{`${service.name} — Opticore Solutions Ltd.`}</title>
                <meta name="description" content={service.shortDescription} />
                <meta property="og:title" content={`${service.name} — Opticore Solutions Ltd.`} />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <section className="section-shell pt-32 md:pt-36 lg:pt-40">
                <div className="section-inner">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="glass-panel hero-noise relative overflow-hidden rounded-[2rem] p-8 sm:p-10 lg:p-14"
                    >
                        <div className="relative z-10 max-w-3xl">
                            <span className="section-kicker">Premium Service</span>
                            <h1 className="text-balance text-4xl font-extrabold text-white sm:text-5xl md:text-6xl lg:text-7xl">
                                <ScrambledText
                                    text={service.name}
                                    className="gradient-text"
                                />
                            </h1>
                            <p className="mt-6 text-base leading-8 text-zinc-300 sm:text-lg">{service.longDescription}</p>
                            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                                <MagneticButton
                                    href="/request-appointment"
                                    ariaLabel={`Start a ${service.name} project`}
                                >
                                    Start a Project
                                </MagneticButton>
                                <Link
                                    href="/contact"
                                    className="touch-target inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                                >
                                    Talk to the Team
                                </Link>
                            </div>
                        </div>
                        <div className="absolute top-10 right-10 hidden h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/5 text-violet-300 lg:flex">
                            <ServiceIcon className="h-10 w-10" />
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <SectionHeader
                        eyebrow="Capabilities"
                        title={`What’s Included in ${service.name}`}
                        description="Each engagement is structured to give you premium execution, clear communication, and assets ready to perform in the real world."
                    />
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }}
                        className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8"
                    >
                        {service.subServices.map((item) => (
                            <motion.article key={item.title} variants={scaleIn} className="glass-panel rounded-[2rem] p-6">
                                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                                <p className="mt-3 text-sm leading-7 text-zinc-400">{item.description}</p>
                            </motion.article>
                        ))}
                    </motion.div>
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <SectionHeader
                        eyebrow="Why Opticore"
                        title="Built for Ambitious Teams"
                        description="We combine strategic thinking with refined execution so your output looks strong and works harder."
                    />
                    <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 lg:gap-8">
                        {service.reasons.map((reason) => (
                            <motion.article
                                key={reason.title}
                                variants={rotateFade}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: '-80px' }}
                                className="glass-panel rounded-[2rem] p-6"
                            >
                                <Check className="h-10 w-10 text-cyan-300" />
                                <h3 className="mt-6 text-xl font-semibold text-white">{reason.title}</h3>
                                <p className="mt-3 text-sm leading-7 text-zinc-400">{reason.description}</p>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <SectionHeader
                        eyebrow="Process"
                        title="A Clear Delivery Rhythm"
                        description="Our workflow stays structured from first call to final handoff so progress remains fast and visible."
                    />
                    <div className="mt-10">
                        <div className="hidden gap-6 md:grid md:grid-cols-4">
                            {service.process.map((step, index) => (
                                <motion.div
                                    key={step.title}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: '-80px' }}
                                    className="glass-panel rounded-[2rem] p-6"
                                >
                                    <span className="text-sm font-semibold tracking-[0.24em] text-cyan-300 uppercase">
                                        0{index + 1}
                                    </span>
                                    <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-zinc-400">{step.description}</p>
                                </motion.div>
                            ))}
                        </div>
                        <div className="space-y-4 md:hidden">
                            {service.process.map((step, index) => (
                                <motion.div
                                    key={step.title}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: '-80px' }}
                                    className="glass-panel relative rounded-[2rem] p-6 pl-10"
                                >
                                    <span className="absolute top-7 left-5 h-2 w-2 rounded-full bg-cyan-300" />
                                    <span className="text-sm font-semibold tracking-[0.24em] text-cyan-300 uppercase">
                                        0{index + 1}
                                    </span>
                                    <h3 className="mt-3 text-xl font-semibold text-white">{step.title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-zinc-400">{step.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <SectionHeader
                        eyebrow="Selected Work"
                        title="Proof in the Execution"
                        description="A quick look at the kind of premium craft Opticore delivers across identity, motion, digital, and product storytelling."
                    />
                    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6 lg:gap-8">
                        {service.portfolio.map((item) => (
                            <motion.article
                                key={item.title}
                                variants={scaleIn}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: '-80px' }}
                                className="group glass-panel overflow-hidden rounded-[2rem]"
                            >
                                <img
                                    src={item.image}
                                    alt={item.alt}
                                    loading="lazy"
                                    onError={(e) => {
                                        e.currentTarget.src = 'https://placehold.co/600x400/111111/7C3AED?text=Opticore';
                                    }}
                                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="p-5">
                                    <p className="text-xs font-semibold tracking-[0.24em] text-cyan-300 uppercase">{item.category}</p>
                                    <h3 className="mt-2 text-xl font-semibold text-white">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-7 text-zinc-400">{item.description}</p>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section-shell pt-0">
                <div className="section-inner">
                    <div className="glass-panel rounded-[2rem] border-t border-t-cyan-400/70 p-8 text-center sm:p-10 lg:p-14">
                        <p className="section-kicker">Next Step</p>
                        <h2 className="text-balance text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">
                            Ready to Build Something Amazing?
                        </h2>
                        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
                            Bring us your brief, rough idea, launch target, or full roadmap. We will turn it into a premium deliverable with speed and intent.
                        </p>
                        <div className="mt-8 flex justify-center">
                            <MagneticButton
                                href="/request-appointment"
                                ariaLabel="Request an appointment"
                            >
                                Start Your Project <ArrowRight className="ml-2 h-4 w-4" />
                            </MagneticButton>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
