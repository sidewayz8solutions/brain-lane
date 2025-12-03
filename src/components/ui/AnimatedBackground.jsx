import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedBackground({ variant = 'default' }) {
    const containerRef = useRef(null);

    // Floating orbs configuration
    const orbs = [
        { color: 'from-blue-600/30 to-blue-600/0', size: 'w-96 h-96', position: 'top-0 left-1/4', delay: 0 },
        { color: 'from-cyan-500/25 to-cyan-500/0', size: 'w-80 h-80', position: 'bottom-20 right-1/4', delay: 2 },
        { color: 'from-purple-600/20 to-purple-600/0', size: 'w-72 h-72', position: 'top-1/3 right-10', delay: 4 },
        { color: 'from-blue-500/15 to-blue-500/0', size: 'w-64 h-64', position: 'bottom-10 left-10', delay: 1 },
    ];

    // Grid pattern for tech feel
    const GridPattern = () => (
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
    );

    // Animated particles
    const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        size: Math.random() * 3 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5,
    }));

    return (
        <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
            
            {/* Grid pattern */}
            <GridPattern />

            {/* Animated gradient orbs */}
            {orbs.map((orb, index) => (
                <motion.div
                    key={index}
                    className={`absolute ${orb.size} ${orb.position} bg-gradient-radial ${orb.color} rounded-full blur-3xl`}
                    initial={{ opacity: 0.5, scale: 1 }}
                    animate={{ 
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.2, 1],
                        x: [0, 30, 0],
                        y: [0, -20, 0],
                    }}
                    transition={{
                        duration: 8,
                        delay: orb.delay,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            ))}

            {/* Floating particles */}
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute rounded-full bg-cyan-400/30"
                    style={{
                        width: particle.size,
                        height: particle.size,
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                    }}
                    animate={{
                        y: [0, -100, 0],
                        opacity: [0, 1, 0],
                    }}
                    transition={{
                        duration: particle.duration,
                        delay: particle.delay,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            ))}

            {/* Radial gradient overlay */}
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-slate-950/80" />
            
            {/* Noise texture */}
            <div className="absolute inset-0 opacity-[0.015]" 
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
                }}
            />
        </div>
    );
}