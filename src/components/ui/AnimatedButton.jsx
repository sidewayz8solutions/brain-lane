import { useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function AnimatedButton({ 
    children, 
    className,
    variant = 'primary',
    size = 'default',
    disabled = false,
    loading = false,
    onClick,
    ...props 
}) {
    const buttonRef = useRef(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 15, stiffness: 300 };
    const x = useSpring(mouseX, springConfig);
    const y = useSpring(mouseY, springConfig);

    const handleMouseMove = (e) => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Magnetic effect - subtle pull towards cursor
        const deltaX = (e.clientX - centerX) * 0.1;
        const deltaY = (e.clientY - centerY) * 0.1;
        
        mouseX.set(deltaX);
        mouseY.set(deltaY);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    const variants = {
        primary: "text-slate-900 shadow-lg shadow-white/20",
        secondary: "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700",
        ghost: "bg-transparent hover:bg-gray-800/50 text-gray-300 hover:text-white",
        danger: "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/25",
        success: "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25",
    };

    // Silver chrome gradient for primary variant
    const primaryStyle = variant === 'primary' ? {
        background: 'linear-gradient(135deg, #e2e8f0 0%, #ffffff 25%, #cbd5e1 50%, #ffffff 75%, #e2e8f0 100%)',
        boxShadow: '0 4px 20px rgba(255,255,255,0.3), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.1)'
    } : {};

    const sizes = {
        sm: "h-9 px-4 text-sm",
        default: "h-11 px-6 text-sm",
        lg: "h-14 px-8 text-base",
        xl: "h-16 px-10 text-lg",
    };

    return (
        <motion.button
            ref={buttonRef}
            className={cn(
                "relative inline-flex items-center justify-center gap-2",
                "font-medium rounded-xl",
                "transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
                "overflow-hidden",
                variants[variant],
                sizes[size],
                className
            )}
            style={{ x, y, ...primaryStyle }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            disabled={disabled || loading}
            whileTap={{ scale: 0.97 }}
            {...props}
        >
            {/* Animated gradient overlay on hover */}
            <motion.div
                className="absolute inset-0 opacity-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0"
                initial={{ x: '-100%' }}
                whileHover={{ 
                    x: '100%',
                    opacity: 1,
                    transition: { duration: 0.5, ease: "easeInOut" }
                }}
            />

            {/* Ripple effect container */}
            <span className="relative z-10 flex items-center gap-2">
                {loading && (
                    <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                )}
                {children}
            </span>

            {/* Glow effect */}
            {variant === 'primary' && (
                <motion.div
                    className="absolute inset-0 rounded-xl opacity-0"
                    whileHover={{ opacity: 1 }}
                    style={{
                        boxShadow: '0 0 30px rgba(147, 51, 234, 0.4), 0 0 60px rgba(245, 158, 11, 0.2)',
                    }}
                />
            )}
        </motion.button>
    );
}

AnimatedButton.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger', 'success']),
    size: PropTypes.oneOf(['sm', 'default', 'lg', 'xl']),
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    onClick: PropTypes.func,
};