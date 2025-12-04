import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from './Logo';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative border-t border-slate-800/50 bg-slate-950/80 backdrop-blur-sm mt-20">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#FFE566]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#461D7C]/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Logo & Slogan */}
                    <div className="lg:col-span-2">
                        <Logo size="md" showSlogan={true} animate={false} className="mb-4" />
                        <p className="text-slate-400 text-sm max-w-md mt-6">
                            AI-powered code analysis that helps you achieve clarity, 
                            quality, and confidence in your projects.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-[#FFE566] font-semibold mb-4 text-sm uppercase tracking-wider">
                            Quick Links
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link 
                                    to={createPageUrl('Home')} 
                                    className="text-slate-400 hover:text-[#FFE566] transition-colors text-sm"
                                >
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    to={createPageUrl('Projects')} 
                                    className="text-slate-400 hover:text-[#FFE566] transition-colors text-sm"
                                >
                                    Projects
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    to={createPageUrl('ProjectHealth')} 
                                    className="text-slate-400 hover:text-[#FFE566] transition-colors text-sm"
                                >
                                    Health Dashboard
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Connect */}
                    <div>
                        <h3 className="text-[#FFE566] font-semibold mb-4 text-sm uppercase tracking-wider">
                            Connect
                        </h3>
                        <div className="flex gap-3">
                            <motion.a
                                href="#"
                                whileHover={{ scale: 1.1, y: -2 }}
                                className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#461D7C]/30 to-[#461D7C]/10 border border-[#461D7C]/30 flex items-center justify-center text-[#FFE566] hover:border-[#FFE566]/50 transition-colors"
                            >
                                <Github className="w-4 h-4" />
                            </motion.a>
                            <motion.a
                                href="#"
                                whileHover={{ scale: 1.1, y: -2 }}
                                className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#461D7C]/30 to-[#461D7C]/10 border border-[#461D7C]/30 flex items-center justify-center text-[#FFE566] hover:border-[#FFE566]/50 transition-colors"
                            >
                                <Twitter className="w-4 h-4" />
                            </motion.a>
                            <motion.a
                                href="#"
                                whileHover={{ scale: 1.1, y: -2 }}
                                className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#461D7C]/30 to-[#461D7C]/10 border border-[#461D7C]/30 flex items-center justify-center text-[#FFE566] hover:border-[#FFE566]/50 transition-colors"
                            >
                                <Linkedin className="w-4 h-4" />
                            </motion.a>
                            <motion.a
                                href="#"
                                whileHover={{ scale: 1.1, y: -2 }}
                                className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#461D7C]/30 to-[#461D7C]/10 border border-[#461D7C]/30 flex items-center justify-center text-[#FFE566] hover:border-[#FFE566]/50 transition-colors"
                            >
                                <Mail className="w-4 h-4" />
                            </motion.a>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-sm">
                        © {currentYear} Brain Lane. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm">
                        <a href="#" className="text-slate-400 hover:text-[#FFE566] transition-colors">
                            Privacy Policy
                        </a>
                        <a href="#" className="text-slate-400 hover:text-[#FFE566] transition-colors">
                            Terms of Service
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
