import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

export default function Logo({ size = 'md', showSlogan = true, animate = true, className = '' }) {
    const sizes = {
        sm: { logo: 'w-8 h-8', text: 'text-lg', slogan: 'text-xs' },
        md: { logo: 'w-16 h-16', text: 'text-4xl', slogan: 'text-sm' },
        lg: { logo: 'w-24 h-24', text: 'text-6xl', slogan: 'text-base' },
        xl: { logo: 'w-32 h-32', text: 'text-7xl', slogan: 'text-lg' }
    };

    const sizeClasses = sizes[size] || sizes.md;

    const logoVariants = animate ? {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        hover: { scale: 1.05, rotate: 2 }
    } : {};

    const floatAnimation = animate ? {
        y: [0, -10, 0],
    } : {};

    const LogoWrapper = animate ? motion.div : 'div';

    return (
        <div className={`flex flex-col items-center gap-3 ${className}`}>
            <LogoWrapper
                className="flex items-center gap-4"
                {...(animate && {
                    initial: "initial",
                    animate: "animate",
                    whileHover: "hover",
                    variants: logoVariants,
                    transition: { duration: 0.5 }
                })}
            >
                {/* Brain Icon - using inline Brain SVG styled like the logo */}
                <motion.div
                    className="relative"
                    {...(animate && {
                        animate: floatAnimation,
                        transition: {
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }
                    })}
                >
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-2xl opacity-60 bg-gradient-to-br from-[#FFE566]/30 to-[#461D7C]/30 blur-xl" />
                    
                    {/* Logo container */}
                    <div className={`relative ${sizeClasses.logo} rounded-2xl flex items-center justify-center`}>
                        {/* Brain icon with gold gradient */}
                        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                            <defs>
                                <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#FFE566" />
                                    <stop offset="50%" stopColor="#FFC947" />
                                    <stop offset="100%" stopColor="#FFE566" />
                                </linearGradient>
                                <filter id="goldGlow">
                                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                    <feMerge>
                                        <feMergeNode in="coloredBlur"/>
                                        <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                            </defs>
                            <path
                                d="M9.5 2C8.67 2 8 2.67 8 3.5V4.5C8 5.33 8.67 6 9.5 6C10.33 6 11 5.33 11 4.5V3.5C11 2.67 10.33 2 9.5 2M14.5 2C13.67 2 13 2.67 13 3.5V4.5C13 5.33 13.67 6 14.5 6C15.33 6 16 5.33 16 4.5V3.5C16 2.67 15.33 2 14.5 2M9.5 7C7.56 7 6 8.56 6 10.5V11.5C6 13.43 7.57 15 9.5 15C10.19 15 10.82 14.8 11.36 14.46C11.77 15.4 12.71 16 13.83 16C15.28 16 16.54 14.93 16.87 13.5H17C18.66 13.5 20 12.16 20 10.5C20 8.84 18.66 7.5 17 7.5H16.87C16.54 6.07 15.28 5 13.83 5C12.71 5 11.77 5.6 11.36 6.54C10.82 6.2 10.19 6 9.5 6M9.5 8C10.33 8 11 8.67 11 9.5V11.5C11 12.33 10.33 13 9.5 13C8.67 13 8 12.33 8 11.5V9.5C8 8.67 8.67 8 9.5 8M13.83 7C14.66 7 15.33 7.67 15.33 8.5V10.5C15.33 11.33 14.66 12 13.83 12C13 12 12.33 11.33 12.33 10.5V8.5C12.33 7.67 13 7 13.83 7M17 9.5C17.55 9.5 18 9.95 18 10.5C18 11.05 17.55 11.5 17 11.5H16.87C16.94 11.17 17 10.84 17 10.5C17 10.16 16.94 9.83 16.87 9.5H17M6 13V14C6 17.31 8.69 20 12 20C15.31 20 18 17.31 18 14V13H16V14C16 16.21 14.21 18 12 18C9.79 18 8 16.21 8 14V13H6Z"
                                fill="url(#brainGradient)"
                                stroke="#461D7C"
                                strokeWidth="0.5"
                                filter="url(#goldGlow)"
                            />
                        </svg>
                    </div>
                </motion.div>

                {/* Brain Lane Text */}
                <motion.h1
                    className={`${sizeClasses.text} font-bold bg-gradient-to-br from-[#FFE566] via-[#FFC947] to-[#FFE566] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,229,102,0.5)]`}
                    style={{
                        textShadow: '0 0 40px rgba(255, 229, 102, 0.4), 0 0 20px rgba(255, 201, 71, 0.3)',
                        WebkitTextStroke: '1px rgba(70, 29, 124, 0.3)'
                    }}
                    {...(animate && {
                        initial: { opacity: 0, x: -20 },
                        animate: { opacity: 1, x: 0 },
                        transition: { delay: 0.3 }
                    })}
                >
                    BRAIN LANE
                </motion.h1>
            </LogoWrapper>

            {/* Slogan */}
            {showSlogan && (
                <motion.p
                    className={`${sizeClasses.slogan} font-medium tracking-[0.2em] bg-gradient-to-r from-[#FFE566] via-[#FFC947] to-[#FFE566] bg-clip-text text-transparent uppercase`}
                    style={{
                        textShadow: '0 0 20px rgba(255, 229, 102, 0.3)',
                    }}
                    {...(animate && {
                        initial: { opacity: 0, y: 10 },
                        animate: { opacity: 1, y: 0 },
                        transition: { delay: 0.5 }
                    })}
                >
                    Discover the Path to Your Peace of Mind
                </motion.p>
            )}
        </div>
    );
}

Logo.propTypes = {
    size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
    showSlogan: PropTypes.bool,
    animate: PropTypes.bool,
    className: PropTypes.string
};
