import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null, 
            errorInfo: null,
            eventId: null 
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        
        // Log error to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        // Generate a unique event ID for error tracking
        const eventId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.setState({ eventId });
        
        // Here you could send to an error tracking service like Sentry
        // Example: Sentry.captureException(error, { extra: errorInfo });
        
        // Store error in localStorage for debugging
        try {
            const errorLog = {
                eventId,
                error: error.toString(),
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            };
            
            const existingErrors = JSON.parse(localStorage.getItem('brainlane_errors') || '[]');
            existingErrors.push(errorLog);
            
            // Keep only last 10 errors
            if (existingErrors.length > 10) {
                existingErrors.shift();
            }
            
            localStorage.setItem('brainlane_errors', JSON.stringify(existingErrors));
        } catch (e) {
            console.error('Failed to log error:', e);
        }
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    handleReportBug = () => {
        const { error, eventId } = this.state;
        const body = encodeURIComponent(
            `## Error Report\n\n` +
            `**Event ID:** ${eventId}\n` +
            `**Error:** ${error?.toString()}\n` +
            `**URL:** ${window.location.href}\n` +
            `**Time:** ${new Date().toISOString()}\n\n` +
            `## Steps to Reproduce\n\n1. \n2. \n3. \n\n` +
            `## Expected Behavior\n\n\n` +
            `## Actual Behavior\n\n`
        );
        window.open(`https://github.com/yourusername/brain-lane/issues/new?body=${body}`, '_blank');
    };

    render() {
        if (this.state.hasError) {
            const { error, errorInfo, eventId } = this.state;
            const { fallback } = this.props;

            // Use custom fallback if provided
            if (fallback) {
                return fallback;
            }

            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
                    <div className="max-w-lg w-full">
                        {/* Error Card */}
                        <div className="bg-slate-900/50 border border-red-500/30 rounded-2xl p-8 text-center">
                            {/* Icon */}
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-6">
                                <AlertTriangle className="w-8 h-8 text-red-400" />
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl font-bold text-white mb-2">
                                Something went wrong
                            </h1>

                            {/* Description */}
                            <p className="text-slate-400 mb-6">
                                We encountered an unexpected error. Our team has been notified and we're working to fix it.
                            </p>

                            {/* Error Details (Development) */}
                            {process.env.NODE_ENV === 'development' && (
                                <div className="text-left mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700 overflow-auto max-h-48">
                                    <p className="text-red-400 font-mono text-sm mb-2">
                                        {error?.toString()}
                                    </p>
                                    {errorInfo?.componentStack && (
                                        <pre className="text-slate-500 font-mono text-xs whitespace-pre-wrap">
                                            {errorInfo.componentStack}
                                        </pre>
                                    )}
                                </div>
                            )}

                            {/* Event ID */}
                            {eventId && (
                                <p className="text-slate-500 text-sm mb-6">
                                    Error ID: <code className="text-slate-400">{eventId}</code>
                                </p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button
                                    onClick={this.handleReload}
                                    className="bg-blue-500 hover:bg-blue-600"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Try Again
                                </Button>
                                
                                <Button
                                    onClick={this.handleGoHome}
                                    variant="outline"
                                    className="border-slate-700 hover:bg-slate-800"
                                >
                                    <Home className="w-4 h-4 mr-2" />
                                    Go Home
                                </Button>

                                <Button
                                    onClick={this.handleReportBug}
                                    variant="outline"
                                    className="border-slate-700 hover:bg-slate-800"
                                >
                                    <Bug className="w-4 h-4 mr-2" />
                                    Report Bug
                                </Button>
                            </div>
                        </div>

                        {/* Help Text */}
                        <p className="text-center text-slate-500 text-sm mt-6">
                            If this problem persists, please try clearing your browser cache or contact support.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Functional wrapper for easier usage with hooks
export function withErrorBoundary(Component, fallback) {
    return function WrappedComponent(props) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}

// Hook-friendly error boundary wrapper
export function ErrorBoundaryWrapper({ children, fallback }) {
    return (
        <ErrorBoundary fallback={fallback}>
            {children}
        </ErrorBoundary>
    );
}

export default ErrorBoundary;
