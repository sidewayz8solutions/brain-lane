import { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Upload, FileArchive, Github, X, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import AnimatedButton from '../ui/AnimatedButton';
import { AnimatedProgress, OrbitalSpinner } from '../ui/LoadingSpinner';

export default function FileUploader({ onUpload, isUploading }) {
    const [dragActive, setDragActive] = useState(false);
    const [uploadMode, setUploadMode] = useState('zip');
    const [githubUrl, setGithubUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

    // Mouse tracking for glow effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const glowX = useSpring(mouseX, { damping: 25, stiffness: 150 });
    const glowY = useSpring(mouseY, { damping: 25, stiffness: 150 });

    // 1GB limit - enforced on frontend and backend
    const MAX_SIZE_MB = 1024;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024; // 1,073,741,824 bytes

    // GitHub URL validation
    const isValidGitHubUrl = (url) => {
        if (!url) return false;
        const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/i;
        return githubPattern.test(url.trim());
    };

    const handleMouseMove = useCallback((e) => {
        if (!dropZoneRef.current) return;
        const rect = dropZoneRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        mouseX.set(x);
        mouseY.set(y);
    }, [mouseX, mouseY]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateFile = (file) => {
        setError(null);
        if (!file.name.endsWith('.zip')) {
            setError('Please upload a ZIP file');
            return false;
        }
        if (file.size > MAX_SIZE_BYTES) {
            setError(`File too large. Maximum size is ${MAX_SIZE_MB}MB`);
            return false;
        }
        return true;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (validateFile(file)) {
                setSelectedFile(file);
            }
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (validateFile(file)) {
                setSelectedFile(file);
            }
        }
    };

    const handleSubmit = () => {
        if (uploadMode === 'zip' && selectedFile) {
            // Simulate progress for visual effect
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 95) {
                    clearInterval(interval);
                    progress = 95;
                }
                setUploadProgress(progress);
            }, 200);
            
            onUpload({ type: 'zip', file: selectedFile });
        } else if (uploadMode === 'github' && githubUrl) {
            // Validate GitHub URL before submitting
            if (!isValidGitHubUrl(githubUrl)) {
                setError('Please enter a valid GitHub repository URL');
                return;
            }
            // Clean up the URL (remove .git if present, ensure https)
            let cleanUrl = githubUrl.trim();
            if (cleanUrl.endsWith('.git')) {
                cleanUrl = cleanUrl.slice(0, -4);
            }
            if (cleanUrl.startsWith('http://')) {
                cleanUrl = cleanUrl.replace('http://', 'https://');
            }
            
            // Simulate progress for GitHub cloning
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 12;
                if (progress >= 90) {
                    clearInterval(interval);
                    progress = 90;
                }
                setUploadProgress(progress);
            }, 250);
            
            onUpload({ type: 'github', url: cleanUrl });
        }
    };

    const clearSelection = () => {
        setSelectedFile(null);
        setGithubUrl('');
        setError(null);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Mode Toggle - Silver Chrome Theme */}
            <div 
                className="flex gap-2 mb-6 p-1.5 rounded-2xl backdrop-blur-sm border border-slate-300/30"
                style={{
                    background: 'linear-gradient(145deg, rgba(226,232,240,0.08) 0%, rgba(255,255,255,0.04) 50%, rgba(148,163,184,0.06) 100%)'
                }}
            >
                {['zip', 'github'].map((mode) => (
                    <motion.button
                        key={mode}
                        onClick={() => { setUploadMode(mode); clearSelection(); }}
                        className={cn(
                            "relative flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-medium transition-colors",
                            uploadMode === mode ? "text-slate-900" : "text-slate-200 hover:text-white"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {uploadMode === mode && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 rounded-xl"
                                style={{
                                    background: 'linear-gradient(135deg, #e2e8f0 0%, #ffffff 50%, #cbd5e1 100%)',
                                    boxShadow: '0 2px 10px rgba(255,255,255,0.3), inset 0 1px 0 rgba(255,255,255,0.8)'
                                }}
                                initial={false}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            {mode === 'zip' ? (
                                <>
                                    <FileArchive className="w-4 h-4" />
                                    Upload ZIP
                                </>
                            ) : (
                                <>
                                    <Github className="w-4 h-4" />
                                    GitHub URL
                                </>
                            )}
                        </span>
                    </motion.button>
                ))}
            </div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-sm"
                    >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {uploadMode === 'zip' ? (
                    <motion.div
                        key="zip"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        {/* Drop Zone - Silver Chrome Theme */}
                        <motion.div
                            ref={dropZoneRef}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onMouseMove={handleMouseMove}
                            onClick={() => !isUploading && fileInputRef.current?.click()}
                            className={cn(
                                "relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 overflow-hidden",
                                dragActive
                                    ? "border-white/70 bg-white/10"
                                    : selectedFile
                                        ? "border-slate-200/60 bg-slate-900/30"
                                        : "border-slate-300/50 hover:border-white/70 bg-slate-900/40",
                                isUploading && "pointer-events-none"
                            )}
                            style={{
                                background: dragActive 
                                    ? 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(226,232,240,0.08) 100%)'
                                    : selectedFile
                                        ? 'linear-gradient(145deg, rgba(226,232,240,0.08) 0%, rgba(255,255,255,0.04) 100%)'
                                        : 'linear-gradient(145deg, rgba(148,163,184,0.06) 0%, rgba(226,232,240,0.03) 100%)'
                            }}
                            whileHover={{ scale: selectedFile ? 1 : 1.01 }}
                            animate={{
                                boxShadow: dragActive
                                    ? '0 0 30px rgba(255, 255, 255, 0.4)'
                                    : selectedFile
                                        ? '0 0 30px rgba(226, 232, 240, 0.3)'
                                        : ['0 0 0px rgba(0, 0, 0, 0)', '0 0 25px rgba(255, 255, 255, 0.2)', '0 0 0px rgba(0, 0, 0, 0)']
                            }}
                            transition={{
                                boxShadow: {
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }
                            }}
                        >
                            {/* Dynamic glow effect - Silver Chrome */}
                            {!selectedFile && (
                                <motion.div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: `radial-gradient(circle at ${glowX.get()}% ${glowY.get()}%, rgba(255, 255, 255, 0.2), transparent 50%)`,
                                    }}
                                />
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".zip"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            
                            <AnimatePresence mode="wait">
                                {isUploading ? (
                                    <motion.div
                                        key="uploading"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="space-y-6"
                                    >
                                        <OrbitalSpinner size="lg" className="mx-auto" />
                                        <div>
                                            <p className="text-cyan-400 font-medium mb-2">Uploading & Analyzing...</p>
                                            <AnimatedProgress progress={uploadProgress} className="w-48 mx-auto" />
                                            <p className="text-cyan-400/60 text-sm mt-2">{Math.round(uploadProgress)}%</p>
                                        </div>
                                    </motion.div>
                                ) : selectedFile ? (
                                    <motion.div
                                        key="selected"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="space-y-5"
                                    >
                                        <motion.div
                                            className="relative w-24 h-24 mx-auto rounded-2xl flex items-center justify-center border border-slate-200/50"
                                            style={{
                                                background: 'linear-gradient(145deg, rgba(226,232,240,0.2) 0%, rgba(255,255,255,0.1) 50%, rgba(148,163,184,0.15) 100%)',
                                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 20px rgba(255,255,255,0.15)'
                                            }}
                                            initial={{ rotate: -10 }}
                                            animate={{ 
                                                rotate: 0,
                                                boxShadow: [
                                                    '0 0 20px rgba(255, 255, 255, 0.2)',
                                                    '0 0 35px rgba(255, 255, 255, 0.35)',
                                                    '0 0 20px rgba(255, 255, 255, 0.2)'
                                                ]
                                            }}
                                            transition={{ 
                                                rotate: { type: "spring", bounce: 0.5 },
                                                boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                                            }}
                                        >
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
                                            >
                                                <CheckCircle className="w-12 h-12 text-slate-100" />
                                            </motion.div>
                                        </motion.div>
                                        <div className="space-y-2">
                                            <motion.p
                                                className="text-white font-medium text-lg"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 }}
                                            >
                                                {selectedFile.name}
                                            </motion.p>
                                            <motion.div
                                                className="flex items-center justify-center gap-3 text-sm"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                            >
                                                <span className="text-slate-200 font-medium">
                                                    {formatFileSize(selectedFile.size)}
                                                </span>
                                                <span className="text-slate-600">•</span>
                                                <span className="text-slate-400">
                                                    Ready to analyze
                                                </span>
                                            </motion.div>
                                        </div>
                                        <motion.button
                                            onClick={(e) => { e.stopPropagation(); clearSelection(); }}
                                            className="text-slate-400 hover:text-white text-sm flex items-center gap-2 mx-auto px-4 py-2 rounded-lg hover:bg-slate-500/20 border border-slate-500/30 hover:border-slate-400/50 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <X className="w-4 h-4" /> Remove File
                                        </motion.button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="space-y-4"
                                    >
                                        <motion.div
                                            className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center border border-slate-300/40"
                                            style={{
                                                background: 'linear-gradient(145deg, rgba(226,232,240,0.15) 0%, rgba(255,255,255,0.08) 50%, rgba(148,163,184,0.12) 100%)',
                                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 15px rgba(0,0,0,0.2)'
                                            }}
                                            animate={{
                                                y: dragActive ? -5 : 0,
                                                scale: dragActive ? 1.1 : 1,
                                            }}
                                            transition={{ type: "spring", bounce: 0.5 }}
                                        >
                                            <Upload 
                                                className={cn(
                                                    "w-10 h-10 transition-colors",
                                                    dragActive ? "text-purple-300" : "text-purple-400"
                                                )}
                                                style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.7))' }}
                                            />
                                        </motion.div>
                                        <div>
                                            <p 
                                                className="text-white font-semibold text-lg"
                                                style={{ textShadow: '0 0 14px rgba(168, 85, 247, 0.85), 0 0 28px rgba(168, 85, 247, 0.55)' }}
                                            >
                                                {dragActive ? 'Drop it here!' : 'Drop your project ZIP here'}
                                            </p>
                                            <p 
                                                className="text-white/90 text-sm mt-2"
                                                style={{ textShadow: '0 0 10px rgba(168, 85, 247, 0.5)' }}
                                            >
                                                or click to browse
                                            </p>
                                            <motion.div
                                                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30"
                                                style={{
                                                    background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.05) 100%)'
                                                }}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.3 }}
                                            >
                                                <span 
                                                    className="text-white text-xs font-medium"
                                                    style={{ textShadow: '0 0 8px rgba(168, 85, 247, 0.6)' }}
                                                >
                                                    Max {MAX_SIZE_MB}MB
                                                </span>
                                            </motion.div>
                                        </div>

                                        {/* Supported stacks - Purple Glow */}
                                        <div className="pt-4">
                                            <p className="text-white/90 text-xs mb-3" style={{ textShadow: '0 0 8px rgba(168, 85, 247, 0.5)' }}>Supports:</p>
                                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                                {['React', 'Next.js', 'Vue', 'Python', 'Node.js', 'FastAPI', 'Django', 'Flask'].map((tech, i) => {
                                                    return (
                                                        <motion.span
                                                            key={tech}
                                                            className="px-3 py-1 text-xs rounded-full text-white border border-purple-500/40 hover:border-purple-400/70 transition-colors"
                                                            style={{
                                                                background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.20) 0%, rgba(168, 85, 247, 0.08) 100%)',
                                                                textShadow: '0 0 10px rgba(168, 85, 247, 0.6)'
                                                            }}
                                                            initial={{ opacity: 0, scale: 0 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: 0.3 + i * 0.06 }}
                                                            whileHover={{ scale: 1.05 }}
                                                        >
                                                            {tech}
                                                        </motion.span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <p 
                                            className="text-white/80 text-xs mt-4"
                                            style={{ textShadow: '0 0 8px rgba(168, 85, 247, 0.4)' }}
                                        >
                                            💡 Tip: Exclude node_modules & virtual environments
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="github"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="space-y-4"
                    >
                        {isUploading ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6 py-8"
                            >
                                <OrbitalSpinner size="lg" className="mx-auto" />
                                <div>
                                    <p className="text-slate-200 font-medium mb-2">Cloning Repository...</p>
                                    <AnimatedProgress progress={uploadProgress} className="w-48 mx-auto" />
                                    <p className="text-slate-400 text-sm mt-2">Analyzing code structure</p>
                                </div>
                            </motion.div>
                        ) : (
                            <>
                                <div className="relative group">
                                    <motion.div
                                        className="absolute -inset-0.5 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(226,232,240,0.5) 0%, rgba(255,255,255,0.3) 50%, rgba(148,163,184,0.4) 100%)'
                                        }}
                                    />
                                    <div className="relative">
                                        <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white z-10" />
                                        <input
                                            value={githubUrl}
                                            onChange={(e) => {
                                                setGithubUrl(e.target.value);
                                                setError(null);
                                            }}
                                            placeholder="https://github.com/username/repository"
                                            className="w-full pl-12 pr-4 h-14 bg-slate-900/70 border border-white/40 text-white placeholder:text-slate-300 rounded-xl focus:outline-none focus:border-white transition-colors"
                                            style={{
                                                background: 'linear-gradient(145deg, rgba(0,0,0,0.35) 0%, rgba(20,20,30,0.35) 100%)',
                                                boxShadow: '0 0 24px rgba(168, 85, 247, 0.25)'
                                            }}
                                            disabled={isUploading}
                                        />
                                    </div>
                                </div>
                                
                                {/* GitHub URL validation feedback */}
                                {githubUrl && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center justify-center gap-2"
                                    >
                                        {isValidGitHubUrl(githubUrl) ? (
                                            <>
                                                <CheckCircle className="w-4 h-4 text-slate-200" />
                                                <span className="text-slate-200 text-sm">Valid GitHub URL</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="w-4 h-4 text-slate-400" />
                                                <span className="text-slate-400 text-sm">Enter a valid GitHub repo URL</span>
                                            </>
                                        )}
                                    </motion.div>
                                )}
                                
                                <p className="text-white/90 text-sm text-center" style={{textShadow: '0 0 10px rgba(168,85,247,0.5)'}}>
                                    Enter the full URL of your public GitHub repository
                                </p>
                                
                                {/* Supported formats hint */}
                                <div 
                                    className="rounded-xl p-4 border border-white/30"
                                    style={{
                                        background: 'linear-gradient(145deg, rgba(0,0,0,0.35) 0%, rgba(20,20,30,0.35) 100%)'
                                    }}
                                >
                                    <p className="text-white/90 text-xs mb-3 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3 text-white" />
                                        Supported formats:
                                    </p>
                                    <div className="space-y-1 font-mono text-xs text-white/85">
                                        <p className="flex items-center gap-2">
                                            <span className="text-white">✓</span> https://github.com/user/repo
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="text-white">✓</span> https://github.com/user/repo.git
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6"
            >
                <AnimatedButton
                    onClick={handleSubmit}
                    disabled={isUploading || (uploadMode === 'zip' ? !selectedFile : !githubUrl || !isValidGitHubUrl(githubUrl))}
                    loading={isUploading}
                    size="xl"
                    className="w-full text-white"
                >
                    {isUploading ? (
                        'Analyzing Project...'
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            Analyze Project
                        </>
                    )}
                </AnimatedButton>
            </motion.div>
        </div>
    );
}

FileUploader.propTypes = {
    onUpload: PropTypes.func.isRequired,
    isUploading: PropTypes.bool.isRequired,
};