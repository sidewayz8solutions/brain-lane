import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '@/App.jsx'
import '@/index.css'

// Filter out Chrome extension errors (harmless but annoying)
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  const message = args.join(' ');
  // Filter out Chrome extension errors
  if (
    message.includes('chrome-extension://') ||
    message.includes('web_accessible_resources') ||
    message.includes('livestartpage-message-add.js') ||
    message.includes('net::ERR_FAILED') && message.includes('chrome-extension://invalid')
  ) {
    return; // Suppress these errors
  }
  originalError.apply(console, args);
};

console.warn = (...args) => {
  const message = args.join(' ');
  // Filter out Chrome extension warnings
  if (
    message.includes('chrome-extension://') ||
    message.includes('web_accessible_resources') ||
    message.includes('livestartpage-message-add.js')
  ) {
    return; // Suppress these warnings
  }
  originalWarn.apply(console, args);
};

// Also catch unhandled errors and rejections
window.addEventListener('error', (event) => {
  const message = event.message || '';
  if (
    message.includes('chrome-extension://') ||
    message.includes('web_accessible_resources') ||
    message.includes('livestartpage-message-add.js')
  ) {
    event.preventDefault();
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || String(event.reason || '');
  if (
    message.includes('chrome-extension://') ||
    message.includes('web_accessible_resources') ||
    message.includes('livestartpage-message-add.js')
  ) {
    event.preventDefault();
    return false;
  }
});

// Auto-clear oversized localStorage to prevent quota errors
try {
  const stored = localStorage.getItem('brain-lane-projects');
  if (stored && stored.length > 1_000_000) { // > 1MB is suspicious
    console.warn('🧹 Clearing oversized brain-lane-projects from localStorage');
    localStorage.removeItem('brain-lane-projects');
    localStorage.removeItem('brain-lane-tasks');
  }
} catch (e) {
  // If reading fails due to quota, clear everything
  console.warn('🧹 localStorage error, clearing brain-lane data:', e.message);
  try {
    localStorage.removeItem('brain-lane-projects');
    localStorage.removeItem('brain-lane-tasks');
  } catch {}
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)