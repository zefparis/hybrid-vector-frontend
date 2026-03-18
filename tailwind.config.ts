import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'hv-bg': '#0A0F1E',
        'hv-surface': '#111827',
        'hv-surface-2': '#1a2235',
        'hv-cyan': '#00C2FF',
        'hv-cyan-dark': '#0099CC',
        'hv-text': '#F9FAFB',
        'hv-muted': '#9CA3AF',
        'hv-red': '#EF4444',
        'hv-orange': '#F97316',
        'hv-green': '#22C55E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'cyan-glow': '0 0 20px rgba(0, 194, 255, 0.5), 0 0 40px rgba(0, 194, 255, 0.25)',
        'cyan-glow-sm': '0 0 10px rgba(0, 194, 255, 0.3)',
        'cyan-glow-lg': '0 0 40px rgba(0, 194, 255, 0.6), 0 0 80px rgba(0, 194, 255, 0.3)',
        'red-glow': '0 0 20px rgba(239, 68, 68, 0.5)',
        'orange-glow': '0 0 20px rgba(249, 115, 22, 0.5)',
        'green-glow': '0 0 20px rgba(34, 197, 94, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan-line': 'scanLine 2.5s linear infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'spin-slow': 'spin 3s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(200%)', opacity: '0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
