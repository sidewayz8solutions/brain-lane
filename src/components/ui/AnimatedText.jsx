import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import PropTypes from 'prop-types';

// Animated text that reveals character by character
function TypewriterText({ text, className, delay = 0 }) {
    const characters = text.split('');
    
    return (
        <span className={className}>
            {characters.map((char, index) => (
                <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.1,
                        delay: delay + index * 0.03,
                        ease: "easeOut"
                    }}
                >
                    {char}
                </motion.span>
            ))}
        </span>
    );
}

TypewriterText.propTypes = {
    text: PropTypes.string.isRequired,
    className: PropTypes.string,
    delay: PropTypes.number,
};

// Animated gradient text
function GradientText({ children, className, colors = ['from-blue-400', 'to-cyan-400'] }) {
    return (
        <motion.span
            className={cn(
                "bg-gradient-to-r bg-clip-text text-transparent",
                colors.join(' '),
                className
            )}
            initial={{ backgroundPosition: '0% 50%' }}
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            style={{ backgroundSize: '200% 200%' }}
        >
            {children}
        </motion.span>
    );
}

GradientText.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    colors: PropTypes.arrayOf(PropTypes.string),
};

// Text that animates word by word
function WordReveal({ text, className, delay = 0, staggerDelay = 0.1 }) {
    const words = text.split(' ');
    
    return (
        <span className={className}>
            {words.map((word, index) => (
                <motion.span
                    key={index}
                    className="inline-block mr-[0.25em]"
                    initial={{ opacity: 0, y: 30, rotateX: -90 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{
                        duration: 0.5,
                        delay: delay + index * staggerDelay,
                        ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                >
                    {word}
                </motion.span>
            ))}
        </span>
    );
}

WordReveal.propTypes = {
    text: PropTypes.string.isRequired,
    className: PropTypes.string,
    delay: PropTypes.number,
    staggerDelay: PropTypes.number,
};

// Glowing text effect
function GlowText({ children, className, glowColor = 'cyan' }) {
    const glowColors = {
        cyan: 'drop-shadow-[0_0_10px_rgba(6,182,212,0.5)] drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]',
        blue: 'drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]',
        purple: 'drop-shadow-[0_0_10px_rgba(147,51,234,0.5)] drop-shadow-[0_0_20px_rgba(147,51,234,0.3)]',
    };

    return (
        <motion.span
            className={cn(glowColors[glowColor], className)}
            animate={{ 
                filter: [
                    'drop-shadow(0 0 10px rgba(6,182,212,0.3))',
                    'drop-shadow(0 0 20px rgba(6,182,212,0.5))',
                    'drop-shadow(0 0 10px rgba(6,182,212,0.3))',
                ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
            {children}
        </motion.span>
    );
}

GlowText.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    glowColor: PropTypes.oneOf(['cyan', 'blue', 'purple']),
};

// Counter animation
function AnimatedCounter({ value, duration = 2, className }) {
    return (
        <motion.span
            className={className}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <motion.span
                initial={{ count: 0 }}
                animate={{ count: value }}
                transition={{ duration, ease: "easeOut" }}
            >
                {({ count }) => Math.floor(count)}
            </motion.span>
        </motion.span>
    );
}

AnimatedCounter.propTypes = {
    value: PropTypes.number.isRequired,
    duration: PropTypes.number,
    className: PropTypes.string,
};

// Scramble text effect
function ScrambleText({ text, className }) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const [displayText, setDisplayText] = useState(text);
    
    useEffect(() => {
        let iteration = 0;
        const interval = setInterval(() => {
            setDisplayText(
                text.split('').map((char, index) => {
                    if (index < iteration) return text[index];
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join('')
            );
            
            if (iteration >= text.length) clearInterval(interval);
            iteration += 1/3;
        }, 30);
        
        return () => clearInterval(interval);
    }, [text]);
    
    return <span className={cn("font-mono", className)}>{displayText}</span>;
}

ScrambleText.propTypes = {
    text: PropTypes.string.isRequired,
    className: PropTypes.string,
};

export { TypewriterText, GradientText, WordReveal, GlowText, AnimatedCounter, ScrambleText };