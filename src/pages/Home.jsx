import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Zap, GitBranch, CheckCircle, Brain, Code2, Cpu, Shield, Rocket, Star, AlertCircle } from 'lucide-react';
import FileUploader from '../components/upload/FileUploader';
import FloatingParticles from '../components/ui/FloatingParticles';
import { createPageUrl } from '@/utils';
import { useProjectStore } from '@/store/projectStore';
import { UploadFile, ExtractZipContents, AnalyzeProjectStructure } from '@/api/integrations';

export default function Home() {
    const navigate = useNavigate();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const createProject = useProjectStore((state) => state.createProject);

    const handleUpload = async (data) => {
        console.log('handleUpload called with:', data);
        setIsUploading(true);
        setUploadError(null);

        try {
            let fileUrl = null;
            let fileTree = [];
            let fileContents = {};
            let detectedStack = [];

            if (data.type === 'zip' && data.file) {
                console.log('Processing ZIP file:', data.file.name);
                
                // Upload and extract zip file
                const uploadResult = await UploadFile({ file: data.file });
                console.log('Upload result:', uploadResult);
                fileUrl = uploadResult.file_url;

                // Extract and analyze contents
                const extracted = await ExtractZipContents(data.file);
                console.log('Extracted contents:', { 
                    fileTreeLength: extracted.fileTree?.length,
                    fileContentsKeys: Object.keys(extracted.fileContents || {}).length 
                });
                fileTree = extracted.fileTree || [];
                fileContents = extracted.fileContents || {};

                const analysis = AnalyzeProjectStructure(fileTree, fileContents);
                console.log('Analysis result:', analysis);
                detectedStack = analysis.detected_stack || [];
            } else if (data.type === 'github' && data.url) {
                // GitHub URL import - create project with URL for later processing
                console.log('Processing GitHub URL:', data.url);
                fileTree = [];
                fileContents = {};
                detectedStack = [];
            }

            const project = createProject({
                name: data.file?.name?.replace('.zip', '') || data.url?.split('/').pop() || 'Imported Project',
                source_type: data.type,
                github_url: data.type === 'github' ? data.url : null,
                zip_file_url: fileUrl,
                status: 'analyzing',
                file_tree: fileTree,
                file_contents: fileContents,
                detected_stack: detectedStack
            });

            console.log('Created project:', project);
            
            // Navigate to analysis page
            const targetUrl = createPageUrl('ProjectAnalysis') + `?id=${project.id}`;
            console.log('Navigating to:', targetUrl);
            navigate(targetUrl);

        } catch (error) {
            console.error('Upload error:', error);
            setUploadError(error.message || 'Failed to process file. Please try again.');
            setIsUploading(false);
        }
    };

    const features = [
        { icon: Brain, title: 'AI Code Analysis', desc: 'Detects your stack and finds issues automatically' },
        { icon: Zap, title: 'Smart Task Generation', desc: 'Creates actionable tasks to complete your project' },
        { icon: GitBranch, title: 'Clean Diffs', desc: 'Review and approve changes like pull requests' },
        { icon: CheckCircle, title: 'One-Click Apply', desc: 'Download patches or export modified code' },
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
        <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden relative">
            {/* Animated Background - Purple & Gold Theme */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {/* Gradient orbs */}
                <motion.div
                    className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[100px]"
                    animate={{
                        x: [0, -80, 0],
                        y: [0, -60, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[80px]"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
                {/* Floating particles */}
                <FloatingParticles count={15} />
            </div>

            <div className="relative z-10">
                {/* Hero Section */}
                <div className="max-w-6xl mx-auto px-6 pt-20 pb-12">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="text-center"
                    >
                        {/* Logo */}
                        <motion.div
                            variants={itemVariants}
                            className="flex items-center justify-center gap-4 mb-12"
                        >
                            <motion.div
                                className="relative"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                animate={{ 
                                    y: [0, -10, 0],
                                }}
                                transition={{ 
                                    type: "spring", 
                                    bounce: 0.6,
                                    y: {
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-amber-400 rounded-2xl blur-xl opacity-60 animate-pulse" />
                                <div className="relative w-16 h-16 bg-gradient-to-br from-purple-600 via-violet-600 to-amber-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/30 border border-purple-400/20">
                                    <Brain className="w-9 h-9 text-white" />
                                </div>
                            </motion.div>
                            <motion.h1
                                className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-amber-200 bg-clip-text text-transparent"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                Brain Lane
                            </motion.h1>
                        </motion.div>

                        {/* Headline */}
                        <motion.div variants={itemVariants} className="mb-8">
                            <h2 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
                                <span className="block text-white mb-3">AI That Finishes</span>
                                <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-amber-400 bg-clip-text text-transparent">
                                    Your Code
                                </span>
                            </h2>
                        </motion.div>

                        {/* Subheadline */}
                        <motion.p
                            variants={itemVariants}
                            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
                        >
                            Upload your project. Our AI analyzes it, creates a completion plan,
                            and implements missing features — all reviewable as clean diffs.
                        </motion.p>

                        {/* Stats row */}
                        <motion.div
                            variants={itemVariants}
                            className="flex items-center justify-center gap-12 mb-14"
                        >
                            {stats.map((stat, idx) => (
                                <motion.div
                                    key={idx}
                                    className="text-center group relative"
                                    whileHover={{ scale: 1.1, y: -5 }}
                                    transition={{ type: "spring", bounce: 0.4 }}
                                >
                                    {/* Hover glow effect */}
                                    <motion.div
                                        className="absolute inset-0 -m-2 bg-gradient-to-r from-purple-600/0 to-amber-600/0 rounded-xl blur-xl opacity-0 group-hover:from-purple-600/20 group-hover:to-amber-600/20 group-hover:opacity-100 transition-all duration-300"
                                    />
                                    <div className="relative">
                                        <motion.div 
                                            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent group-hover:from-amber-400 group-hover:to-purple-400 transition-all duration-300"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.4 + idx * 0.1, type: "spring", bounce: 0.6 }}
                                        >
                                            {stat.value}
                                        </motion.div>
                                        <div className="text-xs text-gray-500 uppercase tracking-widest mt-2 font-medium group-hover:text-gray-400 transition-colors">
                                            {stat.label}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Features Grid - Glassmorphism Cards */}
                        <motion.div
                            variants={containerVariants}
                            className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-5xl mx-auto mb-20"
                        >
                            {features.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    variants={itemVariants}
                                    whileHover={{ y: -8, scale: 1.03 }}
                                    transition={{ type: "spring", bounce: 0.4 }}
                                    className="group"
                                >
                                    <div className="relative h-full p-6 rounded-2xl bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 hover:border-purple-500/30 transition-all duration-300 overflow-hidden">
                                        {/* Hover glow */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        <div className="relative z-10">
                                            <motion.div
                                                className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-amber-500/20 flex items-center justify-center mb-4 mx-auto border border-purple-500/20 group-hover:border-amber-400/30 transition-colors"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.5 + idx * 0.1, type: "spring", bounce: 0.6 }}
                                            >
                                                <feature.icon className="w-6 h-6 text-purple-400 group-hover:text-amber-400 transition-colors" />
                                            </motion.div>
                                            <h3 className="font-semibold text-white mb-2 group-hover:text-purple-200 transition-colors">{feature.title}</h3>
                                            <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Upload Section - Keep the analyzer box styling */}
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.6, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="relative">
                            {/* Glow effect behind card - Purple & Gold */}
                            <motion.div 
                                className="absolute -inset-2 bg-gradient-to-r from-purple-600/30 via-violet-500/20 to-amber-500/30 rounded-[2rem] blur-2xl"
                                animate={{
                                    opacity: [0.3, 0.5, 0.3],
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />

                            <div className="relative bg-gray-900/80 backdrop-blur-2xl rounded-3xl border border-gray-700/50 p-8 shadow-2xl">
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
                                        <Sparkles className="w-5 h-5 text-amber-400" />
                                    </motion.div>
                                    <span className="text-gray-300 font-medium">Start Your Analysis</span>
                                </motion.div>

                                {/* Error Message */}
                                {uploadError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-sm"
                                    >
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {uploadError}
                                    </motion.div>
                                )}

                                <FileUploader onUpload={handleUpload} isUploading={isUploading} />
                            </div>
                        </div>
                    </motion.div>

                    {/* How it works */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="mt-28 text-center"
                    >
                        <motion.h3
                            className="text-sm font-semibold text-purple-400/80 uppercase tracking-[0.2em] mb-12"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                        >
                            How it works
                        </motion.h3>

                        <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap max-w-5xl mx-auto">
                            {[
                                { step: 'Upload Project', icon: Rocket, num: '01' },
                                { step: 'AI Analyzes', icon: Cpu, num: '02' },
                                { step: 'Review Tasks', icon: Code2, num: '03' },
                                { step: 'Apply Changes', icon: Shield, num: '04' },
                            ].map((item, idx) => (
                                <React.Fragment key={idx}>
                                    <motion.div
                                        className="flex flex-col items-center gap-4 group"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.1 + idx * 0.1 }}
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <motion.div
                                            className="relative"
                                            whileHover={{ rotate: 360 }}
                                            transition={{ duration: 0.6 }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-amber-400/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 group-hover:border-purple-500/50 flex items-center justify-center transition-all duration-300">
                                                <item.icon className="w-7 h-7 text-purple-400 group-hover:text-amber-400 transition-colors" />
                                            </div>
                                            <span className="absolute -top-2 -right-2 text-xs font-bold text-amber-400/60 bg-gray-900 px-2 py-0.5 rounded-full border border-gray-800">{item.num}</span>
                                        </motion.div>
                                        <span className="text-gray-400 text-sm font-medium group-hover:text-white transition-colors">{item.step}</span>
                                    </motion.div>
                                    {idx < 3 && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 1.2 + idx * 0.1 }}
                                            className="hidden md:flex items-center"
                                        >
                                            <div className="w-12 h-[2px] bg-gradient-to-r from-purple-500/50 to-amber-400/50" />
                                        </motion.div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </motion.div>

                    {/* Trust Badges Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.3 }}
                        className="mt-28"
                    >
                        <div className="max-w-4xl mx-auto">
                            <div className="grid grid-cols-3 gap-8 items-center">
                                <motion.div
                                    className="text-center space-y-2 group"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <div className="flex items-center justify-center gap-1 text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 1.4 + i * 0.05 }}
                                            >
                                                <Star className="w-5 h-5 fill-current" />
                                            </motion.div>
                                        ))}
                                    </div>
                                    <p className="text-gray-400 text-sm">Secure & Private</p>
                                </motion.div>

                                <motion.div
                                    className="text-center space-y-2 group"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Shield className="w-8 h-8 text-purple-400 mx-auto group-hover:text-amber-400 transition-colors" />
                                    <p className="text-gray-400 text-sm">Code Never Stored</p>
                                </motion.div>

                                <motion.div
                                    className="text-center space-y-2 group"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Zap className="w-8 h-8 text-amber-400 mx-auto group-hover:text-purple-400 transition-colors" />
                                    <p className="text-gray-400 text-sm">Lightning Fast</p>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Bottom spacer */}
                    <div className="h-24" />
                </div>
            </div>
        </div>
    );
}