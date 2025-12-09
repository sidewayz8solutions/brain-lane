/**
 * AuthModal — Login/Signup Modal Component
 * Email, Google, and GitHub authentication
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User, 
  Github, 
  X,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { authService } from '@/services/authService';

// Google icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError(null);
    setSuccess(null);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        await authService.signUpWithEmail(email, password, { fullName });
        setSuccess('Check your email to confirm your account!');
      } else if (mode === 'login') {
        await authService.signInWithEmail(email, password);
        onClose();
      } else if (mode === 'forgot') {
        await authService.resetPassword(email);
        setSuccess('Password reset email sent!');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await authService.signInWithGoogle();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGitHubAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await authService.signInWithGitHub();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!authService.isAvailable()) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gray-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Authentication Not Available</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <p>Authentication is not configured.</p>
            <p className="text-sm mt-2">
              Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-md p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-6 py-8 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center"
          >
            <User className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-gray-400 mt-1">
            {mode === 'login' && 'Sign in to continue to Brain Lane'}
            {mode === 'signup' && 'Start your 14-day free trial'}
            {mode === 'forgot' && "We'll send you a reset link"}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Error/Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm"
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* OAuth Buttons */}
          {mode !== 'forgot' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="h-11 bg-white/5 border-white/10 hover:bg-white/10"
                >
                  <GoogleIcon />
                  <span className="ml-2">Google</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGitHubAuth}
                  disabled={loading}
                  className="h-11 bg-white/5 border-white/10 hover:bg-white/10"
                >
                  <Github className="w-5 h-5" />
                  <span className="ml-2">GitHub</span>
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-gray-900 text-gray-500">or continue with email</span>
                </div>
              </div>
            </>
          )}

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="pl-10 bg-white/5 border-white/10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="pl-10 bg-white/5 border-white/10"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="pl-10 pr-10 bg-white/5 border-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleModeChange('forgot')}
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Link'}
                </>
              )}
            </Button>
          </form>

          {/* Mode Toggle */}
          <div className="text-center text-sm text-gray-400">
            {mode === 'login' && (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => handleModeChange('signup')}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  Sign up
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => handleModeChange('login')}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  Sign in
                </button>
              </>
            )}
            {mode === 'forgot' && (
              <>
                Remember your password?{' '}
                <button
                  onClick={() => handleModeChange('login')}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
