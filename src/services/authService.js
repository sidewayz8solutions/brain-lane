/**
 * Brain Lane — Auth Service
 * ==========================
 * User authentication with Supabase Auth
 * 
 * Features:
 * - Email/Password signup & login
 * - Google OAuth
 * - GitHub OAuth
 * - Session management
 * - User profile with usage history
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not configured. Auth features will be disabled.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// ============================================================================
// AUTH STATE
// ============================================================================

let currentUser = null;
let currentSession = null;
const authListeners = new Set();

// Initialize auth state
if (supabase) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    currentSession = session;
    currentUser = session?.user || null;
    notifyListeners();
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    currentSession = session;
    currentUser = session?.user || null;
    notifyListeners();
  });
}

function notifyListeners() {
  authListeners.forEach(cb => {
    try {
      cb({ user: currentUser, session: currentSession });
    } catch (err) {
      console.error('Auth listener error:', err);
    }
  });
}

// ============================================================================
// AUTH SERVICE
// ============================================================================

export const authService = {
  /**
   * Check if auth is available
   */
  isAvailable() {
    return !!supabase;
  },

  /**
   * Get current user
   */
  getUser() {
    return currentUser;
  },

  /**
   * Get current session
   */
  getSession() {
    return currentSession;
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return !!currentUser;
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback) {
    authListeners.add(callback);
    // Immediately call with current state
    callback({ user: currentUser, session: currentSession });
    return () => authListeners.delete(callback);
  },

  // ---------------------------------------------------------------------------
  // EMAIL AUTH
  // ---------------------------------------------------------------------------

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email, password, metadata = {}) {
    if (!supabase) throw new Error('Auth not configured');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.fullName || '',
          avatar_url: metadata.avatarUrl || '',
          ...metadata,
        },
      },
    });

    if (error) throw error;

    // Create user profile in database
    if (data.user) {
      await this._createUserProfile(data.user);
    }

    return data;
  },

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email, password) {
    if (!supabase) throw new Error('Auth not configured');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Update last login
    if (data.user) {
      await this._updateLastLogin(data.user.id);
    }

    return data;
  },

  /**
   * Send password reset email
   */
  async resetPassword(email) {
    if (!supabase) throw new Error('Auth not configured');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  },

  /**
   * Update password
   */
  async updatePassword(newPassword) {
    if (!supabase) throw new Error('Auth not configured');

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  },

  // ---------------------------------------------------------------------------
  // OAUTH
  // ---------------------------------------------------------------------------

  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    if (!supabase) throw new Error('Auth not configured');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign in with GitHub
   */
  async signInWithGitHub() {
    if (!supabase) throw new Error('Auth not configured');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'read:user user:email',
      },
    });

    if (error) throw error;
    return data;
  },

  // ---------------------------------------------------------------------------
  // SESSION MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * Sign out
   */
  async signOut() {
    if (!supabase) throw new Error('Auth not configured');

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Refresh session
   */
  async refreshSession() {
    if (!supabase) throw new Error('Auth not configured');

    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data;
  },

  // ---------------------------------------------------------------------------
  // USER PROFILE
  // ---------------------------------------------------------------------------

  /**
   * Get user profile
   */
  async getProfile(userId = null) {
    if (!supabase) throw new Error('Auth not configured');

    const id = userId || currentUser?.id;
    if (!id) throw new Error('No user ID provided');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Update user profile
   */
  async updateProfile(updates) {
    if (!supabase) throw new Error('Auth not configured');
    if (!currentUser) throw new Error('Not logged in');

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: currentUser.id,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create user profile (internal)
   */
  async _createUserProfile(user) {
    if (!supabase) return;

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      avatar_url: user.user_metadata?.avatar_url || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to create profile:', error);
    }
  },

  /**
   * Update last login timestamp
   */
  async _updateLastLogin(userId) {
    if (!supabase) return;

    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);
  },

  // ---------------------------------------------------------------------------
  // USAGE HISTORY
  // ---------------------------------------------------------------------------

  /**
   * Get usage history for current user
   */
  async getUsageHistory(limit = 50) {
    if (!supabase) throw new Error('Auth not configured');
    if (!currentUser) throw new Error('Not logged in');

    const { data, error } = await supabase
      .from('usage_history')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  /**
   * Record usage event
   */
  async recordUsage(event) {
    if (!supabase) return;
    if (!currentUser) return;

    const { error } = await supabase.from('usage_history').insert({
      user_id: currentUser.id,
      event_type: event.type,
      event_data: event.data || {},
      project_id: event.projectId,
      credits_used: event.credits || 0,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to record usage:', error);
    }
  },

  /**
   * Get usage summary
   */
  async getUsageSummary(period = 'month') {
    if (!supabase) throw new Error('Auth not configured');
    if (!currentUser) throw new Error('Not logged in');

    const startDate = new Date();
    if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
    else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);

    const { data, error } = await supabase
      .from('usage_history')
      .select('event_type, credits_used')
      .eq('user_id', currentUser.id)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Aggregate
    const summary = {
      totalCredits: 0,
      eventCounts: {},
      period,
    };

    for (const row of data) {
      summary.totalCredits += row.credits_used || 0;
      summary.eventCounts[row.event_type] = (summary.eventCounts[row.event_type] || 0) + 1;
    }

    return summary;
  },
};

// ============================================================================
// REACT HOOK
// ============================================================================

export function useAuth() {
  const [authState, setAuthState] = React.useState({
    user: authService.getUser(),
    session: authService.getSession(),
    loading: true,
  });

  React.useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(({ user, session }) => {
      setAuthState({ user, session, loading: false });
    });
    return unsubscribe;
  }, []);

  return {
    ...authState,
    isLoggedIn: !!authState.user,
    signInWithEmail: authService.signInWithEmail.bind(authService),
    signUpWithEmail: authService.signUpWithEmail.bind(authService),
    signInWithGoogle: authService.signInWithGoogle.bind(authService),
    signInWithGitHub: authService.signInWithGitHub.bind(authService),
    signOut: authService.signOut.bind(authService),
    updateProfile: authService.updateProfile.bind(authService),
  };
}

// Import React for the hook
import React from 'react';

export default authService;
