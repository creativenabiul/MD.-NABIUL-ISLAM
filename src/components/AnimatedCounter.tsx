import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  label: string;
  description?: string;
  delayMs?: number;
}

export function AnimatedCounter({
  value,
  suffix = '',
  label,
  description,
  delayMs = 0,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [displayValue, setDisplayValue] = useState(0);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setEntered(true);
          obs.disconnect();

          if (reduced) {
            setDisplayValue(value);
            return;
          }

          const startTimeout = window.setTimeout(() => {
            const duration = 1100;
            const startTime = performance.now();

            const tick = (now: number) => {
              const progress = Math.min(1, (now - startTime) / duration);
              // Cubic ease out
              const eased = 1 - Math.pow(1 - progress, 3);
              setDisplayValue(Math.round(eased * value));
              if (progress < 1) {
                requestAnimationFrame(tick);
              } else {
                setDisplayValue(value);
              }
            };
            requestAnimationFrame(tick);
          }, delayMs);

          return () => clearTimeout(startTimeout);
        }
      },
      { threshold: 0.25 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [value, delayMs]);

  const formatted = String(displayValue).padStart(value >= 10 ? 2 : 1, '0');

  return (
    <div
      ref={ref}
      className={`p-6 rounded-2xl bg-[#111114] border border-white/10 transition-all duration-700 ease-out ${
        entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      <div className="flex items-baseline gap-1 font-serif text-4xl sm:text-5xl font-semibold text-[#D4B475] tabular-nums overflow-hidden">
        {formatted.split('').map((digit, i) => (
          <span
            key={i}
            className="inline-block transition-transform duration-300"
          >
            {digit}
          </span>
        ))}
        {suffix && <span className="text-2xl sm:text-3xl text-[#E8D2A0]">{suffix}</span>}
      </div>
      <h3 className="mt-3 text-base font-medium text-[#F5F2EB]">{label}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-[#8C8A84] leading-relaxed">{description}</p>
      )}
    </div>
  );
}

interface SkillMeterProps {
  name: string;
  proficiencyLabel?: string;
  level?: number;
  hasLevel: boolean;
}

export function SkillMeter({ name, proficiencyLabel, level, hasLevel }: SkillMeterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
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

  const pct = hasLevel && typeof level === 'number' ? Math.min(100, Math.max(0, level)) : null;

  return (
    <div ref={ref} className="py-3 border-b border-white/8 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-[#F5F2EB]">{name}</span>
        <span className="text-xs font-mono tabular-nums text-[#D4B475]">
          {pct !== null ? `${pct}%` : proficiencyLabel || 'Verified Practice'}
        </span>
      </div>
      {pct !== null && (
        <div className="mt-2 h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#D4B475] to-[#E8D2A0] transition-transform duration-1000 ease-out origin-left"
            style={{
              transform: visible ? `scaleX(${pct / 100})` : 'scaleX(0)',
            }}
          />
        </div>
      )}
    </div>
  );
}
