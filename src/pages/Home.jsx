import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Sparkles, Zap, GitBranch, CheckCircle, ArrowRight, Brain, Code2, Cpu, Shield, Rocket } from 'lucide-react';
import FileUploader from '../components/upload/FileUploader';
import { createPageUrl } from '@/utils';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import AnimatedCard from '../components/ui/AnimatedCard';
import { GradientText, WordReveal } from '../components/ui/AnimatedText';

export default function Home() {
    const navigate = useNavigate();
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (data) => {
        setIsUploading(true);
        
        try {
            let fileUrl = null;
            
            if (data.type === 'zip' && data.file) {
                const uploadResult = await base44.integrations.Core.UploadFile({ file: data.file });
                fileUrl = uploadResult.file_url;
            }

            const project = await base44.entities.Project.create({
                name: data.file?.name?.replace('.zip', '') || data.url?.split('/').pop() || 'Imported Project',
                source_type: data.type,
                github_url: data.type === 'github' ? data.url : null,
                zip_file_url: fileUrl,
                status: 'analyzing',
                file_tree: [],
                file_contents: {}
            });

            navigate(createPageUrl('ProjectAnalysis') + `?id=${project.id}`);
            
        } catch (error) {
            console.error('Upload error:', error);
            setIsUploading(false);
        }
    };

    const features = [
        { icon: Brain, title: 'AI Code Analysis', desc: 'Detects your stack and finds issues automatically', color: 'cyan' },
        { icon: Zap, title: 'Smart Task Generation', desc: 'Creates actionable tasks to complete your project', color: 'yellow' },
        { icon: GitBranch, title: 'Clean Diffs', desc: 'Review and approve changes like pull requests', color: 'green' },
        { icon: CheckCircle, title: 'One-Click Apply', desc: 'Download patches or export modified code', color: 'purple' },
    ];

    const stats = [
        { value: '500MB', label: 'Max Upload' },
        { value: '10+', label: 'Frameworks' },
        { value: '< 30s', label: 'Analysis Time' },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                type: "spring",
                bounce: 0.4,
                duration: 0.8
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
            <AnimatedBackground />

            <div className="relative z-10">
                {/* Hero Section */}
                <div className="max-w-6xl mx-auto px-6 pt-16 pb-12">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="text-center"
                    >
                        {/* Logo with pulse animation */}
                        <motion.div 
                            variants={itemVariants}
                            className="flex items-center justify-center gap-3 mb-10"
                        >
                            <motion.div 
                                className="relative"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", bounce: 0.6 }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-50 animate-pulse" />
                                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                                    <Brain className="w-8 h-8 text-white" />
                                </div>
                            </motion.div>
                            <motion.h1 
                                className="text-3xl font-bold tracking-tight"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                Brain Lane
                            </motion.h1>
                        </motion.div>

                        {/* Headline with animated gradient */}
                        <motion.div variants={itemVariants} className="mb-6">
                            <h2 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
                                <span className="block text-white mb-2">
                                    <WordReveal text="AI That Finishes" delay={0.5} />
                                </span>
                                <GradientText colors={['from-blue-400', 'via-cyan-400', 'to-blue-400']}>
                                    Your Code
                                </GradientText>
                            </h2>
                        </motion.div>

                        {/* Subheadline */}
                        <motion.p 
                            variants={itemVariants}
                            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed"
                        >
                            Upload your project. Our AI analyzes it, creates a completion plan,
                            and implements missing features — all reviewable as clean diffs.
                        </motion.p>

                        {/* Stats row */}
                        <motion.div 
                            variants={itemVariants}
                            className="flex items-center justify-center gap-8 mb-12"
                        >
                            {stats.map((stat, idx) => (
                                <motion.div
                                    key={idx}
                                    className="text-center"
                                    whileHover={{ scale: 1.1 }}
                                >
                                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                        {stat.value}
                                    </div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">
                                        {stat.label}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Features Grid */}
                        <motion.div 
                            variants={containerVariants}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16"
                        >
                            {features.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    variants={itemVariants}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    transition={{ type: "spring", bounce: 0.4 }}
                                >
                                    <AnimatedCard 
                                        className="p-5 h-full" 
                                        glowColor={feature.color}
                                        enableTilt={true}
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.5 + idx * 0.1, type: "spring", bounce: 0.6 }}
                                        >
                                            <feature.icon className="w-7 h-7 text-cyan-400 mb-3 mx-auto" />
                                        </motion.div>
                                        <h3 className="font-semibold text-sm text-white mb-1.5">{feature.title}</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
                                    </AnimatedCard>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Upload Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.6, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="relative">
                            {/* Glow effect behind card */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-cyan-600/20 to-purple-600/20 rounded-[2rem] blur-xl" />
                            
                            <div className="relative bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
                                <motion.div 
                                    className="flex items-center gap-2 justify-center mb-6"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                >
                                    <motion.div
                                        animate={{ 
                                            rotate: [0, 15, -15, 0],
                                            scale: [1, 1.2, 1.2, 1]
                                        }}
                                        transition={{ 
                                            duration: 2, 
                                            repeat: Infinity,
                                            repeatDelay: 3
                                        }}
                                    >
                                        <Sparkles className="w-5 h-5 text-cyan-400" />
                                    </motion.div>
                                    <span className="text-slate-300 font-medium">Start Your Analysis</span>
                                </motion.div>
                                
                                <FileUploader onUpload={handleUpload} isUploading={isUploading} />
                            </div>
                        </div>
                    </motion.div>

                    {/* How it works - Enhanced */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="mt-24 text-center"
                    >
                        <motion.h3 
                            className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-10"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                        >
                            How it works
                        </motion.h3>
                        
                        <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap max-w-4xl mx-auto">
                            {[
                                { step: 'Upload Project', icon: Rocket },
                                { step: 'AI Analyzes', icon: Cpu },
                                { step: 'Review Tasks', icon: Code2 },
                                { step: 'Apply Changes', icon: Shield },
                            ].map((item, idx) => (
                                <React.Fragment key={idx}>
                                    <motion.div 
                                        className="flex items-center gap-3 group"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.1 + idx * 0.1 }}
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <motion.div 
                                            className="relative"
                                            whileHover={{ rotate: 360 }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative w-12 h-12 rounded-full bg-slate-800 border border-slate-700 group-hover:border-cyan-500/50 flex items-center justify-center transition-colors">
                                                <item.icon className="w-5 h-5 text-cyan-400" />
                                            </div>
                                        </motion.div>
                                        <span className="text-slate-300 text-sm font-medium">{item.step}</span>
                                    </motion.div>
                                    {idx < 3 && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 1.2 + idx * 0.1 }}
                                            className="hidden md:block"
                                        >
                                            <ArrowRight className="w-5 h-5 text-slate-600" />
                                        </motion.div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </motion.div>

                    {/* Bottom gradient fade */}
                    <div className="h-32" />
                </div>
            </div>
        </div>
    );
}