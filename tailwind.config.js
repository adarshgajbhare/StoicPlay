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
          'system-ui',
          'Inter',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
      },
      colors: {
        // iOS 26 Liquid Glass Base Colors
        'liquid': {
          'black': '#000000',
          'dark': '#0a0a0b',
          'darker': '#050506',
          'surface': '#1c1c1e',
          'surface-light': '#2c2c2e',
          'glass': 'rgba(28, 28, 30, 0.68)',
          'glass-light': 'rgba(44, 44, 46, 0.78)',
          'overlay': 'rgba(0, 0, 0, 0.85)',
        },
        
        // Advanced Glass Effects
        glass: {
          // Base glass colors with improved opacity
          'white': 'rgba(255, 255, 255, 0.12)',
          'white-soft': 'rgba(255, 255, 255, 0.06)',
          'white-medium': 'rgba(255, 255, 255, 0.18)',
          'white-strong': 'rgba(255, 255, 255, 0.28)',
          'dark': 'rgba(28, 28, 30, 0.68)',
          'dark-soft': 'rgba(28, 28, 30, 0.48)',
          'dark-medium': 'rgba(28, 28, 30, 0.78)',
          'dark-strong': 'rgba(28, 28, 30, 0.88)',
          // iOS 26 specific glass tints
          'tint-blue': 'rgba(64, 156, 255, 0.15)',
          'tint-purple': 'rgba(175, 82, 222, 0.15)',
          'tint-pink': 'rgba(255, 55, 95, 0.15)',
          'tint-green': 'rgba(52, 199, 89, 0.15)',
        },
        
        // Enhanced Neon/Accent Colors
        neon: {
          'blue': '#409CFF',      // iOS 26 System Blue
          'purple': '#AF52DE',    // iOS 26 System Purple
          'pink': '#FF375F',      // iOS 26 System Pink  
          'green': '#34C759',     // iOS 26 System Green
          'orange': '#FF9F0A',    // iOS 26 System Orange
          'red': '#FF3B30',       // iOS 26 System Red
          'yellow': '#FFCC02',    // iOS 26 System Yellow
          'teal': '#64D2FF',      // iOS 26 System Teal
          'indigo': '#5856D6',    // iOS 26 System Indigo
          // Glow variants
          'blue-glow': 'rgba(64, 156, 255, 0.4)',
          'purple-glow': 'rgba(175, 82, 222, 0.4)',
          'pink-glow': 'rgba(255, 55, 95, 0.4)',
        },
        
        // Text Colors for Dark Theme
        text: {
          'primary': 'rgba(255, 255, 255, 0.95)',
          'secondary': 'rgba(255, 255, 255, 0.75)',
          'tertiary': 'rgba(255, 255, 255, 0.55)',
          'quaternary': 'rgba(255, 255, 255, 0.35)',
          'accent': '#409CFF',
        }
      },
      
      backdropBlur: {
        'glass-xs': '2px',
        'glass-sm': '8px',
        'glass-md': '16px',
        'glass-lg': '24px',
        'glass-xl': '32px',
        'glass-2xl': '40px',
        'glass-3xl': '48px',
      },
      
      borderRadius: {
        'glass': '16px',
        'glass-lg': '24px',
        'glass-xl': '32px',
        'glass-2xl': '40px',
        'ios': '12px',      // Standard iOS corner radius
        'ios-lg': '20px',   // Large iOS corner radius
        'ios-xl': '28px',   // Extra large iOS corner radius
      },
      
      boxShadow: {
        // iOS 26 Liquid Glass Shadows
        'glass-subtle': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        'glass-soft': '0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
        'glass-medium': '0 8px 32px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(0, 0, 0, 0.15)',
        'glass-strong': '0 16px 64px rgba(0, 0, 0, 0.35), 0 8px 32px rgba(0, 0, 0, 0.25)',
        'glass-elevated': '0 32px 128px rgba(0, 0, 0, 0.45), 0 16px 64px rgba(0, 0, 0, 0.35)',
        
        // Neon Glow Effects
        'neon-blue': '0 0 20px rgba(64, 156, 255, 0.25), 0 0 40px rgba(64, 156, 255, 0.15)',
        'neon-blue-strong': '0 0 30px rgba(64, 156, 255, 0.4), 0 0 60px rgba(64, 156, 255, 0.25)',
        'neon-purple': '0 0 20px rgba(175, 82, 222, 0.25), 0 0 40px rgba(175, 82, 222, 0.15)',
        'neon-pink': '0 0 20px rgba(255, 55, 95, 0.25), 0 0 40px rgba(255, 55, 95, 0.15)',
        
        // Interactive shadows
        'interactive-rest': '0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.1)',
        'interactive-hover': '0 8px 32px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(0, 0, 0, 0.15)',
        'interactive-active': '0 1px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.15)',
      },
      
      backgroundImage: {
        // Liquid Glass Gradients
        'liquid-dark': 'linear-gradient(135deg, rgba(28, 28, 30, 0.9) 0%, rgba(44, 44, 46, 0.7) 50%, rgba(28, 28, 30, 0.9) 100%)',
        'liquid-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.1) 100%)',
        'liquid-surface': 'linear-gradient(135deg, rgba(44, 44, 46, 0.8) 0%, rgba(28, 28, 30, 0.9) 100%)',
        
        // iOS 26 Specific Gradients  
        'ios-blue': 'linear-gradient(135deg, rgba(64, 156, 255, 0.2) 0%, rgba(64, 156, 255, 0.05) 100%)',
        'ios-purple': 'linear-gradient(135deg, rgba(175, 82, 222, 0.2) 0%, rgba(175, 82, 222, 0.05) 100%)',
        'ios-pink': 'linear-gradient(135deg, rgba(255, 55, 95, 0.2) 0%, rgba(255, 55, 95, 0.05) 100%)',
        
        // Animated Gradients
        'liquid-flow': 'linear-gradient(-45deg, #409CFF, #AF52DE, #FF375F, #34C759, #409CFF)',
        'neon-wave': 'linear-gradient(45deg, rgba(64, 156, 255, 0.3), rgba(175, 82, 222, 0.3), rgba(255, 55, 95, 0.3))',
        
        // Shimmer Effect
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
      },
      
      animation: {
        // iOS 26 Specific Animations
        'liquid-float': 'liquidFloat 6s ease-in-out infinite',
        'liquid-pulse': 'liquidPulse 3s ease-in-out infinite',
        'liquid-glow': 'liquidGlow 2s ease-in-out infinite alternate',
        'liquid-wave': 'liquidWave 8s linear infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'glass-morph': 'glassMorph 4s ease-in-out infinite',
        'neon-breathe': 'neonBreathe 3s ease-in-out infinite',
        
        // Enhanced Existing Animations  
        'float': 'float 4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        
        // Interactive Animations
        'button-press': 'buttonPress 0.1s ease-out',
        'button-release': 'buttonRelease 0.2s ease-out',
      },
      
      keyframes: {
        // iOS 26 Liquid Animations
        liquidFloat: {
          '0%, 100%': { 
            transform: 'translateY(0) rotate(0deg) scale(1)',
            filter: 'brightness(1) saturate(1)',
          },
          '25%': { 
            transform: 'translateY(-8px) rotate(1deg) scale(1.02)',
            filter: 'brightness(1.1) saturate(1.1)',
          },
          '50%': { 
            transform: 'translateY(-4px) rotate(0deg) scale(1.01)',
            filter: 'brightness(1.05) saturate(1.05)',
          },
          '75%': { 
            transform: 'translateY(-12px) rotate(-1deg) scale(1.02)',
            filter: 'brightness(1.1) saturate(1.1)',
          },
        },
        
        liquidPulse: {
          '0%, 100%': { 
            opacity: '0.8',
            transform: 'scale(1)',
          },
          '50%': { 
            opacity: '1',
            transform: 'scale(1.02)',
          },
        },
        
        liquidGlow: {
          '0%': {
            filter: 'brightness(1) saturate(1) blur(0px)',
            boxShadow: '0 0 20px rgba(64, 156, 255, 0.2)',
          },
          '100%': {
            filter: 'brightness(1.2) saturate(1.3) blur(1px)',
            boxShadow: '0 0 40px rgba(64, 156, 255, 0.4), 0 0 80px rgba(64, 156, 255, 0.2)',
          },
        },
        
        liquidWave: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        
        glassMorph: {
          '0%, 100%': {
            backdropFilter: 'blur(16px) saturate(180%)',
            background: 'rgba(28, 28, 30, 0.68)',
          },
          '50%': {
            backdropFilter: 'blur(24px) saturate(200%)',
            background: 'rgba(28, 28, 30, 0.78)',
          },
        },
        
        neonBreathe: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(64, 156, 255, 0.2)',
            filter: 'brightness(1)',
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(64, 156, 255, 0.4), 0 0 80px rgba(64, 156, 255, 0.2)',
            filter: 'brightness(1.2)',
          },
        },
        
        // Enhanced Base Animations
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '25%': { transform: 'translateY(-6px)' },
          '50%': { transform: 'translateY(-3px)' },
          '75%': { transform: 'translateY(-8px)' },
        },
        
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        
        buttonPress: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0.96)' },
        },
        
        buttonRelease: {
          '0%': { transform: 'scale(0.96)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      
      transitionDuration: {
        'instant': '50ms',
        'fast': '150ms',
        'medium': '300ms',
        'slow': '500ms',
        'slower': '750ms',
      },
      
      transitionTimingFunction: {
        'liquid': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-ios': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
  },
  plugins: [
    function({ addUtilities, theme }) {
      const liquidGlassUtilities = {
        // Core Liquid Glass Component
        '.liquid-glass': {
          background: 'rgba(28, 28, 30, 0.68)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: theme('borderRadius.ios'),
          boxShadow: theme('boxShadow.glass-soft'),
        },
        
        // Liquid Glass Variants
        '.liquid-glass-strong': {
          background: 'rgba(28, 28, 30, 0.85)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: theme('boxShadow.glass-medium'),
        },
        
        '.liquid-glass-subtle': {
          background: 'rgba(28, 28, 30, 0.48)',
          backdropFilter: 'blur(16px) saturate(160%)',
          WebkitBackdropFilter: 'blur(16px) saturate(160%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: theme('boxShadow.glass-subtle'),
        },
        
        // Interactive Glass Components
        '.liquid-glass-interactive': {
          background: 'rgba(28, 28, 30, 0.68)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: theme('borderRadius.ios'),
          boxShadow: theme('boxShadow.interactive-rest'),
          cursor: 'pointer',
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          
          '&:hover': {
            background: 'rgba(28, 28, 30, 0.78)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: theme('boxShadow.interactive-hover'),
            transform: 'translateY(-2px) scale(1.01)',
          },
          
          '&:active': {
            background: 'rgba(28, 28, 30, 0.88)',
            boxShadow: theme('boxShadow.interactive-active'),
            transform: 'translateY(0) scale(0.99)',
          },
        },
        
        // Neon Accent Glass
        '.liquid-glass-blue': {
          background: 'linear-gradient(135deg, rgba(64, 156, 255, 0.15) 0%, rgba(28, 28, 30, 0.68) 100%)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(64, 156, 255, 0.3)',
          boxShadow: theme('boxShadow.neon-blue'),
        },
        
        '.liquid-glass-purple': {
          background: 'linear-gradient(135deg, rgba(175, 82, 222, 0.15) 0%, rgba(28, 28, 30, 0.68) 100%)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(175, 82, 222, 0.3)',
          boxShadow: theme('boxShadow.neon-purple'),
        },
        
        // Text Styles
        '.text-liquid-primary': {
          color: theme('colors.text.primary'),
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
        },
        
        '.text-liquid-secondary': {
          color: theme('colors.text.secondary'),
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
        },
        
        '.text-liquid-accent': {
          color: theme('colors.neon.blue'),
          textShadow: `0 0 10px ${theme('colors.neon.blue-glow')}`,
        },
        
        // Shimmer Effect
        '.shimmer': {
          position: 'relative',
          overflow: 'hidden',
          
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: theme('backgroundImage.shimmer'),
            animation: theme('animation.shimmer'),
          },
        },
        
        // iOS 26 Button Base
        '.ios-button': {
          background: theme('backgroundImage.liquid-glass'),
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: theme('borderRadius.ios'),
          color: theme('colors.text.primary'),
          fontWeight: '500',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          
          '&:hover': {
            background: 'rgba(28, 28, 30, 0.78)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            transform: 'translateY(-1px)',
          },
          
          '&:active': {
            background: 'rgba(28, 28, 30, 0.88)',
            transform: 'translateY(0) scale(0.98)',
          },
        },
      };
      
      addUtilities(liquidGlassUtilities);
    },
  ],
};