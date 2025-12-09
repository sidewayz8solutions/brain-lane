import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/authService';

// Auth Context
const AuthContext = createContext({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    signIn: async () => {},
    signUp: async () => {},
    signOut: async () => {},
    signInWithProvider: async () => {},
    refreshSession: async () => {},
    updateProfile: async () => {},
});

// Auth Provider Component
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize auth state
    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            setIsLoading(true);
            
            // Check for existing session
            const currentSession = await authService.getSession();
            
            if (currentSession) {
                setSession(currentSession);
                
                // Fetch user profile
                const userProfile = await authService.getCurrentUser();
                setUser(userProfile);
            }
        } catch (err) {
            console.error('Auth initialization error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Sign in with email/password
    const signIn = useCallback(async (email, password) => {
        try {
            setIsLoading(true);
            setError(null);
            
            const result = await authService.signIn(email, password);
            
            if (result.user) {
                setUser(result.user);
                setSession(result.session);
            }
            
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Sign up with email/password
    const signUp = useCallback(async (email, password, metadata = {}) => {
        try {
            setIsLoading(true);
            setError(null);
            
            const result = await authService.signUp(email, password, metadata);
            
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Sign out
    const signOut = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            await authService.signOut();
            
            setUser(null);
            setSession(null);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Sign in with OAuth provider
    const signInWithProvider = useCallback(async (provider) => {
        try {
            setError(null);
            
            const result = await authService.signInWithProvider(provider);
            
            // OAuth redirects, so we don't need to set state here
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Refresh session
    const refreshSession = useCallback(async () => {
        try {
            const newSession = await authService.refreshSession();
            
            if (newSession) {
                setSession(newSession);
            }
            
            return newSession;
        } catch (err) {
            console.error('Session refresh error:', err);
            // If refresh fails, sign out
            await signOut();
        }
    }, [signOut]);

    // Update user profile
    const updateProfile = useCallback(async (updates) => {
        try {
            setIsLoading(true);
            setError(null);
            
            const updatedUser = await authService.updateProfile(updates);
            
            if (updatedUser) {
                setUser(updatedUser);
            }
            
            return updatedUser;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Auto-refresh session before expiry
    useEffect(() => {
        if (!session?.expires_at) return;

        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        const timeUntilExpiry = expiresAt - now;
        
        // Refresh 5 minutes before expiry
        const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 0);
        
        const refreshTimer = setTimeout(() => {
            refreshSession();
        }, refreshTime);

        return () => clearTimeout(refreshTimer);
    }, [session, refreshSession]);

    const value = {
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        error,
        signIn,
        signUp,
        signOut,
        signInWithProvider,
        refreshSession,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    
    return context;
}

// Higher-order component for protected routes
export function withAuth(Component) {
    return function ProtectedRoute(props) {
        const { isAuthenticated, isLoading } = useAuth();

        if (isLoading) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            );
        }

        if (!isAuthenticated) {
            // Redirect to login or show auth modal
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
                        <p className="text-slate-400 mb-4">Please sign in to access this page</p>
                    </div>
                </div>
            );
        }

        return <Component {...props} />;
    };
}

// Guard component for conditional rendering
export function AuthGuard({ children, fallback = null }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return fallback || (
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        );
    }

    if (!isAuthenticated) {
        return fallback;
    }

    return children;
}

export default AuthContext;
