import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Ensure DOM is ready before mounting React
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('[React] Fatal: #root element not found in DOM');
  console.error('[React] document.readyState:', document.readyState);
  console.error('[React] document.body:', document.body);
  throw new Error('Root element not found - DOM may not be ready');
}

console.log('[React] Mounting app to #root element');
console.log('[React] document.readyState:', document.readyState);

try {
  createRoot(rootElement).render(<App />);
  console.log('[React] App mounted successfully');
} catch (error) {
  console.error('[React] Failed to mount app:', error);
  throw error;
}
