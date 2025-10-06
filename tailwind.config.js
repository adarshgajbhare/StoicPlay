/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif'
        ],
      },
      colors: {
        glass: {
          white: 'rgba(255, 255, 255, 0.15)',
          'white-soft': 'rgba(255, 255, 255, 0.08)',
          'white-strong': 'rgba(255, 255, 255, 0.25)',
          black: 'rgba(0, 0, 0, 0.15)',
          'black-soft': 'rgba(0, 0, 0, 0.08)',
          'black-strong': 'rgba(0, 0, 0, 0.25)',
        },
        neon: {
          blue: '#00d4ff',
          purple: '#8b5cf6',
          pink: '#f472b6',
          green: '#34d399',
          orange: '#fb7185',
        },
      },
      backdropBlur: {
        'glass-sm': '4px',
        'glass-md': '8px',
        'glass-lg': '12px',
        'glass-xl': '16px',
        'glass-2xl': '24px',
      },
      borderRadius: {
        'glass': '20px',
        'glass-lg': '32px',
        'glass-xl': '48px',
      },
      boxShadow: {
        'glass-light': '0 8px 32px rgba(31, 38, 135, 0.37)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.37)',
        'glass-elevated': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        'neon-glow': '0 0 20px rgba(0, 212, 255, 0.3)',
        'neon-glow-strong': '0 0 30px rgba(0, 212, 255, 0.5)',
      },
      backgroundImage: {
        'glass-gradient-light': 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'glass-gradient-dark': 'linear-gradient(135deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.05) 100%)',
        'liquid-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
        'neon-gradient': 'linear-gradient(45deg, var(--neon-blue), var(--neon-purple), var(--neon-pink), var(--neon-green))',
      },
      animation: {
        'wiggle': 'wiggle 0.3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-in-bottom': 'slide-in-bottom 0.5s ease-out',
        'slide-in-right': 'slide-in-right 0.5s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'liquid-gradient': 'liquid-gradient 15s ease infinite',
        'liquid-float': 'liquid-float 6s ease-in-out infinite',
        'neon-pulse': 'neon-pulse 2s infinite alternate',
        'glass-shimmer': 'glass-shimmer 2s infinite',
      },
      keyframes: {
        wiggle: {
          '0%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-1deg)' },
          '75%': { transform: 'rotate(1deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 212, 255, 0.4)' },
        },
        'slide-in-bottom': {
          from: {
            transform: 'translateY(100%)',
            opacity: '0',
          },
          to: {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'slide-in-right': {
          from: {
            transform: 'translateX(100%)',
            opacity: '0',
          },
          to: {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'liquid-gradient': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'liquid-float': {
          '0%, 100%': {
            transform: 'translateY(0) rotate(0deg)',
          },
          '25%': {
            transform: 'translateY(-10px) rotate(1deg)',
          },
          '75%': {
            transform: 'translateY(-5px) rotate(-1deg)',
          },
        },
        'neon-pulse': {
          '0%': {
            filter: 'blur(8px) brightness(1)',
          },
          '100%': {
            filter: 'blur(12px) brightness(1.2)',
          },
        },
        'glass-shimmer': {
          '0%': {
            backgroundPosition: '-200px 0',
          },
          '100%': {
            backgroundPosition: 'calc(200px + 100%) 0',
          },
        },
      },
      transitionDuration: {
        'fast': '200ms',
        'medium': '300ms',
        'slow': '500ms',
      },
      transitionTimingFunction: {
        'liquid': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    function({ addUtilities, theme }) {
      const glassUtilities = {
        '.glass-morphism': {
          background: 'var(--glass-gradient)',
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          border: '1px solid var(--glass-primary)',
          boxShadow: 'var(--glass-shadow)',
          borderRadius: theme('borderRadius.glass'),
        },
        '.glass-interactive': {
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-2px) scale(1.02)',
            filter: 'brightness(1.1) saturate(1.2)',
          },
          '&:active': {
            transform: 'translateY(0) scale(0.98)',
            filter: 'brightness(0.9)',
          },
        },
        '.text-glass': {
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          color: 'rgba(255, 255, 255, 0.9)',
        },
      };
      
      addUtilities(glassUtilities);
    },
  ],
};