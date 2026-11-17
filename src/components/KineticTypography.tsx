import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface HeroKineticHeadlineProps {
  lines: string[];
  className?: string;
}

export function HeroKineticHeadline({ lines, className = '' }: HeroKineticHeadlineProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <h1 ref={containerRef} className={className}>
      {lines.map((line, lineIdx) => (
        <span key={lineIdx} className="block overflow-hidden py-0.5">
          <motion.span
            initial={{ y: '105%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{
              duration: 0.8,
              delay: lineIdx * 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="inline-block"
          >
            {line.split(' ').map((word, wordIdx) => (
              <span key={wordIdx} className="inline-block mr-[0.26em] last:mr-0">
                {word.split('').map((char, charIdx) => (
                  <KineticChar key={charIdx} char={char} mousePos={mousePos} />
                ))}
              </span>
            ))}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

function KineticChar({
  char,
  mousePos,
}: {
  char: string;
  mousePos: { x: number; y: number } | null;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [proximity, setProximity] = useState(0);

  useEffect(() => {
    if (!mousePos || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(mousePos.x - cx, mousePos.y - cy);
    const maxDist = 110;
    const factor = dist < maxDist ? 1 - dist / maxDist : 0;
    setProximity(factor);
  }, [mousePos]);

  return (
    <span
      ref={ref}
      className="inline-block transition-[transform,font-weight,color] duration-150 ease-out hover:font-bold hover:text-[#E8D2A0]"
      style={{
        transform: proximity > 0 ? `translateY(${(-proximity * 3.5).toFixed(2)}px)` : undefined,
        fontWeight: proximity > 0.35 ? 600 : undefined,
        color: proximity > 0.55 ? '#E8D2A0' : undefined,
      }}
    >
      {char}
    </span>
  );
}

export function ScrollRevealParagraph({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const [progress, setProgress] = useState(0);
  const words = text.split(/\s+/);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1);
      return;
    }

    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.9;
      const end = vh * 0.32;
      const ratio = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
      setProgress(ratio);
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <p ref={containerRef} className={className}>
      {words.map((word, idx) => {
        const threshold = idx / Math.max(1, words.length - 1);
        const lit = progress >= threshold * 0.92;
        return (
          <span
            key={idx}
            className={`inline-block mr-[0.28em] transition-colors duration-300 ${
              lit ? 'text-[#F5F2EB]' : 'text-[#F5F2EB]/30'
            }`}
          >
            {word}
          </span>
        );
      })}
    </p>
  );
}

interface SectionHeadingProps {
  kicker?: string;
  title: string;
  outlinedWord?: string;
  className?: string;
}

export function SectionHeading({
  kicker,
  title,
  outlinedWord,
  className = '',
}: SectionHeadingProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={`mb-12 ${className}`}>
      {kicker && (
        <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#D4B475] mb-3">
          {kicker}
        </p>
      )}
      <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#F5F2EB] leading-[1.12]">
        <span className="block overflow-hidden">
          <span
            className={`inline-block transition-transform duration-700 ease-out ${
              visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`}
          >
            {title}
          </span>
        </span>
        {outlinedWord && (
          <span className="block overflow-hidden mt-1">
            <span
              className="editorial-outline-text inline-block"
              style={{ ['--fill-progress' as string]: visible ? '100%' : '0%' }}
            >
              {outlinedWord}
            </span>
          </span>
        )}
      </h2>
      <div className="mt-5 h-px w-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#D4B475] via-[#E8D2A0] to-transparent transition-transform duration-1000 ease-out origin-left"
          style={{ transform: visible ? 'scaleX(1)' : 'scaleX(0)' }}
        />
      </div>
    </div>
  );
}

export function SkillsMarquee({ text }: { text: string }) {
  const [skew, setSkew] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let lastY = window.scrollY;
    let lastTime = performance.now();
    let timer = 0;

    const onScroll = () => {
      const now = performance.now();
      const dt = Math.max(16, now - lastTime);
      const velocity = (window.scrollY - lastY) / dt;
      lastY = window.scrollY;
      lastTime = now;

      const clamped = Math.max(-7, Math.min(7, velocity * 4.2));
      setSkew(clamped);

      clearTimeout(timer);
      timer = window.setTimeout(() => setSkew(0), 140);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, []);

  const line = `${text} — `;

  return (
    <div
      className="relative w-full overflow-hidden border-y border-white/10 bg-[#0c0c0f] py-5 select-none"
      aria-label="Core disciplines marquee"
    >
      <div
        className="animate-marquee-track items-center transition-transform duration-150 ease-out"
        style={{ transform: `skewX(${skew}deg)` }}
      >
        {[0, 1, 2, 3].map((idx) => (
          <span
            key={idx}
            className="font-serif text-xl sm:text-2xl tracking-[0.14em] text-[#D4B475]/90 whitespace-nowrap pr-6"
          >
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}
