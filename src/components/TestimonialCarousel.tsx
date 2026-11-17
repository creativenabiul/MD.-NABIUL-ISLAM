import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import type { TestimonialItem } from '../types/portfolio';
import { SectionHeading } from './KineticTypography';

export function TestimonialCarousel({ testimonials }: { testimonials: TestimonialItem[] }) {
  const [index, setIndex] = useState(0);

  // Strictly hide testimonials section when no verified testimonials exist
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const current = testimonials[index % testimonials.length];
  const prev = () => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length);
  const next = () => setIndex((i) => (i + 1) % testimonials.length);

  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <SectionHeading kicker="Endorsements" title="Client Perspectives" />

      <div className="p-8 sm:p-12 rounded-2xl bg-[#111114] border border-white/10">
        <blockquote className="font-serif text-2xl sm:text-3xl text-[#F5F2EB] leading-snug max-w-4xl">
          &ldquo;{current.quote}&rdquo;
        </blockquote>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {current.imageUrl ? (
              <img
                src={current.imageUrl}
                alt={current.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover border border-[#D4B475]/40"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#1a1a20] border border-[#D4B475]/40 flex items-center justify-center font-serif text-lg text-[#D4B475]">
                {current.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-[#F5F2EB]">{current.name}</p>
              <p className="text-xs text-[#8C8A84]">
                {[current.position, current.company].filter(Boolean).join(' · ')}
              </p>
              {current.hasRating && typeof current.rating === 'number' && (
                <div className="mt-1 flex items-center gap-1" aria-label={`Rated ${current.rating} out of 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < (current.rating || 0) ? 'text-[#D4B475] fill-[#D4B475]' : 'text-white/15'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {testimonials.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prev}
                aria-label="Previous testimonial"
                className="w-10 h-10 rounded-lg border border-white/15 flex items-center justify-center text-[#F5F2EB] hover:border-[#D4B475]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next testimonial"
                className="w-10 h-10 rounded-lg border border-white/15 flex items-center justify-center text-[#F5F2EB] hover:border-[#D4B475]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
