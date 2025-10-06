/* eslint-disable react/prop-types */
import React from 'react';

/**
 * Reusable Glass Button component with Liquid Glass design system
 * @param {string} variant - 'primary', 'secondary', 'danger', 'ghost'
 * @param {string} size - 'sm', 'md', 'lg', 'xl'
 * @param {boolean} neonGlow - Enable neon glow effect
 * @param {string} gradient - Custom gradient classes
 * @param {boolean} disabled - Disabled state
 * @param {boolean} loading - Loading state
 * @param {React.ReactNode} children - Button content
 * @param {React.ReactNode} leftIcon - Icon on the left
 * @param {React.ReactNode} rightIcon - Icon on the right
 * @param {string} className - Additional CSS classes
 * @param {Function} onClick - Click handler
 * @param {object} rest - Additional props
 */
export function GlassButton({
  variant = 'primary',
  size = 'md',
  neonGlow = false,
  gradient = '',
  disabled = false,
  loading = false,
  children,
  leftIcon,
  rightIcon,
  className = '',
  onClick,
  ...rest
}) {
  const baseClasses = 'glass-button relative overflow-hidden font-medium transition-all duration-300 flex items-center justify-center gap-2 glass-focus';
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-xs rounded-lg',
    md: 'px-4 py-3 text-sm rounded-glass',
    lg: 'px-6 py-4 text-base rounded-glass',
    xl: 'px-8 py-5 text-lg rounded-glass-lg'
  };
  
  const variantClasses = {
    primary: 'glass-strong text-glass border-glass-primary/30 hover:border-neon-blue/50',
    secondary: 'glass-soft text-glass/80 border-glass-primary/20 hover:border-glass-primary/40',
    danger: 'glass-strong text-red-300 border-red-400/30 hover:border-red-400/60 bg-gradient-to-r from-red-400/10 to-red-600/10',
    ghost: 'glass-soft text-glass/70 border-transparent hover:glass-strong hover:text-glass'
  };
  
  const glowClasses = {
    primary: 'neon-glow hover:shadow-neon-glow-strong',
    secondary: 'hover:shadow-glass-elevated',
    danger: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    ghost: ''
  };
  
  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed hover:transform-none hover:shadow-none'
    : 'cursor-pointer liquid-interactive';
  
  const finalClasses = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    neonGlow ? glowClasses[variant] : '',
    gradient,
    disabledClasses,
    className
  ].filter(Boolean).join(' ');
  
  const handleClick = (e) => {
    if (disabled || loading) return;
    onClick?.(e);
  };
  
  return (
    <button
      className={finalClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      {...rest}
    >
      {/* Shimmer Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      
      {/* Content */}
      <div className="relative flex items-center gap-2">
        {loading ? (
          <div className="w-4 h-4 border-2 border-glass/30 border-t-glass rounded-full animate-spin" />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        
        {children && (
          <span className={loading ? 'opacity-70' : ''}>
            {children}
          </span>
        )}
        
        {rightIcon && !loading && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </div>
      
      {/* Neon Glow Background */}
      {neonGlow && (
        <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/20 via-neon-purple/20 to-neon-pink/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10" />
      )}
    </button>
  );
}

/**
 * Glass Icon Button - Specialized version for icon-only buttons
 */
export function GlassIconButton({
  icon,
  size = 'md',
  variant = 'ghost',
  neonGlow = false,
  className = '',
  ...rest
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-14 h-14 text-xl'
  };
  
  return (
    <GlassButton
      variant={variant}
      neonGlow={neonGlow}
      className={`${sizeClasses[size]} !p-0 rounded-full ${className}`}
      {...rest}
    >
      {icon}
    </GlassButton>
  );
}

/**
 * Glass Toggle Button - For toggle states
 */
export function GlassToggleButton({
  active = false,
  activeGradient = 'from-neon-blue to-neon-purple',
  children,
  ...rest
}) {
  return (
    <GlassButton
      variant={active ? 'primary' : 'ghost'}
      neonGlow={active}
      gradient={active ? `bg-gradient-to-r ${activeGradient}` : ''}
      className={active ? 'text-white border-transparent' : ''}
      {...rest}
    >
      {children}
    </GlassButton>
  );
}

export default GlassButton;