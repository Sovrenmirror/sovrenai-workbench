/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'agent': {
          'ready': '#60a5fa',      // blue-400
          'working': '#34d399',    // emerald-400
          'paused': '#fbbf24',     // amber-400
          'error': '#f87171',      // red-400
          'completed': '#a78bfa',  // violet-400
        },
        'theme': {
          'neon': '#00ff88',
          'cyber': '#ff00aa',
          'matrix': '#00ff00',
          'vapor': '#ff1493',
          'cosmic': '#9d4edd',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(96, 165, 250, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(96, 165, 250, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
