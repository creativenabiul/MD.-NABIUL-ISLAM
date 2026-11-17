import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Layers } from 'lucide-react';
import type { ProjectItem } from '../types/portfolio';

interface ProjectCardProps {
  project: ProjectItem;
  featuredSpan?: boolean;
}

export function ProjectCard({ project, featuredSpan = false }: ProjectCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, hovering: false });
  const [imgError, setImgError] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - py) * 7,
      ry: (px - 0.5) * 7,
      gx: px * 100,
      gy: py * 100,
      hovering: true,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, hovering: false });
  };

  return (
    <Link
      ref={cardRef}
      to={`/projects/${project.slug}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-cursor-label="VIEW"
      className={`group relative flex flex-col rounded-2xl overflow-hidden bg-[#111114] border border-white/10 hover:border-[#D4B475]/50 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4B475] ${
        featuredSpan ? 'lg:col-span-2' : ''
      }`}
      style={{
        transform: `perspective(1100px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: tilt.hovering
          ? 'border-color 0.25s ease'
          : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease',
      }}
    >
      {/* Mouse-following subtle champagne glare */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          opacity: tilt.hovering ? 1 : 0,
          background: `radial-gradient(circle 280px at ${tilt.gx}% ${tilt.gy}%, rgba(212, 180, 117, 0.14), transparent 70%)`,
        }}
      />

      {/* Cover Image */}
      <div className={`relative w-full overflow-hidden bg-[#16161B] ${featuredSpan ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
        {project.coverImageUrl && !imgError ? (
          <img
            src={project.coverImageUrl}
            alt={project.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#19191f] to-[#0b0b0e] p-6 text-center">
            <Layers className="w-8 h-8 text-[#D4B475]/60 mb-3" />
            <span className="font-serif text-lg text-[#F5F2EB]/70">{project.title}</span>
          </div>
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#111114] via-transparent to-transparent opacity-70"
        />
      </div>

      {/* Content */}
      <div className="relative z-20 flex-1 p-6 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#D4B475] font-medium">
            <span>{project.category}</span>
            {project.featured && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#E8D2A0]">Selected Case Study</span>
              </>
            )}
          </div>
          <h3 className="mt-2 font-serif text-2xl font-semibold text-[#F5F2EB] group-hover:text-[#E8D2A0] transition-colors">
            {project.title}
          </h3>
          <p className="mt-2 text-sm text-[#8C8A84] leading-relaxed line-clamp-3">
            {project.shortDescription}
          </p>
        </div>

        <div className="pt-4 border-t border-white/8 flex items-center justify-between gap-4">
          <div className="text-xs text-[#8C8A84] truncate">
            {project.tools.slice(0, 3).join(' · ')}
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D4B475] whitespace-nowrap shrink-0">
            View Project
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
