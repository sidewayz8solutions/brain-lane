import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Zap, GitBranch, CheckCircle, Brain, Code2, Cpu, Shield, Rocket, Star, AlertCircle, Activity, TrendingUp, Clock, Target, Home as HomeIcon, FolderGit2 } from 'lucide-react';
import FileUploader from '../components/upload/FileUploader';
import FloatingParticles from '../components/ui/FloatingParticles';
import Logo from '../components/ui/Logo';
import Footer from '../components/ui/Footer';
import { createPageUrl } from '@/utils';
import { useProjectStore } from '@/store/projectStore';
import { UploadFile, ExtractZipContents, AnalyzeProjectStructure, UploadZipToSupabase } from '@/api/integrations';
import { hasSupabase, getSupabaseDiagnostics } from '@/services/supabaseClient';
import { runProjectAnalysis } from '@/services/analysisService';
import { OrbitalSpinner } from '@/components/ui/LoadingSpinner';

export default function Home() {
    const navigate = useNavigate();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [analysisStatus, setAnalysisStatus] = useState('idle');
    const [analysisError, setAnalysisError] = useState(null);
    const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
    const [analysisProject, setAnalysisProject] = useState(null);
    const createProject = useProjectStore((state) => state.createProject);
    const updateProject = useProjectStore((state) => state.updateProject);

    const handleUpload = async (data) => {
        console.log('handleUpload called with:', data);
        setIsUploading(true);
        setUploadError(null);
        setAnalysisError(null);
        setAnalysisStatus('uploading');
        setAnalysisModalVisible(true);
        let project = null;

        try {
            let fileUrl = null;
            let fileTree = [];
            let fileContents = {};
            let detectedStack = [];
            let projectName = data.file?.name?.replace('.zip', '') || data.url?.split('/').pop().replace('.git', '') || 'Imported Project';

            // 1. Create a minimal project entry right away (ID generation)
            project = createProject({
                name: projectName,
                source_type: data.type,
                github_url: data.type === 'github' ? data.url : null,
                status: 'uploading',
                // Initialize empty for store persistence
                file_tree: [],
                file_contents: {},
                detected_stack: []
            });
            setAnalysisProject(project);

            // 2. Handle ZIP Upload/Extraction
            if (data.type === 'zip' && data.file) {
                // Upload ZIP entries to Supabase Storage (streamed)
                if (hasSupabase) {
                    try {
                        const supabaseResult = await UploadZipToSupabase({ file: data.file, projectId: project.id });
                        console.log('Supabase upload result:', supabaseResult);
                        if (supabaseResult?.errors?.length) {
                            console.warn('Supabase upload completed with errors:', supabaseResult.errors.slice(0, 5));
                        }
                        fileUrl = `supabase://${supabaseResult.bucket}/${project.id}`;
                    } catch (supabaseErr) {
                        console.error('Supabase upload failed, continuing with local analysis only:', supabaseErr.message);
                        // Do not block analysis just because remote storage failed
                    }
                } else {
                    console.warn('Supabase not available. Local file persistence will be used.');
                }

                // Extract and analyze contents
                const extracted = await ExtractZipContents(data.file);
                fileTree = extracted.fileTree || [];
                fileContents = extracted.fileContents || {};

                const analysis = AnalyzeProjectStructure(fileTree, fileContents);
                detectedStack = analysis.detected_stack || [];

                // 3. Update project with full file structure and detected stack
                updateProject(project.id, {
                    zip_file_url: fileUrl,
                    file_tree: fileTree,
                    file_contents: fileContents,
                    detected_stack: detectedStack,
                    status: 'analyzing',
                });

                // Update local state with the latest project data
                project = { ...project, file_contents: fileContents, file_tree: fileTree, detected_stack: detectedStack, status: 'analyzing' };
                setAnalysisProject(project);
            }

            // 4. Run AI Analysis
            if (project?.id) {
                setAnalysisStatus('analyzing');
                try {
                    const analyzedProject = await runProjectAnalysis(project.id);
                    setAnalysisProject(analyzedProject);
                    setAnalysisStatus('ready');
                } catch (analysisErr) {
                    console.error('Analysis failed in Home:', analysisErr);
                    setAnalysisStatus('error');
                    setAnalysisError(analysisErr.message || 'AI analysis failed. Check console for details.');
                    // Re-throw to hit the outer catch and finalize status
                    throw analysisErr;
                }
            } else {
                // This path should ideally not be hit with a ZIP upload
                setAnalysisStatus('error');
                setAnalysisError('Could not create project ID.');
            }

        } catch (error) {
            console.error('Final upload/analysis error catch:', error);
            const message = error.message || 'Failed to process project. Please check if it is a valid ZIP/GitHub repo.';
            setUploadError(message);
            setAnalysisError(message);
            setAnalysisStatus('error');
            if (project?.id) {
                updateProject(project.id, { status: 'error', error_message: message.substring(0, 500) });
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleCloseModal = () => {
        setAnalysisModalVisible(false);
        // Reset state after modal closes
        setTimeout(() => {
            setAnalysisStatus('idle');
            setAnalysisProject(null);
            setAnalysisError(null);
            setUploadError(null);
        }, 300);
    };

    const handleViewResults = () => {
        if (analysisProject?.id) {
            setAnalysisModalVisible(false);
            navigate(`${createPageUrl('ProjectAnalysis')}?id=${analysisProject.id}`);
        }
    };

    const features = [
        { icon: Brain, title: 'AI Code Analysis', desc: 'Detects your stack and finds issues automatically', color: 'purple' },
        { icon: Zap, title: 'Smart Task Generation', desc: 'Creates actionable tasks to complete your project', color: 'gold' },
        { icon: GitBranch, title: 'Clean Diffs', desc: 'Review and approve changes like pull requests', color: 'purple' },
        { icon: CheckCircle, title: 'One-Click Apply', desc: 'Download patches or export modified code', color: 'gold' },
    ];

    // Bright Silver Chrome color classes - kept for consistency
    const colorClasses = {
        purple: {
            bg: 'from-slate-200/20 to-white/10',
            border: 'border-slate-300/40 hover:border-white/60',
            icon: 'text-slate-200',
            glow: 'group-hover:shadow-white/30'
        },
        gold: {
            bg: 'from-slate-200/20 to-white/10',
            border: 'border-slate-300/40 hover:border-white/60',
            icon: 'text-slate-200',
            glow: 'group-hover:shadow-white/30'
        },
        // fallback accents
        cyan: {
            bg: 'from-slate-200/20 to-white/10',
            border: 'border-slate-300/40 hover:border-white/60',
            icon: 'text-slate-200',
            glow: 'group-hover:shadow-white/30'
        },
        orange: {
            bg: 'from-slate-200/20 to-white/10',
            border: 'border-slate-300/40 hover:border-white/60',
            icon: 'text-slate-200',
            glow: 'group-hover:shadow-white/30'
        }
    };

    const stats = [
        { value: '2.5GB', label: 'Max Upload' },
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
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden relative">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to={createPageUrl('Home')} className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFE566] to-[#FFC947] flex items-center justify-center">
                            <Brain className="w-5 h-5 text-[#461D7C]" />
                        </div>
                        <span className="font-bold text-[#FFE566] text-lg">Brain Lane</span>
                    </Link>

                    <div className="flex items-center gap-1">
                        <Link
                            to={createPageUrl('Home')}
                            className="px-4 py-2 rounded-lg text-sm text-[#FFE566] hover:bg-[#FFE566]/10 transition-colors flex items-center gap-2"
                        >
                            <HomeIcon className="w-4 h-4" />
                            Home
                        </Link>
                        <Link
                            to={createPageUrl('Projects')}
                            className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-[#FFE566] hover:bg-[#FFE566]/10 transition-colors flex items-center gap-2"
                        >
                            <FolderGit2 className="w-4 h-4" />
                            Projects
                        </Link>
                        <Link
                            to={createPageUrl('ProjectHealth')}
                            className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-[#FFE566] hover:bg-[#FFE566]/10 transition-colors flex items-center gap-2"
                        >
                            <Brain className="w-4 h-4" />
                            Health
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Animated Background - Vibrant Multi-color Theme */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    {/* Gradient orbs - Metallic Purple & Gold Theme */}
                    <motion.div
                        className="absolute top-0 left-1/4 w-[640px] h-[640px] rounded-full blur-[120px] metallic-purple-bg opacity-60"
                        style={{ filter: 'blur(120px)' }}
                        animate={{
                            x: [0, 120, 0],
                            y: [0, 40, 0],
                            scale: [1, 1.15, 1]
                        }}
                        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute bottom-0 right-1/4 w-[520px] h-[520px] rounded-full blur-[100px] metallic-gold-bg opacity-50"
                        style={{ filter: 'blur(100px)' }}
                        animate={{
                            x: [0, -80, 0],
                            y: [0, -60, 0],
                            scale: [1, 1.08, 1]
                        }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full blur-[90px] metallic-purple-bg opacity-40"
                        style={{ filter: 'blur(90px)' }}
                        animate={{ scale: [1, 1.25, 1] }}
                        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute bottom-1/4 left-1/4 w-[320px] h-[320px] rounded-full blur-[80px] metallic-gold-bg opacity-35"
                        style={{ filter: 'blur(80px)' }}
                        animate={{
                            x: [0, 40, 0],
                            scale: [1, 1.12, 1]
                        }}
                        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {/* Grid overlay subtle gold lines */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,229,102,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,229,102,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />
                {/* Floating particles */}
                <FloatingParticles count={15} />
            </div>

            <div className="relative z-10">
                {/* Hero Section - Logo Only */}
                <div className="max-w-6xl mx-auto px-6 pt-32 pb-20">
                    <div className="text-center">
                        {/* Your Logo Image with Glowing Frame */}
                        <div className="relative inline-block">
                            {/* Glowing Frame */}
                            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#FFE566] via-[#FFC947] to-[#461D7C] opacity-75 blur-xl animate-pulse" />
                            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-[#FFE566] via-[#FFC947] to-[#461D7C] opacity-90" />

                            {/* Logo Container */}
                            <div className="relative bg-slate-950 rounded-2xl p-4">
                                <img
                                    src="/logo.png"
                                    alt="Brain Lane - Discover the Path to Your Peace of Mind"
                                    className="relative w-full max-w-2xl mx-auto drop-shadow-2xl"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid - Vibrant Glassmorphism Cards */}
                <div className="max-w-5xl mx-auto px-6 mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-5"
                    >
                        {features.map((feature, idx) => {
                            const colors = colorClasses[feature.color];
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 + idx * 0.1 }}
                                    whileHover={{ y: -8, scale: 1.03 }}
                                    className="group"
                                >
                                    <div className="relative h-full p-6 rounded-2xl bg-gradient-to-br from-slate-100/10 via-white/5 to-slate-300/10 backdrop-blur-xl border border-slate-300/30 hover:border-white/50 transition-all duration-300 overflow-hidden group-hover:shadow-lg group-hover:shadow-white/20"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(203,213,225,0.15) 0%, rgba(255,255,255,0.08) 50%, rgba(148,163,184,0.12) 100%)',
                                            boxShadow: '0 4px 30px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)'
                                        }}
                                    >
                                        {/* Chrome shine effect */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                                        {/* Animated corner accent */}
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/30 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />

                                        <div className="relative z-10">
                                            <motion.div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto border border-slate-300/40 hover:border-white/60 transition-all duration-300"
                                                style={{
                                                    background: 'linear-gradient(145deg, rgba(226,232,240,0.2) 0%, rgba(255,255,255,0.1) 50%, rgba(203,213,225,0.15) 100%)',
                                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 8px rgba(0,0,0,0.2)'
                                                }}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.7 + idx * 0.1, type: "spring", bounce: 0.6 }}
                                            >
                                                <feature.icon className="w-6 h-6 text-slate-100" />
                                            </motion.div>
                                            <h3 className="font-semibold text-slate-100 mb-2 transition-colors">{feature.title}</h3>
                                            <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>

                {/* Upload Section - Bright Silver Chrome */}
                <div className="max-w-2xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.6, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="relative">
                            {/* Glow effect behind card - Silver Chrome */}
                            <motion.div
                                className="absolute -inset-2 rounded-[2rem] blur-2xl opacity-40"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(226,232,240,0.6) 0%, rgba(255,255,255,0.4) 50%, rgba(148,163,184,0.5) 100%)'
                                }}
                                animate={{
                                    opacity: [0.3, 0.6, 0.3],
                                }}
                                transition={{
                                    duration: 5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />

                            <div
                                className="relative backdrop-blur-2xl rounded-3xl border border-slate-300/40 p-8 shadow-2xl"
                                style={{
                                    background: 'linear-gradient(145deg, rgba(226,232,240,0.12) 0%, rgba(255,255,255,0.06) 50%, rgba(148,163,184,0.1) 100%)',
                                    boxShadow: '0 8px 40px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.1)'
                                }}
                            >
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
                                        <Sparkles className="w-5 h-5 text-purple-400" style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.8))' }} />
                                    </motion.div>
                                    <span
                                        className="text-purple-300 font-medium"
                                        style={{
                                            textShadow: '0 0 10px rgba(168, 85, 247, 0.8), 0 0 20px rgba(168, 85, 247, 0.6), 0 0 30px rgba(168, 85, 247, 0.4)'
                                        }}
                                    >
                                        Start Your Analysis
                                    </span>
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
                            className="text-sm font-semibold text-[#FFE566]/80 uppercase tracking-[0.2em] mb-12"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                        >
                            How it works
                        </motion.h3>

                        <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap max-w-5xl mx-auto">
                            {[
                                { step: 'Upload Project', icon: Rocket, num: '01', color: 'purple' },
                                { step: 'AI Analyzes', icon: Cpu, num: '02', color: 'gold' },
                                { step: 'Review Tasks', icon: Code2, num: '03', color: 'purple' },
                                { step: 'Apply Changes', icon: Shield, num: '04', color: 'gold' },
                            ].map((item, idx) => {
                                const stepColors = {
                                    purple: { icon: 'text-[#6B3FA0]', border: 'border-[#461D7C]/50', bg: 'from-[#461D7C]/30 to-[#461D7C]/10', num: 'text-[#6B3FA0]' },
                                    gold: { icon: 'text-[#FFE566]', border: 'border-[#FFE566]/50', bg: 'from-[#FFE566]/30 to-[#FFE566]/10', num: 'text-[#FFE566]' }
                                };
                                const colors = stepColors[item.color];
                                return (
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
                                                <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity`} />
                                                <div className={`relative w-16 h-16 rounded-2xl bg-slate-900 border ${colors.border} flex items-center justify-center transition-all duration-300`}>
                                                    <item.icon className={`w-7 h-7 ${colors.icon} transition-colors`} />
                                                </div>
                                                <span className={`absolute -top-2 -right-2 text-xs font-bold ${colors.num} bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800`}>{item.num}</span>
                                            </motion.div>
                                            <span className="text-slate-400 text-sm font-medium group-hover:text-white transition-colors">{item.step}</span>
                                        </motion.div>
                                        {idx < 3 && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 1.2 + idx * 0.1 }}
                                                className="hidden md:flex items-center"
                                            >
                                                <div className={`w-12 h-[2px] bg-gradient-to-r ${
                                                    idx % 2 === 0 ? 'from-[#461D7C]/50 to-[#FFE566]/50' : 'from-[#FFE566]/50 to-[#461D7C]/50'
                                                }`} />
                                            </motion.div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
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
                                    <div className="flex items-center justify-center gap-1 text-[#FFE566]">
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
                                    <p className="text-slate-400 text-sm">Secure & Private</p>
                                </motion.div>

                                <motion.div
                                    className="text-center space-y-2 group"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Shield className="w-8 h-8 text-[#6B3FA0] mx-auto group-hover:text-[#8B5FC0] transition-colors" />
                                    <p className="text-slate-400 text-sm">Code Never Stored</p>
                                </motion.div>

                                <motion.div
                                    className="text-center space-y-2 group"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Zap className="w-8 h-8 text-[#FFE566] mx-auto group-hover:text-[#FFED9A] transition-colors" />
                                    <p className="text-slate-400 text-sm">Lightning Fast</p>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Bottom spacer */}
                    <div className="h-24" />
                </div>
            </div>

            {/* Footer */}
            <Footer />

            {analysisModalVisible && (
                <motion.div
                    className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center px-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-full max-w-xl bg-slate-900/80 border border-[#FFE566]/30 rounded-3xl p-10 text-center shadow-2xl"
                    >
                    <div className="mb-6 flex justify-center">
                        {analysisStatus === 'ready' ? (
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-cyan-500/20 flex items-center justify-center border border-green-400/40">
                                <CheckCircle className="w-12 h-12 text-green-400" />
                            </div>
                        ) : analysisStatus === 'error' ? (
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/30 to-orange-500/20 flex items-center justify-center border border-red-400/40">
                                <AlertCircle className="w-12 h-12 text-red-400" />
                            </div>
                        ) : (
                            <OrbitalSpinner size="lg" />
                        )}
                    </div>

                    <h3 className="text-2xl font-semibold text-[#FFE566] mb-3">
                        {analysisStatus === 'uploading' && 'Uploading Your Project'}
                        {analysisStatus === 'analyzing' && 'Analyzing Your Project'}
                        {analysisStatus === 'ready' && 'Analysis Complete'}
                        {analysisStatus === 'error' && 'Something Went Wrong'}
                    </h3>
                    <p className="text-slate-300 leading-relaxed">
                        {analysisStatus === 'uploading' && 'We\'re securing your ZIP, extracting files, and preparing them for AI.'}
                        {analysisStatus === 'analyzing' && 'Our AI is reviewing your stack, scanning for issues, and building a completion plan. This usually takes under a minute.'}
                        {analysisStatus === 'ready' && 'Your code intelligence report is ready. Jump in to review tasks, risks, and architecture insights.'}
                        {analysisStatus === 'error' && (analysisError || 'We could not finish the analysis. Please try again or reach out if the issue persists.')}
                    </p>

                    {(analysisStatus === 'ready' || analysisStatus === 'error') && (
                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                            {analysisStatus === 'ready' && (
                                <button
                                    onClick={handleViewResults}
                                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FFE566] to-[#FFC947] text-slate-900 font-semibold shadow-lg shadow-[#FFE566]/30 hover:opacity-90 transition"
                                >
                                    View Results
                                </button>
                            )}
                            <button
                                onClick={handleCloseModal}
                                className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-700/60 text-slate-300 hover:bg-slate-800/80 transition"
                            >
                                Close
                            </button>
                        </div>
                    )}
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
