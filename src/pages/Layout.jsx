
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Brain, FolderGit2, Home, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/ui/Logo';

export default function Layout({ children, currentPageName }) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const showNav = currentPageName !== 'Home';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', icon: Home, page: 'Home' },
        { name: 'Projects', icon: FolderGit2, page: 'Projects' },
        { name: 'Health', icon: Brain, page: 'ProjectHealth' },
    ];

    return (
        <div className="min-h-screen bg-slate-950">
            <style>{`
                html { scroll-behavior: smooth; }
                * { scrollbar-width: thin; scrollbar-color: #3b82f6 #1e293b; }
            `}</style>
            
            <AnimatePresence>
                {showNav && (
                    <motion.nav 
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                            scrolled 
                                ? 'bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 shadow-lg shadow-black/20' 
                                : 'bg-transparent border-b border-transparent'
                        }`}
                    >
                        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                            <Link to={createPageUrl('Home')} className="group">
                                <Logo size="sm" showSlogan={false} animate={false} className="scale-90 group-hover:scale-100 transition-transform" />
                            </Link>

                            {/* Desktop Navigation */}
                            <div className="hidden md:flex items-center gap-1">
                                {navLinks.map((link, idx) => (
                                    <motion.div
                                        key={link.page}
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + idx * 0.05 }}
                                    >
                                        <Link 
                                            to={createPageUrl(link.page)}
                                            className={`relative px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all group ${
                                                currentPageName === link.page 
                                                    ? 'text-white' 
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            {currentPageName === link.page && (
                                                <motion.div
                                                    layoutId="activeNavBg"
                                                    className="absolute inset-0 bg-slate-800/80 rounded-lg"
                                                    initial={false}
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                />
                                            )}
                                            <span className="relative z-10 flex items-center gap-2">
                                                <link.icon className="w-4 h-4" />
                                                {link.name}
                                            </span>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Mobile Menu Button */}
                            <motion.button
                                className="md:hidden p-2 text-slate-400 hover:text-white"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                whileTap={{ scale: 0.9 }}
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </motion.button>
                        </div>

                        {/* Mobile Menu */}
                        <AnimatePresence>
                            {mobileMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-800"
                                >
                                    <div className="px-6 py-4 space-y-2">
                                        {navLinks.map((link, idx) => (
                                            <motion.div
                                                key={link.page}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                            >
                                                <Link 
                                                    to={createPageUrl(link.page)}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                                                        currentPageName === link.page 
                                                            ? 'bg-slate-800 text-white' 
                                                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                                    }`}
                                                >
                                                    <link.icon className="w-5 h-5" />
                                                    {link.name}
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.nav>
                )}
            </AnimatePresence>

            <motion.main 
                className={showNav ? 'pt-16' : ''}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                {children}
            </motion.main>
        </div>
    );
}
