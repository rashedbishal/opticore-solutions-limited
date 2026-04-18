import { motion } from 'framer-motion';

const items = [
    { id: 1, title: 'Branding', size: 'col-span-2 row-span-2', bg: 'bg-violet-600', src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800' },
    { id: 2, title: 'Motion', size: 'col-span-1 row-span-1', bg: 'bg-cyan-600', src: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800' },
    { id: 3, title: 'Digital', size: 'col-span-1 row-span-2', bg: 'bg-emerald-600', src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800' },
    { id: 4, title: 'Strategy', size: 'col-span-1 row-span-1', bg: 'bg-pink-600', src: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800' },
    { id: 5, title: 'Growth', size: 'col-span-2 row-span-1', bg: 'bg-orange-600', src: 'https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=800' },
];

export default function KineticBento() {
    return (
        <div className="bg-black py-24 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-16">
                    <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter">
                        Selected <br/> <span className="text-zinc-600">Masterpieces</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-4 md:grid-rows-3 gap-6 h-[1000px] md:h-[800px]">
                    {items.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.8, y: 50 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            viewport={{ once: true }}
                            className={`${item.size} group relative overflow-hidden rounded-[2.5rem] border border-white/10`}
                        >
                            <img 
                                src={item.src} 
                                alt={item.title}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute bottom-8 left-8 transform translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
                                <p className="text-3xl font-black text-white uppercase tracking-tighter">{item.title}</p>
                                <button className="mt-4 text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                    Explore Case Study <span className="w-8 h-px bg-cyan-400" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
