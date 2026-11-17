import { ReactNode, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

interface MagneticButtonProps {
  children: ReactNode;
  to?: string;
  href?: string;
  download?: string | boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'ghost';
  cursorLabel?: string;
  showArrow?: boolean;
  disabled?: boolean;
  className?: string;
}

export function MagneticButton({
  children,
  to,
  href,
  download,
  onClick,
  type = 'button',
  variant = 'primary',
  cursorLabel = 'OPEN',
  showArrow = true,
  disabled = false,
  className = '',
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.22;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.22;
    setOffset({ x: dx, y: dy });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  const baseStyles =
    'group relative inline-flex items-center justify-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg overflow-hidden transition-transform duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4B475] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070708] disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles =
    variant === 'primary'
      ? 'bg-[#D4B475] text-[#070708] border border-[#D4B475]'
      : variant === 'secondary'
      ? 'bg-[#141418] text-[#F5F2EB] border border-white/15 hover:border-[#D4B475]/60'
      : 'bg-transparent text-[#F5F2EB] border border-transparent hover:border-white/15';

  const innerContent = (
    <>
      {/* Clip-path sweeping fill layer */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 transition-[clip-path] duration-300 ease-out [clip-path:inset(0_100%_0_0)] group-hover:[clip-path:inset(0_0%_0_0)] ${
          variant === 'primary' ? 'bg-[#E8D2A0]' : 'bg-[#D4B475]'
        }`}
      />
      {/* Rolling duplicate label */}
      <span
        className={`relative z-10 h-5 overflow-hidden flex flex-col justify-start transition-colors duration-200 ${
          variant !== 'primary' ? 'group-hover:text-[#070708]' : ''
        }`}
      >
        <span className="block h-5 leading-5 transition-transform duration-300 ease-out group-hover:-translate-y-5">
          {children}
        </span>
        <span
          aria-hidden="true"
          className="block h-5 leading-5 transition-transform duration-300 ease-out group-hover:-translate-y-5"
        >
          {children}
        </span>
      </span>
      {showArrow && (
        <span
          className={`relative z-10 w-4 h-4 overflow-hidden inline-flex items-center justify-center transition-colors duration-200 ${
            variant !== 'primary' ? 'group-hover:text-[#070708]' : ''
          }`}
        >
          <ArrowUpRight className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-4 group-hover:-translate-y-4" />
          <ArrowUpRight
            aria-hidden="true"
            className="w-4 h-4 absolute -translate-x-4 translate-y-4 transition-transform duration-300 ease-out group-hover:translate-x-0 group-hover:translate-y-0"
          />
        </span>
      )}
    </>
  );

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-cursor-label={cursorLabel}
      className="inline-block"
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: offset.x === 0 && offset.y === 0 ? 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
      }}
    >
      {to ? (
        <Link to={to} className={`${baseStyles} ${variantStyles} ${className}`}>
          {innerContent}
        </Link>
      ) : href ? (
        <a
          href={href}
          download={download}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noreferrer noopener' : undefined}
          className={`${baseStyles} ${variantStyles} ${className}`}
        >
          {innerContent}
        </a>
      ) : (
        <button
          type={type}
          onClick={onClick}
          disabled={disabled}
          className={`${baseStyles} ${variantStyles} ${className}`}
        >
          {innerContent}
        </button>
      )}
    </div>
  );
}
