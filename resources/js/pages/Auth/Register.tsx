import { Head, Link, Form } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    Mail, 
    Lock, 
    User,
    ArrowRight, 
    Sparkles, 
    ShieldCheck, 
    Zap,
    Code2,
} from 'lucide-react';
import AppLayout from '@/components/Layout/AppLayout';
import GradientOrb from '@/components/UI/GradientOrb';

export default function Register() {
    return (
        <AppLayout>
            <Head title="Create Account | Opticore Solutions Ltd." />
            
            <div className="bg-black min-h-screen flex items-center justify-center py-24 px-4 relative overflow-hidden">
                {/* Background Decor */}
                <GradientOrb className="top-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 blur-[120px]" />
                <GradientOrb className="bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-violet-600/10 blur-[120px]" />
                
                <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
                    <div className="h-full w-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                </div>

                <div className="w-full max-w-xl relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel p-8 md:p-12 rounded-[3rem] border border-white/10 bg-zinc-900/40 backdrop-blur-3xl"
                    >
                        {/* Header */}
                        <div className="text-center mb-12">
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className="w-20 h-20 bg-gradient-to-tr from-cyan-500 to-violet-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,211,238,0.3)]"
                            >
                                <Sparkles className="w-10 h-10 text-white" />
                            </motion.div>
                            <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Start Your Journey</h1>
                            <p className="text-zinc-500 font-medium">Join 50+ brands and creators at Opticore.</p>
                        </div>

                        {/* Form */}
                        <Form action="/register" method="post" className="space-y-6">
                            {({ errors, processing }) => (
                                <>
                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-400 transition-colors">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <input 
                                                type="text" 
                                                name="name"
                                                placeholder="Full Name"
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                                                required
                                            />
                                            {errors.name && <p className="text-red-500 text-xs mt-2 ml-4">{errors.name}</p>}
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-400 transition-colors">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <input 
                                                type="email" 
                                                name="email"
                                                placeholder="Email Address"
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                                                required
                                            />
                                            {errors.email && <p className="text-red-500 text-xs mt-2 ml-4">{errors.email}</p>}
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-violet-400 transition-colors">
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <input 
                                                type="password" 
                                                name="password"
                                                placeholder="Create Password"
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition-all"
                                                required
                                            />
                                            {errors.password && <p className="text-red-500 text-xs mt-2 ml-4">{errors.password}</p>}
                                        </div>
                                    </div>

                                    <div className="flex items-center px-2">
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <input type="checkbox" className="mt-1 w-4 h-4 rounded border-white/10 bg-black/40 text-cyan-500 focus:ring-offset-black" required />
                                            <span className="text-xs text-zinc-500 leading-relaxed">
                                                I agree to the <Link href="/terms-conditions" className="text-white hover:text-cyan-400">Terms of Service</Link> and <Link href="/privacy-policy" className="text-white hover:text-cyan-400">Privacy Policy</Link>.
                                            </span>
                                        </label>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={processing}
                                        className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 group shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
                                    >
                                        {processing ? 'Creating Account...' : 'Create Account'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>

                                    <div className="relative py-4">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-900/40 px-4 text-zinc-600 font-bold tracking-widest">Or sign up with</span></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button type="button" className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 py-4 rounded-2xl hover:bg-white/10 transition-colors">
                                            <Code2 className="w-5 h-5 text-white" />
                                            <span className="text-sm font-bold text-white">Github</span>
                                        </button>
                                        <button type="button" className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 py-4 rounded-2xl hover:bg-white/10 transition-colors">
                                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                                            <span className="text-sm font-bold text-white">Google</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </Form>

                        <div className="mt-12 text-center">
                            <p className="text-zinc-500">
                                Already have an account? <Link href="/login" className="text-white font-bold hover:text-cyan-400 transition-colors">Sign in here</Link>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    );
}
