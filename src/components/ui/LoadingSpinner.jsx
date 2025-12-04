import React from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";

// Simple circular spinner
export function SimpleSpinner({ size = 'default', className }) {
    const sizes = {
        sm: 'w-6 h-6 border-2',
        default: 'w-8 h-8 border-2',
        lg: 'w-12 h-12 border-3',
        xl: 'w-16 h-16 border-4',
    };

    return (
        <div className={cn("relative", className)}>
            <motion.div
                className={cn(
                    "rounded-full border-cyan-500/30 border-t-cyan-400",
                    sizes[size]
                )}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />
        </div>
    );
}

// Orbital spinner with multiple rings
export function OrbitalSpinner({ size = 'default', className }) {
    const sizes = {
        sm: 'w-8 h-8',
        default: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24',
    };

    return (
        <div className={cn("relative", sizes[size], className)}>
            {/* Outer ring */}
            <motion.div
                className="absolute inset-0 rounded-full border-2 border-cyan-500/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400" />
            </motion.div>
            
            {/* Middle ring */}
            <motion.div
                className="absolute inset-2 rounded-full border-2 border-blue-500/40"
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-400" />
            </motion.div>
            
            {/* Inner ring */}
            <motion.div
                className="absolute inset-4 rounded-full border-2 border-purple-500/50"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            >
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-400" />
            </motion.div>
            
            {/* Center dot */}
            <motion.div
                className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-white"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            />
        </div>
    );
}

// DNA-style double helix spinner
export function HelixSpinner({ className }) {
    const dots = 8;
    
    return (
        <div className={cn("relative w-12 h-16 flex items-center justify-center", className)}>
            {Array.from({ length: dots }).map((_, i) => (
                <React.Fragment key={i}>
                    <motion.div
                        className="absolute w-2 h-2 rounded-full bg-cyan-400"
                        animate={{
                            x: ['-10px', '10px', '-10px'],
                            y: 0,
                            scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                            duration: 1.5,
                            delay: i * 0.1,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        style={{ top: `${(i / dots) * 100}%` }}
                    />
                    <motion.div
                        className="absolute w-2 h-2 rounded-full bg-blue-400"
                        animate={{
                            x: ['10px', '-10px', '10px'],
                            y: 0,
                            scale: [1.2, 0.8, 1.2],
                        }}
                        transition={{
                            duration: 1.5,
                            delay: i * 0.1,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        style={{ top: `${(i / dots) * 100}%` }}
                    />
                </React.Fragment>
            ))}
        </div>
    );
}

// Pulsing brain animation
export function BrainPulse({ className }) {
    return (
        <div className={cn("relative w-20 h-20", className)}>
            {/* Outer pulse rings */}
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-cyan-500/30"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 2, opacity: [0, 0.5, 0] }}
                    transition={{
                        duration: 2,
                        delay: i * 0.6,
                        repeat: Infinity,
                        ease: "easeOut"
                    }}
                />
            ))}
            
            {/* Brain icon container */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </div>
            </motion.div>
        </div>
    );
}

// Progress bar with animated gradient
export function AnimatedProgress({ progress, className }) {
    return (
        <div className={cn("relative h-2 rounded-full bg-slate-800 overflow-hidden", className)}>
            <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                    background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #8b5cf6, #3b82f6)',
                    backgroundSize: '200% 100%',
                }}
                initial={{ width: 0 }}
                animate={{ 
                    width: `${progress}%`,
                    backgroundPosition: ['0% 50%', '100% 50%']
                }}
                transition={{ 
                    width: { duration: 0.5, ease: "easeOut" },
                    backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" }
                }}
            />
            
            {/* Shimmer effect */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
        </div>
    );
}

// Dots loading animation
export function DotsLoader({ className }) {
    return (
        <div className={cn("flex items-center gap-1", className)}>
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-cyan-400"
                    animate={{
                        y: [0, -8, 0],
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 0.6,
                        delay: i * 0.15,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
}