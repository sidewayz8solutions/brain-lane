import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '@/App.jsx'
import '@/index.css'

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