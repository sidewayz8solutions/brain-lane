import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function AnimatedCard({ 
    children, 
    className,
    glowColor = 'cyan',
    enableTilt = true,
    enableGlow = true,
    enableShine = true,
    ...props 
}) {
    const cardRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    // Mouse position for tilt effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth spring animation
    const springConfig = { damping: 25, stiffness: 150 };
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

    // Glow position
    const glowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), springConfig);
    const glowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), springConfig);

    const handleMouseMove = (e) => {
        if (!cardRef.current || !enableTilt) return;
        
        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const x = (e.clientX - centerX) / rect.width;
        const y = (e.clientY - centerY) / rect.height;
        
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
        setIsHovered(false);
    };

    const glowColors = {
        cyan: 'rgba(6, 182, 212, 0.15)',
        blue: 'rgba(59, 130, 246, 0.15)',
        purple: 'rgba(147, 51, 234, 0.15)',
        green: 'rgba(34, 197, 94, 0.15)',
    };

    return (
        <motion.div
            ref={cardRef}
            className={cn(
                "relative overflow-hidden rounded-2xl",
                "bg-slate-900/80 backdrop-blur-xl",
                "border border-slate-700/50",
                "transition-colors duration-300",
                isHovered && "border-slate-600/50",
                className
            )}
            style={{
                rotateX: enableTilt ? rotateX : 0,
                rotateY: enableTilt ? rotateY : 0,
                transformPerspective: 1000,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            whileHover={{ scale: 1.02 }}
            transition={{ scale: { duration: 0.2 } }}
            {...props}
        >
            {/* Dynamic glow effect */}
            {enableGlow && isHovered && (
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle at ${glowX.get()}% ${glowY.get()}%, ${glowColors[glowColor]}, transparent 50%)`,
                    }}
                />
            )}

            {/* Shine effect on hover */}
            {enableShine && (
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0, x: '-100%' }}
                    animate={{ 
                        opacity: isHovered ? 1 : 0,
                        x: isHovered ? '100%' : '-100%'
                    }}
                    transition={{ duration: 0.6 }}
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                        transform: 'skewX(-20deg)',
                    }}
                />
            )}

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
}