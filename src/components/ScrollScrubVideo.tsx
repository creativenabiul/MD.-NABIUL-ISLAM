import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play, Pause } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface ScrollScrubVideoProps {
  videoUrl: string;
  posterUrl: string;
  tagline?: string;
}

export function ScrollScrubVideo({
  videoUrl,
  posterUrl,
  tagline = 'Creative Thinking. Strategic Design. Intelligent Automation.',
}: ScrollScrubVideoProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePlaying, setMobilePlaying] = useState(false);

  useEffect(() => {
    const mobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
    setIsMobile(mobile);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video || !videoUrl || videoFailed) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || isMobile) return;

    let ctx: gsap.Context | null = null;
    let inView = false;

    const io = new IntersectionObserver(
      (entries) => {
        inView = Boolean(entries[0]?.isIntersecting);
        if (!inView && !video.paused) {
          video.pause();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(section);

    const setupScrollScrub = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      video.pause();
      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top 75%',
          end: 'bottom 25%',
          scrub: 0.6,
          onUpdate: (self) => {
            if (!inView || !video.duration) return;
            const targetTime = self.progress * Math.max(0.1, video.duration - 0.05);
            if (Math.abs(video.currentTime - targetTime) > 0.04) {
              video.currentTime = targetTime;
            }
          },
        });
      }, section);
    };

    if (video.readyState >= 1) {
      setVideoReady(true);
      setupScrollScrub();
    } else {
      video.addEventListener('loadedmetadata', () => {
        setVideoReady(true);
        setupScrollScrub();
      });
    }

    return () => {
      io.disconnect();
      ctx?.revert();
    };
  }, [videoUrl, videoFailed, isMobile]);

  const toggleMobilePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setMobilePlaying(true);
    } else {
      video.pause();
      setMobilePlaying(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      aria-label="Creative Process Showcase"
      className="relative py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#D4B475] mb-2">
            Studio Reel
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#F5F2EB]">
            Where Craft Meets Automation
          </h2>
        </div>
        <p className="text-sm text-[#8C8A84] max-w-md">{tagline}</p>
      </div>

      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-[#111114]">
        {!videoFailed && videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            muted
            playsInline
            preload="metadata"
            onError={() => setVideoFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={posterUrl}
            alt="Creative studio workstation showcase"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        )}

        {/* Measured scrim for readability */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#070708]/85 via-transparent to-[#070708]/25 pointer-events-none"
        />

        {!videoReady && !videoFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0b0b0e]/40 pointer-events-none">
            <img
              src={posterUrl}
              alt="Studio showcase preview"
              className="w-full h-full object-cover opacity-80"
            />
          </div>
        )}

        <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-[#D4B475] font-medium tracking-wider uppercase">
              {isMobile ? 'Interactive Studio Preview' : 'Scroll-Synchronized Sequence'}
            </p>
            <p className="mt-1 font-serif text-lg sm:text-xl text-[#F5F2EB]">
              Graphic Design · Brand Identity · Intelligent Workflows
            </p>
          </div>

          {isMobile && !videoFailed && (
            <button
              type="button"
              onClick={toggleMobilePlayback}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold whitespace-nowrap shrink-0"
            >
              {mobilePlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {mobilePlaying ? 'Pause' : 'Play Reel'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
