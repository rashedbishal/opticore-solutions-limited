import { Head } from '@inertiajs/react';
import { AnimatePresence, m as motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import SectionHeader from '@/components/UI/SectionHeader';
import { faqItems } from '@/lib/site';

interface FaqItem {
    question: string;
    answer: string;
}

interface Props {
    faqs?: FaqItem[];
}

export default function FAQ({ faqs = [] }: Props) {
    const visibleFaqs = faqs.length > 0 ? faqs : faqItems;
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <>
            <Head>
                <title>FAQ — Opticore Solutions Ltd.</title>
                <meta
                    name="description"
                    content="Answers to common questions about Opticore Solutions Ltd. services, process, pricing, revisions, delivery, and hiring."
                />
                <meta
                    property="og:title"
                    content="FAQ — Opticore Solutions Ltd."
                />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
            </Head>

            <section className="section-shell pt-32 md:pt-36 lg:pt-40">
                <div className="mx-auto w-full max-w-3xl px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mx-auto max-w-4xl text-center"
                    >
                        <span className="section-kicker mx-auto mb-6">FAQ</span>
                        <h1 className="mb-6 text-4xl leading-tight font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-5xl md:text-6xl">
                            Frequently Asked Questions
                        </h1>
                        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                            Everything clients usually want to know before the first brief, call, or kickoff.
                        </p>
                    </motion.div>

                    <div className="mt-10 space-y-4">
                        {visibleFaqs.map((item, index) => {
                            const open = openIndex === index;

                            return (
                                <div
                                    key={item.question}
                                    className="glass-panel overflow-hidden rounded-[1.75rem] bg-white shadow-xl shadow-zinc-200/50 dark:bg-white/5 dark:shadow-xl dark:shadow-black/20"
                                >
                                    <button
                                        type="button"
                                        aria-label={`Toggle answer for ${item.question}`}
                                        className="touch-target flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                                        onClick={() =>
                                            setOpenIndex(open ? null : index)
                                        }
                                    >
                                        <span className="text-base font-semibold text-zinc-900 dark:text-white sm:text-lg">
                                            {item.question}
                                        </span>
                                        <motion.span
                                            animate={{ rotate: open ? 180 : 0 }}
                                            transition={{ duration: 0.25 }}
                                        >
                                            <ChevronDown className="h-5 w-5 text-cyan-300" />
                                        </motion.span>
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {open ? (
                                            <motion.div
                                                initial={{
                                                    height: 0,
                                                    opacity: 0,
                                                }}
                                                animate={{
                                                    height: 'auto',
                                                    opacity: 1,
                                                }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="border-t border-zinc-200 px-5 py-5 text-sm leading-7 text-zinc-600 dark:border-white/10 dark:text-zinc-400 sm:px-6">
                                                    {item.answer}
                                                </div>
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </>
    );
}
