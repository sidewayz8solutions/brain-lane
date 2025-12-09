// Auth API Routes for Vercel Edge Functions
// Handles authentication callbacks and session management

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    const { method, query } = req;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
        return res.status(200).end();
    }

    const action = query.action || req.body?.action;

    try {
        switch (action) {
            case 'callback':
                return handleCallback(req, res);
            
            case 'session':
                return handleSession(req, res);
            
            case 'logout':
                return handleLogout(req, res);
            
            case 'refresh':
                return handleRefresh(req, res);
            
            case 'user':
                return handleGetUser(req, res);

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Auth API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Handle OAuth callback
async function handleCallback(req, res) {
    const { code, state, error, error_description } = req.query;

    if (error) {
        console.error('OAuth error:', error, error_description);
        return res.redirect(`${process.env.FRONTEND_URL || ''}/auth/error?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
        return res.status(400).json({ error: 'Missing authorization code' });
    }

    try {
        // Exchange code for session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            return res.redirect(`${process.env.FRONTEND_URL || ''}/auth/error?error=exchange_failed`);
        }

        // Set secure cookies for session
        const { session } = data;
        
        res.setHeader('Set-Cookie', [
            `sb-access-token=${session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${session.expires_in}`,
            `sb-refresh-token=${session.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
        ]);

        // Redirect to frontend with success
        const redirectUrl = state ? decodeURIComponent(state) : '/';
        return res.redirect(`${process.env.FRONTEND_URL || ''}${redirectUrl}?auth=success`);

    } catch (error) {
        console.error('Callback error:', error);
        return res.redirect(`${process.env.FRONTEND_URL || ''}/auth/error?error=callback_failed`);
    }
}

// Get current session
async function handleSession(req, res) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.substring(7);

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        return res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.user_metadata?.name,
                avatar: user.user_metadata?.avatar_url,
                provider: user.app_metadata?.provider
            }
        });
    } catch (error) {
        console.error('Session error:', error);
        return res.status(500).json({ error: 'Failed to get session' });
    }
}

// Handle logout
async function handleLogout(req, res) {
    // Clear cookies
    res.setHeader('Set-Cookie', [
        'sb-access-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
        'sb-refresh-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    ]);

    return res.json({ success: true, message: 'Logged out successfully' });
}

// Handle token refresh
async function handleRefresh(req, res) {
    const refreshToken = req.cookies?.['sb-refresh-token'] || req.body?.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token' });
    }

    try {
        const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

        if (error) {
            return res.status(401).json({ error: 'Failed to refresh session' });
        }

        const { session } = data;

        res.setHeader('Set-Cookie', [
            `sb-access-token=${session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${session.expires_in}`,
            `sb-refresh-token=${session.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
        ]);

        return res.json({
            accessToken: session.access_token,
            expiresAt: session.expires_at
        });
    } catch (error) {
        console.error('Refresh error:', error);
        return res.status(500).json({ error: 'Failed to refresh session' });
    }
}

// Get user profile
async function handleGetUser(req, res) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.substring(7);

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Fetch extended user profile from database
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        return res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.user_metadata?.name,
                avatar: user.user_metadata?.avatar_url,
                provider: user.app_metadata?.provider,
                createdAt: user.created_at
            },
            profile: profile || null,
            subscription: profile?.subscription_tier || 'free'
        });
    } catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ error: 'Failed to get user' });
    }
}
