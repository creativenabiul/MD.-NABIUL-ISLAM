import { useEffect, useRef, useState } from 'react';

interface CustomCursorProps {
  enabled?: boolean;
}

export function CustomCursor({ enabled = true }: CustomCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string>('');
  const [variant, setVariant] = useState<'default' | 'expanded' | 'hidden'>('hidden');
  const [isTouchOrReduced, setIsTouchOrReduced] = useState(true);

  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!enabled || isTouch || reduced) {
      setIsTouchOrReduced(true);
      return;
    }
    setIsTouchOrReduced(false);

    const pos = { x: -100, y: -100, tx: -100, ty: -100 };
    let rafId = 0;

    const onMove = (e: MouseEvent) => {
      pos.tx = e.clientX;
      pos.ty = e.clientY;
      const target = e.target as HTMLElement | null;
      const cursorTarget = target?.closest<HTMLElement>('[data-cursor-label]');
      const interactiveTarget = target?.closest<HTMLElement>('a, button, [role="button"], input, textarea, select');

      if (cursorTarget) {
        const customLabel = cursorTarget.getAttribute('data-cursor-label') || 'VIEW';
        setLabel(customLabel);
        setVariant('expanded');
      } else if (interactiveTarget) {
        setLabel('OPEN');
        setVariant('expanded');
      } else {
        setLabel('');
        setVariant('default');
      }
    };

    const onLeave = () => setVariant('hidden');

    const loop = () => {
      pos.x += (pos.tx - pos.x) * 0.2;
      pos.y += (pos.ty - pos.y) * 0.2;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [enabled]);

  if (isTouchOrReduced || variant === 'hidden') return null;

  const isExpanded = variant === 'expanded';

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="fixed top-0 left-0 z-[9999] pointer-events-none select-none transition-[width,height,background-color,border-color] duration-200 ease-out flex items-center justify-center rounded-full"
      style={{
        width: isExpanded ? 74 : 16,
        height: isExpanded ? 74 : 16,
        backgroundColor: isExpanded ? 'rgba(212, 180, 117, 0.94)' : 'transparent',
        border: isExpanded ? '1px solid rgba(232, 210, 160, 0.9)' : '1.5px solid rgba(212, 180, 117, 0.85)',
        mixBlendMode: isExpanded ? 'normal' : 'difference',
      }}
    >
      {isExpanded && label && (
        <span className="text-[10px] font-semibold tracking-[0.18em] text-[#070708] uppercase">
          {label}
        </span>
      )}
    </div>
  );
}
